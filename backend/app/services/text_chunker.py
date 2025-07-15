import re
import logging
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class ChunkType(str, Enum):
    TITLE = "title"
    PARAGRAPH = "paragraph"
    LIST_ITEM = "list_item"
    QUOTE = "quote"
    FOOTNOTE = "footnote"


@dataclass
class TextChunk:
    text: str
    chunk_type: ChunkType
    start_pos: int
    end_pos: int
    metadata: Dict
    
    def __post_init__(self):
        """Calculate additional metadata after initialization"""
        self.metadata.update({
            "word_count": len(self.text.split()),
            "char_count": len(self.text),
            "chunk_type": self.chunk_type.value
        })


class TextChunker:
    """
    Intelligent text chunker for academic documents
    Implements sliding window chunking with overlap and semantic awareness
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        overlap_size: int = 200,
        min_chunk_size: int = 100,
        max_chunk_size: int = 2000
    ):
        self.chunk_size = chunk_size
        self.overlap_size = overlap_size
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        
        # Patterns for detecting document structure
        self.title_patterns = [
            r'^[A-Z][A-Z\s]+$',  # ALL CAPS titles
            r'^\d+\.\s+[A-Z]',   # Numbered sections
            r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$',  # Title Case
            r'^(?:Capitolo|Sezione|Parte)\s+\d+',  # Italian chapter/section
            r'^(?:Chapter|Section|Part)\s+\d+',    # English chapter/section
        ]
        
        self.list_patterns = [
            r'^\s*[-•*]\s+',     # Bullet points
            r'^\s*\d+\.\s+',     # Numbered lists
            r'^\s*[a-z]\)\s+',   # Lettered lists
            r'^\s*[IVX]+\.\s+',  # Roman numerals
        ]
        
        self.quote_patterns = [
            r'^".*"$',           # Quoted text
            r'^«.*»$',           # French quotes
            r'^".*"$',           # Smart quotes
        ]
        
        self.footnote_patterns = [
            r'^\d+\s+',          # Numbered footnotes
            r'^\*\s+',           # Asterisk footnotes
        ]
    
    def chunk_text(self, text: str, document_id: int, filename: str) -> List[TextChunk]:
        """
        Main chunking method that processes text and returns structured chunks
        """
        try:
            # Preprocess text
            text = self._preprocess_text(text)
            
            # Split into paragraphs first
            paragraphs = self._split_into_paragraphs(text)
            
            # Process each paragraph and create chunks
            chunks = []
            current_position = 0
            
            for paragraph in paragraphs:
                if len(paragraph.strip()) < self.min_chunk_size:
                    continue
                
                # Detect paragraph type
                chunk_type = self._detect_chunk_type(paragraph)
                
                # Create chunks from this paragraph
                para_chunks = self._create_chunks_from_paragraph(
                    paragraph, 
                    current_position, 
                    chunk_type,
                    document_id,
                    filename
                )
                
                chunks.extend(para_chunks)
                current_position += len(paragraph)
            
            # Apply overlap between chunks
            chunks = self._apply_overlap(chunks)
            
            # Final validation and cleanup
            chunks = self._validate_and_cleanup_chunks(chunks)
            
            logger.info(f"Created {len(chunks)} chunks from document {document_id}")
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking text for document {document_id}: {e}")
            return []
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Normalize line breaks
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Remove page numbers and headers/footers
        text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)
        
        # Remove excessive punctuation
        text = re.sub(r'[.]{3,}', '...', text)
        
        return text.strip()
    
    def _split_into_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs"""
        # Split by double newlines
        paragraphs = re.split(r'\n\s*\n', text)
        
        # Clean each paragraph
        cleaned_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if para and len(para) > 20:  # Ignore very short paragraphs
                cleaned_paragraphs.append(para)
        
        return cleaned_paragraphs
    
    def _detect_chunk_type(self, text: str) -> ChunkType:
        """Detect the type of text chunk"""
        # Check for titles
        for pattern in self.title_patterns:
            if re.match(pattern, text.strip()):
                return ChunkType.TITLE
        
        # Check for lists
        for pattern in self.list_patterns:
            if re.match(pattern, text.strip()):
                return ChunkType.LIST_ITEM
        
        # Check for quotes
        for pattern in self.quote_patterns:
            if re.match(pattern, text.strip()):
                return ChunkType.QUOTE
        
        # Check for footnotes
        for pattern in self.footnote_patterns:
            if re.match(pattern, text.strip()):
                return ChunkType.FOOTNOTE
        
        return ChunkType.PARAGRAPH
    
    def _create_chunks_from_paragraph(
        self, 
        paragraph: str, 
        start_pos: int, 
        chunk_type: ChunkType,
        document_id: int,
        filename: str
    ) -> List[TextChunk]:
        """Create chunks from a single paragraph"""
        chunks = []
        
        # If paragraph is smaller than chunk size, create single chunk
        if len(paragraph) <= self.chunk_size:
            chunk = TextChunk(
                text=paragraph,
                chunk_type=chunk_type,
                start_pos=start_pos,
                end_pos=start_pos + len(paragraph),
                metadata={
                    "document_id": document_id,
                    "filename": filename,
                    "paragraph_index": len(chunks)
                }
            )
            chunks.append(chunk)
            return chunks
        
        # Split long paragraphs into multiple chunks
        sentences = self._split_into_sentences(paragraph)
        
        current_chunk = ""
        current_start = start_pos
        
        for sentence in sentences:
            # Check if adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) > self.chunk_size and current_chunk:
                # Create chunk with current content
                chunk = TextChunk(
                    text=current_chunk.strip(),
                    chunk_type=chunk_type,
                    start_pos=current_start,
                    end_pos=current_start + len(current_chunk),
                    metadata={
                        "document_id": document_id,
                        "filename": filename,
                        "paragraph_index": len(chunks)
                    }
                )
                chunks.append(chunk)
                
                # Start new chunk
                current_chunk = sentence
                current_start = current_start + len(chunks[-1].text)
            else:
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Add remaining text as final chunk
        if current_chunk and len(current_chunk.strip()) >= self.min_chunk_size:
            chunk = TextChunk(
                text=current_chunk.strip(),
                chunk_type=chunk_type,
                start_pos=current_start,
                end_pos=current_start + len(current_chunk),
                metadata={
                    "document_id": document_id,
                    "filename": filename,
                    "paragraph_index": len(chunks)
                }
            )
            chunks.append(chunk)
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Use regex to split on sentence boundaries
        sentences = re.split(r'[.!?]+\s+', text)
        
        # Clean and filter sentences
        cleaned_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and len(sentence) > 10:  # Ignore very short sentences
                cleaned_sentences.append(sentence)
        
        return cleaned_sentences
    
    def _apply_overlap(self, chunks: List[TextChunk]) -> List[TextChunk]:
        """Apply overlap between consecutive chunks"""
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = []
        
        for i, chunk in enumerate(chunks):
            if i == 0:
                # First chunk - no overlap needed
                overlapped_chunks.append(chunk)
            else:
                # Add overlap from previous chunk
                prev_chunk = chunks[i-1]
                overlap_text = self._get_overlap_text(prev_chunk.text, self.overlap_size)
                
                if overlap_text:
                    new_text = overlap_text + " " + chunk.text
                    new_chunk = TextChunk(
                        text=new_text,
                        chunk_type=chunk.chunk_type,
                        start_pos=chunk.start_pos,
                        end_pos=chunk.end_pos,
                        metadata=chunk.metadata.copy()
                    )
                    overlapped_chunks.append(new_chunk)
                else:
                    overlapped_chunks.append(chunk)
        
        return overlapped_chunks
    
    def _get_overlap_text(self, text: str, overlap_size: int) -> str:
        """Get overlap text from the end of a chunk"""
        if len(text) <= overlap_size:
            return text
        
        # Try to find a sentence boundary for cleaner overlap
        overlap_text = text[-overlap_size:]
        
        # Find the first sentence boundary
        sentence_start = re.search(r'[.!?]\s+', overlap_text)
        if sentence_start:
            return overlap_text[sentence_start.end():]
        
        return overlap_text
    
    def _validate_and_cleanup_chunks(self, chunks: List[TextChunk]) -> List[TextChunk]:
        """Final validation and cleanup of chunks"""
        valid_chunks = []
        
        for chunk in chunks:
            # Skip chunks that are too short
            if len(chunk.text.strip()) < self.min_chunk_size:
                continue
            
            # Truncate chunks that are too long
            if len(chunk.text) > self.max_chunk_size:
                chunk.text = chunk.text[:self.max_chunk_size]
            
            # Clean up text
            chunk.text = chunk.text.strip()
            
            # Update metadata
            chunk.metadata.update({
                "final_word_count": len(chunk.text.split()),
                "final_char_count": len(chunk.text)
            })
            
            valid_chunks.append(chunk)
        
        return valid_chunks
    
    def get_chunk_metadata(self, chunks: List[TextChunk]) -> Dict:
        """Get statistics about the chunking process"""
        if not chunks:
            return {}
        
        word_counts = [chunk.metadata.get("word_count", 0) for chunk in chunks]
        char_counts = [chunk.metadata.get("char_count", 0) for chunk in chunks]
        
        chunk_types = {}
        for chunk in chunks:
            chunk_type = chunk.chunk_type.value
            chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1
        
        return {
            "total_chunks": len(chunks),
            "avg_word_count": sum(word_counts) / len(word_counts) if word_counts else 0,
            "avg_char_count": sum(char_counts) / len(char_counts) if char_counts else 0,
            "min_word_count": min(word_counts) if word_counts else 0,
            "max_word_count": max(word_counts) if word_counts else 0,
            "chunk_types": chunk_types
        }


# Singleton instance
text_chunker = TextChunker() 