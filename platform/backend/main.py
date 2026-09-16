import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from routes.auth_routes import router as auth_router
from routes.course_routes import router as course_router
from routes.material_routes import router as material_router
from routes.note_routes import router as note_router
from routes.score_routes import router as score_router
from routes.feedback_routes import router as feedback_router
from routes.user_routes import router as user_router
from routes.quiz_routes import router as quiz_router

load_dotenv()

app = FastAPI(
    title="CECS AI Learning Hub — Platform & Access API",
    description="Core backend platform providing Email OTP authentication, server-enforced role access, and PostgreSQL RLS-backed private notes.",
    version="1.0.0-day02"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000",
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8000", "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(course_router)
app.include_router(material_router)
app.include_router(note_router)
app.include_router(score_router)
app.include_router(feedback_router)
app.include_router(user_router)
app.include_router(quiz_router)

STATIC_DIR = Path(__file__).parent / "static"

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to CECS AI Learning Hub — Platform API (Day 2)",
        "swagger_docs": "http://localhost:8000/docs",
        "redoc": "http://localhost:8000/redoc",
        "health": "http://localhost:8000/health",
        "test_console": "http://localhost:8000/test-ui",
        "status": "online"
    }


@app.get("/test-ui", include_in_schema=False)
def test_console():
    """Single-page manual test console for every Day 2 API flow."""
    return FileResponse(STATIC_DIR / "test_ui.html")

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "CECS AI Learning Hub — Platform API",
        "database": "PostgreSQL with Row-Level Security",
        "day": "Day 2 Foundation"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
