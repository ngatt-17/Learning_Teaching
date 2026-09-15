"""
config.py — Cấu hình trung tâm cho AI module
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── xKiro API ──────────────────────────────────────────────────
XKIRO_API_KEY: str = os.getenv("XKIRO_API_KEY", "")
XKIRO_BASE_URL: str = "https://api.xkiro.com/v1"

# Default model — dùng google/gemini-3.5-flash (free tier, nhanh)
# Để đổi: set MODEL_NAME trong .env
DEFAULT_MODEL: str = os.getenv("MODEL_NAME", "google/gemini-3.5-flash")

# ── Retrieval ──────────────────────────────────────────────────
CHUNK_SIZE_WORDS: int = 150     # ~500 tokens
CHUNK_OVERLAP_WORDS: int = 30
TOP_K: int = 5                  # Số chunks trả về mỗi query

# ── Quiz generation ────────────────────────────────────────────
MAX_QUIZ_COUNT: int = 20        # Giới hạn số câu 1 lần gen

# ── Server ────────────────────────────────────────────────────
AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))
