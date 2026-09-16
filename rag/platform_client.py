"""
platform_client.py — read-only calls to the Platform API on behalf of the caller

Every call forwards the caller's own bearer token, so the Platform applies the same
checks it applies to the browser: enrolment (403), approval of materials, publication of
quizzes, and the rule that answer keys only appear after a submission. The AI service
therefore cannot widen anyone's access, and it has no database credentials at all.

Tests replace these functions with fixtures (see tests/conftest.py).
"""
from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException, status

import config


def _get(path: str, token: str) -> Any:
    url = f"{config.PLATFORM_API_URL}{path}"
    try:
        response = httpx.get(url, headers={"Authorization": f"Bearer {token}"},
                             timeout=config.PLATFORM_TIMEOUT_SECONDS)
    except httpx.HTTPError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Platform API is unreachable from the AI service")

    if response.status_code in (401, 403, 404, 409):
        try:
            detail = response.json().get("detail", response.text)
        except ValueError:
            detail = response.text
        raise HTTPException(status_code=response.status_code, detail=detail)
    if response.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=f"Platform API error {response.status_code}")
    return response.json()


def get_course_content(course_id: str, token: str) -> dict:
    """Approved materials of the course with page text (403 if the caller is not enrolled)."""
    return _get(f"/courses/{course_id}/materials/content", token)


def get_material_pages(course_id: str, material_id: str, token: str) -> dict:
    """One material with its pages. Students get 404 for anything not approved."""
    return _get(f"/courses/{course_id}/materials/{material_id}/pages", token)


def get_student_quiz(course_id: str, quiz_id: str, token: str) -> dict:
    """The quiz as a student sees it while taking it: no answer key, no explanations."""
    return _get(f"/courses/{course_id}/quizzes/{quiz_id}", token)


def get_my_attempts(course_id: str, quiz_id: str, token: str) -> list:
    """The caller's own graded attempts, including correct answers and explanations."""
    return _get(f"/courses/{course_id}/quizzes/{quiz_id}/my-attempts", token)
