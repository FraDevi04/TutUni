from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Progress tracking
    progress = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="projects")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Project(id={self.id}, title='{self.title}', owner_id={self.owner_id})>"
    
    @property
    def document_count(self) -> int:
        return len(self.documents)
    
    @property
    def analyzed_document_count(self) -> int:
        return len([doc for doc in self.documents if doc.is_analyzed])
    
    def update_activity(self) -> None:
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
    
    def calculate_progress(self) -> float:
        """Calculate project progress based on analyzed documents"""
        if not self.documents:
            return 0.0
        
        analyzed_count = self.analyzed_document_count
        total_count = self.document_count
        
        return (analyzed_count / total_count) * 100.0 if total_count > 0 else 0.0 