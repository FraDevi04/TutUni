import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData
from typing import AsyncGenerator
import logging

from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Create declarative base
class Base(DeclarativeBase):
    """Base class for all database models"""
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get async database session.
    Use this in FastAPI endpoints with Depends(get_async_session).
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def create_tables():
    """
    Create all database tables.
    This function is called during application startup.
    """
    try:
        # Import all models to ensure they are registered with Base
        from app.models.user import User
        from app.models.project import Project
        from app.models.document import Document
        from app.models.chat import ChatMessage
        
        logger.info("Creating database tables...")
        
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            
        logger.info("✅ Database tables created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        raise


async def drop_tables():
    """
    Drop all database tables.
    Use with caution - this will delete all data!
    """
    try:
        logger.warning("Dropping all database tables...")
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            
        logger.info("✅ Database tables dropped successfully")
        
    except Exception as e:
        logger.error(f"❌ Error dropping database tables: {e}")
        raise


async def reset_database():
    """
    Reset database by dropping and recreating all tables.
    Use with caution - this will delete all data!
    """
    try:
        logger.warning("Resetting database...")
        await drop_tables()
        await create_tables()
        logger.info("✅ Database reset completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Error resetting database: {e}")
        raise


async def check_database_connection():
    """
    Check if database connection is working.
    Returns True if connection is successful, False otherwise.
    """
    try:
        async with engine.begin() as conn:
            # Use text() for raw SQL with SQLAlchemy 2.0
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


# Utility function for testing
async def get_test_session() -> AsyncSession:
    """
    Get a test database session.
    This creates a new session for testing purposes.
    """
    return AsyncSessionLocal()


# Database health check
async def health_check() -> dict:
    """
    Perform a database health check.
    Returns a dictionary with connection status and basic stats.
    """
    try:
        async with AsyncSessionLocal() as session:
            # Basic connection test
            result = await session.execute("SELECT 1")
            connection_ok = result.scalar() == 1
            
            # Get basic table info
            from app.models.user import User
            from app.models.project import Project
            from app.models.document import Document
            from app.models.chat import ChatMessage
            
            # Count records in main tables
            from sqlalchemy import text
            user_count = await session.execute(text("SELECT COUNT(*) FROM users"))
            project_count = await session.execute(text("SELECT COUNT(*) FROM projects"))
            document_count = await session.execute(text("SELECT COUNT(*) FROM documents"))
            message_count = await session.execute(text("SELECT COUNT(*) FROM chat_messages"))
            
            return {
                "status": "healthy" if connection_ok else "unhealthy",
                "connection": connection_ok,
                "statistics": {
                    "users": user_count.scalar(),
                    "projects": project_count.scalar(),
                    "documents": document_count.scalar(),
                    "messages": message_count.scalar()
                }
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "connection": False,
            "error": str(e)
        }


# Initialize database on module import
if __name__ == "__main__":
    # This allows running the file directly to create tables
    asyncio.run(create_tables()) 