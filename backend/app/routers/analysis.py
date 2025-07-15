from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def analysis_health():
    """Health check for analysis service"""
    return {"status": "ok", "service": "analysis"} 