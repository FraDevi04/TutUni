from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class DocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_size: int
    file_type: str


class DocumentUpload(BaseModel):
    project_id: int


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    file_path: str
    page_count: Optional[int] = None
    status: str
    is_analyzed: bool
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    analyzed_at: Optional[datetime] = None
    project_id: int
    
    # Analysis results
    central_thesis: Optional[str] = None
    key_concepts: Optional[List[str]] = None
    argumentative_structure: Optional[Dict[str, Any]] = None
    cited_sources: Optional[List[Dict[str, Any]]] = None


class DocumentAnalysis(BaseModel):
    central_thesis: Optional[str] = None
    key_concepts: Optional[List[str]] = None
    argumentative_structure: Optional[Dict[str, Any]] = None
    cited_sources: Optional[List[Dict[str, Any]]] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    per_page: int 