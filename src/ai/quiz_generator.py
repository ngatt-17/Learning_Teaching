"""
quiz_generator.py — GenQuiz với 3 luồng

1. gen_from_material()    — Instructor: từ approved slide/material
2. gen_from_question_bank()  — Instructor: từ ngân hàng đề (raw text)
3. gen_from_note()        — Student: từ ghi chú riêng (KHÔNG lưu DB)

Tất cả draft quiz cần instructor PATCH /quiz/{draft_id}/publish mới published.
Student quiz (gen_from_note) không có draft_id và không lưu vào store.
"""
from __future__ import annotations
import json
import uuid
from typing import TypedDict, Literal

from openai import OpenAI

from config import XKIRO_API_KEY, XKIRO_BASE_URL, DEFAULT_MODEL, MAX_QUIZ_COUNT
from fixtures.sample_material import get_material


# ── Types ──────────────────────────────────────────────────────────────────
QuestionType = Literal["mcq", "truefalse", "short"]
Difficulty    = Literal["easy", "medium", "hard"]


class Question(TypedDict):
    id: int
    type: QuestionType
    question: str
    options: list[str]      # [] nếu short answer
    answer: str
    explanation: str
    source_page: int        # 0 nếu không xác định trang


class QuizDraft(TypedDict):
    draft_id: str
    material_id: str | None
    status: Literal["draft", "published"]
    questions: list[Question]


# ── In-memory draft store (Day 2) ──────────────────────────────────────────
# Tuần 2: thay bằng INSERT vào bảng quiz_drafts của platform DB.
_DRAFT_STORE: dict[str, QuizDraft] = {}


# ── OpenAI client ─────────────────────────────────────────────────────────
_client = OpenAI(api_key=XKIRO_API_KEY, base_url=XKIRO_BASE_URL)


# ── Prompt builder ─────────────────────────────────────────────────────────
def _build_quiz_prompt(
    context: str,
    count: int,
    qtype: QuestionType,
    difficulty: Difficulty,
    topic: str = "",
) -> str:
    type_desc = {
        "mcq": "multiple-choice (4 options, exactly one correct answer)",
        "truefalse": "True/False",
        "short": "short answer (1–2 sentences)",
    }[qtype]

    topic_clause = f" Focus on the topic: '{topic}'." if topic else ""
    return f"""You are an educational quiz generator for VinUniversity.
Generate exactly {count} {type_desc} questions at {difficulty} difficulty.{topic_clause}

Use ONLY the following course content:
---
{context}
---

Return a JSON array (no markdown, no extra text) with this exact structure for each question:
{{
  "id": <number>,
  "type": "{qtype}",
  "question": "<question text>",
  "options": [<list of strings, empty array for short answer>],
  "answer": "<correct answer>",
  "explanation": "<1–2 sentence explanation citing the source>",
  "source_page": <page number or 0>
}}

Important:
- For MCQ: options must have exactly 4 strings.
- For True/False: options must be ["True", "False"].
- For short: options must be [].
- Base all questions strictly on the provided content. Do not invent facts.
"""


def _call_llm_for_quiz(prompt: str) -> list[Question]:
    """Gọi LLM và parse JSON response thành list[Question]."""
    try:
        completion = _client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.5,
        )
        raw = completion.choices[0].message.content or "[]"
        # Strip potential markdown fences
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw)
        return [Question(**q) for q in data]
    except (json.JSONDecodeError, TypeError, KeyError) as e:
        # Trả về 1 câu hỏi lỗi thay vì crash toàn bộ
        return [Question(
            id=1, type="short",
            question="[Quiz generation failed — raw LLM output could not be parsed]",
            options=[], answer="N/A",
            explanation=str(e), source_page=0,
        )]


# ── 1. Gen từ material ─────────────────────────────────────────────────────
def gen_from_material(
    material_id: str,
    topic: str = "",
    difficulty: Difficulty = "medium",
    question_type: QuestionType = "mcq",
    count: int = 5,
) -> QuizDraft:
    """Instructor: sinh quiz từ approved material. Trả về draft (status=draft)."""
    count = min(count, MAX_QUIZ_COUNT)
    mat = get_material(material_id)
    if not mat:
        raise ValueError(f"Material '{material_id}' not found in fixtures.")
    if not mat["approved_for_ai"]:
        raise ValueError(f"Material '{material_id}' is not approved for AI use.")

    context = "\n\n".join(
        f"[Page {c['page']}] {c['text']}" for c in mat["chunks"]
    )
    prompt = _build_quiz_prompt(context, count, question_type, difficulty, topic)
    questions = _call_llm_for_quiz(prompt)

    draft = QuizDraft(
        draft_id=str(uuid.uuid4()),
        material_id=material_id,
        status="draft",
        questions=questions,
    )
    _DRAFT_STORE[draft["draft_id"]] = draft
    return draft


# ── 2. Gen từ ngân hàng đề ─────────────────────────────────────────────────
def gen_from_question_bank(
    bank_content: str,
    count: int = 10,
    difficulty: Difficulty = "medium",
    question_type: QuestionType = "mcq",
) -> QuizDraft:
    """Instructor: sinh quiz từ raw text ngân hàng đề (PDF đã extract).
    Trả về draft (status=draft).
    """
    count = min(count, MAX_QUIZ_COUNT)
    prompt = _build_quiz_prompt(bank_content, count, question_type, difficulty)
    questions = _call_llm_for_quiz(prompt)

    draft = QuizDraft(
        draft_id=str(uuid.uuid4()),
        material_id=None,
        status="draft",
        questions=questions,
    )
    _DRAFT_STORE[draft["draft_id"]] = draft
    return draft


# ── 3. Gen từ ghi chú của student (PRIVATE — không lưu DB) ────────────────
def gen_from_note(note_content: str, count: int = 5) -> list[Question]:
    """Student: sinh quiz từ ghi chú riêng.
    KHÔNG lưu vào _DRAFT_STORE hay bất kỳ DB nào.
    Trả thẳng list[Question].
    """
    count = min(count, MAX_QUIZ_COUNT)
    prompt = _build_quiz_prompt(note_content, count, "mcq", "medium")
    return _call_llm_for_quiz(prompt)


# ── Publish (Instructor review) ────────────────────────────────────────────
def publish_draft(draft_id: str) -> QuizDraft:
    """Instructor xác nhận publish draft. Không có bước này, quiz không ra student."""
    draft = _DRAFT_STORE.get(draft_id)
    if not draft:
        raise KeyError(f"Draft '{draft_id}' not found.")
    draft["status"] = "published"
    return draft


def get_draft(draft_id: str) -> QuizDraft | None:
    return _DRAFT_STORE.get(draft_id)


def draft_exists(draft_id: str) -> bool:
    return draft_id in _DRAFT_STORE
