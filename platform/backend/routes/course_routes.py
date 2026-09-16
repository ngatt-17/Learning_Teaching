from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from auth import UserPayload, get_current_user
from middleware import require_role, require_course_access
from database import get_db

router = APIRouter(prefix="/courses", tags=["Courses"])

class CourseCreate(BaseModel):
    code: str
    name: str
    term: str
    instructor_id: Optional[str] = None

class EnrollmentCreate(BaseModel):
    user_id: str
    role: str

@router.get("/")
def list_courses(current_user: UserPayload = Depends(get_current_user)):
    with get_db() as cur:
        if current_user.role == "admin":
            cur.execute("""
                SELECT c.id, c.code, c.name, c.term, u.name as instructor_name
                FROM courses c
                LEFT JOIN users u ON c.instructor_id = u.id
                ORDER BY c.code;
            """)
        else:
            cur.execute("""
                SELECT c.id, c.code, c.name, c.term, e.role as my_role, u.name as instructor_name
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN users u ON c.instructor_id = u.id
                WHERE e.user_id = %s
                ORDER BY c.code;
            """, (current_user.user_id,))
        courses = cur.fetchall()
        # Convert UUID to string for JSON serialization
        return [{**c, "id": str(c["id"])} for c in courses]

@router.get("/readiness", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def course_readiness(current_user: UserPayload = Depends(get_current_user)):
    """
    Course readiness for staff dashboards: enrolment, material lifecycle and quiz review
    counts. Admin sees every course; instructors/TAs see their assigned courses.
    Aggregate counts only — no private notes, no feedback text, no student identity.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT c.id, c.code, c.name, c.term, u.name AS instructor_name,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.role = 'student') AS students,
                   (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id) AS materials_total,
                   (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id
                       AND m.status = 'approved' AND m.approved_for_ai) AS materials_approved,
                   (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id
                       AND m.status IN ('draft', 'processing')) AS materials_pending,
                   (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.id AND m.status = 'failed') AS materials_failed,
                   (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id
                       AND q.quiz_type = 'lesson' AND q.status = 'published') AS quizzes_published,
                   (SELECT COUNT(*) FROM quizzes q WHERE q.course_id = c.id
                       AND q.quiz_type = 'lesson' AND q.status = 'draft') AS quizzes_draft,
                   (SELECT COUNT(*) FROM anonymous_feedback f WHERE f.course_id = c.id) AS feedback_count
            FROM courses c
            LEFT JOIN users u ON u.id = c.instructor_id
            WHERE %s OR c.id IN (SELECT course_id FROM enrollments WHERE user_id = %s)
            ORDER BY c.code;
        """, (current_user.role == "admin", current_user.user_id))
        rows = cur.fetchall()
    return [{**r, "id": str(r["id"])} for r in rows]

@router.get("/{course_id}")
def get_course_detail(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    with get_db() as cur:
        cur.execute("""
            SELECT c.id, c.code, c.name, c.term, u.name as instructor_name, u.email as instructor_email
            FROM courses c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.id = %s;
        """, (course_id,))
        course = cur.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return {**course, "id": str(course["id"])}

@router.post("/", dependencies=[Depends(require_role("admin"))])
def create_course(data: CourseCreate):
    with get_db() as cur:
        cur.execute("""
            INSERT INTO courses (code, name, term, instructor_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id, code, name, term;
        """, (data.code, data.name, data.term, data.instructor_id))
        new_course = cur.fetchone()
        return {**new_course, "id": str(new_course["id"])}

@router.post("/{course_id}/enroll", dependencies=[Depends(require_role("admin"))])
def enroll_user(course_id: str, data: EnrollmentCreate):
    with get_db() as cur:
        cur.execute("""
            INSERT INTO enrollments (user_id, course_id, role)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, course_id) DO UPDATE SET role = EXCLUDED.role
            RETURNING id, user_id, course_id, role;
        """, (data.user_id, course_id, data.role))
        enrollment = cur.fetchone()
        return {
            "id": str(enrollment["id"]),
            "user_id": str(enrollment["user_id"]),
            "course_id": str(enrollment["course_id"]),
            "role": enrollment["role"]
        }


@router.get("/{course_id}/members", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def list_course_members(course_id: str, role: Optional[str] = None, current_user: UserPayload = Depends(require_course_access)):
    """
    Roster of a course: who is enrolled and with which role.
    Identity and enrolment only — never notes, chat history or feedback authorship.
    """
    with get_db() as cur:
        if role:
            cur.execute("""
                SELECT u.id, u.email, u.name, e.role, e.enrolled_at
                FROM enrollments e JOIN users u ON u.id = e.user_id
                WHERE e.course_id = %s AND e.role = %s
                ORDER BY e.role, u.name;
            """, (course_id, role))
        else:
            cur.execute("""
                SELECT u.id, u.email, u.name, e.role, e.enrolled_at
                FROM enrollments e JOIN users u ON u.id = e.user_id
                WHERE e.course_id = %s
                ORDER BY e.role, u.name;
            """, (course_id,))
        members = cur.fetchall()
        return [{
            "id": str(m["id"]),
            "email": m["email"],
            "name": m["name"],
            "role": m["role"],
            "enrolled_at": str(m["enrolled_at"]) if m.get("enrolled_at") else None,
        } for m in members]


@router.delete("/{course_id}/enroll/{user_id}", dependencies=[Depends(require_role("admin"))], status_code=status.HTTP_204_NO_CONTENT)
def unenroll_user(course_id: str, user_id: str):
    """Remove a user from a course (admin assignment management)."""
    with get_db() as cur:
        cur.execute(
            "DELETE FROM enrollments WHERE course_id = %s AND user_id = %s RETURNING id;",
            (course_id, user_id)
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Enrollment not found")
    return None
