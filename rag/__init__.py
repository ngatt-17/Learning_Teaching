"""
Module Grounded Chat RAG (Team 3 - Thành viên B).
Chuyên trách: Hỏi đáp có căn cứ (Grounded Q&A) dựa trên tài liệu bài học đã duyệt.
"""

from .grounded_chat import answer_grounded_chat, INSUFFICIENT_EVIDENCE_MSG
from .mock_materials import MOCK_MATERIALS

__all__ = [
    "answer_grounded_chat",
    "INSUFFICIENT_EVIDENCE_MSG",
    "MOCK_MATERIALS"
]
