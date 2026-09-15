from typing import List
from fastapi import Depends, HTTPException, status
from auth import UserPayload, get_current_user
from database import get_db

def require_role(*roles: str):
    """
    Dependency factory to check if the authenticated user has one of the allowed roles.
    """
    def role_checker(user: UserPayload = Depends(get_current_user)) -> UserPayload:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{user.role}'. Required: {roles}"
            )
        return user
    return role_checker

def require_course_access(course_id: str, user: UserPayload = Depends(get_current_user)) -> UserPayload:
    """
    Dependency that checks if the authenticated user has permission to access the course.
    - Admins have access to all courses.
    - Instructors/Students/TAs must be actively enrolled in the course.
    """
    if user.role == "admin":
        return user
    
    # Check enrollment in database
    with get_db() as cur:
        cur.execute(
            "SELECT 1 FROM enrollments WHERE user_id = %s AND course_id = %s;",
            (user.user_id, course_id)
        )
        if not cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not enrolled in course '{course_id}'"
            )
    return user
