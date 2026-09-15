"""
mock_auth.py — Fake authentication cho Day 2 standalone build

⚠️  MOCKED_AUTH = True
    Tuần 2: thay bằng JWT verification từ platform backend (port 8000).
    Cách swap: thay hàm get_current_user() đọc JWT thật từ Authorization header.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from fastapi import HTTPException, Header, status

# ──────────────────────────────────────────────────────────────
MOCKED_AUTH = True  # ← Flag rõ ràng, dễ grep khi swap tuần 2
# ──────────────────────────────────────────────────────────────

@dataclass
class MockUser:
    user_id: str
    email: str
    role: str                          # "student" | "instructor" | "ta" | "admin"
    enrolled_courses: list[str] = field(default_factory=list)


# Fake token → user mapping  (token là Bearer value trong header)
_FAKE_USERS: dict[str, MockUser] = {
    "student_a_token": MockUser(
        user_id="00000000-0000-0000-0000-000000000001",
        email="student_a@vinuni.edu.vn",
        role="student",
        enrolled_courses=["course-a"],
    ),
    "student_b_token": MockUser(
        user_id="00000000-0000-0000-0000-000000000002",
        email="student_b@vinuni.edu.vn",
        role="student",
        enrolled_courses=["course-b"],
    ),
    "instructor_token": MockUser(
        user_id="00000000-0000-0000-0000-000000000003",
        email="instructor@vinuni.edu.vn",
        role="instructor",
        enrolled_courses=["course-a"],
    ),
    "admin_token": MockUser(
        user_id="00000000-0000-0000-0000-000000000004",
        email="admin@vinuni.edu.vn",
        role="admin",
        enrolled_courses=["course-a", "course-b"],
    ),
}


def get_current_user(authorization: Optional[str] = Header(default=None)) -> MockUser:
    """FastAPI dependency — trả về MockUser từ Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Use: Bearer <token>",
        )
    token = authorization.removeprefix("Bearer ").strip()
    user = _FAKE_USERS.get(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unknown mock token '{token}'. Valid tokens: {list(_FAKE_USERS.keys())}",
        )
    return user


def require_role(*roles: str):
    """FastAPI dependency factory — kiểm tra role."""
    def _check(user: MockUser = Header(default=None)):
        # Called via Depends(get_current_user) chaining in routes
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' not allowed. Required: {roles}",
            )
        return user
    return _check


def require_course_access(course_id: str, user: MockUser) -> MockUser:
    """Kiểm tra user có quyền truy cập course_id không."""
    if user.role == "admin":
        return user  # Admin thấy tất cả
    if course_id not in user.enrolled_courses:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: you are not enrolled in course '{course_id}'.",
        )
    return user
