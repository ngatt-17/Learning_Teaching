"""
chat_rag.py — RAG answer generation với Two-Stage Reranking & Citation Injection

Theo chuẩn thiết kế Day 18 (Production RAG):
1. Stage 1 (Broad Recall): Hybrid Search lấy Top-10 candidates.
2. Stage 2 (High Precision): Reranker Cross-Scorer chắt lọc Top-3 chuẩn xác nhất.
3. Augment: Citation Injection cấp câu ([1], [2]) truy nguyên chính xác nguồn bài giảng.
4. Nguyên tắc "Tutor, Not Solver": Dẫn dắt tư duy, chống hallucination.
"""
from __future__ import annotations
from typing import TypedDict, Literal
from openai import OpenAI

from config import (
    LLM_API_KEY,
    LLM_BASE_URL,
    get_ai_client,
    get_configured_model,
    get_configured_api_key,
    DEFAULT_MODEL,
    TOP_K,
    XKIRO_API_KEY,
    XKIRO_BASE_URL,
)
from retriever import retrieve, RetrievedChunk
from reranker import rerank

# Ngưỡng tối thiểu — chunks dưới ngưỡng này bị coi là không liên quan
MIN_RELEVANCE_SCORE = 0.05
BROAD_RECALL_K = 10  # Stage 1: Lấy 10 ứng viên
FINAL_RERANK_K = 3   # Stage 2: Rerank chọn 3 chunks tinh túy nhất


# ── Types ──────────────────────────────────────────────────────────────────
class Citation(TypedDict):
    material_id: str
    title: str
    page: int
    snippet: str


class RAGResponse(TypedDict):
    answer: str
    citations: list[Citation]
    evidence_level: Literal["supported", "insufficient"]


# ── Client ────────────────────────────────────────────────────────────────
_client = get_ai_client()

# ── Prompts ───────────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are an academic tutor for VinUniversity's CECS AI Learning Hub.

Rules you must ALWAYS follow:
1. Answer ONLY using the provided [Context i] sections below. Do not use outside knowledge.
2. If the context does not contain enough information to answer, say clearly:
   "Based on the approved course materials, I cannot find sufficient information to answer this question."
3. You are a TUTOR, not a solver. Guide understanding — do not just give direct answers to assignments.
4. Keep answers concise (3–5 sentences). Use examples from the context when helpful.
5. Do not make up page numbers, titles, or content not in the context.
6. Respond in the same language as the question (Vietnamese if asked in Vietnamese, English if asked in English).
7. Citation Injection: In your answer, attribute facts to their source by placing [1], [2], or [3] inline at the end of the sentence matching the respective [Context i].
"""

_INSUFFICIENT_ANSWER = (
    "Based on the approved course materials, I cannot find sufficient information "
    "to answer this question. Please refer to your instructor or check the course materials directly."
)


# ── Main function ─────────────────────────────────────────────────────────
def answer_question(question: str, course_id: str) -> RAGResponse:
    """
    Quy trình Two-Stage RAG (Retrieve Top-10 -> Rerank Top-3 -> Generate có Citation Injection).
    Nếu không có chunks hoặc score quá thấp -> evidence_level = "insufficient".
    """
    # ── Stage 1: Broad Recall (Lấy 10 ứng viên từ Hybrid Search) ─────────────
    candidates: list[RetrievedChunk] = retrieve(question, course_id, top_k=BROAD_RECALL_K)

    # Lọc chunks quá kém liên quan
    filtered = [c for c in candidates if c["score"] >= MIN_RELEVANCE_SCORE]

    if not filtered:
        return RAGResponse(
            answer=_INSUFFICIENT_ANSWER,
            citations=[],
            evidence_level="insufficient",
        )

    # ── Stage 2: Two-Stage Rerank (Chấm điểm chéo, chọn Top-3 tinh túy) ──────
    chunks = rerank(question, filtered, top_k=FINAL_RERANK_K)

    # Build context block cho prompt có đánh số [Context 1], [Context 2]...
    context_blocks = []
    for i, c in enumerate(chunks, 1):
        context_blocks.append(
            f"[Context {i}] Source: {c['title']}, Page {c['page']}\n{c.get('text', c['snippet'])}"
        )
    context_str = "\n\n".join(context_blocks)

    user_msg = f"Question: {question}\n\n{context_str}"

    model = get_configured_model()

    try:
        completion = _client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=2048,
            temperature=0.3,
        )
        answer_text = completion.choices[0].message.content or _INSUFFICIENT_ANSWER
    except Exception as e:
        answer_text = (
            f"[AI service error] {str(e)}\n\n"
            f"💡 Gợi ý: Hãy kiểm tra và cấu hình API Key hợp lệ trong file 'rag/.env' "
            f"(hỗ trợ OPENAI_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY hoặc XKIRO_API_KEY)."
        )

    citations: list[Citation] = [
        Citation(
            material_id=c["material_id"],
            title=c["title"],
            page=c["page"],
            snippet=c["snippet"],
        )
        for c in chunks
    ]

    return RAGResponse(
        answer=answer_text,
        citations=citations,
        evidence_level="supported",
    )
