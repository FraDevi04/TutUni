from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.core.database import create_tables
from app.services.background_processor import background_processor
from app.routers import auth, projects, documents, analysis, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await create_tables()
    print("📊 Database tables created")
    
    # Start background processor
    await background_processor.start()
    print("🔄 Background processor started")
    
    print("🚀 TutUni AI Backend started successfully")
    
    yield
    
    # Shutdown
    await background_processor.stop()
    print("🔄 Background processor stopped")
    print("👋 TutUni AI Backend shutting down")


app = FastAPI(
    title="TutUni AI API",
    description="Backend API for TutUni AI - Academic Research Assistant",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])


@app.get("/")
async def root():
    return {
        "message": "TutUni AI Backend API",
        "version": "0.1.0",
        "docs": "/docs" if settings.ENVIRONMENT == "development" else "Documentation not available in production"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"  # TODO: Add actual database health check
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    ) 