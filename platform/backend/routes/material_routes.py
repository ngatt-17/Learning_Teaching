from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from auth import UserPayload, get_current_user
from middleware import require_role, require_course_access
from database import get_db

router = APIRouter(prefix="/courses/{course_id}/materials", tags=["Materials"])

class MaterialCreate(BaseModel):
    title: str
    file_path: Optional[str] = None
    week_number: int
    lesson_title: str

class MaterialStatusUpdate(BaseModel):
    status: str
    approved_for_ai: Optional[bool] = None

@router.get("/")
def get_student_materials(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Student-facing materials endpoint:
    Strictly filters for approved materials only. Draft, processing,
    and archived files are excluded from student view and student retrieval.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT m.id, m.course_id, m.title, m.file_path, m.status, m.approved_for_ai,
                   w.week_number, w.lesson_title, m.created_at
            FROM materials m
            LEFT JOIN week_classifications w ON m.id = w.material_id
            WHERE m.course_id = %s
              AND m.status = 'approved'
              AND m.approved_for_ai = TRUE
            ORDER BY w.week_number ASC, m.created_at ASC;
        """, (course_id,))
        materials = cur.fetchall()
        return [{
            **m,
            "id": str(m["id"]),
            "course_id": str(m["course_id"])
        } for m in materials]

@router.get("/manage", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def get_instructor_materials(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Instructor/Management materials endpoint:
    Returns all materials (draft, processing, approved, archived) along with week classification.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT m.id, m.course_id, m.title, m.file_path, m.status, m.approved_for_ai,
                   w.week_number, w.lesson_title, m.created_at, u.name as uploaded_by_name
            FROM materials m
            LEFT JOIN week_classifications w ON m.id = w.material_id
            LEFT JOIN users u ON m.uploaded_by = u.id
            WHERE m.course_id = %s
            ORDER BY w.week_number ASC NULLS LAST, m.created_at ASC;
        """, (course_id,))
        materials = cur.fetchall()
        return [{
            **m,
            "id": str(m["id"]),
            "course_id": str(m["course_id"])
        } for m in materials]

@router.post("/", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def upload_material(course_id: str, data: MaterialCreate, current_user: UserPayload = Depends(require_course_access)):
    """
    Upload and register course material with instructor week classification.
    Initial status is 'draft'.
    """
    with get_db() as cur:
        cur.execute("""
            INSERT INTO materials (course_id, title, file_path, status, approved_for_ai, uploaded_by)
            VALUES (%s, %s, %s, 'draft', FALSE, %s)
            RETURNING id, course_id, title, status, approved_for_ai;
        """, (course_id, data.title, data.file_path, current_user.user_id))
        mat = cur.fetchone()
        material_id = mat["id"]

        # Insert week classification
        cur.execute("""
            INSERT INTO week_classifications (material_id, course_id, week_number, lesson_title, classified_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING week_number, lesson_title;
        """, (material_id, course_id, data.week_number, data.lesson_title, current_user.user_id))
        w = cur.fetchone()

        return {
            "id": str(material_id),
            "course_id": str(mat["course_id"]),
            "title": mat["title"],
            "status": mat["status"],
            "approved_for_ai": mat["approved_for_ai"],
            "week_number": w["week_number"],
            "lesson_title": w["lesson_title"]
        }

@router.patch("/{material_id}/status", dependencies=[Depends(require_role("instructor", "admin"))])
def update_material_status(
    course_id: str,
    material_id: str,
    data: MaterialStatusUpdate,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Approve or change material status. Only approved materials can be used for student AI retrieval.
    """
    valid_statuses = ['draft', 'processing', 'approved', 'archived']
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    
    approved_ai = data.approved_for_ai if data.approved_for_ai is not None else (data.status == 'approved')

    with get_db() as cur:
        cur.execute("""
            UPDATE materials
            SET status = %s, approved_for_ai = %s
            WHERE id = %s AND course_id = %s
            RETURNING id, course_id, title, status, approved_for_ai;
        """, (data.status, approved_ai, material_id, course_id))
        updated = cur.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Material not found in this course")
        return {
            **updated,
            "id": str(updated["id"]),
            "course_id": str(updated["course_id"])
        }
