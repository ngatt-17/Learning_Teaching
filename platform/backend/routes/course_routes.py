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
