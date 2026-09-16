"""
routes/health_routes.py
"""
from fastapi import APIRouter

import config

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CECS AI Learning Hub — AI & Quality Service",
        "port": config.AI_SERVICE_PORT,
        "platform_api": config.PLATFORM_API_URL,
        "llm_configured": config.is_llm_configured(),
        "mocked": {
            "auth": False,           # Platform JWT
            "file_parsing": False,   # page text from Platform material_pages
            "ai_calls": not config.is_llm_configured(),  # True = extractive fallback in use
        },
    }
