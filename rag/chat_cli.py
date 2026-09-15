"""
INTERACTIVE TERMINAL CHAT CLI FOR CECS AI LEARNING HUB
Allows testing Grounded Chat directly in your terminal with live prompts!
"""

import sys
import os

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


def main():
    print("=" * 70)
    print("🎓 CECS AI LEARNING HUB — CHAT CLI TRỰC TIẾP")
    print("Môn học: CS101 (Introduction to Programming)")
    print("Gõ 'exit' hoặc 'quit' để thoát.")
    print("=" * 70)

    course_id = "CS101"
    lesson_id = "lec_02"

    while True:
        try:
            user_input = input("\n👤 Sinh viên hỏi: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("👋 Đã thoát phiên chat.")
                break

            response = answer_grounded_chat(
                course_id=course_id,
                lesson_id=lesson_id,
                message=user_input
            )

            print("\n🤖 CECS AI:")
            print(response["answer"])

            if response["citations"]:
                print("\n📌 [Citations]:")
                for cite in response["citations"]:
                    print(f"   • File: {cite['source']} (Trang {cite['page']})")

            print(f"🛡️ [is_insufficient_evidence]: {response['is_insufficient_evidence']}")

        except KeyboardInterrupt:
            print("\n👋 Đã thoát phiên chat.")
            break
        except Exception as e:
            print(f"❌ Lỗi: {e}")


if __name__ == "__main__":
    main()
