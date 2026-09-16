"""
quiz_generator.py — GenQuiz chuẩn hóa cho CECS AI Learning Hub (AI & Quality Module)

Hỗ trợ 3 dạng câu hỏi chuẩn hóa theo draft/team-3-ai-quality-day02-plan.md:
  1. single_choice:  Chọn 1 đáp án đúng (Radio). correct_answer: int (index 0..3)
  2. multiple_choice: Chọn nhiều đáp án đúng (Checkbox). correct_answer: list[int]
  3. short_answer:    Điền từ / trả lời ngắn. correct_answer: str, keywords: list[str]

Mỗi câu hỏi đều có:
  - citation: {"source_file": str, "page": int, "evidence_snippet": str}
  - explanation: lời giải thích dựa trên tài liệu

3 luồng sử dụng:
  1. gen_from_material()       — Giảng viên/TA: từ bài giảng đã duyệt (Draft -> Publish)
  2. gen_from_question_bank()  — Giảng viên/TA: từ ngân hàng đề raw text
  3. gen_from_note()           — Sinh viên: từ ghi chú cá nhân (PRIVATE: KHÔNG LƯU SERVER)
"""
from __future__ import annotations
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import TypedDict, Literal, Any, Union

from openai import OpenAI

logger = logging.getLogger(__name__)

from config import (
    LLM_API_KEY,
    LLM_BASE_URL,
    get_ai_client,
    get_configured_model,
    XKIRO_API_KEY,
    XKIRO_BASE_URL,
    DEFAULT_MODEL,
    MAX_QUIZ_COUNT,
)
from fixtures.sample_material import get_material


# ── Types ──────────────────────────────────────────────────────────────────
QuestionType = Literal["single_choice", "multiple_choice", "short_answer", "mcq", "truefalse", "short"]
Difficulty = Literal["easy", "medium", "hard"]


class QuestionCitation(TypedDict):
    source_file: str
    page: int
    evidence_snippet: str


class Question(TypedDict, total=False):
    id: Union[str, int]
    type: str
    topic: str
    question: str
    options: list[str]
    correct_answer: Union[int, list[int], str]
    answer: str                 # Backward compatibility with existing tests
    keywords: list[str]          # Dành riêng cho short_answer
    explanation: str
    citation: QuestionCitation
    source_page: int             # Backward compatibility: page number


class QuizDraft(TypedDict, total=False):
    draft_id: str
    material_id: str | None
    lesson_id: str | None
    topic: str
    generated_at: str
    status: Literal["draft", "published"]
    questions: list[Question]


# ── In-memory draft store (Day 2) ──────────────────────────────────────────
# Tuần 2: thay bằng INSERT vào bảng quiz_drafts của PostgreSQL
_DRAFT_STORE: dict[str, QuizDraft] = {}


# ── OpenAI-compatible LLM client ──────────────────────────────────────────
_client = get_ai_client()


# ── Prompt Builder ─────────────────────────────────────────────────────────
def _build_quiz_prompt(
    context: str,
    count: int,
    requested_types: list[str],
    difficulty: Difficulty,
    topic: str = "",
    source_file: str = "CourseMaterial.pdf",
) -> str:
    topic_clause = f" Focus strictly on topic: '{topic}'." if topic else ""
    types_str = ", ".join(requested_types)

    return f"""You are an educational AI quiz generator for VinUniversity (CECS AI Learning Hub).
Generate exactly {count} quiz questions based ONLY on the provided course material.{topic_clause}
Target difficulty: {difficulty}.
Allowed question types: {types_str}.

Course Material:
---
{context}
---

Requirements for each question type:
1. "single_choice": exactly 4 options. "correct_answer" must be the 0-based integer index (0, 1, 2, or 3).
2. "multiple_choice": exactly 4 options. "correct_answer" must be a list of 0-based integer indices with 2 or more correct options (e.g. [0, 2] or [0, 1, 3]).
3. "short_answer": "options" is []. "correct_answer" is the sample model answer string. Provide a "keywords" list of acceptable key phrases for grading.

For EVERY question, you MUST cite the exact page number and a short snippet from the text where the answer is found.

Return ONLY a valid JSON array of objects (no markdown, no backticks, no introduction) following this schema:
[
  {{
    "id": "q1",
    "type": "single_choice",
    "topic": "{topic or 'Course Concepts'}",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 1,
    "explanation": "Clear explanation citing the course content.",
    "citation": {{
      "source_file": "{source_file}",
      "page": 1,
      "evidence_snippet": "exact or near exact snippet from the text"
    }}
  }},
  {{
    "id": "q2",
    "type": "multiple_choice",
    "topic": "{topic or 'Course Concepts'}",
    "question": "Which of the following are correct? (Select all that apply)",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": [0, 2],
    "explanation": "Explanation why A and C are correct.",
    "citation": {{
      "source_file": "{source_file}",
      "page": 2,
      "evidence_snippet": "text snippet"
    }}
  }},
  {{
    "id": "q3",
    "type": "short_answer",
    "topic": "{topic or 'Course Concepts'}",
    "question": "Fill in the blank / explain briefly...",
    "options": [],
    "correct_answer": "Expected brief answer",
    "keywords": ["keyword1", "keyword2"],
    "explanation": "Explanation.",
    "citation": {{
      "source_file": "{source_file}",
      "page": 3,
      "evidence_snippet": "text snippet"
    }}
  }}
]
Ensure the JSON is strictly valid, and generate a diverse mix of the requested types ({types_str}).
"""


def _normalize_questions(
    raw_data: list[dict[str, Any]],
    default_source: str = "CourseMaterial.pdf",
    target_qtype: str = "",
) -> list[Question]:
    """Chuẩn hóa dữ liệu trả về từ LLM để tương thích 100% với cả schema mới và unit test cũ."""
    normalized: list[Question] = []
    for idx, item in enumerate(raw_data, start=1):
        q_id = item.get("id", f"q{idx}")
        q_type = item.get("type", "single_choice")
        if target_qtype in ("mcq", "single_choice") and q_type in ("single_choice", "mcq"):
            q_type = target_qtype
        elif target_qtype in ("short", "short_answer") and q_type in ("short", "short_answer"):
            q_type = target_qtype

        question_text = item.get("question", "")
        options = item.get("options", [])
        explanation = item.get("explanation", "")
        topic = item.get("topic", "General")
        keywords = item.get("keywords", [])

        # Citation handling
        citation_raw = item.get("citation", {})
        if isinstance(citation_raw, dict):
            page_num = citation_raw.get("page", item.get("source_page", 1))
            try:
                page_num = int(page_num)
            except (ValueError, TypeError):
                page_num = 1
            citation: QuestionCitation = {
                "source_file": citation_raw.get("source_file", default_source),
                "page": page_num,
                "evidence_snippet": citation_raw.get("evidence_snippet", ""),
            }
        else:
            page_num = int(item.get("source_page", 1))
            citation = {
                "source_file": default_source,
                "page": page_num,
                "evidence_snippet": "",
            }

        # Validate len(options) == 4 cho single_choice và multiple_choice
        if q_type in ("single_choice", "multiple_choice", "mcq"):
            if not isinstance(options, list):
                options = []
            options = [str(opt).strip() for opt in options if str(opt).strip()]
            if len(options) > 4:
                logger.warning("Question %s has %d options (>4). Truncating to 4.", q_id, len(options))
                options = options[:4]
            elif len(options) < 4:
                logger.warning("Question %s has %d options (<4). Padding default fallbacks.", q_id, len(options))
                fallbacks = ["None of the above", "All of the above", "Cannot be determined", "Not applicable"]
                for fb in fallbacks:
                    if len(options) == 4:
                        break
                    if fb not in options:
                        options.append(fb)
                while len(options) < 4:
                    options.append(f"Option {chr(65 + len(options))}")

        elif q_type in ("short_answer", "short"):
            options = []

        # Correct answer & answer string handling
        correct_answer = item.get("correct_answer")
        answer_str = item.get("answer")

        if q_type in ("single_choice", "mcq"):
            if correct_answer is None and answer_str is not None:
                if answer_str in options:
                    correct_answer = options.index(answer_str)
                else:
                    correct_answer = 0
            elif isinstance(correct_answer, int) and 0 <= correct_answer < len(options):
                pass
            else:
                try:
                    correct_answer = int(correct_answer)
                    if not (0 <= correct_answer < len(options)):
                        correct_answer = 0
                except (ValueError, TypeError):
                    correct_answer = 0
            answer_str = options[correct_answer]

        elif q_type == "multiple_choice":
            if isinstance(correct_answer, list):
                valid_indices = [i for i in correct_answer if isinstance(i, int) and 0 <= i < len(options)]
                correct_answer = valid_indices if valid_indices else [0]
            else:
                correct_answer = [0]
            answer_str = ", ".join(options[i] for i in correct_answer)

        elif q_type in ("short_answer", "short"):
            if correct_answer is None:
                correct_answer = answer_str or ""
            if not answer_str:
                answer_str = str(correct_answer)
            if not keywords and isinstance(correct_answer, str):
                keywords = [k.strip() for k in correct_answer.split() if len(k.strip()) > 2]

        q: Question = {
            "id": q_id,
            "type": q_type,
            "topic": topic,
            "question": question_text,
            "options": options,
            "correct_answer": correct_answer,
            "answer": answer_str or "",
            "keywords": keywords,
            "explanation": explanation,
            "citation": citation,
            "source_page": citation["page"],
        }
        normalized.append(q)
    return normalized


def _call_llm_for_quiz(
    prompt: str,
    default_source: str = "CourseMaterial.pdf",
    target_qtype: str = "",
) -> list[Question]:
    """Gọi LLM engine chuẩn hóa (hỗ trợ OpenAI, Gemini, DeepSeek, xKiro) và parse kết quả JSON."""
    raw = ""
    model = get_configured_model()
    try:
        completion = _client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional educational assessment engine for VinUniversity. Output strictly valid JSON arrays only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,
            temperature=0.4,
        )
        raw = completion.choices[0].message.content or "[]"
    except Exception as e:
        logger.error(
            "LLM API call failed (model=%s, error_type=%s): %s",
            model,
            type(e).__name__,
            str(e),
            exc_info=True,
        )
        fb_type = target_qtype if target_qtype in ("single_choice", "multiple_choice", "short_answer", "mcq", "truefalse", "short") else "single_choice"
        fb_opts = [] if fb_type in ("short_answer", "short") else ["Retry", "Check Connection", "Check API Key", "Contact Admin"]
        fb_ans = [0] if fb_type in ("multiple_choice",) else (0 if fb_type in ("single_choice", "mcq", "truefalse") else "Retry")
        return [
            {
                "id": "q1",
                "type": fb_type,
                "topic": "API Error",
                "question": f"[Quiz generation failed — API call error: {type(e).__name__}]",
                "options": fb_opts,
                "correct_answer": fb_ans,
                "answer": "Retry",
                "keywords": [] if fb_type not in ("short_answer", "short") else ["Retry"],
                "explanation": f"API call error: {str(e)}",
                "citation": {"source_file": default_source, "page": 1, "evidence_snippet": "API Error fallback"},
                "source_page": 1,
            }
        ]

    try:
        # Bóc tách markdown json nếu có
        cleaned_raw = raw.strip()
        if "```json" in cleaned_raw:
            cleaned_raw = cleaned_raw.split("```json", 1)[1].split("```", 1)[0]
        elif "```" in cleaned_raw:
            cleaned_raw = cleaned_raw.split("```", 1)[1].split("```", 1)[0]
        cleaned_raw = cleaned_raw.strip()

        data = json.loads(cleaned_raw)
        if isinstance(data, dict) and "questions" in data:
            data = data["questions"]
        if not isinstance(data, list):
            data = []

        return _normalize_questions(data, default_source=default_source, target_qtype=target_qtype)

    except (json.JSONDecodeError, TypeError, KeyError) as e:
        logger.error(
            "Failed to parse LLM JSON response (error=%s). Raw output was:\n%s",
            str(e),
            raw,
            exc_info=True,
        )
        fb_type = target_qtype if target_qtype in ("single_choice", "multiple_choice", "short_answer", "mcq", "truefalse", "short") else "single_choice"
        fb_opts = [] if fb_type in ("short_answer", "short") else ["Retry", "Check JSON Format", "Check Output", "Contact Admin"]
        fb_ans = [0] if fb_type in ("multiple_choice",) else (0 if fb_type in ("single_choice", "mcq", "truefalse") else "Retry")
        return [
            {
                "id": "q1",
                "type": fb_type,
                "topic": "Parse Error",
                "question": "[Quiz generation failed — LLM output could not be parsed as valid JSON]",
                "options": fb_opts,
                "correct_answer": fb_ans,
                "answer": "Retry",
                "keywords": [] if fb_type not in ("short_answer", "short") else ["Retry"],
                "explanation": f"JSON parsing failed: {str(e)}",
                "citation": {"source_file": default_source, "page": 1, "evidence_snippet": "Parse Error fallback"},
                "source_page": 1,
            }
        ]
    except Exception as e:
        logger.error(
            "Unexpected error in _call_llm_for_quiz: %s",
            str(e),
            exc_info=True,
        )
        fb_type = target_qtype if target_qtype in ("single_choice", "multiple_choice", "short_answer", "mcq", "truefalse", "short") else "single_choice"
        fb_opts = [] if fb_type in ("short_answer", "short") else ["Retry", "Check System", "Check Logs", "Contact Admin"]
        fb_ans = [0] if fb_type in ("multiple_choice",) else (0 if fb_type in ("single_choice", "mcq", "truefalse") else "Retry")
        return [
            {
                "id": "q1",
                "type": fb_type,
                "topic": "Unexpected Error",
                "question": f"[Quiz generation failed — unexpected error: {str(e)}]",
                "options": fb_opts,
                "correct_answer": fb_ans,
                "answer": "Retry",
                "keywords": [] if fb_type not in ("short_answer", "short") else ["Retry"],
                "explanation": str(e),
                "citation": {"source_file": default_source, "page": 1, "evidence_snippet": "Error fallback"},
                "source_page": 1,
            }
        ]


# ── 1. Gen từ bài giảng đã duyệt (Instructor / TA Flow) ──────────────────────
def gen_from_material(
    material_id: str,
    topic: str = "",
    difficulty: Difficulty = "medium",
    question_type: str = "mixed",
    count: int = 3,
) -> QuizDraft:
    """Giảng viên sinh quiz từ học liệu đã duyệt. Trả về QuizDraft ở trạng thái 'draft'."""
    count = min(count, MAX_QUIZ_COUNT)
    mat = get_material(material_id)
    if not mat:
        raise ValueError(f"Material '{material_id}' not found in fixtures.")
    if not mat.get("approved_for_ai"):
        raise ValueError(f"Material '{material_id}' is not approved for AI use.")

    # Xác định các dạng câu hỏi cần sinh
    if question_type in ("single_choice", "mcq"):
        requested_types = ["single_choice"]
    elif question_type in ("multiple_choice",):
        requested_types = ["multiple_choice"]
    elif question_type in ("short_answer", "short"):
        requested_types = ["short_answer"]
    elif question_type in ("truefalse",):
        requested_types = ["single_choice"]
    else:
        # Mặc định là 'mixed': sinh kết hợp đủ 3 dạng chuẩn của Team 3
        requested_types = ["single_choice", "multiple_choice", "short_answer"]

    context = "\n\n".join(
        f"[Page {c['page']}] {c['text']}" for c in mat["chunks"]
    )
    source_file = f"{material_id}.pdf"
    prompt = _build_quiz_prompt(context, count, requested_types, difficulty, topic, source_file)
    questions = _call_llm_for_quiz(prompt, default_source=source_file, target_qtype=question_type)

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    draft_id = str(uuid.uuid4())
    draft: QuizDraft = {
        "draft_id": draft_id,
        "material_id": material_id,
        "lesson_id": material_id,
        "topic": topic or "Course Material Overview",
        "generated_at": now_iso,
        "status": "draft",
        "questions": questions,
    }
    _DRAFT_STORE[draft_id] = draft
    return draft


# ── 2. Gen từ ngân hàng đề raw text (Instructor / TA Flow) ───────────────────
def gen_from_question_bank(
    bank_content: str,
    count: int = 3,
    difficulty: Difficulty = "medium",
    question_type: str = "mixed",
    topic: str = "",
) -> QuizDraft:
    """Giảng viên sinh quiz từ text ngân hàng đề. Trả về draft."""
    count = min(count, MAX_QUIZ_COUNT)
    if question_type in ("single_choice", "mcq"):
        requested_types = ["single_choice"]
    elif question_type in ("multiple_choice",):
        requested_types = ["multiple_choice"]
    elif question_type in ("short_answer", "short"):
        requested_types = ["short_answer"]
    else:
        requested_types = ["single_choice", "multiple_choice", "short_answer"]

    prompt = _build_quiz_prompt(bank_content, count, requested_types, difficulty, topic, "QuestionBank.pdf")
    questions = _call_llm_for_quiz(prompt, default_source="QuestionBank.pdf", target_qtype=question_type)

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    draft_id = str(uuid.uuid4())
    draft: QuizDraft = {
        "draft_id": draft_id,
        "material_id": None,
        "lesson_id": "bank-extracted",
        "topic": topic or "Question Bank Topic",
        "generated_at": now_iso,
        "status": "draft",
        "questions": questions,
    }
    _DRAFT_STORE[draft_id] = draft
    return draft


# ── 3. Gen từ ghi chú của sinh viên (STUDENT PRIVATE — KHÔNG LƯU DB) ────────
def gen_from_note(
    note_content: str,
    count: int = 3,
    types: list[str] | None = None,
) -> list[Question]:
    """
    Sinh viên sinh quiz từ ghi chú cá nhân (Private Study Space).
    TUYỆT ĐỐI KHÔNG LƯU VÀO _DRAFT_STORE HOẶC DATABASE NÀO.
    """
    count = min(count, MAX_QUIZ_COUNT)
    requested_types = types or ["single_choice", "short_answer"]
    prompt = _build_quiz_prompt(note_content, count, requested_types, "medium", "Personal Notes", "PrivateStudyNotes")
    target_type = requested_types[0] if len(requested_types) == 1 else ""
    return _call_llm_for_quiz(prompt, default_source="PrivateStudyNotes", target_qtype=target_type)


# ── 4. API Contract Endpoint cho Team 1 & Team 2 (POST /api/ai/gen-quiz) ───
def gen_quiz_standard(
    lesson_content: str,
    topic: str = "",
    num_questions: int = 3,
    types: list[str] | None = None,
    source_file: str = "LectureSlide.pdf",
    lesson_id: str = "lesson-01",
) -> dict[str, Any]:
    """Hàm sinh bài tập chuẩn theo đúng định dạng JSON thỏa thuận trong Team 3 Day 02 plan."""
    num_questions = min(num_questions, MAX_QUIZ_COUNT)
    requested_types = types or ["single_choice", "multiple_choice", "short_answer"]
    prompt = _build_quiz_prompt(lesson_content, num_questions, requested_types, "medium", topic, source_file)
    target_type = requested_types[0] if len(requested_types) == 1 else ""
    questions = _call_llm_for_quiz(prompt, default_source=source_file, target_qtype=target_type)

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return {
        "lesson_id": lesson_id,
        "topic": topic or "General Topic",
        "generated_at": now_iso,
        "questions": questions,
    }


# ── Publish draft (Instructor review) ──────────────────────────────────────
def publish_draft(draft_id: str) -> QuizDraft:
    """Giảng viên duyệt publish. Không có bước này, sinh viên không thể thấy bài tập."""
    draft = _DRAFT_STORE.get(draft_id)
    if not draft:
        raise KeyError(f"Draft '{draft_id}' not found.")
    draft["status"] = "published"
    return draft


def get_draft(draft_id: str) -> QuizDraft | None:
    return _DRAFT_STORE.get(draft_id)


def draft_exists(draft_id: str) -> bool:
    return draft_id in _DRAFT_STORE


# ── Aliases for documentation & cross-module compatibility ──────────────────
generate_quiz_from_material = gen_from_material
publish_quiz_draft = publish_draft
