import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
import aiofiles
from fastapi import HTTPException, UploadFile
from datetime import datetime
import logging

# Optional PyMuPDF import
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False
    logging.warning("PyMuPDF not available. PDF processing will be limited.")

from app.core.config import settings


class DocumentProcessor:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR if hasattr(settings, 'UPLOAD_DIR') else "uploads")
        self.upload_dir.mkdir(exist_ok=True)
    
    async def save_file(self, file: UploadFile, project_id: int) -> Tuple[str, str]:
        """Save uploaded file to disk and return file path and filename"""
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create project directory
        project_dir = self.upload_dir / str(project_id)
        project_dir.mkdir(exist_ok=True)
        
        file_path = project_dir / unique_filename
        
        try:
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                while content := await file.read(1024):
                    await f.write(content)
            
            return str(file_path), unique_filename
            
        except Exception as e:
            # Clean up on error
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=500,
                detail=f"Errore durante il salvataggio del file: {str(e)}"
            )
    
    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file"""
        
        # Check file type
        allowed_types = ['.pdf', '.docx']
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo di file non supportato. Supportati: {', '.join(allowed_types)}"
            )
        
        # Warn about PDF limitations if PyMuPDF is not available
        if file_extension == '.pdf' and not HAS_PYMUPDF:
            logging.warning(f"PDF file uploaded but PyMuPDF not available: {file.filename}")
        
        # Check file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if file.size > max_size:
            raise HTTPException(
                status_code=400,
                detail="File troppo grande. Massimo 50MB."
            )
    
    def extract_text_from_pdf(self, file_path: str) -> Tuple[str, int]:
        """Extract text from PDF file using PyMuPDF"""
        
        if not HAS_PYMUPDF:
            # Fallback: return placeholder text
            logging.warning(f"PyMuPDF not available. Cannot extract text from PDF: {file_path}")
            placeholder_text = (
                "PDF Text Extraction Not Available\n\n"
                "PyMuPDF is required for PDF text extraction but is not installed.\n"
                "Please install PyMuPDF to enable PDF processing:\n"
                "pip install PyMuPDF\n\n"
                "Or use DOCX files instead."
            )
            return placeholder_text, 1
        
        try:
            doc = fitz.open(file_path)
            text = ""
            page_count = len(doc)
            
            for page_num in range(page_count):
                page = doc[page_num]
                text += page.get_text()
                text += "\n\n"  # Add separation between pages
            
            doc.close()
            
            # Clean up text
            text = self.clean_text(text)
            
            return text, page_count
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Errore nell'estrazione del testo: {str(e)}"
            )
    
    def extract_text_from_docx(self, file_path: str) -> Tuple[str, int]:
        """Extract text from DOCX file using python-docx"""
        
        try:
            import docx
            
            doc = docx.Document(file_path)
            text = ""
            paragraph_count = 0
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n\n"
                    paragraph_count += 1
            
            # Estimate page count (rough approximation)
            page_count = max(1, paragraph_count // 10)
            
            # Clean up text
            text = self.clean_text(text)
            
            return text, page_count
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Errore nell'estrazione del testo: {str(e)}"
            )
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        
        # Remove excessive whitespace
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                cleaned_lines.append(line)
        
        # Join lines and normalize spacing
        cleaned_text = '\n'.join(cleaned_lines)
        
        # Remove excessive newlines
        while '\n\n\n' in cleaned_text:
            cleaned_text = cleaned_text.replace('\n\n\n', '\n\n')
        
        return cleaned_text
    
    def get_file_info(self, file_path: str) -> dict:
        """Get file information"""
        
        path = Path(file_path)
        
        return {
            'size': path.stat().st_size,
            'created': datetime.fromtimestamp(path.stat().st_ctime),
            'modified': datetime.fromtimestamp(path.stat().st_mtime),
            'exists': path.exists()
        }
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from disk"""
        
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception:
            return False


# Singleton instance
document_processor = DocumentProcessor() 