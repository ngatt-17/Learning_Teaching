"""
Integration contract checks (migration 003): the data the AI service and the web app
depend on, and the privacy/approval rules that must hold on those paths.

Run: pytest tests/test_integration_contract.py -v   (needs the seeded database)
"""
import io
import os
import sys
import uuid

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

STUDENT_A = "student_a@vinuni.edu.vn"
STUDENT_C = "student_c@vinuni.edu.vn"
INSTRUCTOR = "instructor@vinuni.edu.vn"
ADMIN = "admin@vinuni.edu.vn"

COURSE_A = "10000000-0000-0000-0000-000000000001"   # COMP2030
COURSE_B = "10000000-0000-0000-0000-000000000002"   # COMP3010
COURSE_C = "10000000-0000-0000-0000-000000000003"   # CS-AI3010 (quiz demo)
MATERIAL_A_APPROVED = "20000000-0000-0000-0000-000000000001"
MATERIAL_A_DRAFT = "20000000-0000-0000-0000-000000000002"
MATERIAL_B_APPROVED = "20000000-0000-0000-0000-000000000004"
DEMO_QUIZ = "30000000-0000-0000-0000-000000000011"

_tokens = {}


def headers(email: str) -> dict:
    if email not in _tokens:
        assert client.post("/auth/request-otp", json={"email": email}).status_code == 200
        res = client.post("/auth/verify-otp", json={"email": email, "otp": "000000"})
        assert res.status_code == 200, res.text
        _tokens[email] = res.json()["access_token"]
    return {"Authorization": f"Bearer {_tokens[email]}"}


def _create_quiz(course_id, questions, title="Contract probe", publish=False):
    res = client.post(f"/courses/{course_id}/quizzes/", headers=headers(INSTRUCTOR),
                      json={"title": f"{title} {uuid.uuid4().hex[:6]}", "week_number": 12, "questions": questions})
    assert res.status_code == 201, res.text
    quiz_id = res.json()["id"]
    if publish:
        pub = client.patch(f"/courses/{course_id}/quizzes/{quiz_id}/status",
                           headers=headers(INSTRUCTOR), json={"status": "published"})
        assert pub.status_code == 200, pub.text
    return quiz_id


# ─────────────────────────── retrieval source ───────────────────────────

def test_30_content_endpoint_returns_only_approved_pages():
    res = client.get(f"/courses/{COURSE_A}/materials/content", headers=headers(STUDENT_A))
    assert res.status_code == 200, res.text
    materials = res.json()["materials"]
    ids = {m["id"] for m in materials}
    assert MATERIAL_A_APPROVED in ids
    assert MATERIAL_A_DRAFT not in ids
    assert all(m["pages"] for m in materials if m["id"] == MATERIAL_A_APPROVED)
    assert "DRAFT-CANARY" not in res.text


def test_31_content_endpoint_is_draft_free_for_staff_too():
    res = client.get(f"/courses/{COURSE_A}/materials/content", headers=headers(INSTRUCTOR))
    assert res.status_code == 200
    assert "DRAFT-CANARY" not in res.text


def test_32_content_endpoint_denies_other_course():
    res = client.get(f"/courses/{COURSE_B}/materials/content", headers=headers(STUDENT_A))
    assert res.status_code == 403


def test_33_student_cannot_open_draft_material_pages():
    student = client.get(f"/courses/{COURSE_A}/materials/{MATERIAL_A_DRAFT}/pages", headers=headers(STUDENT_A))
    assert student.status_code == 404
    staff = client.get(f"/courses/{COURSE_A}/materials/{MATERIAL_A_DRAFT}/pages", headers=headers(INSTRUCTOR))
    assert staff.status_code == 200
    assert "DRAFT-CANARY" in staff.text

    approved = client.get(f"/courses/{COURSE_A}/materials/{MATERIAL_A_APPROVED}/pages", headers=headers(STUDENT_A))
    assert approved.status_code == 200
    assert [p["page_number"] for p in approved.json()["pages"]] == [1, 2, 3]


# ─────────────────────────── question contract ───────────────────────────

def test_34_invalid_question_shapes_are_rejected():
    bad_single = {"question_type": "single_choice", "prompt": "p", "options": ["a", "b"], "correct_answer": "c"}
    bad_multi = {"question_type": "multiple_choice", "prompt": "p", "options": ["a", "b"], "correct_answer": []}
    legacy = {"question_type": "true_false", "prompt": "p", "correct_answer": "a"}
    for q in (bad_single, bad_multi, legacy):
        res = client.post(f"/courses/{COURSE_A}/quizzes/", headers=headers(INSTRUCTOR),
                          json={"title": "invalid", "questions": [q]})
        assert res.status_code == 422, (q, res.text)


def test_35_select_all_and_accepted_answers_are_graded_server_side():
    quiz_id = _create_quiz(COURSE_A, [
        {"question_type": "single_choice", "prompt": "Pick b", "options": ["a", "b", "c"], "correct_answer": "b",
         "topic": "Single", "citation": {"material_id": MATERIAL_A_APPROVED, "title": "Week 1", "page": 2}},
        {"question_type": "multiple_choice", "prompt": "Pick a and c", "options": ["a", "b", "c"],
         "correct_answer": ["c", "a"], "topic": "Multi"},
        {"question_type": "short_answer", "prompt": "Name it", "correct_answer": "time quantum",
         "accepted_answers": ["quantum"], "explanation": "RR parameter"},
    ], publish=True)
    try:
        taking = client.get(f"/courses/{COURSE_A}/quizzes/{quiz_id}", headers=headers(STUDENT_C)).json()
        for q in taking["questions"]:
            for hidden in ("correct_answer", "accepted_answers", "explanation", "citation"):
                assert hidden not in q, f"{hidden} leaked before submission"
        qid = [q["id"] for q in taking["questions"]]

        partial = client.post(f"/courses/{COURSE_A}/quizzes/{quiz_id}/submit", headers=headers(STUDENT_C),
                              json={"answers": [{"question_id": qid[0], "answer": "b"},
                                                {"question_id": qid[1], "answer": ["a"]},
                                                {"question_id": qid[2], "answer": "  QUANTUM "}]})
        assert partial.status_code == 200, partial.text
        assert partial.json()["correct_count"] == 2   # select-all is all-or-nothing

        exact = client.post(f"/courses/{COURSE_A}/quizzes/{quiz_id}/submit", headers=headers(STUDENT_C),
                            json={"answers": [{"question_id": qid[1], "answer": ["a", "c"]}]})
        assert exact.json()["correct_count"] == 1
        assert exact.json()["points_awarded"] == 0.0

        review = client.get(f"/courses/{COURSE_A}/quizzes/{quiz_id}/my-attempts", headers=headers(STUDENT_C)).json()
        first = review[0]["answers"]
        assert first[0]["citation"]["page"] == 2 and first[0]["topic"] == "Single"
        assert first[1]["correct_answer"] == ["a", "c"] and first[1]["submitted_answer"] == ["a"]
        assert first[1]["is_correct"] is False
    finally:
        client.patch(f"/courses/{COURSE_A}/quizzes/{quiz_id}/status",
                     headers=headers(INSTRUCTOR), json={"status": "archived"})


def test_36_draft_quiz_is_editable_only_before_publishing():
    q = [{"question_type": "short_answer", "prompt": "v1", "correct_answer": "x"}]
    quiz_id = _create_quiz(COURSE_A, q)
    body = {"title": "Edited draft", "week_number": 12, "questions": [
        {"question_type": "single_choice", "prompt": "v2", "options": ["x", "y"], "correct_answer": "y"}]}
    try:
        assert client.put(f"/courses/{COURSE_A}/quizzes/{quiz_id}", headers=headers(INSTRUCTOR), json=body).status_code == 200
        manage = client.get(f"/courses/{COURSE_A}/quizzes/{quiz_id}/manage", headers=headers(INSTRUCTOR)).json()
        assert manage["title"] == "Edited draft" and manage["questions"][0]["prompt"] == "v2"

        client.patch(f"/courses/{COURSE_A}/quizzes/{quiz_id}/status", headers=headers(INSTRUCTOR), json={"status": "published"})
        assert client.put(f"/courses/{COURSE_A}/quizzes/{quiz_id}", headers=headers(INSTRUCTOR), json=body).status_code == 409
        assert client.put(f"/courses/{COURSE_A}/quizzes/{quiz_id}", headers=headers(STUDENT_A), json=body).status_code == 403
    finally:
        client.delete(f"/courses/{COURSE_A}/quizzes/{quiz_id}", headers=headers(INSTRUCTOR))


def test_37_quiz_cannot_reference_another_course_material():
    res = client.post(f"/courses/{COURSE_A}/quizzes/", headers=headers(INSTRUCTOR),
                      json={"title": "cross-course", "material_id": MATERIAL_B_APPROVED, "questions": []})
    assert res.status_code == 400, res.text


def test_38_demo_quiz_matches_the_student_exam_view():
    res = client.get(f"/courses/{COURSE_C}/quizzes/{DEMO_QUIZ}", headers=headers(STUDENT_A))
    assert res.status_code == 200, res.text
    quiz = res.json()
    assert quiz["title"] == "Bài tập 8: Kiểm tra kiến thức E-Commerce & AI"
    assert quiz["time_limit_seconds"] == 900 and quiz["due_at"] is not None
    assert len(quiz["questions"]) == 5
    assert all(q["question_type"] == "single_choice" and len(q["options"]) == 4 for q in quiz["questions"])


# ─────────────────────────── notes & materials ───────────────────────────

def test_39_note_anchor_must_be_an_accessible_material():
    draft_anchor = client.post(f"/courses/{COURSE_A}/notes", headers=headers(STUDENT_A),
                               json={"title": "x", "content": "y", "material_id": MATERIAL_A_DRAFT, "page_number": 1})
    assert draft_anchor.status_code == 400

    other_course = client.post(f"/courses/{COURSE_A}/notes", headers=headers(STUDENT_A),
                               json={"title": "x", "content": "y", "material_id": MATERIAL_B_APPROVED})
    assert other_course.status_code == 400

    created = client.post(f"/courses/{COURSE_A}/notes", headers=headers(STUDENT_A),
                          json={"title": "Slide 2", "content": "PCB lưu trạng thái", "material_id": MATERIAL_A_APPROVED,
                                "page_number": 2})
    assert created.status_code == 201, created.text
    note = created.json()
    try:
        assert note["material_id"] == MATERIAL_A_APPROVED and note["page_number"] == 2
        mine = client.get(f"/courses/{COURSE_A}/notes?material_id={MATERIAL_A_APPROVED}", headers=headers(STUDENT_A))
        assert note["id"] in {n["id"] for n in mine.json()}

        staff = client.get(f"/courses/{COURSE_A}/notes?material_id={MATERIAL_A_APPROVED}", headers=headers(INSTRUCTOR))
        assert note["id"] not in {n["id"] for n in staff.json()}
        assert client.get(f"/notes/{note['id']}", headers=headers(ADMIN)).status_code == 403
    finally:
        client.delete(f"/notes/{note['id']}", headers=headers(STUDENT_A))


def test_40_uploaded_text_material_starts_as_hidden_draft():
    upload = client.post(
        f"/courses/{COURSE_A}/materials/upload", headers=headers(INSTRUCTOR),
        data={"title": "Upload probe", "week_number": "11", "lesson_title": "Probe"},
        files={"file": ("probe.txt", io.BytesIO("UPLOAD-PROBE page one\fpage two".encode()), "text/plain")},
    )
    assert upload.status_code == 201, upload.text
    material = upload.json()
    try:
        assert material["status"] == "draft" and material["page_count"] == 2 and material["has_file"] is True

        before = client.get(f"/courses/{COURSE_A}/materials/content", headers=headers(STUDENT_A))
        assert "UPLOAD-PROBE" not in before.text
        assert client.get(f"/courses/{COURSE_A}/materials/{material['id']}/file",
                          headers=headers(STUDENT_A)).status_code == 404

        client.patch(f"/courses/{COURSE_A}/materials/{material['id']}/status",
                     headers=headers(INSTRUCTOR), json={"status": "approved"})
        after = client.get(f"/courses/{COURSE_A}/materials/content", headers=headers(STUDENT_A))
        assert "UPLOAD-PROBE" in after.text
        assert client.get(f"/courses/{COURSE_A}/materials/{material['id']}/file",
                          headers=headers(STUDENT_A)).status_code == 200
    finally:
        removed = client.delete(f"/courses/{COURSE_A}/materials/{material['id']}", headers=headers(INSTRUCTOR))
        assert removed.status_code == 204


def test_41_upload_without_text_is_failed_and_cannot_be_approved():
    upload = client.post(
        f"/courses/{COURSE_A}/materials/upload", headers=headers(INSTRUCTOR),
        data={"title": "Empty text", "week_number": "11", "lesson_title": "Probe"},
        files={"file": ("blank.md", io.BytesIO(b"   \n "), "text/markdown")},
    )
    assert upload.status_code == 201, upload.text
    material = upload.json()
    try:
        assert material["status"] == "failed" and material["processing_error"]
        approve = client.patch(f"/courses/{COURSE_A}/materials/{material['id']}/status",
                               headers=headers(INSTRUCTOR), json={"status": "approved"})
        assert approve.status_code == 400
    finally:
        client.delete(f"/courses/{COURSE_A}/materials/{material['id']}", headers=headers(INSTRUCTOR))


def test_42_upload_rejects_unsupported_types_and_students():
    bad_type = client.post(f"/courses/{COURSE_A}/materials/upload", headers=headers(INSTRUCTOR),
                           data={"title": "x", "week_number": "1", "lesson_title": "x"},
                           files={"file": ("run.exe", io.BytesIO(b"MZ"), "application/octet-stream")})
    assert bad_type.status_code == 400
    student = client.post(f"/courses/{COURSE_A}/materials/upload", headers=headers(STUDENT_A),
                          data={"title": "x", "week_number": "1", "lesson_title": "x"},
                          files={"file": ("a.txt", io.BytesIO(b"hello"), "text/plain")})
    assert student.status_code == 403


def test_43_readiness_is_staff_only_and_scoped():
    assert client.get("/courses/readiness", headers=headers(STUDENT_A)).status_code == 403
    instructor = {c["id"] for c in client.get("/courses/readiness", headers=headers(INSTRUCTOR)).json()}
    assert COURSE_A in instructor and COURSE_C in instructor and COURSE_B not in instructor
    admin = client.get("/courses/readiness", headers=headers(ADMIN)).json()
    assert {COURSE_A, COURSE_B, COURSE_C} <= {c["id"] for c in admin}
    assert all("notes" not in key for c in admin for key in c)
