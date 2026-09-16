"""
config.py — Cấu hình trung tâm cho AI module
Hỗ trợ mọi LLM Engine tuân theo chuẩn OpenAI API (OpenAI, Azure, Local LLM, v.v.)
"""
import os
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(ENV_PATH)
load_dotenv()

# ── Generic LLM API Configuration (Đọc 100% từ .env) ─────────────────────────
LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "")
DEFAULT_MODEL: str = os.getenv("LLM_MODEL", "")

# ── Retrieval ──────────────────────────────────────────────────
CHUNK_SIZE_WORDS: int = 150     # ~500 tokens
CHUNK_OVERLAP_WORDS: int = 30
TOP_K: int = 5                  # Số chunks trả về mỗi query

# ── Quiz generation ────────────────────────────────────────────
MAX_QUIZ_COUNT: int = 20        # Giới hạn số câu 1 lần gen

# ── Server ────────────────────────────────────────────────────
AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))
