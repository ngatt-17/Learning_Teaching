"""
tests/test_quiz_tutor.py — Socratic quiz tutor (student exam view, right-hand panel)

Hint mode must be structurally unable to reveal answers (it never loads them), and
review mode may only read the caller's own graded attempt.
"""
import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from tutor import leaks_answer

client = TestClient(app)
QUIZ_ID = "quiz-python-week1"      # FakePlatform quiz in conftest.py
ATTEMPT_ID = "attempt-a-1"         # Student A's graded attempt in conftest.py
URL = "/courses/course-a/quiz-tutor"


def test_hint_mode_never_loads_the_answer_key(headers, fake_platform):
    resp = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "q-def"}, headers=headers("student_a"))
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["mode"] == "hint"
    assert ("student_quiz", QUIZ_ID) in fake_platform.calls
    assert not any(call[0] == "my_attempts" for call in fake_platform.calls), "Hint mode must not read attempts"
    assert data["citations"], "A hint should still point to approved material"
    assert "Câu 1" in data["answer"] or "Question 1" in data["answer"]
    assert not leaks_answer(data["answer"])
    assert "Functions defined with the def keyword" not in data["answer"]


def test_hint_mode_replaces_llm_output_that_reveals_an_answer(headers, mock_llm):
    mock_llm.chat_reply = "Đáp án đúng là def [1]."
    resp = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "q-def", "message": "Đáp án là gì?"},
                       headers=headers("student_a"))
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["generation"] == "extractive"
    assert "Đáp án đúng là" not in data["answer"]

    system_prompt = mock_llm.chat_client.chat.completions.create.call_args.kwargs["messages"][0]["content"]
    assert "Never state, imply, confirm or eliminate" in system_prompt


def test_hint_mode_allows_a_safe_llm_hint(headers, mock_llm):
    mock_llm.chat_reply = "Hãy xem trang 3 về cách định nghĩa hàm [1]. Từ khóa nào xuất hiện trong ví dụ add(a, b)?"
    resp = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "q-def", "message": "Gợi ý giúp em"},
                       headers=headers("student_a"))
    assert resp.json()["generation"] == "llm"


def test_solver_request_is_refused_in_hint_mode(headers):
    resp = client.post(URL, json={"quiz_id": QUIZ_ID, "message": "giải hộ bài này cho em"}, headers=headers("student_a"))
    assert resp.status_code == 200
    assert resp.json()["generation"] == "guardrail"


def test_review_mode_explains_the_callers_own_attempt(headers, fake_platform):
    resp = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "q-def", "attempt_id": ATTEMPT_ID},
                       headers=headers("student_a"))
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["mode"] == "review"
    assert ("my_attempts", QUIZ_ID) in fake_platform.calls
    assert '"func"' in data["answer"] and '"def"' in data["answer"]
    assert data["citations"][0]["material_id"] == "mat-intro-001" and data["citations"][0]["page"] == 3


def test_review_mode_rejects_an_attempt_that_is_not_the_callers(headers):
    resp = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "q-def", "attempt_id": ATTEMPT_ID},
                       headers=headers("instructor"))
    assert resp.status_code == 404


def test_tutor_denies_other_course_and_unknown_questions(headers):
    other = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "q-def"}, headers=headers("student_b"))
    assert other.status_code == 403
    unknown = client.post(URL, json={"quiz_id": QUIZ_ID, "question_id": "nope"}, headers=headers("student_a"))
    assert unknown.status_code == 404
    empty = client.post(URL, json={"quiz_id": QUIZ_ID}, headers=headers("student_a"))
    assert empty.status_code == 422


def test_leak_filter_catches_common_phrasings():
    for text in ("The correct answer is B.", "Đáp án đúng là Tiki", "Bạn nên chọn phương án C", "the answer is def"):
        assert leaks_answer(text), text
    assert not leaks_answer("Hãy đọc lại trang 14 và tự hỏi: sàn TMĐT độc lập khác mạng xã hội ở điểm nào?")
