"""
Unit tests for Grounded Chat RAG (Member B - Team 3).
Tests all 4 guardrails:
1. Approved material retrieval with citations.
2. Standard insufficient evidence refusal.
3. Strict exclusion of draft materials.
4. Strict exclusion of other courses' materials.
5. Socratic tutor principle ("Tutor, Not Solver").
"""

import unittest
import sys
import os

current_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from grounded_chat import answer_grounded_chat, INSUFFICIENT_EVIDENCE_MSG
except ImportError:
    from rag.grounded_chat import answer_grounded_chat, INSUFFICIENT_EVIDENCE_MSG


class TestGroundedChatRAG(unittest.TestCase):

    def test_grounded_chat_approved_material_with_citation(self):
        """Test 1: Approved material returns answers and citations."""
        response = answer_grounded_chat(
            course_id="CS101",
            lesson_id="lec_02",
            message="Kích thước của con trỏ trên hệ thống 64-bit là bao nhiêu?"
        )
        self.assertFalse(response["is_insufficient_evidence"])
        self.assertTrue(len(response["citations"]) > 0)
        self.assertEqual(response["citations"][0]["source"], "Lecture02_Pointers.pdf")
        self.assertIn("8 bytes", response["answer"])

    def test_grounded_chat_insufficient_evidence_exact_phrase(self):
        """Test 2: Off-topic questions return standard insufficient evidence message."""
        response = answer_grounded_chat(
            course_id="CS101",
            lesson_id="lec_02",
            message="Giá chứng khoán hôm nay"
        )
        self.assertTrue(response["is_insufficient_evidence"])
        self.assertEqual(response["answer"], INSUFFICIENT_EVIDENCE_MSG)
        self.assertEqual(len(response["citations"]), 0)

    def test_grounded_chat_blocks_draft_materials(self):
        """Test 3: Draft materials must be completely excluded."""
        response = answer_grounded_chat(
            course_id="CS101",
            lesson_id="lec_03",
            message="Cấu trúc struct trong ngôn ngữ C là gì?"
        )
        self.assertTrue(response["is_insufficient_evidence"])
        self.assertEqual(response["answer"], INSUFFICIENT_EVIDENCE_MSG)

    def test_grounded_chat_blocks_other_course_materials(self):
        """Test 4: Materials belonging to other courses must be excluded."""
        response = answer_grounded_chat(
            course_id="CS101",
            lesson_id="lec_01",
            message="Định luật Ohm V = I * R là gì?"
        )
        self.assertTrue(response["is_insufficient_evidence"])
        self.assertEqual(response["answer"], INSUFFICIENT_EVIDENCE_MSG)

    def test_grounded_chat_tutor_not_solver(self):
        """Test 5: Asking AI to solve homework triggers Socratic guidance."""
        response = answer_grounded_chat(
            course_id="CS101",
            lesson_id="lec_02",
            message="Giải hộ bài tập viết code quản lý sinh viên bằng con trỏ giúp em với"
        )
        self.assertFalse(response["is_insufficient_evidence"])
        self.assertIn("không thể giải hộ bài tập", response["answer"])


if __name__ == "__main__":
    unittest.main()
