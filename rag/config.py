"""
config.py — Cấu hình trung tâm cho AI module (CECS AI Learning Hub)
Hỗ trợ mọi LLM Engine tuân theo chuẩn OpenAI API (OpenAI, Gemini, Azure, DeepSeek, Local LLM, xKiro, v.v.)
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(ENV_PATH, override=True)
load_dotenv(override=True)


def get_configured_api_key() -> str:
    """Lấy API Key theo thứ tự ưu tiên: LLM_API_KEY > AI_API_KEY > OPENAI_API_KEY > GEMINI_API_KEY > DEEPSEEK_API_KEY > XKIRO_API_KEY"""
    raw_key = (
        os.getenv("LLM_API_KEY")
        or os.getenv("AI_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("DEEPSEEK_API_KEY")
        or os.getenv("XKIRO_API_KEY")
        or ""
    )
    return raw_key.strip()


def get_configured_base_url() -> str:
    """Tự động phát hiện Base URL tương ứng với Provider nếu không cấu hình thủ công."""
    custom_url = (
        os.getenv("LLM_BASE_URL")
        or os.getenv("AI_BASE_URL")
        or os.getenv("OPENAI_BASE_URL")
        or os.getenv("XKIRO_BASE_URL")
    )
    if custom_url and custom_url.strip():
        return custom_url.strip()
    if os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY") and not os.getenv("XKIRO_API_KEY") and not os.getenv("LLM_BASE_URL"):
        return "https://generativelanguage.googleapis.com/v1beta/openai/"
    if os.getenv("DEEPSEEK_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        return "https://api.deepseek.com/v1"
    if os.getenv("XKIRO_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        return "https://api.xkiro.com/v1"
    # Mặc định OpenAI chính thức
    return "https://api.openai.com/v1"


def get_configured_model() -> str:
    """Tự động chọn model tối ưu theo Provider."""
    custom_model = (
        os.getenv("LLM_MODEL")
        or os.getenv("MODEL_NAME")
        or os.getenv("OPENAI_MODEL")
        or os.getenv("AI_MODEL")
    )
    if custom_model and custom_model.strip():
        return custom_model.strip()
    if os.getenv("GEMINI_API_KEY") and not os.getenv("OPENAI_API_KEY") and not os.getenv("XKIRO_API_KEY"):
        return "gemini-3.5-flash-lite"
    if os.getenv("DEEPSEEK_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        return "deepseek-chat"
    if os.getenv("XKIRO_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        return "deepseek/deepseek-v4.1-flash:free"
    return "gpt-4o-mini"


# ── Generic LLM API Configuration & Global Exports ──────────────────────────
LLM_API_KEY: str = get_configured_api_key()
LLM_BASE_URL: str = get_configured_base_url()
DEFAULT_MODEL: str = get_configured_model()

# Tương thích ngược với các module khác
AI_API_KEY: str = LLM_API_KEY
AI_BASE_URL: str = LLM_BASE_URL
XKIRO_API_KEY: str = LLM_API_KEY
XKIRO_BASE_URL: str = LLM_BASE_URL


def get_ai_client() -> OpenAI:
    """Khởi tạo OpenAI client với thông tin cấu hình mới nhất từ file .env"""
    load_dotenv(ENV_PATH, override=True)
    load_dotenv(override=True)
    api_key = get_configured_api_key()
    base_url = get_configured_base_url()
    return OpenAI(api_key=api_key or "dummy_test_key", base_url=base_url if base_url else None)

# ── Retrieval ──────────────────────────────────────────────────
CHUNK_SIZE_WORDS: int = 150     # ~500 tokens
CHUNK_OVERLAP_WORDS: int = 30
TOP_K: int = 5                  # Số chunks trả về mỗi query

# ── Quiz generation ────────────────────────────────────────────
MAX_QUIZ_COUNT: int = 20        # Giới hạn số câu 1 lần gen

# ── Server ────────────────────────────────────────────────────
AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))

