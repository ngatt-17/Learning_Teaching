"""
routes/quiz_routes.py — GenQuiz endpoints

Instructor / TA:
  POST /quiz/from-material        — Gen từ approved material của Platform (draft JSON)
  POST /quiz/from-bank            — Gen từ ngân hàng đề raw text (draft JSON)
  PATCH /quiz/{draft_id}/publish  — (legacy Day 2, in-memory) — the real review gate is
                                    the Platform: POST /courses/{id}/quizzes/ always creates
                                    a draft and PATCH .../status publishes it
  GET /quiz/{draft_id}            — (legacy Day 2) Xem draft

Student (private — không lưu DB):
  POST /quiz/from-note            — Gen từ ghi chú riêng

Team 1 & Team 2 Contract:
  POST /api/ai/gen-quiz           — Sinh bài tập 3 dạng chuẩn hóa JSON
  POST /api/ai/analyze-competency — Phân tích điểm mạnh/yếu từ kết quả gửi lên
  POST /api/ai/courses/{course_id}/quizzes/{quiz_id}/competency
                                  — Phân tích từ attempt thật của chính sinh viên (Platform)
"""
from __future__ import annotations
from typing import Literal, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

import config
import platform_client
import quiz_generator as qg
from auth import AuthUser, get_current_user, require_staff

router = APIRouter(prefix="/quiz", tags=["GenQuiz"])
contract_router = APIRouter(prefix="/api/ai", tags=["Team Contract Endpoints"])

# Topics produced by quiz_generator when the provider call or JSON parsing failed.
_GENERATION_ERROR_TOPICS = {"API Error", "Parse Error", "Unexpected Error"}


def _require_llm():
    if not config.is_llm_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI quiz generation is unavailable: no LLM_API_KEY is configured on the AI service.",
        )


def _reject_failed_generation(questions: list[dict]):
    failed = [q for q in questions if q.get("topic") in _GENERATION_ERROR_TOPICS]
    if failed:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"The LLM provider did not return usable questions ({failed[0].get('topic')}). Try again.",
        )


# ── Request schemas ────────────────────────────────────────────────────────
AllowedQuestionType = Literal[
    "single_choice", "multiple_choice", "short_answer",
    "mixed", "mcq", "truefalse", "short"
]


class FromMaterialRequest(BaseModel):
    material_id: str = Field(..., examples=["20000000-0000-0000-0000-000000000001"])
    course_id: str   = Field(..., examples=["10000000-0000-0000-0000-000000000001"])
    topic: str       = Field(default="", examples=["variables and data types"])
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_type: str = Field(default="mixed", examples=["mixed"])
    count: int       = Field(default=3, ge=1, le=20)


class FromBankRequest(BaseModel):
    bank_content: str = Field(..., min_length=20,
                              description="Raw text extracted from question bank file")
    count: int = Field(default=3, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_type: str = Field(default="mixed", examples=["mixed"])
    topic: str = Field(default="", examples=["Pointers and memory"])


class FromNoteRequest(BaseModel):
    note_content: str = Field(..., min_length=15,
                              description="Student's private note content")
    count: int = Field(default=3, ge=1, le=20)
    types: list[str] = Field(default=["single_choice", "short_answer"])


class GenQuizStandardRequest(BaseModel):
    lesson_content: str = Field(..., min_length=20, examples=["Content of lecture slide..."])
    topic: str = Field(default="C Programming", examples=["Con trỏ và Bộ nhớ"])
    num_questions: int = Field(default=3, ge=1, le=20)
    types: list[str] = Field(
        default=["single_choice", "multiple_choice", "short_answer"],
        examples=[["single_choice", "multiple_choice", "short_answer"]]
    )
    source_file: str = Field(default="Lecture01.pdf", examples=["Lecture02_Pointers.pdf"])
    lesson_id: str = Field(default="lesson-c-intro", examples=["c-programming-intro"])


# ── Instructor: Gen từ material ────────────────────────────────────────────
@router.post("/from-material")
def gen_from_material(
    body: FromMaterialRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Instructor/TA: generate quiz draft questions from an approved course material.
    The material and its page text are loaded from the Platform API with the caller's
    token (course access is enforced there). The result is not published anywhere: the
    web app lets the instructor edit it and saves it to the Platform as a `draft` quiz.
    """
    require_staff(current_user, "generate quiz drafts")
    _require_llm()

    payload = platform_client.get_material_pages(body.course_id, body.material_id, current_user.token)
    material = payload["material"]
    if material.get("status") != "approved" or not material.get("approved_for_ai"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Material is not approved for AI use. Approve it before generating questions.")
    pages = [p for p in payload.get("pages", []) if p.get("content", "").strip()]
    if not pages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Material has no extracted text")

    try:
        draft = qg.gen_from_material(
            material_id=body.material_id,
            topic=body.topic,
            difficulty=body.difficulty,
            question_type=body.question_type,
            count=body.count,
            material={
                "title": material["title"],
                "approved_for_ai": True,
                "chunks": [{"page": p["page_number"], "text": p["content"]} for p in pages],
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    _reject_failed_generation(draft["questions"])

    return {
        **draft,
        "course_id": body.course_id,
        "material_title": material["title"],
        "message": "Draft questions generated. Review and edit them, then save the quiz as a draft on the Platform.",
    }


# ── Instructor: Gen từ ngân hàng đề ───────────────────────────────────────
@router.post("/from-bank")
def gen_from_bank(
    body: FromBankRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Instructor/TA: generate quiz draft from a question bank (raw text).
    Status = 'draft'. Requires PATCH /publish.
    """
    require_staff(current_user, "use question banks")
    _require_llm()

    draft = qg.gen_from_question_bank(
        bank_content=body.bank_content,
        count=body.count,
        difficulty=body.difficulty,
        question_type=body.question_type,
        topic=body.topic,
    )
    _reject_failed_generation(draft["questions"])
    return {
        **draft,
        "message": "Draft created from question bank. Review and PATCH /quiz/{draft_id}/publish to publish.",
    }


# ── Instructor: Publish draft ──────────────────────────────────────────────
@router.patch("/{draft_id}/publish")
def publish_draft(
    draft_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Legacy Day 2 in-memory publish. Students only ever see quizzes published on the
    Platform (PATCH /courses/{id}/quizzes/{quiz_id}/status).
    """
    require_staff(current_user, "publish quiz drafts")

    try:
        published = qg.publish_draft(draft_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Draft '{draft_id}' not found.")

    return {
        **published,
        "message": f"Quiz '{draft_id}' is now published and visible to students.",
    }


# ── Instructor: Get draft ──────────────────────────────────────────────────
@router.get("/{draft_id}")
def get_draft(
    draft_id: str,
    current_user: AuthUser = Depends(get_current_user),
):
    """View a quiz draft (instructor only)."""
    require_staff(current_user, "view quiz drafts")

    draft = qg.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Draft '{draft_id}' not found.")
    return draft


# ── Student: Gen từ ghi chú riêng (PRIVATE — KHÔNG LƯU DB) ─────────────────
@router.post("/from-note")
def gen_from_note(
    body: FromNoteRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Student: generate quiz from their own private note.

    Privacy guarantee:
    - Result is returned directly to the student.
    - NOT saved to any database or draft store.
    - No draft_id is created.
    - Cannot be accessed by instructors, admins, or other students.
    """
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This endpoint is for students only.")
    _require_llm()

    questions = qg.gen_from_note(body.note_content, body.count, body.types)
    _reject_failed_generation(questions)

    return {
        "note_quiz": True,
        "stored": False,                # Ghi rõ: không lưu DB
        "owner_id": current_user.user_id,
        "count": len(questions),
        "questions": questions,
        "privacy_notice": (
            "These questions were generated from your private notes "
            "and are not stored on the server."
        ),
    }


# ── API Contract Endpoint cho Team 1 & Team 2 ──────────────────────────────
@contract_router.post("/gen-quiz")
def api_gen_quiz_contract(
    body: GenQuizStandardRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Endpoint chuẩn theo hợp đồng API Team 3 (AI & Quality) với Team 1 & Team 2:
    Nhận nội dung bài học -> Sinh đúng 3 dạng (single_choice, multiple_choice, short_answer)
    kèm trích dẫn số trang và lời giải thích.

    Phân quyền: Chỉ giảng viên, TA hoặc admin mới được sinh đề thi từ học liệu môn học.
    """
    require_staff(current_user, "generate quizzes from course content")
    _require_llm()

    result = qg.gen_quiz_standard(
        lesson_content=body.lesson_content,
        topic=body.topic,
        num_questions=body.num_questions,
        types=body.types,
        source_file=body.source_file,
        lesson_id=body.lesson_id,
    )
    _reject_failed_generation(result["questions"])
    return result


# ── API Contract Endpoint: Competency & Gap Analysis ───────────────────────
class QuizAnswerInput(BaseModel):
    question_id: str = Field(default="q1", examples=["q1"])
    topic: str = Field(..., examples=["Cú pháp & Kiểu dữ liệu cơ bản"])
    is_correct: bool = Field(..., examples=[True])


class AnalyzeCompetencyRequest(BaseModel):
    student_id: str = Field(..., examples=["std_123"])
    course_id: Optional[str] = Field(default="CS101", examples=["CS101"])
    quiz_answers: list[QuizAnswerInput] = Field(default=[], description="Kết quả làm bài quiz chính thức")
    chat_topics: Optional[list[str]] = Field(default=[], description="Lịch sử thắc mắc bài học tại khung chat chung")
    private_notes: Optional[Any] = Field(
        default=None,
        description="⚠️ CẤM CUNG CẤP: Dữ liệu ghi chú cá nhân của sinh viên không được phép phân tích."
    )


@contract_router.post("/analyze-competency")
def api_analyze_competency(
    body: AnalyzeCompetencyRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Endpoint chuẩn theo hợp đồng API Team 3 (AI & Quality) — Khối 3: Competency Analyst.
    Phân tích điểm mạnh (Strengths) và điểm yếu / lỗ hổng kiến thức (Weaknesses).

    Quy tắc bảo mật bất khả xâm phạm ('Private means private'):
    - Chỉ phân tích từ kết quả quiz_answers và chat_topics chung của bài học.
    - Tuyệt đối loại trừ và từ chối xử lý dữ liệu private_notes của người học.
    - Sinh viên chỉ được phân tích cho chính mình.
    """
    if body.private_notes is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Security violation: 'private_notes' cannot be accessed or analyzed by the AI Competency Engine. "
                "Private study space is strictly confidential."
            ),
        )
    if current_user.role == "student" and body.student_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Students can only analyze their own results.")

    from competency_analyzer import analyze_competency

    raw_answers = [ans.model_dump() for ans in body.quiz_answers]
    report = analyze_competency(
        student_id=body.student_id,
        quiz_answers=raw_answers,
        chat_topics=body.chat_topics or [],
        course_id=body.course_id or "CS101",
    )
    return report


class AttemptCompetencyRequest(BaseModel):
    attempt_id: Optional[str] = Field(default=None, description="Defaults to the latest attempt")


@contract_router.post("/courses/{course_id}/quizzes/{quiz_id}/competency")
def attempt_competency(
    course_id: str,
    quiz_id: str,
    body: AttemptCompetencyRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Strengths/weaknesses for the caller's own graded attempt. Results are read from the
    Platform (never taken from the client), grouped by question topic, and each weak
    topic points to the citation pages of the questions that were missed.
    """
    from competency_analyzer import analyze_competency

    attempts = platform_client.get_my_attempts(course_id, quiz_id, current_user.token)
    if not attempts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No submitted attempt for this quiz")
    attempt = attempts[-1] if body.attempt_id is None else next(
        (a for a in attempts if a["attempt_id"] == body.attempt_id), None)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found for this student and quiz")

    quiz_answers, review_pages = [], {}
    for a in attempt["answers"]:
        topic = a.get("topic") or "Tổng quan"
        quiz_answers.append({"question_id": a["question_id"], "topic": topic, "is_correct": a["is_correct"]})
        citation = a.get("citation") or {}
        if not a["is_correct"] and citation.get("title") and citation.get("page"):
            review_pages.setdefault(topic, {}).setdefault(citation["title"], set()).add(citation["page"])

    recommendations = {
        topic: "Đọc lại " + "; ".join(f"{title}, trang {', '.join(map(str, sorted(pages)))}"
                                      for title, pages in by_title.items()) + "."
        for topic, by_title in review_pages.items()
    }
    report = analyze_competency(
        student_id=current_user.user_id,
        quiz_answers=quiz_answers,
        chat_topics=[],
        course_id=course_id,
        recommendations=recommendations,
    )
    return {**report, "attempt_id": attempt["attempt_id"], "quiz_id": quiz_id}
