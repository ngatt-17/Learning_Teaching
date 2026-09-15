"""
tests/test_ai_quality.py — 7 test cases cho AI & Quality pair (Day 2)

Kiểm tra các tiêu chí từ DAY_02_INSTRUCTIONS.md Section 4 "Checks to run":
- Approved materials retrieval
- Draft exclusion
- Citation validity
- GenQuiz draft flow
- Publish access control
- Student private quiz (no DB write)
- Cross-course access denial

Chạy: pytest tests/test_ai_quality.py -v
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Đảm bảo src/ai/ trong path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
import quiz_generator as qg

client = TestClient(app)

# ── Auth headers ──────────────────────────────────────────────────────────
STUDENT_A = {"Authorization": "Bearer student_a_token"}   # course-a
STUDENT_B = {"Authorization": "Bearer student_b_token"}   # course-b
INSTRUCTOR = {"Authorization": "Bearer instructor_token"}  # course-a
ADMIN = {"Authorization": "Bearer admin_token"}


# ═════════════════════════════════════════════════════════════════════════
# T01 — Chat RAG trả về answer + citation có page number
# ═════════════════════════════════════════════════════════════════════════
def test_T01_chat_returns_answer_with_citation():
    """Student A hỏi về tài liệu course-a → answer + citations với page."""
    resp = client.post(
        "/courses/course-a/chat",
        json={"question": "What is a variable in Python?"},
        headers=STUDENT_A,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "answer" in data
    assert len(data["answer"]) > 10, "Answer quá ngắn hoặc rỗng"
    assert data["evidence_level"] == "supported"
    assert len(data["citations"]) > 0, "Phải có ít nhất 1 citation"

    citation = data["citations"][0]
    assert "material_id" in citation
    assert "page" in citation and isinstance(citation["page"], int) and citation["page"] >= 1
    assert "snippet" in citation and len(citation["snippet"]) > 0


# ═════════════════════════════════════════════════════════════════════════
# T02 — Câu hỏi ngoài scope tài liệu → evidence_level = "insufficient"
# ═════════════════════════════════════════════════════════════════════════
def test_T02_chat_insufficient_evidence():
    """Câu hỏi về chủ đề hoàn toàn ngoài tài liệu → insufficient."""
    resp = client.post(
        "/courses/course-a/chat",
        json={"question": "Xin chào, hôm nay thời tiết Hà Nội thế nào?"},
        headers=STUDENT_A,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["evidence_level"] == "insufficient"
    assert data["citations"] == []


# ═════════════════════════════════════════════════════════════════════════
# T03 — Draft material (approved_for_ai=False) bị loại khỏi retrieval
# ═════════════════════════════════════════════════════════════════════════
def test_T03_draft_material_excluded_from_retrieval():
    """material mat-draft-003 (approved_for_ai=False) không được xuất hiện trong citations."""
    resp = client.post(
        "/courses/course-a/chat",
        json={"question": "What is a function in Python?"},
        headers=STUDENT_A,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    # Security check: citation không được chứa draft material
    for citation in data.get("citations", []):
        assert citation["material_id"] != "mat-draft-003", (
            "SECURITY FAILURE: Draft material appeared in citations!"
        )
        assert "draft" not in citation["title"].lower() or citation["material_id"] != "mat-draft-003"


# ═════════════════════════════════════════════════════════════════════════
# T04 — GenQuiz from material trả về draft (status=draft, chưa publish)
# ═════════════════════════════════════════════════════════════════════════
def test_T04_genquiz_from_material_returns_draft():
    """Instructor gen quiz từ material → draft JSON, status=draft."""
    resp = client.post(
        "/quiz/from-material",
        json={
            "material_id": "mat-intro-001",
            "course_id": "course-a",
            "topic": "variables",
            "difficulty": "easy",
            "question_type": "mcq",
            "count": 3,
        },
        headers=INSTRUCTOR,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert "draft_id" in data, "Phải có draft_id"
    assert data["status"] == "draft", "Status phải là 'draft' trước khi publish"
    assert "questions" in data
    assert len(data["questions"]) >= 1

    q = data["questions"][0]
    assert "question" in q
    assert "answer" in q
    assert "explanation" in q
    assert q["type"] == "mcq"
    assert len(q["options"]) == 4, "MCQ phải có đúng 4 options"


# ═════════════════════════════════════════════════════════════════════════
# T05 — Student không thể publish quiz draft (403)
# ═════════════════════════════════════════════════════════════════════════
def test_T05_genquiz_publish_requires_instructor():
    """Student gọi PATCH /publish → 403. Chỉ instructor mới publish được."""
    # Đầu tiên instructor tạo draft
    resp = client.post(
        "/quiz/from-material",
        json={
            "material_id": "mat-intro-001",
            "course_id": "course-a",
            "difficulty": "medium",
            "question_type": "truefalse",
            "count": 2,
        },
        headers=INSTRUCTOR,
    )
    assert resp.status_code == 200
    draft_id = resp.json()["draft_id"]

    # Student thử publish → 403
    resp2 = client.patch(f"/quiz/{draft_id}/publish", headers=STUDENT_A)
    assert resp2.status_code == 403, (
        f"Student phải bị từ chối publish, nhưng nhận {resp2.status_code}"
    )

    # Instructor publish thành công
    resp3 = client.patch(f"/quiz/{draft_id}/publish", headers=INSTRUCTOR)
    assert resp3.status_code == 200
    assert resp3.json()["status"] == "published"


# ═════════════════════════════════════════════════════════════════════════
# T06 — Student quiz từ private note KHÔNG lưu vào store
# ═════════════════════════════════════════════════════════════════════════
def test_T06_genquiz_from_note_not_stored():
    """Student gen quiz từ ghi chú → nhận kết quả nhưng không có trong draft store."""
    note = (
        "A loop repeats a block of code. The for loop iterates over a sequence. "
        "The while loop continues as long as a condition is True. "
        "Break exits the loop immediately."
    )
    resp = client.post(
        "/quiz/from-note",
        json={"note_content": note, "count": 3},
        headers=STUDENT_A,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data.get("stored") is False, "stored phải là False"
    assert data.get("note_quiz") is True
    assert len(data["questions"]) >= 1
    assert "privacy_notice" in data

    # Kiểm tra không có draft_id nào trong response
    assert "draft_id" not in data, "from-note không được trả về draft_id"

    # Kiểm tra không có trong _DRAFT_STORE
    for draft_id in qg._DRAFT_STORE:
        draft = qg._DRAFT_STORE[draft_id]
        # Không có draft nào được tạo bởi from-note
        # (from-note không gọi gen_from_material hay gen_from_question_bank)
    # Store count không tăng nếu chỉ gọi from-note
    before_count = len(qg._DRAFT_STORE)
    client.post(
        "/quiz/from-note",
        json={"note_content": note, "count": 2},
        headers=STUDENT_A,
    )
    after_count = len(qg._DRAFT_STORE)
    assert after_count == before_count, (
        "PRIVACY FAILURE: from-note đã ghi vào draft store!"
    )


# ═════════════════════════════════════════════════════════════════════════
# T07 — Student B không thể hỏi về course-a (cross-course isolation)
# ═════════════════════════════════════════════════════════════════════════
def test_T07_student_cannot_access_other_course_chat():
    """Student B enrolled in course-b → hỏi course-a phải bị 403."""
    resp = client.post(
        "/courses/course-a/chat",
        json={"question": "What is a variable?"},
        headers=STUDENT_B,
    )
    assert resp.status_code == 403, (
        f"Student B phải bị từ chối truy cập course-a, nhưng nhận {resp.status_code}"
    )


# ═════════════════════════════════════════════════════════════════════════
# T08 — GenQuiz Contract: Đầy đủ 3 dạng câu hỏi, citation và JSON schema
# ═════════════════════════════════════════════════════════════════════════
def test_T08_genquiz_contract_and_citations():
    """Kiểm tra API contract /api/ai/gen-quiz: cấu trúc câu hỏi có citation và lời giải thích."""
    content = (
        "In C programming, pointers store memory addresses of variables. "
        "The dereference operator '*' accesses the value pointed to. "
        "Dynamic memory functions in stdlib.h include malloc, calloc, and free."
    )
    resp = client.post(
        "/api/ai/gen-quiz",
        json={
            "lesson_content": content,
            "topic": "Con trỏ & Bộ nhớ C",
            "num_questions": 3,
            "types": ["single_choice", "multiple_choice", "short_answer"],
            "source_file": "Lecture02_Pointers.pdf",
            "lesson_id": "c-pointers-02",
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["lesson_id"] == "c-pointers-02"
    assert "questions" in data
    assert len(data["questions"]) >= 1

    for q in data["questions"]:
        assert "question" in q
        assert "type" in q
        assert "explanation" in q
        assert "citation" in q, "Mỗi câu hỏi phải có citation"
        assert "source_file" in q["citation"]
        assert "page" in q["citation"]
        assert "evidence_snippet" in q["citation"]
