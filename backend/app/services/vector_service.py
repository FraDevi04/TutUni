import os
import logging
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
import numpy as np
from uuid import uuid4

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorService:
    def __init__(self):
        self.client = None
        self.embedding_model = None
        self._init_client()
        self._init_embedding_model()
    
    def _init_client(self):
        """Initialize ChromaDB client"""
        try:
            # Create vector db directory if it doesn't exist
            vector_db_path = Path(settings.VECTOR_DB_PATH)
            vector_db_path.mkdir(parents=True, exist_ok=True)
            
            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(
                path=str(vector_db_path),
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            logger.info(f"ChromaDB client initialized at: {vector_db_path}")
            
        except Exception as e:
            logger.error(f"Error initializing ChromaDB client: {e}")
            raise
    
    def _init_embedding_model(self):
        """Initialize sentence transformer model"""
        try:
            # Use a multilingual model that works well with Italian text
            model_name = "paraphrase-multilingual-MiniLM-L12-v2"
            self.embedding_model = SentenceTransformer(model_name)
            logger.info(f"Embedding model loaded: {model_name}")
            
        except Exception as e:
            logger.error(f"Error loading embedding model: {e}")
            raise
    
    def get_or_create_collection(self, project_id: int) -> chromadb.Collection:
        """Get or create collection for a project"""
        try:
            collection_name = f"project_{project_id}"
            
            # Try to get existing collection
            try:
                collection = self.client.get_collection(name=collection_name)
                logger.info(f"Retrieved existing collection: {collection_name}")
            except:
                # Create new collection if it doesn't exist
                collection = self.client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info(f"Created new collection: {collection_name}")
            
            return collection
            
        except Exception as e:
            logger.error(f"Error getting/creating collection for project {project_id}: {e}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for list of texts"""
        try:
            if not texts:
                return []
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(
                texts,
                batch_size=32,
                show_progress_bar=True,
                convert_to_numpy=True
            )
            
            # Convert to list of lists
            embeddings_list = embeddings.tolist()
            
            logger.info(f"Generated embeddings for {len(texts)} text chunks")
            return embeddings_list
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    def add_document_embeddings(
        self, 
        project_id: int, 
        document_id: int, 
        chunks: List[str], 
        metadatas: List[Dict]
    ) -> bool:
        """Add document embeddings to collection"""
        try:
            if not chunks or not metadatas:
                logger.warning("No chunks or metadatas provided")
                return False
            
            collection = self.get_or_create_collection(project_id)
            
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            
            # Generate unique IDs for each chunk
            chunk_ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
            
            # Add to collection
            collection.add(
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
                ids=chunk_ids
            )
            
            logger.info(f"Added {len(chunks)} chunks for document {document_id} to collection project_{project_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document embeddings: {e}")
            return False
    
    def search_similar_chunks(
        self, 
        project_id: int, 
        query: str, 
        n_results: int = 10,
        where: Optional[Dict] = None
    ) -> Dict:
        """Search for similar chunks in project collection"""
        try:
            collection = self.get_or_create_collection(project_id)
            
            # Generate query embedding
            query_embedding = self.generate_embeddings([query])[0]
            
            # Search in collection
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where,
                include=['documents', 'metadatas', 'distances']
            )
            
            logger.info(f"Found {len(results['documents'][0])} similar chunks for query in project {project_id}")
            return results
            
        except Exception as e:
            logger.error(f"Error searching similar chunks: {e}")
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    
    def delete_document_embeddings(self, project_id: int, document_id: int) -> bool:
        """Delete all embeddings for a document"""
        try:
            collection = self.get_or_create_collection(project_id)
            
            # Delete all chunks for this document
            collection.delete(
                where={"document_id": document_id}
            )
            
            logger.info(f"Deleted embeddings for document {document_id} from project {project_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document embeddings: {e}")
            return False
    
    def delete_project_collection(self, project_id: int) -> bool:
        """Delete entire collection for a project"""
        try:
            collection_name = f"project_{project_id}"
            self.client.delete_collection(name=collection_name)
            
            logger.info(f"Deleted collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting project collection: {e}")
            return False
    
    def get_collection_stats(self, project_id: int) -> Dict:
        """Get statistics about a project collection"""
        try:
            collection = self.get_or_create_collection(project_id)
            count = collection.count()
            
            return {
                "total_chunks": count,
                "collection_name": f"project_{project_id}"
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"total_chunks": 0, "collection_name": f"project_{project_id}"}


# Singleton instance
vector_service = VectorService() 