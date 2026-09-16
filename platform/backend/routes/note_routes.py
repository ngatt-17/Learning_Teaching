from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from auth import UserPayload, get_current_user
from middleware import require_course_access
from database import get_db

router = APIRouter(tags=["Private Notes"])

NOTE_COLUMNS = "id, owner_id, course_id, material_id, page_number, title, content, created_at, updated_at"

class NoteCreate(BaseModel):
    title: str = "Untitled Note"
    content: str = ""
    # Optional anchor to the slide being studied. The note stays owner-only (RLS).
    material_id: Optional[str] = None
    page_number: Optional[int] = Field(default=None, ge=1)

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


def _serialize(n) -> dict:
    return {
        **n,
        "id": str(n["id"]),
        "owner_id": str(n["owner_id"]),
        "course_id": str(n["course_id"]),
        "material_id": str(n["material_id"]) if n.get("material_id") else None,
    }


def _check_note_anchor(course_id: str, material_id: Optional[str], user: UserPayload):
    """A note may only point at a material of the same course that the caller can open."""
    if not material_id:
        return
    with get_db() as cur:
        cur.execute("SELECT status, approved_for_ai FROM materials WHERE id = %s AND course_id = %s;",
                    (material_id, course_id))
        material = cur.fetchone()
    visible = material and (
        user.role in ("instructor", "ta", "admin")
        or (material["status"] == "approved" and material["approved_for_ai"])
    )
    if not visible:
        raise HTTPException(status_code=400, detail="material_id is not an accessible material of this course")


@router.get("/courses/{course_id}/notes")
def list_my_course_notes(
    course_id: str,
    material_id: Optional[str] = None,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    List private notes for the current user in this course (optionally for one material).
    RLS is enforced at the database level using app.current_user_id.
    """
    with get_db(user_id=current_user.user_id) as cur:
        if material_id:
            cur.execute(f"""
                SELECT {NOTE_COLUMNS}
                FROM private_notes
                WHERE course_id = %s AND material_id = %s
                ORDER BY page_number NULLS LAST, updated_at DESC;
            """, (course_id, material_id))
        else:
            cur.execute(f"""
                SELECT {NOTE_COLUMNS}
                FROM private_notes
                WHERE course_id = %s
                ORDER BY updated_at DESC;
            """, (course_id,))
        notes = cur.fetchall()
        return [_serialize(n) for n in notes]

@router.post("/courses/{course_id}/notes", status_code=status.HTTP_201_CREATED)
def create_private_note(
    course_id: str,
    data: NoteCreate,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    Create a private note for the current student.
    Owner is strictly bound to the authenticated user.
    """
    _check_note_anchor(course_id, data.material_id, current_user)
    with get_db(user_id=current_user.user_id) as cur:
        cur.execute(f"""
            INSERT INTO private_notes (owner_id, course_id, material_id, page_number, title, content)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING {NOTE_COLUMNS};
        """, (current_user.user_id, course_id, data.material_id, data.page_number, data.title, data.content))
        note = cur.fetchone()
        return _serialize(note)

@router.get("/notes/{note_id}")
def get_private_note(
    note_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Fetch a specific private note.
    Protected by PostgreSQL RLS: if current_user is not the note's owner,
    the query returns 0 rows (treated as 403 Forbidden).
    """
    with get_db(user_id=current_user.user_id) as cur:
        cur.execute(f"""
            SELECT {NOTE_COLUMNS}
            FROM private_notes
            WHERE id = %s;
        """, (note_id,))
        note = cur.fetchone()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Private note can only be accessed by its owner"
            )

        return _serialize(note)

@router.patch("/notes/{note_id}")
def update_private_note(
    note_id: str,
    data: NoteUpdate,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Update a private note. RLS strictly guarantees that only the owner can modify it.
    """
    with get_db(user_id=current_user.user_id) as cur:
        cur.execute("""
            SELECT id FROM private_notes WHERE id = %s;
        """, (note_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied or note not found"
            )

        updates = []
        params = []
        if data.title is not None:
            updates.append("title = %s")
            params.append(data.title)
        if data.content is not None:
            updates.append("content = %s")
            params.append(data.content)
        updates.append("updated_at = NOW()")
        params.append(note_id)

        cur.execute(f"""
            UPDATE private_notes
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING {NOTE_COLUMNS};
        """, tuple(params))
        updated = cur.fetchone()
        return _serialize(updated)

@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_private_note(
    note_id: str,
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Delete a private note. RLS guarantees only owner can delete.
    """
    with get_db(user_id=current_user.user_id) as cur:
        cur.execute("SELECT id FROM private_notes WHERE id = %s;", (note_id,))
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied or note not found"
            )
        cur.execute("DELETE FROM private_notes WHERE id = %s;", (note_id,))
        return None
