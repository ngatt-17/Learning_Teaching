# CECS AI Learning Hub — Agent Rules & Guidelines

## ⚠️ Quy tắc Git BẮT BUỘC (Strict Git Policy)

1. **KHÔNG BAO GIỜ tự ý `git commit`:**
   - Trừ khi người dùng nói rõ: "commit đi", "hãy commit", hoặc đưa message cụ thể.
   - Luôn cho người dùng xem `git status` / `git diff` trước khi commit.

2. **KHÔNG BAO GIỜ tự ý `git push`:**
   - Tuyệt đối không tự động chạy `git push` trong bất kỳ tình huống nào.
   - **Quy trình trước khi push:**
     1. Chạy `git status` và `git log` để tóm tắt chính xác những commit sắp được push.
     2. Trình bày danh sách thay đổi cho người dùng.
     3. **CHỜ người dùng xác nhận rõ ràng** (ví dụ: "push đi", "đẩy lên đi") mới được chạy lệnh `git push`.
   - Nếu người dùng chưa nói push, DỪNG LẠI và chỉ thông báo trạng thái local.

3. **Bảo vệ nhánh làm việc:**
   - Chỉ thao tác trên nhánh được chỉ định (nhánh cá nhân).
   - Không tự ý rebase / force push nếu chưa có sự đồng ý của người dùng.
