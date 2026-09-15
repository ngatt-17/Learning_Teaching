"""
chat_rag.py — RAG answer generation với citation page-level

Nguyên tắc "Tutor, Not Solver":
- Chỉ trả lời dựa trên approved course materials.
- Nếu không có evidence → trả "insufficient", không hallucinate.
- Citation bao gồm material_id, title, page_number, snippet.
"""
from __future__ import annotations
from typing import TypedDict, Literal
from openai import OpenAI

from config import XKIRO_API_KEY, XKIRO_BASE_URL, DEFAULT_MODEL, TOP_K
from retriever import retrieve, RetrievedChunk

# Ngưỡng tối thiểu — chunks dưới ngưỡng này bị coi là không liên quan
MIN_RELEVANCE_SCORE = 0.05


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
_client = OpenAI(api_key=XKIRO_API_KEY, base_url=XKIRO_BASE_URL)

# ── Prompts ───────────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """You are an academic tutor for VinUniversity's CECS AI Learning Hub.

Rules you must ALWAYS follow:
1. Answer ONLY using the provided [Context] sections below. Do not use outside knowledge.
2. If the context does not contain enough information to answer, say clearly:
   "Based on the approved course materials, I cannot find sufficient information to answer this question."
3. You are a TUTOR, not a solver. Guide understanding — do not just give direct answers to assignments.
4. Keep answers concise (3–5 sentences). Use examples from the context when helpful.
5. Do not make up page numbers, titles, or content not in the context.
"""

_INSUFFICIENT_ANSWER = (
    "Based on the approved course materials, I cannot find sufficient information "
    "to answer this question. Please refer to your instructor or check the course materials directly."
)


# ── Main function ─────────────────────────────────────────────────────────
def answer_question(question: str, course_id: str) -> RAGResponse:
    """
    Trả về answer + citations từ approved materials của course_id.
    Nếu không có chunks hoặc score quá thấp → evidence_level = "insufficient".
    """
    chunks: list[RetrievedChunk] = retrieve(question, course_id, top_k=TOP_K)

    # Lọc chunks quá kém liên quan
    chunks = [c for c in chunks if c["score"] >= MIN_RELEVANCE_SCORE]

    if not chunks:
        return RAGResponse(
            answer=_INSUFFICIENT_ANSWER,
            citations=[],
            evidence_level="insufficient",
        )

    # Build context block cho prompt
    context_blocks = []
    for i, c in enumerate(chunks, 1):
        context_blocks.append(
            f"[Context {i}] Source: {c['title']}, Page {c['page']}\n{c['snippet']}"
        )
    context_str = "\n\n".join(context_blocks)

    user_msg = f"Question: {question}\n\n{context_str}"

    try:
        completion = _client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=512,
            temperature=0.3,
        )
        answer_text = completion.choices[0].message.content or _INSUFFICIENT_ANSWER
    except Exception as e:
        answer_text = f"[AI service error] {str(e)}"

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
