from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, and_
from typing import List, Optional, Dict, Any
import logging
import json
from datetime import datetime

from app.core.database import get_async_session
from app.models.chat import ChatMessage, MessageType
from app.models.user import User
from app.models.project import Project
from app.schemas.chat import (
    ChatMessageRequest, 
    ChatMessageResponse, 
    ChatHistoryResponse,
    ChatContextChunk
)
from app.services.ai_service import ai_service
from app.routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/projects/{project_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    project_id: int,
    message_request: ChatMessageRequest,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """Send a message to AI and get response with RAG context"""
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            and_(
                Project.id == project_id,
                Project.owner_id == current_user.id
            )
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Get recent conversation history for context
        recent_messages = db.query(ChatMessage).filter(
            ChatMessage.project_id == project_id
        ).order_by(desc(ChatMessage.created_at)).limit(10).all()
        
        # Convert to format expected by AI service
        conversation_history = []
        for msg in reversed(recent_messages):  # Reverse to get chronological order
            role = "user" if msg.message_type == MessageType.USER else "assistant"
            conversation_history.append({
                "role": role,
                "content": msg.content
            })
        
        # Store user message
        user_message = ChatMessage(
            content=message_request.content,
            message_type=MessageType.USER,
            project_id=project_id,
            user_id=current_user.id
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # Retrieve context using RAG
        context_chunks = await ai_service.retrieve_context(
            project_id=project_id,
            query=message_request.content,
            max_chunks=5
        )
        
        # Generate AI response
        ai_response_content, ai_metadata = await ai_service.generate_response(
            user_query=message_request.content,
            context_chunks=context_chunks,
            conversation_history=conversation_history
        )
        
        # Prepare context documents and chunks for storage
        context_documents = []
        retrieved_chunks = []
        
        for chunk in context_chunks:
            if chunk.document_id not in context_documents:
                context_documents.append(chunk.document_id)
            
            retrieved_chunks.append({
                "document_id": chunk.document_id,
                "chunk_text": chunk.chunk_text[:200] + "..." if len(chunk.chunk_text) > 200 else chunk.chunk_text,
                "similarity_score": chunk.similarity_score,
                "metadata": chunk.metadata
            })
        
        # Store AI response
        ai_message = ChatMessage(
            content=ai_response_content,
            message_type=MessageType.AI,
            project_id=project_id,
            user_id=current_user.id,
            context_documents=context_documents,
            ai_model=ai_metadata.get("ai_model"),
            tokens_used=ai_metadata.get("tokens_used"),
            processing_time_ms=ai_metadata.get("processing_time_ms"),
            retrieved_chunks=retrieved_chunks,
            confidence_score=ai_metadata.get("confidence_score")
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        
        logger.info(f"Chat message processed for project {project_id}, user {current_user.id}")
        
        return ChatMessageResponse.model_validate(ai_message)
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.get("/projects/{project_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    project_id: int,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a project"""
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            and_(
                Project.id == project_id,
                Project.owner_id == current_user.id
            )
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Get total count
        total_count = db.query(ChatMessage).filter(
            ChatMessage.project_id == project_id
        ).count()
        
        # Get messages with pagination
        messages = db.query(ChatMessage).filter(
            ChatMessage.project_id == project_id
        ).order_by(desc(ChatMessage.created_at)).offset(offset).limit(limit).all()
        
        # Convert to response format
        message_responses = [ChatMessageResponse.model_validate(msg) for msg in messages]
        
        return ChatHistoryResponse(
            messages=message_responses,
            total_count=total_count,
            has_more=offset + limit < total_count
        )
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chat history: {str(e)}"
        )


@router.get("/projects/{project_id}/suggested-questions")
async def get_suggested_questions(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """Get suggested questions for a project"""
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            and_(
                Project.id == project_id,
                Project.owner_id == current_user.id
            )
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Generate suggested questions
        suggested_questions = await ai_service.generate_suggested_questions(
            project_id=project_id
        )
        
        return {"suggestions": suggested_questions}
        
    except Exception as e:
        logger.error(f"Error getting suggested questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting suggested questions: {str(e)}"
        )


@router.delete("/projects/{project_id}/history")
async def clear_chat_history(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for a project"""
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            and_(
                Project.id == project_id,
                Project.owner_id == current_user.id
            )
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Delete all messages for this project
        deleted_count = db.query(ChatMessage).filter(
            ChatMessage.project_id == project_id
        ).delete()
        
        db.commit()
        
        logger.info(f"Cleared {deleted_count} chat messages for project {project_id}")
        
        return {"message": f"Cleared {deleted_count} messages", "success": True}
        
    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )


@router.get("/projects/{project_id}/stats")
async def get_chat_stats(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """Get chat statistics for a project"""
    try:
        # Verify project exists and user has access
        project = db.query(Project).filter(
            and_(
                Project.id == project_id,
                Project.owner_id == current_user.id
            )
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Get chat statistics
        total_messages = db.query(ChatMessage).filter(
            ChatMessage.project_id == project_id
        ).count()
        
        user_messages = db.query(ChatMessage).filter(
            and_(
                ChatMessage.project_id == project_id,
                ChatMessage.message_type == MessageType.USER
            )
        ).count()
        
        ai_messages = db.query(ChatMessage).filter(
            and_(
                ChatMessage.project_id == project_id,
                ChatMessage.message_type == MessageType.AI
            )
        ).count()
        
        # Get total tokens used
        total_tokens = db.query(ChatMessage).filter(
            and_(
                ChatMessage.project_id == project_id,
                ChatMessage.tokens_used.isnot(None)
            )
        ).with_entities(ChatMessage.tokens_used).all()
        
        total_tokens_used = sum(tokens[0] for tokens in total_tokens if tokens[0])
        
        return {
            "total_messages": total_messages,
            "user_messages": user_messages,
            "ai_messages": ai_messages,
            "total_tokens_used": total_tokens_used
        }
        
    except Exception as e:
        logger.error(f"Error getting chat stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chat stats: {str(e)}"
        )


@router.get("/health")
async def chat_health():
    """Health check for chat service"""
    return {"status": "ok", "service": "chat"} 
