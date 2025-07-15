from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for user registration"""
    name: str = Field(..., min_length=2, max_length=50, description="Nome completo")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, max_length=100, description="Password")
    
    @validator('name')
    def validate_name(cls, v):
        if not v.replace(' ', '').isalpha():
            raise ValueError('Il nome può contenere solo lettere e spazi')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if not any(c.islower() for c in v):
            raise ValueError('La password deve contenere almeno una lettera minuscola')
        if not any(c.isupper() for c in v):
            raise ValueError('La password deve contenere almeno una lettera maiuscola')
        if not any(c.isdigit() for c in v):
            raise ValueError('La password deve contenere almeno un numero')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    """Schema for user data in responses"""
    id: int
    email: str
    name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    documents_uploaded: Optional[int] = None
    ai_questions_asked: Optional[int] = None
    ai_questions_today: Optional[int] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: Optional[str] = None
    email: Optional[str] = None
    exp: Optional[datetime] = None


class PasswordReset(BaseModel):
    """Schema for password reset request"""
    email: EmailStr = Field(..., description="Email address")


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation"""
    token: str = Field(..., description="Reset token")
    new_password: str = Field(..., min_length=6, max_length=100, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        if not any(c.islower() for c in v):
            raise ValueError('La password deve contenere almeno una lettera minuscola')
        if not any(c.isupper() for c in v):
            raise ValueError('La password deve contenere almeno una lettera maiuscola')
        if not any(c.isdigit() for c in v):
            raise ValueError('La password deve contenere almeno un numero')
        return v


class UserUpdate(BaseModel):
    """Schema for user profile updates"""
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    
    @validator('name')
    def validate_name(cls, v):
        if v and not v.replace(' ', '').isalpha():
            raise ValueError('Il nome può contenere solo lettere e spazi')
        return v.strip() if v else v 