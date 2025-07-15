from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from pathlib import Path

from app.core.database import get_async_session
from app.models.user import User
from app.models.project import Project
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.services.document_processor import document_processor
from app.services.background_processor import process_document, reprocess_document, get_processing_status, health_check
from app.routers.auth import get_current_user


router = APIRouter()





@router.post("/upload/{project_id}", response_model=DocumentResponse)
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Upload a document to a specific project"""
    
    # Validate file
    document_processor.validate_file(file)
    
    # Check if project exists and user owns it
    stmt = select(Project).where(
        Project.id == project_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progetto non trovato"
        )
    
    # Check user upload limits
    if not current_user.is_pro:
        if current_user.documents_uploaded >= 20:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Limite di 20 documenti raggiunto. Aggiorna a Pro per documenti illimitati."
            )
    
    try:
        # Save file to disk
        file_path, unique_filename = await document_processor.save_file(file, project_id)
        
        # Create document record
        document = Document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file.size,
            file_type=Path(file.filename).suffix.lower(),
            project_id=project_id,
            status="UPLOADED"
        )
        
        db.add(document)
        await db.commit()
        await db.refresh(document)
        
        # Update user upload count
        current_user.documents_uploaded += 1
        await db.commit()
        
        # Update project activity
        project.update_activity()
        await db.commit()
        
        # Queue document for background processing
        await process_document(document.id, priority=1)
        
        return DocumentResponse.model_validate(document)
        
    except Exception as e:
        # Clean up on error
        if 'file_path' in locals():
            document_processor.delete_file(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante l'upload: {str(e)}"
        )


@router.get("/project/{project_id}", response_model=DocumentListResponse)
async def list_project_documents(
    project_id: int,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """List documents in a specific project"""
    
    # Check if project exists and user owns it
    stmt = select(Project).where(
        Project.id == project_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progetto non trovato"
        )
    
    # Get documents with pagination
    offset = (page - 1) * per_page
    stmt = select(Document).where(
        Document.project_id == project_id
    ).order_by(Document.created_at.desc()).offset(offset).limit(per_page)
    
    result = await db.execute(stmt)
    documents = result.scalars().all()
    
    # Get total count
    count_stmt = select(func.count(Document.id)).where(Document.project_id == project_id)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar()
    
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get a specific document"""
    
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a document"""
    
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    # Delete file from disk
    document_processor.delete_file(document.file_path)
    
    # Delete from database
    await db.delete(document)
    await db.commit()
    
    # Update user document count
    current_user.documents_uploaded = max(0, current_user.documents_uploaded - 1)
    await db.commit()
    
    return {"message": "Documento eliminato con successo"}


@router.post("/{document_id}/reprocess")
async def reprocess_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Reprocess a document (re-extract text and re-analyze)"""
    
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    # Reset document status
    document.status = "UPLOADED"
    document.extracted_text = None
    document.page_count = None
    document.error_message = None
    document.is_analyzed = False
    document.analysis_result = None
    
    await db.commit()
    
    # Queue document for reprocessing
    await reprocess_document(document_id)
    
    return {"message": "Riprocessamento del documento avviato"}


@router.get("/{document_id}/text")
async def get_document_text(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get extracted text from a document"""
    
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Testo non ancora estratto dal documento"
        )
    
    return {
        "document_id": document.id,
        "filename": document.original_filename,
        "extracted_text": document.extracted_text,
        "page_count": document.page_count,
        "status": document.status
    }


@router.get("/processing/status")
async def get_processing_status_endpoint(
    current_user: User = Depends(get_current_user)
):
    """Get current processing status"""
    
    # Only allow pro users or admins to check processing status
    if not current_user.is_pro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli utenti Pro"
        )
    
    status_info = await get_processing_status()
    return status_info


@router.get("/processing/health")
async def get_processing_health(
    current_user: User = Depends(get_current_user)
):
    """Health check for the background processor"""
    
    # Only allow pro users or admins to check health
    if not current_user.is_pro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso riservato agli utenti Pro"
        )
    
    health_info = await health_check()
    return health_info


@router.post("/{document_id}/analyze")
async def analyze_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Manually trigger AI analysis for a document"""
    
    # Check if user owns the document
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    # Check if document has extracted text
    if not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il documento deve essere processato prima di poter essere analizzato"
        )
    
    # Check rate limits for free users
    if not current_user.is_pro and current_user.ai_queries_today >= 50:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Limite giornaliero di 50 analisi raggiunto. Aggiorna a Pro per analisi illimitate."
        )
    
    try:
        # Import AI service here to avoid circular imports
        from app.services.ai_service import ai_service
        
        # Perform AI analysis
        analysis_result = await ai_service.analyze_document(
            document_text=document.extracted_text,
            filename=document.original_filename
        )
        
        # Update document with analysis results
        document.mark_as_analyzed(analysis_result)
        await db.commit()
        
        # Update user AI usage count
        if not current_user.is_pro:
            current_user.ai_queries_today += 1
            await db.commit()
        
        return {
            "message": "Analisi completata con successo",
            "document_id": document.id,
            "analysis_result": analysis_result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante l'analisi: {str(e)}"
        )


@router.get("/{document_id}/analysis")
async def get_document_analysis(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get AI analysis results for a document"""
    
    # Check if user owns the document
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    if not document.is_analyzed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Documento non ancora analizzato"
        )
    
    return {
        "document_id": document.id,
        "filename": document.original_filename,
        "analyzed_at": document.analyzed_at,
        "central_thesis": document.central_thesis,
        "key_concepts": document.key_concepts,
        "argumentative_structure": document.argumentative_structure,
        "cited_sources": document.cited_sources,
        "analysis_metadata": document.analysis_result.get("analysis_metadata", {}) if document.analysis_result else {}
    }


@router.delete("/{document_id}/analysis")
async def reset_document_analysis(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Reset analysis results for a document (to trigger re-analysis)"""
    
    # Check if user owns the document
    stmt = select(Document).join(Project).where(
        Document.id == document_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento non trovato"
        )
    
    # Reset analysis fields
    document.is_analyzed = False
    document.analysis_result = None
    document.central_thesis = None
    document.key_concepts = None
    document.argumentative_structure = None
    document.cited_sources = None
    document.analyzed_at = None
    
    await db.commit()
    
    return {"message": "Analisi resettata. Puoi ora richiedere una nuova analisi."} 
