"""
routes/chat_routes.py — Chat RAG endpoint

POST /courses/{course_id}/chat
  Auth: Bearer <student_token>
  Body: { "question": "..." }
  Response: { "answer", "citations", "evidence_level" }
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from mock_auth import MockUser, get_current_user, require_course_access
from chat_rag import answer_question

router = APIRouter(prefix="/courses/{course_id}", tags=["Chat RAG"])


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000,
                          example="What is a variable in Python?")


@router.post("/chat")
def chat(
    course_id: str,
    body: ChatRequest,
    current_user: MockUser = Depends(get_current_user),
):
    """
    Student asks a question grounded in approved course materials.
    Returns answer + citations (material_id, title, page) + evidence_level.

    - evidence_level = 'supported': answer is grounded in retrieved chunks.
    - evidence_level = 'insufficient': no relevant approved content found.

    Access control: student must be enrolled in this course.
    Draft / unapproved materials are never retrieved.
    """
    # Kiểm tra quyền truy cập course
    require_course_access(course_id, current_user)

    result = answer_question(body.question, course_id)
    return {
        "course_id": course_id,
        "question": body.question,
        "answer": result["answer"],
        "citations": result["citations"],
        "evidence_level": result["evidence_level"],
        "user_id": current_user.user_id,
    }
