"""
tests/test_genquiz_contract.py — Bộ 3 test kiểm chứng đầu ra JSON chuẩn cho GenQuiz (Thành viên A)

Tất cả các test đều mock OpenAI client để:
  - Chạy offline 100%, không cần internet / API key thật.
  - Không tốn token/quota API.
  - Chạy tức thì (<1 giây), hoàn toàn deterministic, không flaky.
"""
import json
import os
import sys
from unittest.mock import patch, MagicMock
import pytest

# Add src/ai to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import quiz_generator as qg


def _make_mock_completion(data: list[dict]) -> MagicMock:
    """Helper tạo mock response từ OpenAI client."""
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(data)
    mock_res = MagicMock()
    mock_res.choices = [mock_choice]
    return mock_res


@pytest.fixture(scope="module")
def cs101_content() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "sample_lecture_cs101.txt")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def test_01_single_choice_json_structure(cs101_content):
    """Test 1: Sinh câu hỏi single_choice trả ra đúng chuẩn JSON (options=4, correct_answer=int, citation)."""
    mock_data = [
        {
            "id": "q1",
            "type": "single_choice",
            "topic": "Kiểu dữ liệu cơ bản C",
            "question": "Trong ngôn ngữ C trên hệ thống 64-bit hiện đại, kiểu int thường chiếm bao nhiêu bytes?",
            "options": ["1 byte", "4 bytes", "8 bytes", "2 bytes"],
            "correct_answer": 1,
            "explanation": "Kiểu int có kích thước 4 bytes theo chuẩn hệ thống hiện đại.",
            "citation": {
                "source_file": "Lecture01_Intro.pdf",
                "page": 1,
                "evidence_snippet": "int: 4 bytes (standard integer type)",
            },
        }
    ]

    with patch.object(qg._client.chat.completions, "create", return_value=_make_mock_completion(mock_data)):
        result = qg.gen_quiz_standard(
            lesson_content=cs101_content,
            topic="Kiểu dữ liệu cơ bản C",
            num_questions=1,
            types=["single_choice"],
            source_file="Lecture01_Intro.pdf",
            lesson_id="cs101-intro",
        )

    assert "lesson_id" in result
    assert "questions" in result
    assert len(result["questions"]) >= 1

    q = result["questions"][0]
    assert q["type"] == "single_choice", f"Expected type 'single_choice', got {q.get('type')}"
    assert len(q["options"]) == 4, f"Options phải có đúng 4 phần tử, có {len(q.get('options', []))}"
    assert isinstance(q["correct_answer"], int), "correct_answer của single_choice phải là số nguyên (index)"
    assert 0 <= q["correct_answer"] < 4, "correct_answer index phải nằm trong khoảng 0..3"
    assert q["explanation"], "Phải có lời giải thích"

    # Kiểm tra citation
    citation = q.get("citation")
    assert citation is not None, "Phải có trường citation"
    assert citation.get("source_file") == "Lecture01_Intro.pdf"
    assert isinstance(citation.get("page"), int) and citation.get("page") >= 1, "Page phải là số nguyên >= 1"
    assert citation.get("evidence_snippet"), "Citation phải có đoạn văn bằng chứng"


def test_02_multiple_choice_json_structure(cs101_content):
    """Test 2: Sinh câu hỏi multiple_choice trả ra đúng chuẩn JSON (options=4, correct_answer=list[int], citation)."""
    mock_data = [
        {
            "id": "q2",
            "type": "multiple_choice",
            "topic": "Cấp phát bộ nhớ động stdlib.h",
            "question": "Những hàm nào sau đây được dùng để cấp phát hoặc thay đổi kích thước bộ nhớ heap? (Chọn tất cả đáp án đúng)",
            "options": ["malloc()", "calloc()", "free()", "realloc()"],
            "correct_answer": [0, 1, 3],
            "explanation": "malloc, calloc, realloc cấp phát/đổi kích thước. free() là giải phóng.",
            "citation": {
                "source_file": "Lecture02_Pointers.pdf",
                "page": 3,
                "evidence_snippet": "Dynamic memory is allocated on the heap using malloc, calloc, realloc",
            },
        }
    ]

    with patch.object(qg._client.chat.completions, "create", return_value=_make_mock_completion(mock_data)):
        result = qg.gen_quiz_standard(
            lesson_content=cs101_content,
            topic="Cấp phát bộ nhớ động stdlib.h",
            num_questions=1,
            types=["multiple_choice"],
            source_file="Lecture02_Pointers.pdf",
            lesson_id="cs101-pointers",
        )

    assert len(result["questions"]) >= 1
    q = result["questions"][0]

    assert q["type"] == "multiple_choice", f"Expected type 'multiple_choice', got {q.get('type')}"
    assert len(q["options"]) == 4, "Options phải có đúng 4 lựa chọn"
    assert isinstance(q["correct_answer"], list), "correct_answer của multiple_choice phải là list[int]"
    assert len(q["correct_answer"]) >= 1, "Phải có ít nhất 1 đáp án đúng"
    assert all(isinstance(i, int) and 0 <= i < 4 for i in q["correct_answer"]), "Các phần tử đáp án phải là index 0..3"

    citation = q.get("citation")
    assert citation is not None
    assert isinstance(citation.get("page"), int) and citation.get("page") >= 1, "Page phải là số nguyên >= 1"
    assert citation.get("evidence_snippet")


def test_03_short_answer_json_structure(cs101_content):
    """Test 3: Sinh câu hỏi short_answer có keywords chấm điểm, đáp án mẫu và citation."""
    mock_data = [
        {
            "id": "q3",
            "type": "short_answer",
            "topic": "Toán tử con trỏ",
            "question": "Toán tử nào trong ngôn ngữ C được sử dụng để dereference con trỏ?",
            "options": [],
            "correct_answer": "*",
            "keywords": ["*", "toán tử *", "dereference", "indirection"],
            "explanation": "Toán tử '*' dùng để truy xuất giá trị tại địa chỉ con trỏ.",
            "citation": {
                "source_file": "Lecture02_Pointers.pdf",
                "page": 2,
                "evidence_snippet": "The dereference operator '*' accesses the value stored",
            },
        }
    ]

    with patch.object(qg._client.chat.completions, "create", return_value=_make_mock_completion(mock_data)):
        result = qg.gen_quiz_standard(
            lesson_content=cs101_content,
            topic="Toán tử con trỏ",
            num_questions=1,
            types=["short_answer"],
            source_file="Lecture02_Pointers.pdf",
            lesson_id="cs101-pointers",
        )

    assert len(result["questions"]) >= 1
    q = result["questions"][0]

    assert q["type"] == "short_answer", f"Expected type 'short_answer', got {q.get('type')}"
    assert q["options"] == [], "Short answer không có options (rỗng)"
    assert isinstance(q["correct_answer"], str) and len(q["correct_answer"]) > 0, "Phải có đáp án mẫu dạng string"
    assert "keywords" in q, "Phải có danh sách keywords để chấm điểm"
    assert isinstance(q["keywords"], list) and len(q["keywords"]) >= 1, "Keywords phải có ít nhất 1 từ khóa"

    citation = q.get("citation")
    assert citation is not None
    assert isinstance(citation.get("page"), int) and citation.get("page") >= 1, "Page phải là số nguyên >= 1"
    assert citation.get("evidence_snippet")
