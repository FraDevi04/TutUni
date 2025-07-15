from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_async_session
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.background_processor import process_project_documents
from app.routers.auth import get_current_user


router = APIRouter()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new project"""
    
    # Check if free user has reached project limit
    if not current_user.is_pro:
        stmt = select(func.count(Project.id)).where(Project.owner_id == current_user.id)
        result = await db.execute(stmt)
        project_count = result.scalar()
        
        if project_count >= 5:  # Free user limit
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Limite di 5 progetti raggiunto. Aggiorna a Pro per progetti illimitati."
            )
    
    # Create project
    db_project = Project(
        title=project.title,
        description=project.description,
        owner_id=current_user.id
    )
    
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    
    # Manually create response with computed fields for new project
    return ProjectResponse(
        id=db_project.id,
        title=db_project.title,
        description=db_project.description,
        progress=db_project.progress,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
        last_activity=db_project.last_activity,
        owner_id=db_project.owner_id,
        document_count=0,  # New project has no documents
        analyzed_document_count=0  # New project has no analyzed documents
    )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """List all projects for the current user"""
    
    # Get projects with document counts using a join
    from sqlalchemy.orm import selectinload
    stmt = select(Project).options(selectinload(Project.documents)).where(Project.owner_id == current_user.id).order_by(Project.updated_at.desc())
    result = await db.execute(stmt)
    projects = result.scalars().all()
    
    # Manually build response objects with computed fields
    project_responses = []
    for project in projects:
        project_responses.append(ProjectResponse(
            id=project.id,
            title=project.title,
            description=project.description,
            progress=project.progress,
            created_at=project.created_at,
            updated_at=project.updated_at,
            last_activity=project.last_activity,
            owner_id=project.owner_id,
            document_count=len(project.documents),
            analyzed_document_count=len([doc for doc in project.documents if doc.is_analyzed])
        ))
    
    return project_responses


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get a specific project"""
    
    # Get project with documents loaded
    from sqlalchemy.orm import selectinload
    stmt = select(Project).options(selectinload(Project.documents)).where(
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
    
    return ProjectResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        progress=project.progress,
        created_at=project.created_at,
        updated_at=project.updated_at,
        last_activity=project.last_activity,
        owner_id=project.owner_id,
        document_count=len(project.documents),
        analyzed_document_count=len([doc for doc in project.documents if doc.is_analyzed])
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Update a project"""
    
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
    
    # Update fields
    if project_update.title is not None:
        project.title = project_update.title
    if project_update.description is not None:
        project.description = project_update.description
    
    project.update_activity()
    
    await db.commit()
    await db.refresh(project)
    
    # Load documents for computed fields
    from sqlalchemy.orm import selectinload
    stmt = select(Project).options(selectinload(Project.documents)).where(Project.id == project.id)
    result = await db.execute(stmt)
    updated_project = result.scalar_one()
    
    return ProjectResponse(
        id=updated_project.id,
        title=updated_project.title,
        description=updated_project.description,
        progress=updated_project.progress,
        created_at=updated_project.created_at,
        updated_at=updated_project.updated_at,
        last_activity=updated_project.last_activity,
        owner_id=updated_project.owner_id,
        document_count=len(updated_project.documents),
        analyzed_document_count=len([doc for doc in updated_project.documents if doc.is_analyzed])
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a project"""
    
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
    
    await db.delete(project)
    await db.commit()
    
    return {"message": "Progetto eliminato con successo"}


@router.get("/{project_id}/stats")
async def get_project_stats(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get project statistics"""
    
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
    
    return {
        "document_count": project.document_count,
        "analyzed_document_count": project.analyzed_document_count,
        "progress": project.calculate_progress(),
        "last_activity": project.last_activity
    }


@router.post("/{project_id}/process-documents")
async def process_project_documents_endpoint(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Process all documents in a project"""
    
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
    
    # Queue all documents for processing
    await process_project_documents(project_id)
    
    return {"message": f"Documenti del progetto '{project.title}' in elaborazione"} 
