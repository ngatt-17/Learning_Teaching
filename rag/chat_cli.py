"""
INTERACTIVE TERMINAL CHAT CLI FOR CECS AI LEARNING HUB
Cho phép test trực tiếp Grounded Chat RAG gửi prompt thật đến LLM!
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
    from chat_rag import answer_question
    from config import get_configured_api_key, get_configured_base_url, get_configured_model
    from grounded_chat import is_direct_solver_request
except ImportError:
    from rag.chat_rag import answer_question
    from rag.config import get_configured_api_key, get_configured_base_url, get_configured_model
    from rag.grounded_chat import is_direct_solver_request


def main():
    api_key = get_configured_api_key()
    base_url = get_configured_base_url()
    model = get_configured_model()

    masked_key = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) > 10 else ("(Chưa cấu hình)" if not api_key else "******")

    print("=" * 70)
    print("🎓 CECS AI LEARNING HUB — REAL LLM CHAT RAG CLI")
    print(f"📡 LLM Model : {model}")
    print(f"🔗 Endpoint  : {base_url}")
    print(f"🔑 API Key   : {masked_key}")
    print("Môn học     : course-a (CS101 - Introduction to Programming)")
    print("Gõ 'exit' hoặc 'quit' để thoát.")
    print("=" * 70)

    if not api_key:
        print("\n⚠️  CHÚ Ý: Bạn chưa điền API Key trong file 'rag/.env'.")
        print("   Hãy mở file 'rag/.env' và điền OPENAI_API_KEY, GEMINI_API_KEY hoặc XKIRO_API_KEY.")
        print("   (Hệ thống vẫn sẽ chạy thử nghiệm truy xuất và báo lỗi nếu gọi LLM).\n")

    course_id = "course-a"

    while True:
        try:
            user_input = input("\n👤 Sinh viên hỏi: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("👋 Đã thoát phiên chat.")
                break

            # Kiểm tra Socratic tutor guardrail trước
            if is_direct_solver_request(user_input):
                print("\n🤖 CECS AI (Socratic Tutor Guardrail):")
                print("Là trợ lý học tập CECS, mình không thể giải hộ bài tập hoặc viết sẵn mã nguồn cho bạn.")
                print("💡 Hướng dẫn tư duy: Hãy phân tích bài toán, xác định kiểu dữ liệu và cấu trúc điều khiển cần dùng nhé!")
                print("\n🛡️ [evidence_level]: socratic_guardrail (Không gọi LLM để chống giải hộ bài)")
                continue

            print("\n⏳ Đang truy xuất tài liệu và gửi prompt đến LLM...")
            response = answer_question(
                question=user_input,
                course_id=course_id
            )

            print("\n🤖 CECS AI:")
            print(response["answer"])

            if response.get("citations"):
                print("\n📌 [Citations / Tài liệu trích dẫn]:")
                for cite in response["citations"]:
                    print(f"   • {cite['title']} — Trang {cite['page']}")
                    print(f"     \"{cite['snippet']}\"")

            print(f"\n🛡️ [evidence_level]: {response.get('evidence_level')}")

        except KeyboardInterrupt:
            print("\n👋 Đã thoát phiên chat.")
            break
        except Exception as e:
            print(f"❌ Lỗi: {e}")


if __name__ == "__main__":
    main()

