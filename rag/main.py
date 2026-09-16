"""
main.py — AI & Quality Service (Day 2 Standalone)
Runs on port 8001. Platform backend runs on port 8000.

⚠️  MOCKED_AUTH = True  (see mock_auth.py)
⚠️  MOCKED_FILE_PARSING = True  (see fixtures/sample_material.py)
    LLM API calls are REAL.
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
from config import AI_SERVICE_PORT

load_dotenv()

app = FastAPI(
    title="CECS AI Learning Hub — AI & Quality Service",
    description=(
        "Standalone AI module: Chat RAG with citation, GenQuiz (3 modes), "
        "and quality test checklist. Day 2 build — auth and file parsing are mocked; "
        "LLM API calls are real.\n\n"
        "**Mock tokens for testing:**\n"
        "- `student_a_token` — Student A (enrolled: course-a)\n"
        "- `student_b_token` — Student B (enrolled: course-b)\n"
        "- `instructor_token` — Instructor (course-a)\n"
        "- `admin_token` — Admin (all courses)"
    ),
    version="1.0.0-day02-standalone",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"],
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
        "version": "1.0.0-day02-standalone",
        "swagger_docs": "http://localhost:8001/docs",
        "health": "http://localhost:8001/health",
        "endpoints": {
            "chat_rag": "POST /courses/{course_id}/chat",
            "gen_quiz_from_material": "POST /quiz/from-material",
            "gen_quiz_from_bank": "POST /quiz/from-bank",
            "gen_quiz_from_note": "POST /quiz/from-note (student private)",
            "publish_quiz": "PATCH /quiz/{draft_id}/publish",
        },
        "mock_tokens": {
            "student_a_token": "Student A — enrolled in course-a",
            "student_b_token": "Student B — enrolled in course-b",
            "instructor_token": "Instructor — manages course-a",
            "admin_token": "Admin — all courses",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=AI_SERVICE_PORT, reload=True)
