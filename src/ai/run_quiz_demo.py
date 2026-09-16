"""
run_quiz_demo.py — Script chạy thử nhanh toàn bộ tính năng GenQuiz (AI Assessment Engine)

Kịch bản Demo chuẩn theo draft/team-3-ai-quality-day02-plan.md:
  1. Giảng viên sinh Quiz từ bài giảng với đủ 3 dạng câu hỏi chuẩn:
     - single_choice: Chọn 1 đáp án đúng (Radio)
     - multiple_choice: Chọn nhiều đáp án đúng (Checkbox)
     - short_answer: Trả lời ngắn / điền từ
     Mỗi câu đều có citation: số trang + bằng chứng trích dẫn.
  2. Giảng viên duyệt & Publish draft -> chuyển sang 'published'.
  3. Sinh viên tự luyện tập từ ghi chú cá nhân (Private Study Space - Không lưu DB).

Cách chạy từ terminal:
    python src/ai/run_quiz_demo.py
"""
import sys
import os

# Đảm bảo import được các module trong src/ai
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Đảm bảo in tiếng Việt & emoji chuẩn trên console Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import quiz_generator as qg
from config import DEFAULT_MODEL


def main():
    print("=" * 75)
    print("🚀 DEMO CHẠY THỬ HỆ THỐNG GENQUIZ (AI & Quality Module)")
    print(f"🤖 Đang sử dụng AI Engine: {DEFAULT_MODEL}")
    print("=" * 75)

    # -------------------------------------------------------------
    # 1. GIẢNG VIÊN SINH QUIZ TỪ SLIDE / TÀI LIỆU ĐÃ DUYỆT (ĐỦ 3 DẠNG)
    # -------------------------------------------------------------
    print("\n[1] 👩‍🏫 GIẢNG VIÊN: Sinh Quiz từ tài liệu đã duyệt (mat-intro-001)")
    print("    Yêu cầu: Sinh đủ 3 dạng chuẩn (single_choice, multiple_choice, short_answer)")
    print(f"    Đang phân tích bài giảng và tạo bộ câu hỏi khảo thí...")

    draft = qg.gen_from_material(
        material_id="mat-intro-001",
        topic="Python Variables and Data Structures",
        difficulty="medium",
        question_type="mixed",
        count=3,
    )

    print(f"\n✅ Tạo Draft thành công!")
    print(f"   • Draft ID: {draft['draft_id']}")
    print(f"   • Trạng thái ban đầu: '{draft['status']}' (Chưa publish - SV chưa thấy)")
    print(f"   • Số câu hỏi sinh ra: {len(draft['questions'])}\n")

    for idx, q in enumerate(draft["questions"], 1):
        q_type = q.get("type", "single_choice")
        print(f"  ─── Câu {idx} [{q_type.upper()}] ───")
        print(f"  ❓ Câu hỏi: {q.get('question')}")

        if q_type in ("single_choice", "multiple_choice", "mcq"):
            options = q.get("options", [])
            for opt_idx, opt in enumerate(options):
                print(f"     [{opt_idx}] {opt}")
            correct = q.get("correct_answer")
            print(f"  👉 Đáp án đúng: {correct} ({q.get('answer')})")
        else:
            print(f"  👉 Đáp án mẫu: {q.get('correct_answer')}")
            if q.get("keywords"):
                print(f"  🔑 Từ khóa chấm điểm: {', '.join(q['keywords'])}")

        print(f"  💡 Lời giải thích: {q.get('explanation')}")
        citation = q.get("citation", {})
        if citation:
            print(f"  📄 Trích dẫn: Trang {citation.get('page')} ({citation.get('source_file')})")
            print(f"     Bằng chứng: \"{citation.get('evidence_snippet')}\"")
        print()

    # -------------------------------------------------------------
    # 2. GIẢNG VIÊN DUYỆT VÀ PUBLISH QUIZ DRAFT
    # -------------------------------------------------------------
    print("-" * 75)
    print(f"[2] 🔒 GIẢNG VIÊN: Review & Duyệt Publish Draft ({draft['draft_id']})")
    published = qg.publish_draft(draft["draft_id"])
    print(f"✅ Trạng thái sau duyệt: '{published['status']}' (Sinh viên đã có thể làm bài!)")

    # -------------------------------------------------------------
    # 3. SINH VIÊN TỰ SINH QUIZ TỪ GHI CHÚ RIÊNG (PRIVATE)
    # -------------------------------------------------------------
    print("-" * 75)
    print("\n[3] 👨‍🎓 SINH VIÊN: Tự tạo bài luyện tập từ ghi chú riêng (Private Study Space)")
    student_note = (
        "Recursion is a method where a function calls itself to solve smaller subproblems. "
        "Every recursive function must have a base case to stop recursion, otherwise it causes "
        "a stack overflow error."
    )
    print(f"Ghi chú của SV: \"{student_note}\"")
    print("Đang tạo câu hỏi luyện tập từ ghi chú cá nhân...")

    student_questions = qg.gen_from_note(student_note, count=1, types=["single_choice"])
    if student_questions:
        sq = student_questions[0]
        print(f"\n✅ Câu hỏi luyện tập cá nhân:")
        print(f"  ❓ Câu hỏi: {sq.get('question')}")
        for opt in sq.get("options", []):
            print(f"    - {opt}")
        print(f"  👉 Đáp án: {sq.get('answer')}")
        print(f"  💡 Giải thích: {sq.get('explanation')}")
        print("  🛡️ Quyền riêng tư: KHÔNG lưu vào Database hay Draft Store!")

    print("\n" + "=" * 75)
    print("🎉 TẤT CẢ CÁC LUỒNG GENQUIZ ĐÃ CHẠY THÀNH CÔNG VÀ CHUẨN XÁC!")
    print("=" * 75)


if __name__ == "__main__":
    main()
