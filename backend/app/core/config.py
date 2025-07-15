from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "TutUni AI Backend"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://tutuni-ai.vercel.app"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "tutuni-ai-backend.render.com"]
    
    # Database - Default to SQLite for development
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/tutuni_ai.db"
    DATABASE_ECHO: bool = False
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Vector Database
    VECTOR_DB_PATH: str = "./data/vector_db"
    
    # AI Services
    AI_PROVIDER: str = "ollama"  # Options: "anthropic", "groq", "ollama", "local"
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OLLAMA_HOST: str = "http://100.65.152.95:11434"
    OLLAMA_MODEL: str = "deepseek-r1:latest"  # Specific model to use
    OLLAMA_EMBEDDING_MODEL: str = "deepseek-r1:latest"  # Embedding model
    
    # File Storage
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = [".pdf", ".docx", ".txt"]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds
    
    # Email (for future use)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = ""
    EMAILS_FROM_NAME: str = "TutUni AI"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"
        
    def __post_init__(self):
        # Create upload directory if it doesn't exist
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Create data directory if it doesn't exist
        Path("./data").mkdir(parents=True, exist_ok=True)


settings = Settings() 