# KẾ HOẠCH HÀNH ĐỘNG TEAM 3 (AI & QUALITY) — DAY 02
**Dự án:** CECS AI Learning Hub — VinUniversity  
**Cặp phụ trách (Pair 3):** Team 3 (2 thành viên)  
**Mục tiêu Day 02:** Xây dựng lõi AI chạy được, kết nối API và Demo kịch bản trọng tâm (Grounded Chat & genQuiz 3 dạng) lúc 15:00.

---

## 1. Bối cảnh & Phân công trong nhóm lớn

* **Team 1 (UI/UX):** Xây dựng giao diện Frontend (Màn hình bài học 3 cột, giao diện làm Quiz, khung chat AI).
* **Team 2 (Backend/DB):** Cấu trúc Database, xác thực OTP, phân quyền khóa học và bảo mật Row-Level Security (RLS).
* **Team 3 (AI & Quality):**
  1. **`GenQuiz` (Sinh đề tự động):** Tự động tạo câu hỏi trắc nghiệm/tự luận từ Slide bài học và ngân hàng đề của GV theo cấu trúc chuẩn. *(Ưu tiên hàng đầu)*
  2. **`Grounded Chat (RAG)`:** Hỏi đáp bám sát nội dung slide đã duyệt, kèm trích dẫn số trang, từ chối khi thiếu dữ liệu và chặn tài liệu `draft`.
  3. **`Điểm mạnh / Điểm yếu (Strength & Weakness)`:** Đánh giá năng lực sinh viên từ Quiz và Chat phục vụ biểu đồ cá nhân và báo cáo lỗ hổng chung cho Giảng viên.

---

## 2. Chi tiết 3 Bài toán Lõi & Chuẩn hóa Kỹ thuật

### 📌 Bài toán 1: GenQuiz (Tạo bài tập tự động — Hỗ trợ đủ 3 dạng câu hỏi)
* **Phân công phụ trách:** **Thành viên A**
* **Mục tiêu:** Giảng viên tải tài liệu/slide lên $\rightarrow$ AI đọc hiểu và sinh bộ đề bài tập nháp theo đúng chuẩn 3 dạng để Giảng viên duyệt.
* **Quy chuẩn 3 dạng câu hỏi:**
  1. `single_choice`: Chọn 1 đáp án đúng (Radio).
  2. `multiple_choice`: Chọn nhiều đáp án đúng (Checkbox).
  3. `short_answer`: Trả lời ngắn / điền từ (kèm từ khóa chấm điểm và đáp án mẫu).

#### Định dạng JSON trả về chuẩn hóa (Structured JSON Output):
```json
{
  "lesson_id": "c-programming-intro",
  "topic": "Cú pháp cơ bản & Con trỏ",
  "generated_at": "2026-09-15T15:00:00Z",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "topic": "Kiểu dữ liệu cơ bản",
      "question": "Trong ngôn ngữ C trên hệ thống 64-bit hiện đại, kiểu dữ liệu nào dưới đây thường có kích thước 4 bytes?",
      "options": ["char", "int", "double", "void*"],
      "correct_answer": 1,
      "explanation": "Kiểu int có kích thước chuẩn 4 bytes. Kiểu char là 1 byte, double là 8 bytes và con trỏ là 8 bytes trên hệ 64-bit.",
      "citation": {
        "source_file": "Lecture01_Intro.pdf",
        "page": 5,
        "evidence_snippet": "Slide 5: Primitive Data Types - int (4 bytes)"
      }
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "topic": "Quản lý bộ nhớ động",
      "question": "Những hàm nào sau đây trong thư viện stdlib.h được sử dụng để cấp phát hoặc tái cấp phát bộ nhớ động? (Chọn tất cả các đáp án đúng)",
      "options": ["malloc()", "calloc()", "free()", "realloc()"],
      "correct_answer": [0, 1, 3],
      "explanation": "malloc, calloc, realloc dùng để cấp phát/thay đổi kích thước bộ nhớ heap. Hàm free() dùng để giải phóng bộ nhớ.",
      "citation": {
        "source_file": "Lecture02_Pointers.pdf",
        "page": 18,
        "evidence_snippet": "Slide 18: Dynamic Memory Allocation Functions"
      }
    },
    {
      "id": "q3",
      "type": "short_answer",
      "topic": "Khái niệm con trỏ",
      "question": "Toán tử nào trong ngôn ngữ C được sử dụng để lấy giá trị tại địa chỉ ô nhớ mà con trỏ đang trỏ tới (dereference operator)?",
      "correct_answer": "*",
      "keywords": ["*", "toán tử *", "dereference", "toán tử giải con trỏ"],
      "explanation": "Toán tử '*' (indirection/dereference) dùng để truy xuất giá trị tại địa chỉ con trỏ. Toán tử '&' dùng để lấy địa chỉ.",
      "citation": {
        "source_file": "Lecture02_Pointers.pdf",
        "page": 12,
        "evidence_snippet": "Slide 12: Pointer Dereferencing with *"
      }
    }
  ]
}
```

---

### 📌 Bài toán 2: Grounded Chat (RAG có trích dẫn & Rào chắn sư phạm)
* **Phân công phụ trách:** **Thành viên B**
* **Mục tiêu:** Sinh viên hỏi về bài học $\rightarrow$ AI trả lời chính xác, trích dẫn số trang, từ chối khi không có tài liệu và giữ vững nguyên tắc Socratic ("Tutor, Not Solver").
* **3 Rào chắn bắt buộc theo yêu cầu Day 02:**
  1. **Lọc trạng thái tài liệu (Bắt buộc):** Chỉ tìm kiếm trong các tài liệu có `course_id` tương ứng VÀ `status = 'approved'`. Loại trừ 100% tài liệu `draft` (chưa duyệt) hoặc tài liệu của môn học khác.
  2. **Trích dẫn minh bạch (Citation):** Mọi câu trả lời bắt buộc phải đính kèm `citations: [{"source": "...", "page": X}]`.
  3. **Từ chối chuẩn khi thiếu chứng cứ:** Nếu câu hỏi không nằm trong slide bài học, AI trả lời câu chuẩn:  
     *"The approved course materials do not have enough evidence to answer this question."*
  4. **Tutor, Not Solver:** Nếu sinh viên yêu cầu "giải hộ bài tập", AI từ chối đưa lời giải trực tiếp, chỉ đưa gợi ý tư duy từng bước.

---

### 📌 Bài toán 3: Phân tích Năng lực Mạnh / Yếu (Competency & Gap Analysis)
* **Phối hợp thực hiện:** **Thành viên A + Thành viên B**
* **Mục tiêu:** Đánh giá độ nắm vững kiến thức theo từng chủ đề (Topic) dựa trên kết quả Quiz và các câu hỏi trong Chat.
* **Nguyên tắc bảo mật "Private means private" (Bất di bất dịch):**
  - Dữ liệu chat **CHỈ LẤY TỪ Lesson Chat** (khung hỏi đáp bài học), **tuyệt đối KHÔNG đọc từ Private Study Space** (ghi chú cá nhân của sinh viên).
  - Giảng viên **chỉ nhận báo cáo tổng hợp lỗ hổng của cả lớp (Aggregated Misconceptions)**, không soi vào dữ liệu riêng của từng sinh viên.

#### Định dạng kết quả xuất ra cho Sinh viên:
```json
{
  "student_id": "std_123",
  "course_id": "CS101",
  "competency_summary": {
    "strengths": [
      {
        "topic": "Cú pháp & Kiểu dữ liệu cơ bản",
        "mastery_pct": 90,
        "status": "Solid Mastery",
        "evidence": "Làm đúng 5/5 câu Quiz phần Data Types."
      }
    ],
    "weaknesses": [
      {
        "topic": "Con trỏ & Quản lý bộ nhớ",
        "mastery_pct": 40,
        "status": "Needs Review",
        "evidence": "Làm sai câu hỏi về dereference và đã hỏi Chat 3 lần về lỗi Segmentation Fault.",
        "recommended_action": "Đọc lại Slide 12–18 trong Lecture02_Pointers.pdf"
      }
    ]
  }
}
```

---

## 3. Hợp đồng Giao tiếp API với Team 2 & Team 1 (API Contracts)

Để Team 2 cấu hình route và Team 1 gọi API mượt mà, Team 3 quy định 3 Endpoint độc lập:

1. **`POST /api/ai/gen-quiz` (Dành cho Giảng viên):**
   * **Request:** `{ "lesson_content": "văn bản trích từ slide...", "topic": "Con trỏ", "num_questions": 3, "types": ["single_choice", "multiple_choice", "short_answer"] }`
   * **Response:** JSON danh sách câu hỏi theo cấu trúc ở Bài toán 1.
2. **`POST /api/ai/chat` (Dành cho Sinh viên):**
   * **Request:** `{ "course_id": "CS101", "lesson_id": "lec_02", "message": "Con trỏ là gì?" }`
   * **Response:** `{ "answer": "...", "citations": [{"source": "Lecture02.pdf", "page": 12}], "is_insufficient_evidence": false }`
3. **`POST /api/ai/analyze-competency` (Hệ thống chạy tự động):**
   * **Request:** `{ "student_id": "std_123", "quiz_answers": [...], "chat_topics": ["Pointers", "Memory"] }`
   * **Response:** JSON điểm mạnh/yếu theo cấu trúc ở Bài toán 3.

---

## 4. Phân công Nội bộ Team 3 Trước 15:00

| Thành viên | Nhiệm vụ chính trước 15:00 | Bàn giao cụ thể |
|---|---|---|
| **Thành viên A** | • Xây dựng prompt và logic cho **`GenQuiz 3 dạng`** (`single_choice`, `multiple_choice`, `short_answer`).<br>• Chuẩn bị 1 file slide/text bài giảng mẫu (CS101) để chạy demo.<br>• Soạn sẵn 3 câu test kiểm chứng đầu ra JSON. | File script Python sinh Quiz độc lập trả ra JSON hợp lệ 100%. |
| **Thành viên B** | • Xây dựng prompt **`Chat RAG`** có trích dẫn số trang và câu từ chối chuẩn khi thiếu dữ liệu.<br>• Xây dựng hàm **`Phân tích Mạnh/Yếu`** tính % Mastery theo topic từ kết quả quiz và tag chat. | File script Python chạy thử hỏi đáp có trích dẫn và hàm tính điểm mạnh/yếu. |

---

## 5. Kịch bản Demo Cuộc Họp 15:00 (Minimum Viable Demo)

1. **Demo 1 (Giảng viên tạo bài tập):** Nhập 1 đoạn văn bản Slide Bài giảng C $\rightarrow$ Bấm sinh Quiz $\rightarrow$ AI trả ra ngay 3 câu hỏi (1 Single Choice, 1 Multi Choice, 1 Short Answer) có giải thích và số trang rõ ràng.
2. **Demo 2 (Sinh viên hỏi bài):** Hỏi 1 câu trong slide $\rightarrow$ AI trả lời có trích dẫn `[Page 12]`. Hỏi 1 câu ngoài lề $\rightarrow$ AI từ chối: *"The approved course materials do not have enough evidence..."*.
3. **Demo 3 (Phân tích năng lực):** Nhập kết quả làm bài tập có câu đúng câu sai $\rightarrow$ Xuất ngay bảng Điểm mạnh / Điểm yếu kèm gợi ý slide cần xem lại.
4. **Chốt với Team 1 & Team 2:** Gửi bản API Contract JSON này để hai team triển khai khớp chuẩn 100% trong buổi chiều.
