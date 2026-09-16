"""
tests/test_retrieval_vi.py — retrieval on Vietnamese course text from the Platform payload

Regression checks for issues found while integrating with the seeded CS-AI3010 / COMP2030
pages: syllable collisions ("tử" in "điện tử"), filler words ("khác", "thế nào") and
sentence fragments in extractive answers.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from chat_rag import answer_question, find_evidence
from retriever import materials_from_platform

CONTENT = {
    "course_id": "c",
    "materials": [
        {"id": "ecom", "title": "E-Commerce — Chương 1", "status": "approved", "approved_for_ai": True, "pages": [
            {"page_number": 13, "content": "Sàn thương mại điện tử là nền tảng trung gian kết nối người bán và người mua, xử lý đơn hàng."},
        ]},
        {"id": "agent", "title": "AI — Tác tử", "status": "approved", "approved_for_ai": True, "pages": [
            {"page_number": 16, "content": "Tác tử duy lý chọn hành động nhằm tối đa hóa thước đo hiệu năng kỳ vọng. "
                                          "Duy lý không đồng nghĩa với toàn tri (omniscience): tác tử duy lý vẫn có thể sai."},
        ]},
        {"id": "os1", "title": "OS Week 1", "status": "approved", "approved_for_ai": True, "pages": [
            {"page_number": 2, "content": "Tiến trình (process) là một chương trình đang chạy. Chương trình (program) chỉ là file thực thi trên đĩa."},
        ]},
        {"id": "os2", "title": "OS Week 2", "status": "approved", "approved_for_ai": True, "pages": [
            {"page_number": 3, "content": "Chuyển ngữ cảnh xảy ra khi CPU chuyển từ process này sang process khác."},
        ]},
        {"id": "draft", "title": "Draft", "status": "draft", "approved_for_ai": False, "pages": [
            {"page_number": 1, "content": "DRAFT-CANARY tác tử duy lý process program"},
        ]},
    ],
}
MATERIALS = materials_from_platform(CONTENT)


def _cited(question):
    return [(c["material_id"], c["page"]) for c in find_evidence(question, "c", materials=MATERIALS)]


def test_draft_is_dropped_by_the_adapter():
    assert "draft" not in MATERIALS


def test_syllable_collision_does_not_add_unrelated_citation():
    assert _cited("Tác tử duy lý là gì?") == [("agent", 16)]


def test_filler_words_do_not_outrank_the_defining_page():
    assert _cited("Process khác program thế nào?")[0] == ("os1", 2)


def test_extractive_answer_keeps_whole_sentences():
    answer = answer_question("Tác tử duy lý là gì?", "c", materials=MATERIALS)["answer"]
    assert "Duy lý không đồng nghĩa với toàn tri (omniscience): tác tử duy lý vẫn có thể sai." in answer
    assert "DRAFT-CANARY" not in answer


def test_off_topic_vietnamese_question_is_insufficient():
    result = answer_question("Hôm nay trời mưa không?", "c", materials=MATERIALS)
    assert result["evidence_level"] == "insufficient"
    assert result["answer"].startswith("Tài liệu môn học đã được phê duyệt không có đủ thông tin")
