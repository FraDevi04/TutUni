from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class ChatMessageRequest(BaseModel):
    """Request model for sending a chat message"""
    content: str = Field(..., min_length=1, max_length=2000, description="User message content")
    

class ChatMessageResponse(BaseModel):
    """Response model for chat messages"""
    id: int
    content: str
    message_type: MessageType
    created_at: datetime
    
    # Context and metadata
    context_documents: Optional[List[int]] = None
    ai_model: Optional[str] = None
    tokens_used: Optional[int] = None
    processing_time_ms: Optional[int] = None
    
    # RAG metadata
    retrieved_chunks: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[float] = None
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Response model for chat history"""
    messages: List[ChatMessageResponse]
    total_count: int
    has_more: bool


class ChatContextChunk(BaseModel):
    """Model for retrieved context chunks"""
    document_id: int
    chunk_text: str
    similarity_score: float
    metadata: Dict[str, Any]


class ChatStreamResponse(BaseModel):
    """Response model for streaming chat responses"""
    type: str  # "chunk", "done", "error"
    content: Optional[str] = None
    message_id: Optional[int] = None
    error: Optional[str] = None 