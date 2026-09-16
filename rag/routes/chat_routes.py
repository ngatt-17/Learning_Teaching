"""
routes/chat_routes.py — Grounded chat and the Socratic quiz tutor

POST /courses/{course_id}/chat
  Auth: Bearer <Platform JWT>
  Body: { "question": "...", "material_id"?: "...", "page_number"?: 3 }
  Response: { "answer", "citations", "evidence_level", "generation" }

POST /courses/{course_id}/quiz-tutor
  Body: { "quiz_id", "question_id"?, "message"?, "attempt_id"? }
  attempt_id absent  → hint mode (answer key never loaded)
  attempt_id present → review mode (the caller's own graded attempt)
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

import platform_client
from auth import AuthUser, get_current_user
from chat_rag import answer_question
from grounded_chat import is_direct_solver_request
from retriever import materials_from_platform
from tutor import tutor_hint, tutor_review

router = APIRouter(prefix="/courses/{course_id}", tags=["Chat RAG"])


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000,
                          examples=["Process Control Block lưu những thông tin gì?"])
    # The material/page the student is looking at; boosts retrieval, never widens access.
    material_id: Optional[str] = None
    page_number: Optional[int] = Field(default=None, ge=1)


class TutorRequest(BaseModel):
    quiz_id: str
    question_id: Optional[str] = None
    message: str = Field(default="", max_length=1000)
    attempt_id: Optional[str] = None


def _approved_materials(course_id: str, user: AuthUser) -> dict:
    # 403 here when the caller is not enrolled; drafts are never in this payload.
    return materials_from_platform(platform_client.get_course_content(course_id, user.token))


@router.post("/chat")
def chat(
    course_id: str,
    body: ChatRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Student asks a question grounded in approved course materials.
    Returns answer + citations (material_id, title, page) + evidence_level.

    - evidence_level = 'supported': answer is grounded in retrieved chunks.
    - evidence_level = 'insufficient': no relevant approved content found.
    - generation = 'llm' | 'extractive' (no LLM key: quoted sentences) | 'guardrail'.

    Access control: enrolment is checked by the Platform API with the caller's token.
    Draft / unapproved materials are never retrieved.
    """
    materials = _approved_materials(course_id, current_user)

    if is_direct_solver_request(body.question):
        result = {
            "answer": ("Mình là trợ lý học tập nên không giải hộ bài tập. Hãy chia sẻ bạn đã thử những bước nào — "
                       "mình sẽ gợi ý từng bước dựa trên tài liệu môn học."),
            "citations": [], "evidence_level": "supported", "generation": "guardrail",
        }
    else:
        result = answer_question(body.question, course_id, materials=materials,
                                 prefer_material_id=body.material_id)
    return {
        "course_id": course_id,
        "question": body.question,
        "answer": result["answer"],
        "citations": result["citations"],
        "evidence_level": result["evidence_level"],
        "generation": result["generation"],
        "user_id": current_user.user_id,
    }


@router.post("/quiz-tutor")
def quiz_tutor(
    course_id: str,
    body: TutorRequest,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Socratic tutor next to the quiz. The mode is decided by data the Platform API returns
    for this caller, not by trusting the client:
    - hint: loads the student view of the quiz (no answer key exists in that payload).
    - review: loads the caller's own attempt; a 404 is returned if attempt_id is not theirs.
    """
    if not body.message.strip() and not body.question_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Provide a message or a question_id")

    materials = _approved_materials(course_id, current_user)

    if body.attempt_id:
        attempts = platform_client.get_my_attempts(course_id, body.quiz_id, current_user.token)
        attempt = next((a for a in attempts if a["attempt_id"] == body.attempt_id), None)
        if attempt is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Attempt not found for this student and quiz")
        return tutor_review(course_id, attempt, materials, body.message, body.question_id)

    quiz = platform_client.get_student_quiz(course_id, body.quiz_id, current_user.token)
    if body.question_id and body.question_id not in {q["id"] for q in quiz.get("questions", [])}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this quiz")
    return tutor_hint(course_id, quiz, materials, body.message, body.question_id)
