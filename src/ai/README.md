# Team 3 (AI & Quality Module) — CECS AI Learning Hub

**Day 2 Standalone Service** | Port: `8001` | Branch: `feature/ngatt-17-ai-quality-day02`  
**AI Engine:** Chuẩn OpenAI-compatible API (Cấu hình linh hoạt qua biến môi trường .env)

---

## 👥 Phân công nội bộ Team 3

* **Thành viên A (Nga - `ngatt-17`):**
  - Phụ trách chính: **`GenQuiz` (Hệ thống tạo bài tập tự động 3 dạng)**.
  - Các file chính:
    - [`quiz_generator.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/quiz_generator.py): Lõi sinh đề từ slide, ngân hàng đề và ghi chú cá nhân; chuẩn hóa JSON đầu ra.
    - [`run_quiz_demo.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/run_quiz_demo.py): Script chạy thử demo độc lập in ra màn hình cực kỳ trực quan.
    - [`sample_lecture_cs101.txt`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/sample_lecture_cs101.txt): Slide bài giảng mẫu CS101 về C/Pointers để chạy thử nghiệm.
    - [`routes/quiz_routes.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/routes/quiz_routes.py): Router cung cấp các API endpoint (bao gồm `POST /api/ai/gen-quiz` theo contract).
    - [`tests/test_genquiz_contract.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/tests/test_genquiz_contract.py): Bộ 3 bài test kiểm chứng JSON đầu ra của 3 dạng câu hỏi.
* **Thành viên B (Tin - `TinNguyenn`):**
  - Phụ trách chính: **`Grounded Chat (RAG)`** & **`Phân tích Năng lực Mạnh/Yếu`**.
  - Các file liên quan:
    - [`chat_rag.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/chat_rag.py): Luồng hỏi đáp bám sát slide có trích dẫn, từ chối khi thiếu chứng cứ ("Tutor, Not Solver").
    - [`retriever.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/retriever.py): Bộ lọc tài liệu đã duyệt (`status='approved'`), chặn tài liệu `draft`.
    - [`routes/chat_routes.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/routes/chat_routes.py): Endpoint hỏi đáp cho sinh viên (`POST /courses/{course_id}/chat`).

---

## 🚀 Hướng dẫn chạy thử nhanh phần GenQuiz (Cho Tin)

Tin chỉ cần mở thư mục `src/ai` và chạy 1 trong các lệnh sau:

### 1. Chạy Demo trực quan toàn bộ 3 luồng GenQuiz:
```bash
# Từ thư mục gốc:
& "src/ai/.venv/Scripts/python.exe" src/ai/run_quiz_demo.py

# Hoặc nếu đang trong src/ai:
python run_quiz_demo.py
```
> Kết quả in ra ngay trên terminal: 1 câu Single Choice (Radio), 1 câu Multiple Choice (Checkbox), 1 câu Short Answer (Điền từ), kèm số trang và trích dẫn bằng chứng từ bài giảng CS101.

### 2. Chạy bộ 3 test kiểm chứng cấu trúc JSON:
```bash
& "src/ai/.venv/Scripts/python.exe" -m pytest src/ai/tests/test_genquiz_contract.py -v
```
*(Kết quả: 3 passed in ~20s).*

### 3. Chạy toàn bộ test suite AI & Quality (8 test case):
```bash
& "src/ai/.venv/Scripts/python.exe" -m pytest src/ai/tests/test_ai_quality.py -v
```
*(Kết quả: 8 passed in ~40s).*

---

## 📋 Chuẩn hóa 3 dạng câu hỏi GenQuiz (JSON Schema)

Theo thỏa thuận API Contract của nhóm, hàm `gen_quiz_standard()` và endpoint `POST /api/ai/gen-quiz` trả về định dạng:

```json
{
  "lesson_id": "cs101-pointers",
  "topic": "Cú pháp cơ bản & Con trỏ",
  "generated_at": "2026-09-15T15:00:00Z",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "topic": "Kiểu dữ liệu cơ bản",
      "question": "Trong ngôn ngữ C trên hệ thống 64-bit hiện đại, kiểu int thường chiếm bao nhiêu bytes?",
      "options": ["1 byte", "4 bytes", "8 bytes", "2 bytes"],
      "correct_answer": 1,
      "explanation": "Kiểu int có kích thước 4 bytes theo chuẩn...",
      "citation": {
        "source_file": "Lecture01_Intro.pdf",
        "page": 1,
        "evidence_snippet": "int: 4 bytes (standard integer type)"
      }
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "topic": "Quản lý bộ nhớ động",
      "question": "Những hàm nào sau đây trong stdlib.h dùng để cấp phát bộ nhớ? (Chọn tất cả đáp án đúng)",
      "options": ["malloc()", "calloc()", "free()", "realloc()"],
      "correct_answer": [0, 1, 3],
      "explanation": "malloc, calloc, realloc cấp phát/đổi kích thước heap. free() là giải phóng.",
      "citation": {
        "source_file": "Lecture02_Pointers.pdf",
        "page": 3,
        "evidence_snippet": "malloc, calloc, realloc allocate memory on the heap"
      }
    },
    {
      "id": "q3",
      "type": "short_answer",
      "topic": "Toán tử con trỏ",
      "question": "Toán tử nào trong C dùng để lấy giá trị tại địa chỉ ô nhớ mà con trỏ đang trỏ tới?",
      "options": [],
      "correct_answer": "*",
      "keywords": ["*", "dereference", "toán tử *", "indirection"],
      "explanation": "Toán tử '*' (dereference/indirection) dùng để truy xuất giá trị...",
      "citation": {
        "source_file": "Lecture02_Pointers.pdf",
        "page": 2,
        "evidence_snippet": "The dereference operator '*' accesses the value stored..."
      }
    }
  ]
}
```

---

## 🔌 Danh sách API Endpoints của AI Service (Port 8001)

| Phương thức | Đường dẫn | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/ai/gen-quiz` | Public / Team | **API Contract cho Team 1 & Team 2** sinh 3 dạng bài tập |
| `POST` | `/quiz/from-material` | Instructor / TA | Giảng viên sinh đề từ học liệu đã duyệt (tạo draft) |
| `POST` | `/quiz/from-bank` | Instructor / TA | Giảng viên sinh đề từ text ngân hàng câu hỏi (tạo draft) |
| `PATCH` | `/quiz/{draft_id}/publish` | Instructor / TA | Duyệt và xuất bản đề (bắt buộc trước khi SV xem) |
| `POST` | `/quiz/from-note` | Student | Sinh viên tự ôn tập từ ghi chú riêng (**không lưu DB**) |
| `POST` | `/courses/{course_id}/chat` | Student / All | Grounded Chat RAG kèm trích dẫn số trang |
| `GET` | `/health` | All | Kiểm tra tình trạng hoạt động của service |

---

## ⚙️ Cấu hình môi trường (.env)
 
Cấu hình mẫu trong `src/ai/.env.example` (file `.env` thực tế được bảo vệ trong `.gitignore`):
```env
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.your-provider.com/v1
LLM_MODEL=your-model-name-here
AI_SERVICE_PORT=8001
```
