"""
competency_analyzer.py — Phân tích Điểm mạnh / Điểm yếu & Lỗ hổng kiến thức

Theo chuẩn thiết kế Team 3 (AI & Quality) — Day 02:
- Gom nhóm kết quả bài làm Quiz theo chủ đề (topic)
- Tính tỉ lệ thành thạo: % Mastery = (Số câu đúng / Tổng số câu) * 100
- Phân loại:
    + Strengths (Solid Mastery): Mastery >= 80% và ít thắc mắc trong chat
    + Weaknesses (Needs Review): Mastery < 60% HOẶC thắc mắc trong chat >= 2 lần
- Gợi ý hành động ôn tập (recommended_action) chỉ đích danh slide & trang bài giảng (TOPIC_REVIEW_MAP)
- Nguyên tắc bảo mật: "Private means private" — CHỈ lấy từ Quiz và Lesson Chat,
  tuyệt đối KHÔNG đọc ghi chú cá nhân (Private Notes).
"""
from __future__ import annotations
from typing import TypedDict, Optional
import unicodedata


# ── Types & Contracts ────────────────────────────────────────────────────────
class QuizAnswerItem(TypedDict):
    question_id: str
    topic: str
    is_correct: bool


class StrengthItem(TypedDict):
    topic: str
    mastery_pct: float
    status: str
    evidence: str


class WeaknessItem(TypedDict):
    topic: str
    mastery_pct: float
    status: str
    evidence: str
    recommended_action: str


class CompetencySummary(TypedDict):
    strengths: list[StrengthItem]
    weaknesses: list[WeaknessItem]


class CompetencyReport(TypedDict):
    student_id: str
    course_id: str
    competency_summary: CompetencySummary


# ── Từ điển Ánh xạ Chủ đề -> Tài liệu & Trang cần ôn tập ────────────────────
# Khớp với tài liệu học phần của CECS AI Learning Hub
TOPIC_REVIEW_MAP: dict[str, dict[str, str]] = {
    "cú pháp & kiểu dữ liệu cơ bản": {
        "source_file": "Lecture01_Intro.pdf",
        "pages": "1-6",
    },
    "kiểu dữ liệu": {
        "source_file": "Lecture01_Intro.pdf",
        "pages": "4-6",
    },
    "biến & kiểu dữ liệu": {
        "source_file": "Lecture01_Intro.pdf",
        "pages": "1-5",
    },
    "con trỏ & quản lý bộ nhớ": {
        "source_file": "Lecture02_Pointers.pdf",
        "pages": "12-18",
    },
    "con trỏ": {
        "source_file": "Lecture02_Pointers.pdf",
        "pages": "12-16",
    },
    "quản lý bộ nhớ động": {
        "source_file": "Lecture02_Pointers.pdf",
        "pages": "18-22",
    },
    "điều khiển luồng & vòng lặp": {
        "source_file": "Lecture02_ControlFlow.pdf",
        "pages": "1-8",
    },
    "vòng lặp": {
        "source_file": "Lecture02_ControlFlow.pdf",
        "pages": "3-7",
    },
    "hàm & tái sử dụng mã nguồn": {
        "source_file": "Lecture03_Functions.pdf",
        "pages": "1-10",
    },
    "cấu trúc dữ liệu & mảng": {
        "source_file": "Lecture04_DataStructures.pdf",
        "pages": "1-15",
    },
}


def _strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để đối khớp mềm."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def get_recommendation_for_topic(topic: str) -> str:
    """Tra cứu TOPIC_REVIEW_MAP để đưa ra chỉ dẫn ôn tập cụ thể."""
    topic_clean = topic.strip().lower()

    # 1. Khớp chính xác
    if topic_clean in TOPIC_REVIEW_MAP:
        ref = TOPIC_REVIEW_MAP[topic_clean]
        return f"Đọc lại Slide {ref['pages']} trong file {ref['source_file']}."

    # 2. Khớp từ khóa mềm (không phân biệt dấu tiếng Việt)
    topic_normalized = _strip_accents(topic_clean)
    for map_topic, ref in TOPIC_REVIEW_MAP.items():
        if _strip_accents(map_topic) in topic_normalized or topic_normalized in _strip_accents(map_topic):
            return f"Đọc lại Slide {ref['pages']} trong file {ref['source_file']}."

    # 3. Fallback chung nếu topic mới
    return f"Xem lại tài liệu bài giảng liên quan đến chủ đề '{topic}'."


def compute_topic_mastery(quiz_answers: list[dict]) -> dict[str, dict]:
    """
    Gom nhóm câu trả lời theo topic và tính tỉ lệ mastery:
    {
        "topic_name": {
            "total": int,
            "correct": int,
            "mastery_pct": float (0..100)
        }
    }
    """
    stats: dict[str, dict] = {}
    for ans in quiz_answers:
        topic = ans.get("topic", "Tổng quan").strip()
        is_correct = bool(ans.get("is_correct", False))

        if topic not in stats:
            stats[topic] = {"total": 0, "correct": 0, "mastery_pct": 0.0}

        stats[topic]["total"] += 1
        if is_correct:
            stats[topic]["correct"] += 1

    for topic, data in stats.items():
        if data["total"] > 0:
            data["mastery_pct"] = round((data["correct"] / data["total"]) * 100, 1)

    return stats


def count_chat_topic_queries(chat_topics: list[str]) -> dict[str, int]:
    """Đếm tần suất sinh viên thắc mắc theo từng topic trong khung chat bài học."""
    counts: dict[str, int] = {}
    for item in chat_topics:
        cleaned = item.strip()
        if not cleaned:
            continue
        counts[cleaned] = counts.get(cleaned, 0) + 1
    return counts


def analyze_competency(
    student_id: str,
    quiz_answers: list[dict],
    chat_topics: Optional[list[str]] = None,
    course_id: str = "CS101",
) -> CompetencyReport:
    """
    Thuật toán phân tích năng lực lõi (Competency & Gap Analysis).

    Nguyên tắc phân loại:
      - Strengths (Solid Mastery): Mastery >= 80% VÀ chat_queries < 2
      - Weaknesses (Needs Review): Mastery < 60% HOẶC chat_queries >= 2
    """
    if chat_topics is None:
        chat_topics = []

    topic_stats = compute_topic_mastery(quiz_answers)
    chat_counts = count_chat_topic_queries(chat_topics)

    # Tập hợp danh sách tất cả các topic xuất hiện trong cả Quiz lẫn Chat
    all_topics = set(topic_stats.keys())
    for c_topic in chat_counts.keys():
        all_topics.add(c_topic)

    strengths: list[StrengthItem] = []
    weaknesses: list[WeaknessItem] = []

    for topic in sorted(all_topics):
        stats = topic_stats.get(topic, {"total": 0, "correct": 0, "mastery_pct": 0.0})
        total = stats["total"]
        correct = stats["correct"]
        pct = stats["mastery_pct"]

        # Đếm số lần hỏi trong chat có liên quan đến topic này
        chat_freq = 0
        topic_norm = _strip_accents(topic)
        for c_topic, count in chat_counts.items():
            if _strip_accents(c_topic) in topic_norm or topic_norm in _strip_accents(c_topic):
                chat_freq += count

        # ── Phân loại 1: ĐIỂM MẠNH (Mastery >= 80% và không bị rối băn khoăn nhiều trong chat)
        if pct >= 80.0 and chat_freq < 2:
            strengths.append({
                "topic": topic,
                "mastery_pct": pct,
                "status": "Solid Mastery",
                "evidence": f"Làm đúng {correct}/{total} câu Quiz phần {topic} (đạt {pct}%).",
            })

        # ── Phân loại 2: ĐIỂM YẾU (Mastery < 60% HOẶC hỏi chat >= 2 lần)
        elif pct < 60.0 or chat_freq >= 2:
            evidence_parts = []
            if total > 0:
                evidence_parts.append(f"Làm đúng {correct}/{total} câu Quiz (đạt {pct}%)")
            else:
                evidence_parts.append("Chưa hoàn thành đủ bài quiz đánh giá")

            if chat_freq >= 2:
                evidence_parts.append(f"đã thắc mắc {chat_freq} lần trong khung Chat bài học")

            evidence_str = "; ".join(evidence_parts) + "."
            action_str = get_recommendation_for_topic(topic)

            weaknesses.append({
                "topic": topic,
                "mastery_pct": pct,
                "status": "Needs Review",
                "evidence": evidence_str,
                "recommended_action": action_str,
            })

    return {
        "student_id": student_id,
        "course_id": course_id,
        "competency_summary": {
            "strengths": strengths,
            "weaknesses": weaknesses,
        },
    }
