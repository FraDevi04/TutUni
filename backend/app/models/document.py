from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum

from app.core.database import Base


class DocumentStatus(str, Enum):
    UPLOADING = "UPLOADING"
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    ANALYZED = "ANALYZED"
    ERROR = "ERROR"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_type = Column(String(10), nullable=False)  # .pdf, .docx, etc.
    
    # Content
    extracted_text = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(20), default=DocumentStatus.UPLOADED, nullable=False)
    is_analyzed = Column(Boolean, default=False, nullable=False)
    
    # Analysis results
    analysis_result = Column(JSON, nullable=True)  # Store AI analysis results
    central_thesis = Column(Text, nullable=True)
    key_concepts = Column(JSON, nullable=True)  # List of key concepts
    argumentative_structure = Column(JSON, nullable=True)  # Document structure
    cited_sources = Column(JSON, nullable=True)  # Bibliography and citations
    
    # Error handling
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="documents")
    
    def __repr__(self) -> str:
        return f"<Document(id={self.id}, filename='{self.filename}', status='{self.status}')>"
    
    @property
    def file_size_mb(self) -> float:
        """Return file size in MB"""
        return self.file_size / (1024 * 1024)
    
    @property
    def is_pdf(self) -> bool:
        return self.file_type.lower() == ".pdf"
    
    @property
    def is_docx(self) -> bool:
        return self.file_type.lower() == ".docx"
    
    def set_error(self, error_message: str) -> None:
        """Set document status to error with message"""
        self.status = DocumentStatus.ERROR
        self.error_message = error_message
    
    def mark_as_analyzed(self, analysis_data: dict) -> None:
        """Mark document as analyzed and store results"""
        self.status = DocumentStatus.ANALYZED
        self.is_analyzed = True
        self.analyzed_at = func.now()
        self.analysis_result = analysis_data
        
        # Extract specific analysis fields
        if "central_thesis" in analysis_data:
            self.central_thesis = analysis_data["central_thesis"]
        if "key_concepts" in analysis_data:
            self.key_concepts = analysis_data["key_concepts"]
        if "argumentative_structure" in analysis_data:
            self.argumentative_structure = analysis_data["argumentative_structure"]
        if "cited_sources" in analysis_data:
            self.cited_sources = analysis_data["cited_sources"] 