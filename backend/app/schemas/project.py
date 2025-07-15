from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    progress: float
    created_at: datetime
    updated_at: datetime
    last_activity: datetime
    owner_id: int
    document_count: int
    analyzed_document_count: int 