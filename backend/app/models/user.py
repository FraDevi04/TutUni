from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from app.core.database import Base


class UserRole(str, Enum):
    FREE = "free"
    PRO = "pro"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.FREE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Usage tracking
    documents_uploaded = Column(Integer, default=0, nullable=False)
    ai_questions_asked = Column(Integer, default=0, nullable=False)
    ai_questions_today = Column(Integer, default=0, nullable=False)
    ai_questions_reset_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
    
    @property
    def is_pro(self) -> bool:
        return self.role in [UserRole.PRO, UserRole.ADMIN]
    
    @property
    def can_upload_documents(self) -> bool:
        if self.role == UserRole.FREE:
            return self.documents_uploaded < 20  # Free limit
        return True  # Pro users have unlimited uploads
    
    @property
    def can_ask_ai_questions(self) -> bool:
        if self.role == UserRole.FREE:
            # Reset daily counter if needed
            today = datetime.utcnow().date()
            if self.ai_questions_reset_date.date() < today:
                return True  # Will be reset when question is asked
            return self.ai_questions_today < 50  # Free limit per day
        return True  # Pro users have unlimited questions 