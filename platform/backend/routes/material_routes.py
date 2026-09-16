import os
import uuid
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from auth import UserPayload, get_current_user
from middleware import require_role, require_course_access
from database import get_db
from material_processing import extract_pages, SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/courses/{course_id}/materials", tags=["Materials"])

STAFF = ("instructor", "ta", "admin")
# Private storage for uploaded files. Never served statically: every download goes
# through GET /{material_id}/file, which applies the same visibility rules as the API.
STORAGE_DIR = Path(os.getenv("MATERIAL_STORAGE_DIR", Path(__file__).resolve().parent.parent / "storage" / "materials"))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "25")) * 1024 * 1024

class MaterialCreate(BaseModel):
    title: str
    file_path: Optional[str] = None
    week_number: int
    lesson_title: str
    # Optional page text for materials registered without a file (fixtures, pasted notes).
    pages: Optional[List[str]] = None

class MaterialStatusUpdate(BaseModel):
    status: str
    approved_for_ai: Optional[bool] = None


def _is_staff(user: UserPayload) -> bool:
    return user.role in STAFF


def _student_visible(material) -> bool:
    return material["status"] == "approved" and material["approved_for_ai"]


def _serialize(m) -> dict:
    out = {**m, "id": str(m["id"]), "course_id": str(m["course_id"])}
    if "file_path" in m:
        out["has_file"] = bool(m["file_path"]) and _stored_file(m["file_path"]) is not None
    return out


def _stored_file(file_path: Optional[str]) -> Optional[Path]:
    """Resolve a stored file path, refusing anything outside the storage directory."""
    if not file_path:
        return None
    candidate = (STORAGE_DIR / Path(file_path).name).resolve()
    if candidate.parent != STORAGE_DIR.resolve() or not candidate.is_file():
        return None
    return candidate


def _load_visible_material(cur, course_id: str, material_id: str, user: UserPayload):
    """
    Load one material of the course. Students only ever see approved materials;
    anything else is reported as not found so drafts do not leak through ids.
    """
    cur.execute("""
        SELECT m.id, m.course_id, m.title, m.file_path, m.original_filename, m.status,
               m.approved_for_ai, m.page_count, m.processing_error, m.created_at,
               w.week_number, w.lesson_title
        FROM materials m
        LEFT JOIN week_classifications w ON m.id = w.material_id
        WHERE m.id = %s AND m.course_id = %s;
    """, (material_id, course_id))
    material = cur.fetchone()
    if not material or (not _is_staff(user) and not _student_visible(material)):
        raise HTTPException(status_code=404, detail="Material not found in this course")
    return material


def _replace_pages(cur, material_id, pages: List[tuple]) -> int:
    cur.execute("DELETE FROM material_pages WHERE material_id = %s;", (material_id,))
    for page_number, content in pages:
        cur.execute("""
            INSERT INTO material_pages (material_id, page_number, content)
            VALUES (%s, %s, %s);
        """, (material_id, page_number, content))
    return len(pages)


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
                   m.page_count, w.week_number, w.lesson_title, m.created_at
            FROM materials m
            LEFT JOIN week_classifications w ON m.id = w.material_id
            WHERE m.course_id = %s
              AND m.status = 'approved'
              AND m.approved_for_ai = TRUE
            ORDER BY w.week_number ASC, m.created_at ASC;
        """, (course_id,))
        materials = cur.fetchall()
        return [_serialize(m) for m in materials]

@router.get("/content")
def get_approved_content(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Retrieval source for the AI service: approved materials of the course with their
    page text. The filter is the same for every role, so an instructor's chat can never
    be grounded in a draft either. Private notes are a separate table and never joined.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT m.id, m.title, m.status, m.approved_for_ai, w.week_number, w.lesson_title
            FROM materials m
            LEFT JOIN week_classifications w ON m.id = w.material_id
            WHERE m.course_id = %s AND m.status = 'approved' AND m.approved_for_ai = TRUE
            ORDER BY w.week_number ASC NULLS LAST, m.created_at ASC;
        """, (course_id,))
        materials = cur.fetchall()
        ids = [m["id"] for m in materials]
        pages_by_material = {mid: [] for mid in ids}
        if ids:
            cur.execute("""
                SELECT material_id, page_number, content
                FROM material_pages
                WHERE material_id = ANY(%s::uuid[])
                ORDER BY material_id, page_number;
            """, ([str(i) for i in ids],))
            for p in cur.fetchall():
                pages_by_material[p["material_id"]].append(
                    {"page_number": p["page_number"], "content": p["content"]}
                )
    return {
        "course_id": course_id,
        "materials": [{
            "id": str(m["id"]),
            "title": m["title"],
            "status": m["status"],
            "approved_for_ai": m["approved_for_ai"],
            "week_number": m["week_number"],
            "lesson_title": m["lesson_title"],
            "pages": pages_by_material[m["id"]],
        } for m in materials],
    }

@router.get("/manage", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def get_instructor_materials(course_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Instructor/Management materials endpoint:
    Returns all materials (draft, processing, approved, archived) along with week classification.
    """
    with get_db() as cur:
        cur.execute("""
            SELECT m.id, m.course_id, m.title, m.file_path, m.original_filename, m.status,
                   m.approved_for_ai, m.page_count, m.processing_error,
                   w.week_number, w.lesson_title, m.created_at, u.name as uploaded_by_name
            FROM materials m
            LEFT JOIN week_classifications w ON m.id = w.material_id
            LEFT JOIN users u ON m.uploaded_by = u.id
            WHERE m.course_id = %s
            ORDER BY w.week_number ASC NULLS LAST, m.created_at ASC;
        """, (course_id,))
        materials = cur.fetchall()
        return [_serialize(m) for m in materials]

@router.post("/", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def upload_material(course_id: str, data: MaterialCreate, current_user: UserPayload = Depends(require_course_access)):
    """
    Upload and register course material with instructor week classification.
    Initial status is 'draft'.
    """
    pages = [(i, text.strip()) for i, text in enumerate(data.pages or [], start=1)]
    with get_db() as cur:
        cur.execute("""
            INSERT INTO materials (course_id, title, file_path, status, approved_for_ai, uploaded_by, page_count)
            VALUES (%s, %s, %s, 'draft', FALSE, %s, %s)
            RETURNING id, course_id, title, status, approved_for_ai, page_count;
        """, (course_id, data.title, data.file_path, current_user.user_id, len(pages)))
        mat = cur.fetchone()
        material_id = mat["id"]
        _replace_pages(cur, material_id, pages)

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
            "page_count": mat["page_count"],
            "week_number": w["week_number"],
            "lesson_title": w["lesson_title"]
        }

@router.post("/upload", dependencies=[Depends(require_role("instructor", "ta", "admin"))],
             status_code=status.HTTP_201_CREATED)
def upload_material_file(
    course_id: str,
    file: UploadFile = File(...),
    title: str = Form(..., min_length=1),
    week_number: int = Form(..., ge=1),
    lesson_title: str = Form(..., min_length=1),
    current_user: UserPayload = Depends(require_course_access),
):
    """
    Upload a PDF/TXT/MD file, extract its text page by page and register it as a draft.

    Extraction runs inside the request (pilot-sized files). A file with no extractable
    text — typically a scanned PDF — is kept with status 'failed' and the reason, so the
    instructor can retry or remove it. Nothing reaches students until it is approved.
    """
    extension = Path(file.filename or "").suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400,
                            detail=f"Unsupported file type '{extension}'. Allowed: {sorted(SUPPORTED_EXTENSIONS)}")
    payload = file.file.read(MAX_UPLOAD_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MB")

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{extension}"
    stored_path = STORAGE_DIR / stored_name
    stored_path.write_bytes(payload)

    pages, error = extract_pages(stored_path)
    new_status = "draft" if not error else "failed"

    with get_db() as cur:
        cur.execute("""
            INSERT INTO materials (course_id, title, file_path, original_filename, status, approved_for_ai,
                                   uploaded_by, page_count, processing_error)
            VALUES (%s, %s, %s, %s, %s, FALSE, %s, %s, %s)
            RETURNING id;
        """, (course_id, title, stored_name, file.filename, new_status, current_user.user_id, len(pages), error))
        material_id = cur.fetchone()["id"]
        _replace_pages(cur, material_id, pages)
        cur.execute("""
            INSERT INTO week_classifications (material_id, course_id, week_number, lesson_title, classified_by)
            VALUES (%s, %s, %s, %s, %s);
        """, (material_id, course_id, week_number, lesson_title, current_user.user_id))
        material = _load_visible_material(cur, course_id, material_id, current_user)
    return _serialize(material)

@router.get("/{material_id}")
def get_material(course_id: str, material_id: str, current_user: UserPayload = Depends(require_course_access)):
    with get_db() as cur:
        material = _load_visible_material(cur, course_id, material_id, current_user)
    return _serialize(material)

@router.get("/{material_id}/pages")
def get_material_pages(course_id: str, material_id: str, current_user: UserPayload = Depends(require_course_access)):
    """Extracted page text. Students: approved materials only (404 otherwise)."""
    with get_db() as cur:
        material = _load_visible_material(cur, course_id, material_id, current_user)
        cur.execute("""
            SELECT page_number, content FROM material_pages
            WHERE material_id = %s ORDER BY page_number;
        """, (material_id,))
        pages = cur.fetchall()
    return {
        "material": _serialize(material),
        "pages": [dict(p) for p in pages],
    }

@router.get("/{material_id}/file")
def download_material_file(course_id: str, material_id: str, current_user: UserPayload = Depends(require_course_access)):
    with get_db() as cur:
        material = _load_visible_material(cur, course_id, material_id, current_user)
    path = _stored_file(material["file_path"])
    if path is None:
        raise HTTPException(status_code=404, detail="No stored file for this material")
    return FileResponse(path, filename=material["original_filename"] or path.name)

@router.post("/{material_id}/reprocess", dependencies=[Depends(require_role("instructor", "ta", "admin"))])
def reprocess_material(course_id: str, material_id: str, current_user: UserPayload = Depends(require_course_access)):
    """Retry text extraction for a stored file (e.g. after a failed upload)."""
    with get_db() as cur:
        material = _load_visible_material(cur, course_id, material_id, current_user)
        path = _stored_file(material["file_path"])
        if path is None:
            raise HTTPException(status_code=400, detail="This material has no stored file to process")
        pages, error = extract_pages(path)
        # A retry never publishes: success returns the material to draft for review.
        new_status = "failed" if error else ("draft" if material["status"] in ("failed", "processing") else material["status"])
        _replace_pages(cur, material_id, pages)
        cur.execute("""
            UPDATE materials SET status = %s, page_count = %s, processing_error = %s,
                   approved_for_ai = CASE WHEN %s = 'approved' THEN approved_for_ai ELSE FALSE END
            WHERE id = %s;
        """, (new_status, len(pages), error, new_status, material_id))
        material = _load_visible_material(cur, course_id, material_id, current_user)
    return _serialize(material)

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
        cur.execute("SELECT status, page_count FROM materials WHERE id = %s AND course_id = %s;",
                    (material_id, course_id))
        current = cur.fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Material not found in this course")
        if data.status == "approved" and current["status"] == "failed":
            raise HTTPException(status_code=400, detail="Processing failed for this material; retry or remove it before approving")

        cur.execute("""
            UPDATE materials
            SET status = %s, approved_for_ai = %s
            WHERE id = %s AND course_id = %s
            RETURNING id, course_id, title, status, approved_for_ai;
        """, (data.status, approved_ai, material_id, course_id))
        updated = cur.fetchone()
        return {
            **updated,
            "id": str(updated["id"]),
            "course_id": str(updated["course_id"])
        }

@router.delete("/{material_id}", dependencies=[Depends(require_role("instructor", "admin"))],
               status_code=status.HTTP_204_NO_CONTENT)
def remove_material(course_id: str, material_id: str, current_user: UserPayload = Depends(require_course_access)):
    """
    Remove a material, its extracted pages and its stored file. Quizzes that referenced it
    keep their questions (material_id is set to NULL by the foreign key).
    """
    with get_db() as cur:
        cur.execute("DELETE FROM materials WHERE id = %s AND course_id = %s RETURNING file_path;",
                    (material_id, course_id))
        removed = cur.fetchone()
        if not removed:
            raise HTTPException(status_code=404, detail="Material not found in this course")
    path = _stored_file(removed["file_path"])
    if path is not None:
        path.unlink(missing_ok=True)
    return None
