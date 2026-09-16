"""
DEMO SCRIPT: COMPETENCY & GAP ANALYSIS (KHỐI 3: PHÂN TÍCH NĂNG LỰC) — DAY 02
Chạy trực tiếp từ terminal:
  python rag/demo_competency.py
"""
import sys
import os
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup import path
current_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from competency_analyzer import analyze_competency


def print_banner(title: str):
    print("\n" + "=" * 80)
    print(f"🎯 {title.upper()}")
    print("=" * 80)


def run_demo():
    print_banner("DEMO PHÂN TÍCH NĂNG LỰC SINH VIÊN QUA BÀI QUIZ & CHAT")

    # Dữ liệu giả lập kết quả làm bài của sinh viên:
    # - Cú pháp & Kiểu dữ liệu: làm đúng 3/3 câu (100%) -> ĐIỂM MẠNH
    # - Vòng lặp: làm đúng 2/3 câu (66.7%) -> MỨC TRUNG BÌNH
    # - Con trỏ & Quản lý bộ nhớ: làm đúng 1/4 câu (25%) + hỏi chat 3 lần -> ĐIỂM YẾU
    quiz_answers = [
        {"question_id": "q1", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
        {"question_id": "q2", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},
        {"question_id": "q3", "topic": "Cú pháp & Kiểu dữ liệu cơ bản", "is_correct": True},

        {"question_id": "q4", "topic": "Vòng lặp & Điều khiển luồng", "is_correct": True},
        {"question_id": "q5", "topic": "Vòng lặp & Điều khiển luồng", "is_correct": False},
        {"question_id": "q6", "topic": "Vòng lặp & Điều khiển luồng", "is_correct": True},

        {"question_id": "q7", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": False},
        {"question_id": "q8", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": False},
        {"question_id": "q9", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": False},
        {"question_id": "q10", "topic": "Con trỏ & Quản lý bộ nhớ", "is_correct": True},
    ]

    # Lịch sử thắc mắc trong chat bài học chung
    chat_topics = [
        "Con trỏ",
        "Con trỏ",
        "Memory leak khi dùng con trỏ",
    ]

    print("📊 DỮ LIỆU ĐẦU VÀO CỦA SINH VIÊN (std_2026):")
    print(f"  • Tổng số câu quiz đã làm: {len(quiz_answers)} câu")
    print(f"  • Lịch sử thắc mắc tại Lesson Chat: {chat_topics}")

    print("\n⏳ Đang phân tích mức độ thành thạo (% Mastery) & tìm lỗ hổng kiến thức...")

    report = analyze_competency(
        student_id="std_2026",
        quiz_answers=quiz_answers,
        chat_topics=chat_topics,
        course_id="CS101",
    )

    summary = report["competency_summary"]

    print_banner("KẾT QUẢ PHÂN TÍCH NĂNG LỰC (COMPETENCY SUMMARY)")

    # 1. Hiển thị Điểm mạnh
    print("\n🌟 1. ĐIỂM MẠNH (STRENGTHS — SOLID MASTERY >= 80%):")
    if summary["strengths"]:
        for idx, s in enumerate(summary["strengths"], 1):
            print(f"   [{idx}] Chủ đề: {s['topic']}")
            print(f"       • Độ thành thạo: {s['mastery_pct']}% — Trạng thái: {s['status']}")
            print(f"       • Minh chứng: {s['evidence']}")
    else:
        print("   (Chưa có chủ đề nào đạt ngưỡng >= 80%)")

    # 2. Hiển thị Điểm yếu & Lỗ hổng
    print("\n⚠️ 2. ĐIỂM YẾU CẦN ÔN TẬP (WEAKNESSES — NEEDS REVIEW):")
    if summary["weaknesses"]:
        for idx, w in enumerate(summary["weaknesses"], 1):
            print(f"   [{idx}] Chủ đề: {w['topic']}")
            print(f"       • Độ thành thạo: {w['mastery_pct']}% — Trạng thái: {w['status']}")
            print(f"       • Bằng chứng phát hiện: {w['evidence']}")
            print(f"       👉 HÀNH ĐỘNG KHUYẾN NGHỊ: {w['recommended_action']}")
    else:
        print("   (Không có lỗ hổng kiến thức nghiêm trọng)")

    print_banner("ĐỊNH DẠNG JSON XUẤT RA API ĐỂ FRONTEND TEAM 1 VẼ BIỂU ĐỒ")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    run_demo()
