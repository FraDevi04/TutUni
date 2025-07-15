import asyncio
import logging
from typing import Optional, Dict, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.core.database import get_async_session
from app.models.document import Document, DocumentStatus
from app.models.project import Project
from app.services.document_processor import document_processor
from app.services.text_chunker import text_chunker, TextChunk
from app.services.vector_service import vector_service
from app.services.ai_service import ai_service
from app.schemas.chat import ChatContextChunk

logger = logging.getLogger(__name__)


class BackgroundProcessor:
    """
    Background service for processing documents:
    1. Extract text from PDF/DOCX
    2. Chunk the text intelligently
    3. Generate embeddings
    4. Store in vector database
    """
    
    def __init__(self):
        self.is_running = False
        self.processing_queue = asyncio.Queue()
        self.current_tasks = {}
        
    async def start(self):
        """Start the background processor"""
        if self.is_running:
            logger.warning("Background processor already running")
            return
        
        self.is_running = True
        logger.info("Background processor started")
        
        # Start processing loop
        asyncio.create_task(self._processing_loop())
    
    async def stop(self):
        """Stop the background processor"""
        self.is_running = False
        logger.info("Background processor stopped")
    
    async def queue_document_for_processing(self, document_id: int, priority: int = 1):
        """Queue a document for processing"""
        try:
            await self.processing_queue.put({
                'document_id': document_id,
                'priority': priority,
                'queued_at': datetime.now()
            })
            logger.info(f"Document {document_id} queued for processing")
        except Exception as e:
            logger.error(f"Error queuing document {document_id}: {e}")
    
    async def _processing_loop(self):
        """Main processing loop"""
        while self.is_running:
            try:
                # Get next document to process
                task = await asyncio.wait_for(
                    self.processing_queue.get(),
                    timeout=5.0  # 5 second timeout
                )
                
                document_id = task['document_id']
                
                # Skip if already processing
                if document_id in self.current_tasks:
                    logger.info(f"Document {document_id} already being processed")
                    continue
                
                # Start processing
                self.current_tasks[document_id] = asyncio.create_task(
                    self._process_document(document_id)
                )
                
            except asyncio.TimeoutError:
                # No tasks in queue, continue
                continue
            except Exception as e:
                logger.error(f"Error in processing loop: {e}")
                await asyncio.sleep(1)
    
    async def _process_document(self, document_id: int):
        """Process a single document through the complete pipeline"""
        async with get_async_session() as db:
            try:
                # Get document from database
                document = await self._get_document(db, document_id)
                if not document:
                    logger.error(f"Document {document_id} not found")
                    return
                
                # Update status to processing
                document.status = DocumentStatus.PROCESSING
                await db.commit()
                
                logger.info(f"Starting processing of document {document_id}: {document.filename}")
                
                # Step 1: Extract text
                extracted_text, page_count = await self._extract_text(document)
                
                # Step 2: Update document with extracted text
                document.extracted_text = extracted_text
                document.page_count = page_count
                document.status = DocumentStatus.PROCESSED
                await db.commit()
                
                # Step 3: AI Analysis (NEW)
                try:
                    logger.info(f"Starting AI analysis for document {document_id}")
                    analysis_result = await ai_service.analyze_document(
                        document_text=extracted_text,
                        filename=document.original_filename
                    )
                    
                    # Update document with analysis results
                    document.mark_as_analyzed(analysis_result)
                    await db.commit()
                    
                    logger.info(f"AI analysis completed for document {document_id}")
                    
                except Exception as e:
                    logger.error(f"AI analysis failed for document {document_id}: {e}")
                    # Continue with processing even if AI analysis fails
                    
                # Step 4: Chunk the text
                chunks = await self._chunk_text(document)
                
                # Step 5: Generate embeddings and store in vector DB
                success = await self._store_embeddings(document, chunks)
                
                if success:
                    # Update document status to final analyzed state
                    if document.status != DocumentStatus.ANALYZED:
                        document.status = DocumentStatus.ANALYZED
                        document.analyzed_at = datetime.now()
                        await db.commit()
                    
                    logger.info(f"Successfully processed document {document_id} with {len(chunks)} chunks")
                else:
                    raise Exception("Failed to store embeddings")
                
            except Exception as e:
                logger.error(f"Error processing document {document_id}: {e}")
                
                # Update document with error
                document.status = DocumentStatus.ERROR
                document.error_message = str(e)
                await db.commit()
                
            finally:
                # Remove from current tasks
                if document_id in self.current_tasks:
                    del self.current_tasks[document_id]
    
    async def _get_document(self, db: AsyncSession, document_id: int) -> Optional[Document]:
        """Get document from database"""
        try:
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting document {document_id}: {e}")
            return None
    
    async def _extract_text(self, document: Document) -> tuple[str, int]:
        """Extract text from document file"""
        try:
            if document.is_pdf:
                text, page_count = document_processor.extract_text_from_pdf(document.file_path)
            elif document.is_docx:
                text, page_count = document_processor.extract_text_from_docx(document.file_path)
            else:
                raise ValueError(f"Unsupported file type: {document.file_type}")
            
            logger.info(f"Extracted {len(text)} characters from {document.filename}")
            return text, page_count
            
        except Exception as e:
            logger.error(f"Error extracting text from {document.filename}: {e}")
            raise
    
    async def _chunk_text(self, document: Document) -> List[TextChunk]:
        """Chunk the extracted text"""
        try:
            if not document.extracted_text:
                raise ValueError("No extracted text available")
            
            # Use text chunker to create intelligent chunks
            chunks = text_chunker.chunk_text(
                text=document.extracted_text,
                document_id=document.id,
                filename=document.filename
            )
            
            logger.info(f"Created {len(chunks)} chunks from {document.filename}")
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking text from {document.filename}: {e}")
            raise
    
    async def _store_embeddings(self, document: Document, chunks: List[TextChunk]) -> bool:
        """Generate embeddings and store in vector database"""
        try:
            if not chunks:
                logger.warning(f"No chunks to process for document {document.id}")
                return False
            
            # Convert chunks to text and metadata
            chunk_texts = [chunk.text for chunk in chunks]
            chunk_metadatas = []
            
            for i, chunk in enumerate(chunks):
                metadata = chunk.metadata.copy()
                metadata.update({
                    "chunk_id": i,
                    "document_id": document.id,
                    "project_id": document.project_id,
                    "filename": document.filename,
                    "file_type": document.file_type,
                    "chunk_type": chunk.chunk_type.value,
                    "start_pos": chunk.start_pos,
                    "end_pos": chunk.end_pos,
                    "created_at": datetime.now().isoformat()
                })
                chunk_metadatas.append(metadata)
            
            # Store embeddings in vector database
            success = vector_service.add_document_embeddings(
                project_id=document.project_id,
                document_id=document.id,
                chunks=chunk_texts,
                metadatas=chunk_metadatas
            )
            
            if success:
                logger.info(f"Successfully stored embeddings for document {document.id}")
                return True
            else:
                logger.error(f"Failed to store embeddings for document {document.id}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing embeddings for document {document.id}: {e}")
            return False
    
    async def reprocess_document(self, document_id: int):
        """Reprocess a document (delete old embeddings and process again)"""
        async with get_db() as db:
            try:
                # Get document
                document = await self._get_document(db, document_id)
                if not document:
                    logger.error(f"Document {document_id} not found")
                    return
                
                # Delete old embeddings
                vector_service.delete_document_embeddings(
                    project_id=document.project_id,
                    document_id=document_id
                )
                
                # Reset document status
                document.status = DocumentStatus.UPLOADED
                document.extracted_text = None
                document.page_count = None
                document.analyzed_at = None
                document.error_message = None
                await db.commit()
                
                # Queue for processing
                await self.queue_document_for_processing(document_id)
                
                logger.info(f"Document {document_id} queued for reprocessing")
                
            except Exception as e:
                logger.error(f"Error reprocessing document {document_id}: {e}")
    
    async def get_processing_status(self) -> Dict:
        """Get current processing status"""
        return {
            "is_running": self.is_running,
            "queue_size": self.processing_queue.qsize(),
            "current_tasks": list(self.current_tasks.keys()),
            "total_processing": len(self.current_tasks)
        }
    
    async def process_project_documents(self, project_id: int):
        """Process all documents in a project"""
        async with get_db() as db:
            try:
                # Get all documents for project
                result = await db.execute(
                    select(Document).where(
                        Document.project_id == project_id,
                        Document.status.in_([DocumentStatus.UPLOADED, DocumentStatus.ERROR])
                    )
                )
                documents = result.scalars().all()
                
                # Queue all documents for processing
                for document in documents:
                    await self.queue_document_for_processing(document.id)
                
                logger.info(f"Queued {len(documents)} documents from project {project_id} for processing")
                
            except Exception as e:
                logger.error(f"Error processing project {project_id} documents: {e}")
    
    async def health_check(self) -> Dict:
        """Health check for the background processor"""
        try:
            # Check if ChromaDB is accessible
            vector_stats = vector_service.get_collection_stats(1)  # Test with project 1
            
            return {
                "status": "healthy" if self.is_running else "stopped",
                "queue_size": self.processing_queue.qsize(),
                "active_tasks": len(self.current_tasks),
                "vector_db_accessible": bool(vector_stats),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


# Singleton instance
background_processor = BackgroundProcessor()


# Convenience functions for external use
async def process_document(document_id: int, priority: int = 1):
    """Queue a document for processing"""
    await background_processor.queue_document_for_processing(document_id, priority)


async def reprocess_document(document_id: int):
    """Reprocess a document"""
    await background_processor.reprocess_document(document_id)


async def process_project_documents(project_id: int):
    """Process all documents in a project"""
    await background_processor.process_project_documents(project_id)


async def get_processing_status():
    """Get current processing status"""
    return await background_processor.get_processing_status()


async def health_check():
    """Health check for the background processor"""
    return await background_processor.health_check() 