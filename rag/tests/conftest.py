"""
Shared fixtures for the AI service tests.

- Tokens are real Platform-style JWTs signed with config.JWT_SECRET (no mock tokens).
- The Platform API is replaced by FakePlatform, which enforces enrolment like the real
  one and, on purpose, still returns the draft fixture material in the content payload
  so the tests prove the AI side filters it out again.
- The LLM is switched off by default (extractive mode) so tests never call a provider;
  use the `mock_llm` fixture to exercise the LLM path with a scripted reply.
"""
import copy
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import jwt
import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import config  # noqa: E402
import platform_client  # noqa: E402
from fixtures.sample_material import SAMPLE_MATERIALS  # noqa: E402

USERS = {
    "student_a": {"sub": "00000000-0000-0000-0000-00000000000a", "role": "student", "courses": ["course-a"]},
    "student_b": {"sub": "00000000-0000-0000-0000-00000000000b", "role": "student", "courses": ["course-b"]},
    "instructor": {"sub": "00000000-0000-0000-0000-00000000000c", "role": "instructor", "courses": ["course-a"]},
    "admin": {"sub": "00000000-0000-0000-0000-00000000000d", "role": "admin", "courses": []},
}

QUIZ_ID = "quiz-python-week1"
ATTEMPT_ID = "attempt-a-1"

QUIZ = {
    "id": QUIZ_ID,
    "course_id": "course-a",
    "title": "Quiz 1 — Python basics",
    "questions": [
        {
            "id": "q-def", "position": 1, "question_type": "single_choice", "topic": "Functions",
            "prompt": "Which keyword defines a reusable function in Python?",
            "options": ["func", "def", "lambda", "function"],
            "correct_answer": "def",
            "explanation": "Functions are defined with the def keyword.",
            "citation": {"material_id": "mat-intro-001", "title": "Introduction to Programming — Week 1", "page": 3},
        },
        {
            "id": "q-break", "position": 2, "question_type": "single_choice", "topic": "Loops",
            "prompt": "What does the break statement do inside a loop?",
            "options": ["Skips one iteration", "Exits the loop immediately", "Restarts the loop", "Raises an error"],
            "correct_answer": "Exits the loop immediately",
            "explanation": "break exits the loop immediately; continue skips the rest of the iteration.",
            "citation": {"material_id": "mat-control-002", "title": "Control Flow and Loops — Week 2", "page": 3},
        },
    ],
}


def mint_token(user_key: str, secret: str | None = None, expires_in: int = 3600) -> str:
    user = USERS[user_key]
    payload = {
        "sub": user["sub"],
        "email": f"{user_key}@vinuni.edu.vn",
        "name": user_key.replace("_", " ").title(),
        "role": user["role"],
        "enrolled_courses": user["courses"],
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    }
    return jwt.encode(payload, secret or config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


@pytest.fixture
def headers():
    """headers("student_a") -> {"Authorization": "Bearer <jwt>"}"""
    return lambda user_key, **kw: {"Authorization": f"Bearer {mint_token(user_key, **kw)}"}


class FakePlatform:
    def __init__(self):
        self.calls: list[tuple] = []

    @staticmethod
    def _caller(token: str) -> dict:
        return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])

    def _check_course(self, course_id: str, token: str) -> dict:
        caller = self._caller(token)
        if caller["role"] != "admin" and course_id not in caller["enrolled_courses"]:
            raise HTTPException(status_code=403, detail=f"Access denied: You are not enrolled in course '{course_id}'")
        return caller

    def get_course_content(self, course_id: str, token: str) -> dict:
        self.calls.append(("content", course_id))
        self._check_course(course_id, token)
        materials = []
        for mid, mat in SAMPLE_MATERIALS.items():
            if mat["course_id"] != course_id:
                continue
            materials.append({
                "id": mid,
                "title": mat["title"],
                "status": "approved" if mat["approved_for_ai"] else "draft",
                "approved_for_ai": mat["approved_for_ai"],
                "pages": [{"page_number": c["page"], "content": c["text"]} for c in mat["chunks"]],
            })
        return {"course_id": course_id, "materials": materials}

    def get_material_pages(self, course_id: str, material_id: str, token: str) -> dict:
        self.calls.append(("pages", material_id))
        caller = self._check_course(course_id, token)
        mat = SAMPLE_MATERIALS.get(material_id)
        if not mat or mat["course_id"] != course_id or (caller["role"] == "student" and not mat["approved_for_ai"]):
            raise HTTPException(status_code=404, detail="Material not found in this course")
        return {
            "material": {"id": material_id, "title": mat["title"],
                         "status": "approved" if mat["approved_for_ai"] else "draft",
                         "approved_for_ai": mat["approved_for_ai"]},
            "pages": [{"page_number": c["page"], "content": c["text"]} for c in mat["chunks"]],
        }

    def get_student_quiz(self, course_id: str, quiz_id: str, token: str) -> dict:
        self.calls.append(("student_quiz", quiz_id))
        self._check_course(course_id, token)
        if quiz_id != QUIZ_ID or course_id != QUIZ["course_id"]:
            raise HTTPException(status_code=404, detail="Quiz not found in this course")
        quiz = copy.deepcopy(QUIZ)
        for q in quiz["questions"]:
            for hidden in ("correct_answer", "explanation", "citation"):
                q.pop(hidden)
        return quiz

    def get_my_attempts(self, course_id: str, quiz_id: str, token: str) -> list:
        self.calls.append(("my_attempts", quiz_id))
        caller = self._check_course(course_id, token)
        if quiz_id != QUIZ_ID or caller["sub"] != USERS["student_a"]["sub"]:
            return []
        answers = []
        for q, chosen in zip(QUIZ["questions"], ["func", "Exits the loop immediately"]):
            answers.append({
                "question_id": q["id"], "position": q["position"], "prompt": q["prompt"],
                "question_type": q["question_type"], "options": q["options"], "topic": q["topic"],
                "correct_answer": q["correct_answer"], "explanation": q["explanation"], "citation": q["citation"],
                "submitted_answer": chosen, "is_correct": chosen == q["correct_answer"],
            })
        return [{"attempt_id": ATTEMPT_ID, "attempt_number": 1, "correct_count": 1, "total_questions": 2,
                 "score": 1.0, "max_score": 2.0, "points_awarded": 1.0, "submitted_at": "2026-09-16T10:00:00+07:00",
                 "answers": answers}]


@pytest.fixture(autouse=True)
def fake_platform(monkeypatch):
    fake = FakePlatform()
    for name in ("get_course_content", "get_material_pages", "get_student_quiz", "get_my_attempts"):
        monkeypatch.setattr(platform_client, name, getattr(fake, name))
    return fake


@pytest.fixture(autouse=True)
def llm_off(monkeypatch):
    monkeypatch.setattr(config, "is_llm_configured", lambda: False)


def _completion(text: str) -> MagicMock:
    choice = MagicMock()
    choice.message.content = text
    response = MagicMock()
    response.choices = [choice]
    return response


@pytest.fixture
def mock_llm(monkeypatch):
    """
    Turn the LLM path on with scripted replies:
        mock_llm.chat_reply = "..."        # chat / tutor text
        mock_llm.quiz_items = [ {...} ]    # quiz generator JSON items
    """
    import chat_rag
    import quiz_generator

    state = MagicMock()
    state.chat_reply = "Scripted tutor reply [1]."
    state.quiz_items = []
    monkeypatch.setattr(config, "is_llm_configured", lambda: True)

    chat_client = MagicMock()
    chat_client.chat.completions.create.side_effect = lambda **kw: _completion(state.chat_reply)
    monkeypatch.setattr(chat_rag, "_client", chat_client)

    quiz_client = MagicMock()
    quiz_client.chat.completions.create.side_effect = lambda **kw: _completion(json.dumps(state.quiz_items))
    monkeypatch.setattr(quiz_generator, "_client", quiz_client)

    state.chat_client = chat_client
    state.quiz_client = quiz_client
    return state
