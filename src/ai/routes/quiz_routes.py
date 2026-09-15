"""
routes/quiz_routes.py — GenQuiz endpoints

Instructor / TA:
  POST /quiz/from-material        — Gen từ approved material (draft)
  POST /quiz/from-bank            — Gen từ ngân hàng đề raw text (draft)
  PATCH /quiz/{draft_id}/publish  — Duyệt publish (bắt buộc trước khi học sinh xem)
  GET /quiz/{draft_id}            — Xem draft

Student (private — không lưu DB):
  POST /quiz/from-note            — Gen từ ghi chú riêng

Team 1 & Team 2 Contract:
  POST /api/ai/gen-quiz           — Sinh bài tập 3 dạng chuẩn hóa JSON
"""
from __future__ import annotations
from typing import Literal, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from mock_auth import MockUser, get_current_user, require_course_access
import quiz_generator as qg

router = APIRouter(prefix="/quiz", tags=["GenQuiz"])
contract_router = APIRouter(prefix="/api/ai", tags=["Team Contract Endpoints"])


# ── Request schemas ────────────────────────────────────────────────────────
AllowedQuestionType = Literal[
    "single_choice", "multiple_choice", "short_answer",
    "mixed", "mcq", "truefalse", "short"
]


class FromMaterialRequest(BaseModel):
    material_id: str = Field(..., example="mat-intro-001")
    course_id: str   = Field(..., example="course-a")
    topic: str       = Field(default="", example="variables and data types")
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_type: str = Field(default="mixed", example="mixed")
    count: int       = Field(default=3, ge=1, le=20)


class FromBankRequest(BaseModel):
    bank_content: str = Field(..., min_length=20,
                              description="Raw text extracted from question bank file")
    count: int = Field(default=3, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_type: str = Field(default="mixed", example="mixed")
    topic: str = Field(default="", example="Pointers and memory")


class FromNoteRequest(BaseModel):
    note_content: str = Field(..., min_length=15,
                              description="Student's private note content")
    count: int = Field(default=3, ge=1, le=20)
    types: list[str] = Field(default=["single_choice", "short_answer"])


class GenQuizStandardRequest(BaseModel):
    lesson_content: str = Field(..., min_length=20, example="Content of lecture slide...")
    topic: str = Field(default="C Programming", example="Con trỏ và Bộ nhớ")
    num_questions: int = Field(default=3, ge=1, le=20)
    types: list[str] = Field(
        default=["single_choice", "multiple_choice", "short_answer"],
        example=["single_choice", "multiple_choice", "short_answer"]
    )
    source_file: str = Field(default="Lecture01.pdf", example="Lecture02_Pointers.pdf")
    lesson_id: str = Field(default="lesson-c-intro", example="c-programming-intro")


# ── Instructor: Gen từ material ────────────────────────────────────────────
@router.post("/from-material")
def gen_from_material(
    body: FromMaterialRequest,
    current_user: MockUser = Depends(get_current_user),
):
    """
    Instructor/TA: generate quiz draft from an approved course material.
    Quiz is saved as 'draft' — instructor must PATCH /publish before students see it.
    """
    if current_user.role not in ("instructor", "ta", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only instructors, TAs, or admins can generate quiz drafts.")

    # Kiểm tra instructor có quyền trên course không
    require_course_access(body.course_id, current_user)

    try:
        draft = qg.gen_from_material(
            material_id=body.material_id,
            topic=body.topic,
            difficulty=body.difficulty,
            question_type=body.question_type,
            count=body.count,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {
        **draft,
        "message": "Draft created. Review questions and PATCH /quiz/{draft_id}/publish to make it available to students.",
    }


# ── Instructor: Gen từ ngân hàng đề ───────────────────────────────────────
@router.post("/from-bank")
def gen_from_bank(
    body: FromBankRequest,
    current_user: MockUser = Depends(get_current_user),
):
    """
    Instructor/TA: generate quiz draft from a question bank (raw text).
    Status = 'draft'. Requires PATCH /publish.
    """
    if current_user.role not in ("instructor", "ta", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only instructors, TAs, or admins can use question banks.")

    draft = qg.gen_from_question_bank(
        bank_content=body.bank_content,
        count=body.count,
        difficulty=body.difficulty,
        question_type=body.question_type,
        topic=body.topic,
    )
    return {
        **draft,
        "message": "Draft created from question bank. Review and PATCH /quiz/{draft_id}/publish to publish.",
    }


# ── Instructor: Publish draft ──────────────────────────────────────────────
@router.patch("/{draft_id}/publish")
def publish_draft(
    draft_id: str,
    current_user: MockUser = Depends(get_current_user),
):
    """
    Instructor confirms and publishes a quiz draft.
    Without this step, no student can access the quiz.
    """
    if current_user.role not in ("instructor", "ta", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only instructors, TAs, or admins can publish quiz drafts.")

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
    current_user: MockUser = Depends(get_current_user),
):
    """View a quiz draft (instructor only)."""
    if current_user.role not in ("instructor", "ta", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only instructors can view quiz drafts.")

    draft = qg.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Draft '{draft_id}' not found.")
    return draft


# ── Student: Gen từ ghi chú riêng (PRIVATE — KHÔNG LƯU DB) ─────────────────
@router.post("/from-note")
def gen_from_note(
    body: FromNoteRequest,
    current_user: MockUser = Depends(get_current_user),
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

    questions = qg.gen_from_note(body.note_content, body.count, body.types)

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
def api_gen_quiz_contract(body: GenQuizStandardRequest):
    """
    Endpoint chuẩn theo hợp đồng API Team 3 (AI & Quality) với Team 1 & Team 2:
    Nhận nội dung bài học -> Sinh đúng 3 dạng (single_choice, multiple_choice, short_answer)
    kèm trích dẫn số trang và lời giải thích.
    """
    result = qg.gen_quiz_standard(
        lesson_content=body.lesson_content,
        topic=body.topic,
        num_questions=body.num_questions,
        types=body.types,
        source_file=body.source_file,
        lesson_id=body.lesson_id,
    )
    return result
