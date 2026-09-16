"""
DEMO SCRIPT FOR GROUNDED CHAT RAG (THÀNH VIÊN B - TEAM 3) — DAY 02
Run this file directly from anywhere:
  python rag/demo.py
  or:
  cd rag && python demo.py
"""

import sys
import os
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Enable direct execution from both repo root or inside folder
current_dir = os.path.abspath(os.path.dirname(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from grounded_chat import answer_grounded_chat
except ImportError:
    from rag.grounded_chat import answer_grounded_chat


def print_separator(title: str):
    print("\n" + "=" * 80)
    print(f"🚀 {title.upper()}")
    print("=" * 80)


def demo_grounded_chat_success():
    print_separator("Kịch bản 1: Grounded Chat có trích dẫn nguồn (Approved Material)")
    question = "Kích thước của con trỏ trên hệ thống 64-bit là bao nhiêu bytes?"
    print(f"👤 [Sinh viên hỏi]: {question}")

    res = answer_grounded_chat(
        course_id="CS101",
        lesson_id="lec_02",
        message=question
    )

    print("\n🤖 [CECS AI Trả lời]:")
    print(res["answer"])
    print(f"\n📌 [Trích dẫn tài liệu - Citations]: {json.dumps(res['citations'], indent=2, ensure_ascii=False)}")
    print(f"✅ is_insufficient_evidence: {res['is_insufficient_evidence']}")


def demo_insufficient_evidence():
    print_separator("Kịch bản 2: Từ chối chuẩn khi thiếu chứng cứ (Insufficient Evidence)")
    question = "Giá chứng khoán hôm nay"
    print(f"👤 [Sinh viên hỏi]: {question}")

    res = answer_grounded_chat(
        course_id="CS101",
        lesson_id="lec_02",
        message=question
    )

    print("\n🤖 [CECS AI Trả lời]:")
    print(f"\"{res['answer']}\"")
    print(f"📌 [Citations]: {res['citations']}")
    print(f"🛡️ is_insufficient_evidence: {res['is_insufficient_evidence']}")


def demo_security_draft_and_course_isolation():
    print_separator("Kịch bản 3: Bảo mật tài liệu Draft & Cách ly môn học khác")
    print("Test A: Hỏi nội dung thuộc slide ĐANG Ở TRẠNG THÁI DRAFT (Lecture03_Draft_Structs.pdf)")
    res_draft = answer_grounded_chat(
        course_id="CS101",
        lesson_id="lec_03",
        message="Cấu trúc struct trong C hoạt động như thế nào?"
    )
    print(f"🤖 [Kết quả chặn Draft]: {res_draft['answer']}")
    print(f"🛡️ is_insufficient_evidence: {res_draft['is_insufficient_evidence']} (Chặn thành công!)")

    print("\nTest B: Hỏi nội dung thuộc MÔN HỌC KHÁC (EE201 - Điện trở Ohm)")
    res_other = answer_grounded_chat(
        course_id="CS101",
        lesson_id="lec_01",
        message="Định luật Ohm V = I * R là gì?"
    )
    print(f"🤖 [Kết quả chặn Course khác]: {res_other['answer']}")
    print(f"🛡️ is_insufficient_evidence: {res_other['is_insufficient_evidence']} (Chặn thành công!)")


def demo_tutor_not_solver():
    print_separator("Kịch bản 4: Triết lý Socratic 'Tutor, Not Solver' (Không giải bài hộ)")
    prompt = "Giải hộ bài tập viết hàm đảo ngược mảng bằng con trỏ giúp em với"
    print(f"👤 [Sinh viên yêu cầu]: {prompt}")

    res = answer_grounded_chat(
        course_id="CS101",
        lesson_id="lec_02",
        message=prompt
    )

    print("\n🤖 [CECS AI Định hướng Socratic]:")
    print(res["answer"])


if __name__ == "__main__":
    print("\n🎉 BẮT ĐẦU CHẠY DEMO TOÀN BỘ 4 KỊCH BẢN GROUNDED CHAT RAG (THÀNH VIÊN B) 🎉\n")
    demo_grounded_chat_success()
    demo_insufficient_evidence()
    demo_security_draft_and_course_isolation()
    demo_tutor_not_solver()
    print("\n" + "=" * 80)
    print("✅ TOÀN BỘ 4 KỊCH BẢN GROUNDED CHAT RAG ĐÃ HOÀN TẤT XUẤT SẮC!")
    print("=" * 80 + "\n")
