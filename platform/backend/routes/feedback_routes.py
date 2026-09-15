from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from auth import UserPayload
from middleware import require_role, require_course_access
from database import get_db

router = APIRouter(prefix="/courses/{course_id}/feedback", tags=["Anonymous Feedback"])

class FeedbackSubmit(BaseModel):
    content: str

@router.post("/", status_code=status.HTTP_201_CREATED)
def submit_anonymous_feedback(
    course_id: str,
    data: FeedbackSubmit,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Submit anonymous course feedback.
    The database table deliberately does not have an author/user_id column.
    """
    with get_db() as cur:
        cur.execute("""
            INSERT INTO anonymous_feedback (course_id, content)
            VALUES (%s, %s)
            RETURNING id, course_id, content, submitted_at;
        """, (course_id, data.content))
        fb = cur.fetchone()
        return {
            "status": "received",
            "message": "Feedback submitted anonymously. No identity is linked.",
            "submitted_at": str(fb["submitted_at"])
        }

@router.get("/", dependencies=[Depends(require_role("admin"))])
def list_feedback_for_admin(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Admin view of raw feedback.
    Instructors only receive aggregate summaries via weekly email reports.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT id, course_id, content, submitted_at
            FROM anonymous_feedback
            WHERE course_id = %s
            ORDER BY submitted_at DESC;
        """, (course_id,))
        feedbacks = cur.fetchall()
        return [{
            "id": str(f["id"]),
            "course_id": str(f["course_id"]),
            "content": f["content"],
            "submitted_at": str(f["submitted_at"])
        } for f in feedbacks]
