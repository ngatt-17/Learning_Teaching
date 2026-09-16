"""
routes/health_routes.py
"""
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CECS AI Learning Hub — AI & Quality Service",
        "port": 8001,
        "day": "Day 2 Standalone",
        "mocked": {
            "auth": True,
            "file_parsing": True,
            "ai_calls": False,  # LLM API live
        },
    }
