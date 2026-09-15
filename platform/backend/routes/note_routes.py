from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from auth import UserPayload, get_current_user
from middleware import require_course_access
from database import get_db

router = APIRouter(tags=["Private Notes"])

class NoteCreate(BaseModel):
    title: str = "Untitled Note"
    content: str = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

@router.get("/courses/{course_id}/notes")
def list_my_course_notes(
    course_id: str,
    current_user: UserPayload = Depends(require_course_access)
):
    """
    List private notes for the current user in this course.
    RLS is enforced at the database level using app.current_user_id.
    """
    with get_db(user_id=current_user.user_id) as cur:
        cur.execute("""
            SELECT id, owner_id, course_id, title, content, created_at, updated_at
            FROM private_notes
            WHERE course_id = %s
            ORDER BY updated_at DESC;
        """, (course_id,))
        notes = cur.fetchall()
        return [{
            **n,
            "id": str(n["id"]),
            "owner_id": str(n["owner_id"]),
            "course_id": str(n["course_id"])
        } for n in notes]

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
    with get_db(user_id=current_user.user_id) as cur:
        cur.execute("""
            INSERT INTO private_notes (owner_id, course_id, title, content)
            VALUES (%s, %s, %s, %s)
            RETURNING id, owner_id, course_id, title, content, created_at, updated_at;
        """, (current_user.user_id, course_id, data.title, data.content))
        note = cur.fetchone()
        return {
            **note,
            "id": str(note["id"]),
            "owner_id": str(note["owner_id"]),
            "course_id": str(note["course_id"])
        }

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
        cur.execute("""
            SELECT id, owner_id, course_id, title, content, created_at, updated_at
            FROM private_notes
            WHERE id = %s;
        """, (note_id,))
        note = cur.fetchone()
        if not note:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Private note can only be accessed by its owner"
            )
        
        return {
            **note,
            "id": str(note["id"]),
            "owner_id": str(note["owner_id"]),
            "course_id": str(note["course_id"])
        }

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
            RETURNING id, owner_id, course_id, title, content, updated_at;
        """, tuple(params))
        updated = cur.fetchone()
        return {
            **updated,
            "id": str(updated["id"]),
            "owner_id": str(updated["owner_id"]),
            "course_id": str(updated["course_id"])
        }

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
