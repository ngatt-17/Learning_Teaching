"""
tests/test_competency.py — Unit tests cho Khối 3: Competency Analyst (Đánh giá điểm mạnh/yếu qua Quiz)

Kiểm tra:
1. Tính toán tỉ lệ thành thạo (% Mastery) theo từng chủ đề (Topic)
2. Phân loại Điểm mạnh (Strengths — Solid Mastery) khi Mastery >= 80%
3. Phân loại Điểm yếu (Weaknesses — Needs Review) khi Mastery < 60%
4. Nhận diện băn khoăn kiến thức từ Chat (chat_topics >= 2 lần)
5. Chỉ dẫn ôn tập cụ thể kèm slide và trang từ TOPIC_REVIEW_MAP
6. Bảo mật ranh giới riêng tư: Cấm phân tích Private Notes (HTTP 400)
7. Chuẩn hóa cấu trúc JSON hợp đồng API: POST /api/ai/analyze-competency
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from competency_analyzer import (
    compute_topic_mastery,
    analyze_competency,
    get_recommendation_for_topic,
    TOPIC_REVIEW_MAP,
)

client = TestClient(app)
STUDENT_A = {"Authorization": "Bearer student_a_token"}


def test_01_compute_topic_mastery_calculation():
    """Kiểm tra độ chính xác công thức tính % Mastery theo từng Topic."""
    sample_answers = [
        {"question_id": "q1", "topic": "Cú pháp & Kiểu dữ liệu", "is_correct": True},
        {"question_id": "q2", "topic": "Cú pháp & Kiểu dữ liệu", "is_correct": True},
        {"question_id": "q3", "topic": "Cú pháp & Kiểu dữ liệu", "is_correct": False},
        {"question_id": "q4", "topic": "Con trỏ", "is_correct": True},
        {"question_id": "q5", "topic": "Con trỏ", "is_correct": True},
    ]

    stats = compute_topic_mastery(sample_answers)
    assert stats["Cú pháp & Kiểu dữ liệu"]["total"] == 3
    assert stats["Cú pháp & Kiểu dữ liệu"]["correct"] == 2
    assert stats["Cú pháp & Kiểu dữ liệu"]["mastery_pct"] == 66.7

    assert stats["Con trỏ"]["total"] == 2
    assert stats["Con trỏ"]["correct"] == 2
    assert stats["Con trỏ"]["mastery_pct"] == 100.0


def test_02_strengths_classification():
    """Kiểm tra tiêu chí Điểm mạnh: Mastery >= 80% và ít hỏi chat."""
    sample_answers = [
        {"question_id": "q1", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
        {"question_id": "q2", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
        {"question_id": "q3", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
        {"question_id": "q4", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
        {"question_id": "q5", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
    ]

    report = analyze_competency(
        student_id="std_123",
        quiz_answers=sample_answers,
        chat_topics=["General intro"],
        course_id="CS101",
    )

    strengths = report["competency_summary"]["strengths"]
    assert len(strengths) == 1
    assert strengths[0]["topic"] == "Cú pháp & Kiểu dữ liệu cơ bản"
    assert strengths[0]["mastery_pct"] == 100.0
    assert strengths[0]["status"] == "Solid Mastery"
    assert "5/5 câu" in strengths[0]["evidence"]


def test_03_weaknesses_classification_by_score():
    """Kiểm tra tiêu chí Điểm yếu: Mastery < 60% và có chỉ dẫn ôn tập slide chính xác."""
    sample_answers = [
        {"question_id": "q1", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": False},
        {"question_id": "q2", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": False},
        {"question_id": "q3", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": True},
    ]

    report = analyze_competency(
        student_id="std_123",
        quiz_answers=sample_answers,
        chat_topics=[],
        course_id="CS101",
    )

    weaknesses = report["competency_summary"]["weaknesses"]
    assert len(weaknesses) == 1
    assert weaknesses[0]["topic"] == "Con trỏ & Quản lý bộ nhớ"
    assert weaknesses[0]["mastery_pct"] == 33.3
    assert weaknesses[0]["status"] == "Needs Review"
    assert "1/3 câu" in weaknesses[0]["evidence"]
    assert "Lecture02_Pointers.pdf" in weaknesses[0]["recommended_action"]
    assert "Slide 12-18" in weaknesses[0]["recommended_action"]


def test_04_weakness_triggered_by_frequent_chat_inquiries():
    """Dù làm quiz đạt 100% nhưng hỏi chat >= 2 lần về lỗi segfault -> Phải cảnh báo lỗ hổng."""
    sample_answers = [
        {"question_id": "q1", "topic": "Con trỏ", "is_correct": True},
    ]
    chat_topics = ["Con trỏ", "Con trỏ"]  # Hỏi 2 lần

    report = analyze_competency(
        student_id="std_123",
        quiz_answers=sample_answers,
        chat_topics=chat_topics,
        course_id="CS101",
    )

    weaknesses = report["competency_summary"]["weaknesses"]
    assert len(weaknesses) == 1
    assert weaknesses[0]["topic"] == "Con trỏ"
    assert "đã thắc mắc 2 lần" in weaknesses[0]["evidence"]


def test_05_privacy_boundary_rejects_private_notes():
    """Kiểm tra nguyên tắc bảo mật: Cấm nhận dữ liệu private_notes."""
    payload = {
        "student_id": "std_123",
        "course_id": "CS101",
        "quiz_answers": [
            {"question_id": "q1", "topic": "Vòng lặp", "is_correct": True}
        ],
        "private_notes": "Ghi chú riêng của tôi: tôi chưa hiểu vòng lặp while",
    }

    resp = client.post(
        "/api/ai/analyze-competency",
        json=payload,
        headers=STUDENT_A,
    )
    assert resp.status_code == 400
    assert "Security violation" in resp.json()["detail"]


def test_06_api_endpoint_json_contract():
    """Kiểm tra đầy đủ luồng API POST /api/ai/analyze-competency khớp chuẩn hợp đồng Day 02."""
    payload = {
        "student_id": "std_123",
        "course_id": "CS101",
        "quiz_answers": [
            {"question_id": "q1", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
            {"question_id": "q2", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
            {"question_id": "q3", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": False},
        ],
        "chat_topics": ["Con trỏ", "Con trỏ"],
    }

    resp = client.post(
        "/api/ai/analyze-competency",
        json=payload,
        headers=STUDENT_A,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["student_id"] == "std_123"
    assert data["course_id"] == "CS101"
    assert "competency_summary" in data

    summary = data["competency_summary"]
    assert "strengths" in summary
    assert "weaknesses" in summary

    # Strengths chứa Cú pháp cơ bản
    assert any(s["topic"] == "Cú pháp & Kiểu dữ liệu cơ bản" for s in summary["strengths"])
    # Weaknesses chứa Con trỏ
    assert any(w["topic"] == "Con trỏ & Quản lý bộ nhớ" for w in summary["weaknesses"])
