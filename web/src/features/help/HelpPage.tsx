import { Bot, HelpCircle, Lock, MessageSquare, ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    icon: <Lock size={18} className="text-[#C8232C]" />,
    title: 'Ghi chú riêng là riêng tư',
    body:
      'Chỉ chủ ghi chú đọc được. Giảng viên, trợ giảng, CECS admin và sinh viên khác không truy cập được qua giao diện, API, báo cáo hay dashboard. Ghi chú không được dùng cho Trợ giảng AI của lớp và không nằm trong nhật ký thông thường. Quyền truy cập của đội vận hành hạ tầng (máy chủ, sao lưu) được mô tả riêng trong tài liệu vận hành.',
  },
  {
    icon: <Bot size={18} className="text-[#1E3A6E]" />,
    title: 'Trợ giảng AI trả lời thế nào',
    body:
      'Trợ giảng chỉ dùng tài liệu giảng viên đã duyệt của khóa học bạn được phân công, và mọi câu trả lời kèm trích dẫn trang. Khi tài liệu không đủ thông tin, trợ giảng nói rõ thay vì đoán. Khi LLM chưa được bật, câu trả lời được ghép từ chính các câu trong tài liệu (nhãn "Chế độ trích dẫn").',
  },
  {
    icon: <HelpCircle size={18} className="text-[#1E3A6E]" />,
    title: 'Quiz và Trợ lý Socratic',
    body:
      'Trong lúc làm bài, Trợ lý Socratic chỉ gợi ý hướng suy nghĩ và trang tài liệu liên quan — nó không được nạp đáp án. Bài được chấm trên máy chủ; chỉ lần làm đầu tiên được cộng điểm. Sau khi nộp, bấm "HỎI AI" cạnh từng câu để xem giải thích chi tiết.',
  },
  {
    icon: <MessageSquare size={18} className="text-emerald-700" />,
    title: 'Góp ý',
    body:
      'Tab Feedback trong mỗi khóa học gửi góp ý ẩn danh tới CECS admin. Đây là kênh riêng: nội dung góp ý không kèm danh tính và không liên quan tới ghi chú cá nhân.',
  },
  {
    icon: <ShieldCheck size={18} className="text-emerald-700" />,
    title: 'Giảng viên: duyệt trước khi phát hành',
    body:
      'Tài liệu tải lên và quiz do AI soạn luôn ở trạng thái nháp. Sinh viên và Trợ giảng AI chỉ thấy nội dung sau khi giảng viên duyệt/phát hành; có thể gỡ bất cứ lúc nào.',
  },
];

export function HelpPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto overflow-y-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">Hướng dẫn & quyền riêng tư</h1>
      {SECTIONS.map((s) => (
        <section key={s.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">{s.icon} {s.title}</h2>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed">{s.body}</p>
        </section>
      ))}
      <p className="text-xs text-slate-500">
        Hỗ trợ pilot: liên hệ đầu mối hỗ trợ CECS được thông báo trong buổi giới thiệu khóa học.
      </p>
    </main>
  );
}
