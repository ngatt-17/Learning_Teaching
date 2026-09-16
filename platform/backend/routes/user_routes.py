from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import UserPayload
from middleware import require_role
from database import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", dependencies=[Depends(require_role("admin"))])
def list_users(role: Optional[str] = None):
    """
    Admin-only directory used to assign instructors and students to courses.
    Returns account identity only — never notes, scores or feedback.
    """
    with get_db() as cur:
        if role:
            cur.execute(
                "SELECT id, email, name, role FROM users WHERE role = %s ORDER BY role, name;",
                (role,),
            )
        else:
            cur.execute("SELECT id, email, name, role FROM users ORDER BY role, name;")
        users = cur.fetchall()
        return [{**u, "id": str(u["id"])} for u in users]


@router.get("/{user_id}/courses", dependencies=[Depends(require_role("admin"))])
def list_courses_of_user(user_id: str):
    """
    Admin view: which courses a given student/instructor is assigned to.
    The self-service equivalent is GET /courses/ , which scopes to the caller.
    """
    with get_db() as cur:
        cur.execute("SELECT id, email, name, role FROM users WHERE id = %s;", (user_id,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        cur.execute("""
            SELECT c.id, c.code, c.name, c.term, e.role AS enrolled_role, e.enrolled_at
            FROM enrollments e JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = %s
            ORDER BY c.code;
        """, (user_id,))
        courses = cur.fetchall()

    return {
        "user": {**user, "id": str(user["id"])},
        "courses": [{
            **c,
            "id": str(c["id"]),
            "enrolled_at": str(c["enrolled_at"]) if c.get("enrolled_at") else None,
        } for c in courses],
    }
