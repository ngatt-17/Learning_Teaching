"""
main.py — AI & Quality Service
Runs on port 8001. Platform backend runs on port 8000.

Integration (Day 3):
- Auth: Platform JWT verified with the shared JWT_SECRET (auth.py). Mock tokens removed.
- Content: approved materials read through the Platform API with the caller's token
  (platform_client.py). This service has no database access.
- LLM: real calls when LLM_API_KEY is set; otherwise chat/tutor answer in labelled
  extractive mode and quiz generation returns 503.
"""
import os
import sys

# Thêm rag/ vào sys.path để các module import nhau được
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.health_routes import router as health_router
from routes.chat_routes import router as chat_router
from routes.quiz_routes import router as quiz_router, contract_router
from config import AI_SERVICE_PORT, PLATFORM_API_URL

load_dotenv()

app = FastAPI(
    title="CECS AI Learning Hub — AI & Quality Service",
    description=(
        "AI module: grounded chat with citations, Socratic quiz tutor, GenQuiz (3 types) and "
        "competency analysis.\n\n"
        "**Auth:** sign in on the Platform API (`POST /auth/verify-otp`) and send the same "
        "`Authorization: Bearer <token>` here. Course access and material approval are checked "
        f"by the Platform API at {PLATFORM_API_URL}."
    ),
    version="1.1.0-integration",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:4173", "http://127.0.0.1:4173",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(quiz_router)
app.include_router(contract_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "CECS AI Learning Hub — AI & Quality Service",
        "version": "1.1.0-integration",
        "swagger_docs": f"http://localhost:{AI_SERVICE_PORT}/docs",
        "health": f"http://localhost:{AI_SERVICE_PORT}/health",
        "platform_api": PLATFORM_API_URL,
        "endpoints": {
            "chat_rag": "POST /courses/{course_id}/chat",
            "quiz_tutor": "POST /courses/{course_id}/quiz-tutor",
            "gen_quiz_from_material": "POST /quiz/from-material",
            "gen_quiz_from_bank": "POST /quiz/from-bank",
            "gen_quiz_from_note": "POST /quiz/from-note (student private)",
            "attempt_competency": "POST /api/ai/courses/{course_id}/quizzes/{quiz_id}/competency",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=True)
