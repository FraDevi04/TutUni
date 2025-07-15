from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum

from app.core.database import Base


class MessageType(str, Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(10), nullable=False)  # user, ai, system
    
    # Context and metadata
    context_documents = Column(JSON, nullable=True)  # Document IDs used for context
    ai_model = Column(String(50), nullable=True)  # deepseek-r1:latest, etc.
    tokens_used = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    # RAG metadata
    retrieved_chunks = Column(JSON, nullable=True)  # Vector search results
    confidence_score = Column(JSON, nullable=True)  # Response confidence
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project = relationship("Project", back_populates="chat_messages")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")
    
    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, type='{self.message_type}', project_id={self.project_id})>"
    
    @property
    def is_user_message(self) -> bool:
        return self.message_type == MessageType.USER
    
    @property
    def is_ai_message(self) -> bool:
        return self.message_type == MessageType.AI
    
    @property
    def truncated_content(self) -> str:
        """Return truncated content for display"""
        if len(self.content) <= 100:
            return self.content
        return self.content[:97] + "..." 