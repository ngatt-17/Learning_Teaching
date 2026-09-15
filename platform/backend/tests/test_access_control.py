import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)

# Seeded IDs from schema.sql
STUDENT_A_EMAIL = "student_a@vinuni.edu.vn"
STUDENT_B_EMAIL = "student_b@vinuni.edu.vn"
INSTRUCTOR_EMAIL = "instructor@vinuni.edu.vn"
ADMIN_EMAIL = "admin@vinuni.edu.vn"

COURSE_A_ID = "10000000-0000-0000-0000-000000000001"  # COMP2030
COURSE_B_ID = "10000000-0000-0000-0000-000000000002"  # COMP3010

def get_token_for(email: str) -> str:
    """Helper to authenticate and retrieve JWT token."""
    # Request OTP
    req_res = client.post("/auth/request-otp", json={"email": email})
    assert req_res.status_code == 200, f"Failed OTP request for {email}: {req_res.text}"
    # Verify with dev master code '000000'
    verify_res = client.post("/auth/verify-otp", json={"email": email, "otp": "000000"})
    assert verify_res.status_code == 200, f"Failed OTP verify for {email}: {verify_res.text}"
    return verify_res.json()["access_token"]

def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}

# =========================================================================
# TEST SUITE 1: AUTHENTICATION & OTP
# =========================================================================

def test_01_otp_rejects_non_vinuni_email():
    res = client.post("/auth/request-otp", json={"email": "external@gmail.com"})
    assert res.status_code == 400
    assert "vinuni.edu.vn" in res.json()["detail"]

def test_02_otp_success_for_student_a():
    token = get_token_for(STUDENT_A_EMAIL)
    assert token is not None

    me_res = client.get("/auth/me", headers=auth_headers(token))
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == STUDENT_A_EMAIL
    assert data["role"] == "student"
    assert COURSE_A_ID in data["enrolled_courses"]

# =========================================================================
# TEST SUITE 2: COURSE ACCESS CONTROL
# =========================================================================

def test_03_student_a_accesses_course_a_success():
    token = get_token_for(STUDENT_A_EMAIL)
    res = client.get(f"/courses/{COURSE_A_ID}", headers=auth_headers(token))
    assert res.status_code == 200
    assert res.json()["code"] == "COMP2030"

def test_04_student_a_denied_course_b():
    token = get_token_for(STUDENT_A_EMAIL)
    res = client.get(f"/courses/{COURSE_B_ID}", headers=auth_headers(token))
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_05_student_b_denied_course_a():
    token = get_token_for(STUDENT_B_EMAIL)
    res = client.get(f"/courses/{COURSE_A_ID}", headers=auth_headers(token))
    assert res.status_code == 403

def test_06_admin_can_access_any_course():
    admin_token = get_token_for(ADMIN_EMAIL)
    res_a = client.get(f"/courses/{COURSE_A_ID}", headers=auth_headers(admin_token))
    res_b = client.get(f"/courses/{COURSE_B_ID}", headers=auth_headers(admin_token))
    assert res_a.status_code == 200
    assert res_b.status_code == 200

# =========================================================================
# TEST SUITE 3: MATERIALS FILTERING & MANAGEMENT
# =========================================================================

def test_07_draft_materials_hidden_from_student():
    """
    Student must ONLY see approved materials. Draft or processing materials
    must never be exposed in student retrieval.
    """
    token = get_token_for(STUDENT_A_EMAIL)
    res = client.get(f"/courses/{COURSE_A_ID}/materials", headers=auth_headers(token))
    assert res.status_code == 200
    materials = res.json()
    assert len(materials) >= 1
    for m in materials:
        assert m["status"] == "approved"
        assert m["approved_for_ai"] is True
        assert "DRAFT" not in m["title"]

def test_08_instructor_sees_all_materials_including_drafts():
    token = get_token_for(INSTRUCTOR_EMAIL)
    res = client.get(f"/courses/{COURSE_A_ID}/materials/manage", headers=auth_headers(token))
    assert res.status_code == 200
    materials = res.json()
    statuses = {m["status"] for m in materials}
    assert "draft" in statuses
    assert "approved" in statuses

def test_09_student_denied_manage_materials():
    token = get_token_for(STUDENT_A_EMAIL)
    res = client.get(f"/courses/{COURSE_A_ID}/materials/manage", headers=auth_headers(token))
    assert res.status_code == 403

# =========================================================================
# TEST SUITE 4: PRIVATE NOTES & ROW-LEVEL SECURITY (RLS)
# =========================================================================

def test_10_student_a_creates_and_reads_note():
    token_a = get_token_for(STUDENT_A_EMAIL)
    # Create note
    create_res = client.post(
        f"/courses/{COURSE_A_ID}/notes",
        headers=auth_headers(token_a),
        json={"title": "Test RLS Note", "content": "Critical secret note content"}
    )
    assert create_res.status_code == 201
    note = create_res.json()
    note_id = note["id"]

    # Read back note
    get_res = client.get(f"/notes/{note_id}", headers=auth_headers(token_a))
    assert get_res.status_code == 200
    assert get_res.json()["content"] == "Critical secret note content"


def test_11_student_b_cannot_read_student_a_note():
    # Student A creates note
    token_a = get_token_for(STUDENT_A_EMAIL)
    create_res = client.post(
        f"/courses/{COURSE_A_ID}/notes",
        headers=auth_headers(token_a),
        json={"title": "A's Private Reflection", "content": "Not for B's eyes"}
    )
    note_id = create_res.json()["id"]

    # Student B attempts to read Student A's note
    token_b = get_token_for(STUDENT_B_EMAIL)
    res = client.get(f"/notes/{note_id}", headers=auth_headers(token_b))
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
    assert "Access denied" in res.json()["detail"]

def test_12_instructor_and_admin_cannot_read_student_note():
    """
    Even course instructors and system admins are denied direct access to private notes.
    """
    token_a = get_token_for(STUDENT_A_EMAIL)
    create_res = client.post(
        f"/courses/{COURSE_A_ID}/notes",
        headers=auth_headers(token_a),
        json={"title": "Confidential Study Plan", "content": "Private notes test"}
    )
    note_id = create_res.json()["id"]

    # Instructor attempts to read
    inst_token = get_token_for(INSTRUCTOR_EMAIL)
    res_inst = client.get(f"/notes/{note_id}", headers=auth_headers(inst_token))
    assert res_inst.status_code == 403

    # Admin attempts to read
    admin_token = get_token_for(ADMIN_EMAIL)
    res_admin = client.get(f"/notes/{note_id}", headers=auth_headers(admin_token))
    assert res_admin.status_code == 403

# =========================================================================
# TEST SUITE 5: DASHBOARD ACCURACY & PRIVATE NOTES ABSENCE
# =========================================================================

def test_13_dashboard_excludes_private_notes():
    inst_token = get_token_for(INSTRUCTOR_EMAIL)
    res = client.get(f"/courses/{COURSE_A_ID}/scores/class-summary", headers=auth_headers(inst_token))
    assert res.status_code == 200
    data = res.json()
    assert "private_notes" not in data
    assert "notes" not in data
    assert data["privacy_guarantee"] is not None

def test_14_anonymous_feedback_contains_no_user_identity():
    token_a = get_token_for(STUDENT_A_EMAIL)
    submit_res = client.post(
        f"/courses/{COURSE_A_ID}/feedback/",
        headers=auth_headers(token_a),
        json={"content": "The pacing in Week 1 was slightly too fast."}
    )
    assert submit_res.status_code == 201

    admin_token = get_token_for(ADMIN_EMAIL)
    list_res = client.get(f"/courses/{COURSE_A_ID}/feedback/", headers=auth_headers(admin_token))
    assert list_res.status_code == 200
    feedbacks = list_res.json()
    assert len(feedbacks) >= 1
    for fb in feedbacks:
        assert "user_id" not in fb
        assert "author" not in fb
        assert "student_id" not in fb


# =========================================================================
# TEST SUITE 6: SCORE INTEGRITY (students must not write their own score)
# =========================================================================

def test_15_student_cannot_award_points_to_self():
    token = get_token_for(STUDENT_A_EMAIL)
    res = client.post(
        f"/courses/{COURSE_A_ID}/scores/activity",
        headers=auth_headers(token),
        json={"student_id": "00000000-0000-0000-0000-000000000003",
              "activity_type": "quiz", "points_earned": 100}
    )
    assert res.status_code == 403, f"Student was able to write a score: {res.text}"


def test_16_instructor_can_award_points_to_enrolled_student():
    token = get_token_for(INSTRUCTOR_EMAIL)
    res = client.post(
        f"/courses/{COURSE_A_ID}/scores/activity",
        headers=auth_headers(token),
        json={"student_id": "00000000-0000-0000-0000-000000000003",
              "activity_type": "quiz", "points_earned": 1}
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["points_added"] == 1
    assert body["awarded_by"] == "00000000-0000-0000-0000-000000000002"


def test_17_award_rejects_out_of_range_points():
    token = get_token_for(INSTRUCTOR_EMAIL)
    res = client.post(
        f"/courses/{COURSE_A_ID}/scores/activity",
        headers=auth_headers(token),
        json={"student_id": "00000000-0000-0000-0000-000000000003",
              "activity_type": "quiz", "points_earned": 9999}
    )
    assert res.status_code == 422, f"Unbounded score accepted: {res.text}"


def test_18_award_rejects_student_outside_the_course():
    token = get_token_for(INSTRUCTOR_EMAIL)
    res = client.post(
        f"/courses/{COURSE_A_ID}/scores/activity",
        headers=auth_headers(token),
        json={"student_id": "00000000-0000-0000-0000-000000000004",  # Student B, Course B only
              "activity_type": "quiz", "points_earned": 5}
    )
    assert res.status_code == 404, res.text

