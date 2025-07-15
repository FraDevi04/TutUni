#!/usr/bin/env python3
"""
Background Worker Script for TutUni AI
Standalone script to run the background document processor

Usage:
    python -m app.services.background_worker
    
    or
    
    python backend/app/services/background_worker.py
"""

import asyncio
import logging
import signal
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.background_processor import background_processor
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('background_worker.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


class BackgroundWorker:
    """
    Standalone background worker for document processing
    """
    
    def __init__(self):
        self.is_running = False
        self.shutdown_event = asyncio.Event()
        
    async def start(self):
        """Start the background worker"""
        logger.info("Starting TutUni AI Background Worker")
        logger.info(f"Environment: {settings.ENVIRONMENT}")
        logger.info(f"Vector DB Path: {settings.VECTOR_DB_PATH}")
        
        try:
            # Start background processor
            await background_processor.start()
            self.is_running = True
            
            logger.info("Background worker started successfully")
            
            # Wait for shutdown signal
            await self.shutdown_event.wait()
            
        except Exception as e:
            logger.error(f"Error starting background worker: {e}")
            raise
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the background worker"""
        logger.info("Stopping background worker...")
        
        try:
            await background_processor.stop()
            self.is_running = False
            logger.info("Background worker stopped")
        except Exception as e:
            logger.error(f"Error stopping background worker: {e}")
    
    def handle_shutdown(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down gracefully...")
        self.shutdown_event.set()


async def main():
    """Main function to run the background worker"""
    worker = BackgroundWorker()
    
    # Setup signal handlers
    def signal_handler(signum, frame):
        worker.handle_shutdown(signum, frame)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Worker error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Run the background worker
    asyncio.run(main()) 