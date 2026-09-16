import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  Users,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Download,
  Send,
  X,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface ReportViewProps {
  courseCode: string;
  courseName: string;
  chapterTitle: string;
  quizTitle?: string;
  onBack: () => void;
}

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  submitTime: string;
  score: number;
  timeSpent: string;
  status: 'Passed' | 'NeedsHelp' | 'Pending';
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  answerSheet: {
    qId: number;
    qText: string;
    studentChoice: string;
    correctChoice: string;
    isCorrect: boolean;
  }[];
}

export const ReportView: React.FC<ReportViewProps> = ({
  courseCode,
  chapterTitle,
  quizTitle,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'All' | 'High' | 'NeedsHelp'>('All');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);

  const questionsAnalysis = [
    { id: 1, text: 'Định nghĩa nào chuẩn xác nhất về Tác tử (Agent) trong AI?', correctRate: 96, bloom: 'Nhận biết', pageCitation: 'Slide 3' },
    { id: 2, text: 'Bốn thành phần của khung cấu trúc PEAS gồm những gì?', correctRate: 92, bloom: 'Nhận biết', pageCitation: 'Slide 5' },
    { id: 3, text: 'Môi trường chơi cờ vua được phân loại là môi trường gì?', correctRate: 88, bloom: 'Thông hiểu', pageCitation: 'Slide 6' },
    {
      id: 4,
      text: 'Sự khác biệt cốt lõi giữa Simple Reflex Agent và Goal-based Agent?',
      correctRate: 42,
      bloom: 'Phân tích',
      pageCitation: 'Slide 12 (AI(1).pdf)',
      isWarning: true,
      misconceptionNote: '42% sinh viên nhầm lẫn giữa điều kiện kích hoạt phản xạ và trạng thái đánh giá mục tiêu.',
    },
    { id: 5, text: 'Hàm tác tử f: P* -> A biểu diễn mối quan hệ toán học nào?', correctRate: 85, bloom: 'Thông hiểu', pageCitation: 'Slide 4' },
    { id: 6, text: 'Thước đo hiệu suất (Performance Measure) cần được xác định bởi ai?', correctRate: 78, bloom: 'Vận dụng', pageCitation: 'Slide 5' },
    { id: 7, text: 'Tác tử học tập (Learning Agent) gồm những thành phần cơ bản nào?', correctRate: 89, bloom: 'Nhận biết', pageCitation: 'Slide 9' },
    { id: 8, text: 'Trong môi trường không quan sát được một phần (Partially Observable), tác tử cần gì?', correctRate: 74, bloom: 'Vận dụng', pageCitation: 'Slide 7' },
    { id: 9, text: 'Ưu điểm chính của Utility-based Agent so với Goal-based Agent?', correctRate: 81, bloom: 'Phân tích', pageCitation: 'Slide 8' },
    { id: 10, text: 'Khái niệm Rationality (Tính hợp lý) khác với Omniscience (Toàn tri) ở điểm nào?', correctRate: 94, bloom: 'Thông hiểu', pageCitation: 'Slide 3' },
  ];

  const studentSubmissions: StudentDetail[] = [
    {
      id: '22010045',
      name: 'Nguyễn Văn An',
      email: 'an.nv@vinuni.edu.vn',
      submitTime: '15/09 14:20',
      score: 9.0,
      timeSpent: '12m 45s',
      status: 'Passed',
      strengths: [
        'Nắm vững bản chất Tác tử hợp lý & mô hình toán f: P* → A',
        'Xác định chính xác khung PEAS cho xe tự hành',
        'Phân loại đúng các loại môi trường tác vụ phức tạp',
      ],
      weaknesses: [
        'Nhầm lẫn nhẹ ở Câu 6 về chủ thể xác định Performance Measure (chọn sai giữa nhà thiết kế bên ngoài và nhận thức bên trong tác tử)',
      ],
      recommendation: 'Sinh viên nắm kiến thức rất chắc, có thể giao các bài toán mô phỏng lập trình agent nâng cao.',
      answerSheet: [
        { qId: 1, qText: 'Định nghĩa Tác tử (Agent)', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 2, qText: 'Thành phần cấu trúc PEAS', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 3, qText: 'Phân loại môi trường cờ vua', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 4, qText: 'Simple Reflex vs Goal-based', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 5, qText: 'Hàm tác tử f: P* -> A', studentChoice: 'D', correctChoice: 'D', isCorrect: true },
        { qId: 6, qText: 'Xác định Performance Measure', studentChoice: 'A', correctChoice: 'C', isCorrect: false },
        { qId: 7, qText: 'Thành phần Learning Agent', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 8, qText: 'Môi trường Partially Observable', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 9, qText: 'Utility-based Agent', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 10, qText: 'Rationality vs Omniscience', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
      ],
    },
    {
      id: '22010182',
      name: 'Trần Thị Mai',
      email: 'mai.tt@vinuni.edu.vn',
      submitTime: '15/09 15:10',
      score: 8.5,
      timeSpent: '14m 10s',
      status: 'Passed',
      strengths: [
        'Hiểu rất rõ khung PEAS và phân biệt được môi trường Discrete vs Continuous',
        'Trả lời đúng câu hỏi suy luận về Utility Agent',
      ],
      weaknesses: [
        'Sai Câu 4: Chưa phân biệt được việc duy trì trạng thái mục tiêu (Goal) với phản xạ điều kiện',
      ],
      recommendation: 'Cần ôn lại Slide 12 của tài liệu AI(1).pdf về sơ đồ khối Goal-based Agent.',
      answerSheet: [
        { qId: 1, qText: 'Định nghĩa Tác tử (Agent)', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 2, qText: 'Thành phần cấu trúc PEAS', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 3, qText: 'Phân loại môi trường cờ vua', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 4, qText: 'Simple Reflex vs Goal-based', studentChoice: 'A', correctChoice: 'B', isCorrect: false },
        { qId: 5, qText: 'Hàm tác tử f: P* -> A', studentChoice: 'D', correctChoice: 'D', isCorrect: true },
        { qId: 6, qText: 'Xác định Performance Measure', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 7, qText: 'Thành phần Learning Agent', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 8, qText: 'Môi trường Partially Observable', studentChoice: 'B', correctChoice: 'A', isCorrect: false },
        { qId: 9, qText: 'Utility-based Agent', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 10, qText: 'Rationality vs Omniscience', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
      ],
    },
    {
      id: '22010419',
      name: 'Hoàng Thùy Dương',
      email: 'duong.ht@vinuni.edu.vn',
      submitTime: '15/09 19:12',
      score: 5.5,
      timeSpent: '18m 05s',
      status: 'NeedsHelp',
      strengths: [
        'Nắm được các định nghĩa khái niệm lý thuyết cơ bản (Câu 1, 2, 10)',
      ],
      weaknesses: [
        'Yếu về phân biệt cấu trúc các loại tác tử: Sai Câu 4, 7, 8, 9',
        'Nhầm lẫn nghiêm trọng giữa Tác tử phản xạ, tác tử có mô hình và tác tử học tập',
        'Chưa hiểu cách biểu diễn trạng thái trong môi trường không quan sát được toàn phần',
      ],
      recommendation: 'Cần gặp trực tiếp giảng viên hoặc trợ giảng (TA) trong giờ Office Hours để củng cố lại toàn bộ Chương 1.',
      answerSheet: [
        { qId: 1, qText: 'Định nghĩa Tác tử (Agent)', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 2, qText: 'Thành phần cấu trúc PEAS', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 3, qText: 'Phân loại môi trường cờ vua', studentChoice: 'C', correctChoice: 'B', isCorrect: false },
        { qId: 4, qText: 'Simple Reflex vs Goal-based', studentChoice: 'D', correctChoice: 'B', isCorrect: false },
        { qId: 5, qText: 'Hàm tác tử f: P* -> A', studentChoice: 'D', correctChoice: 'D', isCorrect: true },
        { qId: 6, qText: 'Xác định Performance Measure', studentChoice: 'B', correctChoice: 'C', isCorrect: false },
        { qId: 7, qText: 'Thành phần Learning Agent', studentChoice: 'A', correctChoice: 'B', isCorrect: false },
        { qId: 8, qText: 'Môi trường Partially Observable', studentChoice: 'C', correctChoice: 'A', isCorrect: false },
        { qId: 9, qText: 'Utility-based Agent', studentChoice: 'A', correctChoice: 'C', isCorrect: false },
        { qId: 10, qText: 'Rationality vs Omniscience', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
      ],
    },
    {
      id: '22010091',
      name: 'Lê Hoàng Nam',
      email: 'nam.lh@vinuni.edu.vn',
      submitTime: '15/09 16:05',
      score: 7.0,
      timeSpent: '16m 30s',
      status: 'Passed',
      strengths: [
        'Hiểu tốt về tính hợp lý (Rationality) và cấu trúc PEAS',
        'Làm đúng các câu vận dụng thực tế',
      ],
      weaknesses: [
        'Sai Câu 4 (Reflex vs Goal) và Câu 8 (Partially Observable)',
      ],
      recommendation: 'Khuyến khích sinh viên làm lại bài tập tự luyện trên trợ lý AI Tutor.',
      answerSheet: [
        { qId: 1, qText: 'Định nghĩa Tác tử (Agent)', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 2, qText: 'Thành phần cấu trúc PEAS', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 3, qText: 'Phân loại môi trường cờ vua', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 4, qText: 'Simple Reflex vs Goal-based', studentChoice: 'A', correctChoice: 'B', isCorrect: false },
        { qId: 5, qText: 'Hàm tác tử f: P* -> A', studentChoice: 'D', correctChoice: 'D', isCorrect: true },
        { qId: 6, qText: 'Xác định Performance Measure', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 7, qText: 'Thành phần Learning Agent', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 8, qText: 'Môi trường Partially Observable', studentChoice: 'D', correctChoice: 'A', isCorrect: false },
        { qId: 9, qText: 'Utility-based Agent', studentChoice: 'A', correctChoice: 'C', isCorrect: false },
        { qId: 10, qText: 'Rationality vs Omniscience', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
      ],
    },
    {
      id: '22010314',
      name: 'Phạm Hồng Phúc',
      email: 'phuc.ph@vinuni.edu.vn',
      submitTime: '15/09 17:40',
      score: 9.5,
      timeSpent: '10m 15s',
      status: 'Passed',
      strengths: [
        'Xuất sắc 9/10 câu hỏi, tốc độ hoàn thành nhanh nhất lớp (10 phút)',
        'Nắm vững toàn bộ cấu trúc phân loại tác tử thông minh',
      ],
      weaknesses: [
        'Chỉ sai sót nhỏ ở Câu 6 về chi tiết câu chữ của thước đo hiệu suất',
      ],
      recommendation: 'Đủ điều kiện làm nhóm trưởng bài tập lớn môn AI3010.',
      answerSheet: [
        { qId: 1, qText: 'Định nghĩa Tác tử (Agent)', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 2, qText: 'Thành phần cấu trúc PEAS', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 3, qText: 'Phân loại môi trường cờ vua', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 4, qText: 'Simple Reflex vs Goal-based', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 5, qText: 'Hàm tác tử f: P* -> A', studentChoice: 'D', correctChoice: 'D', isCorrect: true },
        { qId: 6, qText: 'Xác định Performance Measure', studentChoice: 'A', correctChoice: 'C', isCorrect: false },
        { qId: 7, qText: 'Thành phần Learning Agent', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 8, qText: 'Môi trường Partially Observable', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 9, qText: 'Utility-based Agent', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 10, qText: 'Rationality vs Omniscience', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
      ],
    },
    {
      id: '22010112',
      name: 'Vũ Đức Mạnh',
      email: 'manh.vd@vinuni.edu.vn',
      submitTime: '15/09 20:00',
      score: 8.0,
      timeSpent: '13m 22s',
      status: 'Passed',
      strengths: [
        'Nắm vững mô hình PEAS và hiểu đúng câu hỏi phân tích về Utility',
      ],
      weaknesses: [
        'Sai Câu 4 (Reflex vs Goal) và Câu 6',
      ],
      recommendation: 'Cần ôn lại phân loại agent trước bài thi giữa kỳ.',
      answerSheet: [
        { qId: 1, qText: 'Định nghĩa Tác tử (Agent)', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 2, qText: 'Thành phần cấu trúc PEAS', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 3, qText: 'Phân loại môi trường cờ vua', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 4, qText: 'Simple Reflex vs Goal-based', studentChoice: 'C', correctChoice: 'B', isCorrect: false },
        { qId: 5, qText: 'Hàm tác tử f: P* -> A', studentChoice: 'D', correctChoice: 'D', isCorrect: true },
        { qId: 6, qText: 'Xác định Performance Measure', studentChoice: 'B', correctChoice: 'C', isCorrect: false },
        { qId: 7, qText: 'Thành phần Learning Agent', studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        { qId: 8, qText: 'Môi trường Partially Observable', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        { qId: 9, qText: 'Utility-based Agent', studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        { qId: 10, qText: 'Rationality vs Omniscience', studentChoice: 'A', correctChoice: 'A', isCorrect: true },
      ],
    },
    {
      id: '22010255',
      name: 'Đỗ Minh Quân',
      email: 'quan.dm@vinuni.edu.vn',
      submitTime: 'Chưa nộp',
      score: 0.0,
      timeSpent: '—',
      status: 'Pending',
      strengths: [],
      weaknesses: ['Chưa tham gia làm bài tập đúng hạn.'],
      recommendation: 'Cần gửi email nhắc nhở trước khi hết hạn nộp bài 24h.',
      answerSheet: [],
    },
  ];

  const filteredStudents = studentSubmissions.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.id.includes(searchTerm) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (scoreFilter === 'All') return matchesSearch;
    if (scoreFilter === 'High') return matchesSearch && st.score >= 8.5;
    if (scoreFilter === 'NeedsHelp') return matchesSearch && (st.score < 6.5 || st.status === 'Pending');
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* TOP HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Quay lại khóa học"
            >
              <ArrowLeft size={16} />
              <span>Quay lại khóa học</span>
            </button>
            <span className="text-slate-300">|</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {courseCode}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                  Báo cáo phân tích AI
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-[#1E3A6E] tracking-tight">
                {quizTitle ? `Báo cáo kết quả: ${quizTitle}` : `Báo cáo kết quả: ${chapterTitle}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Đã xuất file báo cáo phân tích định dạng Excel.')}
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={() => alert('Đã gửi thông báo nhắc nhở làm bài đến sinh viên chưa hoàn thành!')}
              className="px-3.5 py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send size={14} />
              <span>Nhắc sinh viên chưa nộp</span>
            </button>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH SCROLLABLE CONTAINER (Scrollbar strictly on the far right edge of the screen) */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
          {/* KPI OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Tỉ lệ hoàn thành</span>
                <Users size={16} className="text-[#1E3A6E]" />
              </div>
              <p className="text-2xl font-extrabold text-[#1E3A6E]">91.8%</p>
              <p className="text-[11px] text-slate-400 mt-1">68 / 74 sinh viên đã nộp bài</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Điểm trung bình lớp</span>
                <BarChart2 size={16} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600">8.4 / 10</p>
              <p className="text-[11px] text-slate-400 mt-1">Cao nhất: 10 • Thấp nhất: 5.5</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Thời gian làm trung bình</span>
                <Clock size={16} className="text-slate-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">14m 12s</p>
              <p className="text-[11px] text-slate-400 mt-1">Đề thi 10 câu trắc nghiệm</p>
            </div>

            <div className="bg-amber-50/70 p-4 sm:p-5 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-semibold">
                <span>Điểm gây nhầm lẫn</span>
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-700">Câu 4 (42%)</p>
              <p className="text-[11px] text-amber-800/80 mt-1">Nhầm lẫn Reflex vs Goal Agent</p>
            </div>
          </div>

          {/* PEDAGOGICAL AI SOCRATIC INSIGHT BOX */}
          <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/60 border border-amber-200 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                  <Sparkles size={16} />
                </div>
                <h2 className="font-bold text-amber-950 text-sm">
                  Phân tích điểm hiểu nhầm sư phạm toàn lớp (AI Learning Analytics)
                </h2>
              </div>
              <span className="text-[11px] font-semibold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
                Khuyến nghị cho giảng viên
              </span>
            </div>

            <div className="text-xs text-amber-950/90 space-y-2 leading-relaxed bg-white/70 p-4 rounded-lg border border-amber-200/60">
              <p>
                • <strong>Phát hiện mấu chốt:</strong> Có <strong>42% sinh viên</strong> chọn phương án B (sai) ở Câu số 4 do đồng nhất khái niệm <em>"hành vi có mục tiêu"</em> với <em>"phản xạ có điều kiện"</em>.
              </p>
              <p>
                • <strong>Căn cứ tài liệu:</strong> Nội dung này nằm tại <strong>Trang 12 của slide AI(1).pdf</strong>. Sinh viên có xu hướng bỏ qua slide định nghĩa về State Representation.
              </p>
              <p>
                • <strong>Đề xuất can thiệp cho Dr. Nguyễn Thanh Tùng:</strong> Dành 5–7 phút đầu giờ học buổi kế tiếp để giảng lại slide 12 với ví dụ thực tế về Robot hút bụi tự hành có bản đồ vs không bản đồ.
              </p>
            </div>
          </div>

          {/* DETAILED QUESTION-BY-QUESTION ACCURACY BREAKDOWN */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Chi tiết độ chính xác từng câu hỏi trong đề
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Độ khó thực tế đo lường dựa trên 68 lượt nộp bài của sinh viên CECS.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600">10 câu hỏi</span>
            </div>

            <div className="divide-y divide-slate-100">
              {questionsAnalysis.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    q.isWarning ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">Câu {q.id}.</span>
                      <span className="text-xs text-slate-700 font-medium">{q.text}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.2 rounded font-medium">
                        Mức độ: {q.bloom}
                      </span>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">Nguồn: {q.pageCitation}</span>
                    </div>

                    {q.misconceptionNote && (
                      <p className="text-[11px] text-amber-800 font-medium mt-1">
                        ⚠️ {q.misconceptionNote}
                      </p>
                    )}
                  </div>

                  <div className="w-48 shrink-0 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className={q.correctRate < 60 ? 'text-amber-700' : 'text-emerald-700'}>
                          {q.correctRate}% đúng
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            q.correctRate < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${q.correctRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STUDENT ROSTER WITH INDIVIDUAL PERFORMANCE DRILL-DOWN (Split Layout or Drawer) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Hồ sơ kết quả sinh viên & Phân tích điểm mạnh/yếu cá nhân
                </h3>
                <p className="text-xs text-slate-500">
                  Nhấn vào bất kỳ sinh viên nào để mở bảng phân tích điểm mạnh, điểm yếu và gợi ý phụ đạo riêng biệt.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc MSSV..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:border-[#1E3A6E] focus:outline-none w-48"
                  />
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setScoreFilter('All')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      scoreFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setScoreFilter('High')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      scoreFilter === 'High' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Giỏi (≥8.5)
                  </button>
                  <button
                    onClick={() => setScoreFilter('NeedsHelp')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      scoreFilter === 'NeedsHelp' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Cần hỗ trợ
                  </button>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN GRID: LEFT TABLE, RIGHT INDIVIDUAL DETAIL PANEL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* TABLE AREA */}
              <div
                className={`transition-all duration-300 ${
                  selectedStudent ? 'lg:col-span-7' : 'lg:col-span-12'
                }`}
              >
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Mã SV</th>
                        <th className="p-3.5">Họ và tên</th>
                        <th className="p-3.5 hidden sm:table-cell">Thời gian nộp</th>
                        <th className="p-3.5 text-right">Điểm</th>
                        <th className="p-3.5 text-center">Trạng thái</th>
                        <th className="p-3.5 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => {
                        const isSelected = selectedStudent?.id === st.id;
                        return (
                          <tr
                            key={st.id}
                            onClick={() => setSelectedStudent(st)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/80 font-medium'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="p-3.5 font-semibold text-slate-900">{st.id}</td>
                            <td className="p-3.5 font-medium">{st.name}</td>
                            <td className="p-3.5 text-slate-500 hidden sm:table-cell">{st.submitTime}</td>
                            <td className="p-3.5 text-right font-bold text-[#1E3A6E]">
                              {st.score > 0 ? `${st.score}/10` : '—'}
                            </td>
                            <td className="p-3.5 text-center">
                              {st.status === 'Passed' && (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Đạt
                                </span>
                              )}
                              {st.status === 'NeedsHelp' && (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Cần kèm
                                </span>
                              )}
                              {st.status === 'Pending' && (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600">
                                  Chưa nộp
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudent(st);
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#1E3A6E] text-white'
                                    : 'text-[#1E3A6E] hover:bg-blue-50 border border-slate-200'
                                }`}
                              >
                                <span>Xem</span>
                                <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT INDIVIDUAL STUDENT DIAGNOSTIC PANEL (Requirement: xem chi tiết yếu/mạnh chỗ nào) */}
              {selectedStudent && (
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-md p-5 space-y-5 sticky top-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* Panel Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E3A6E] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {selectedStudent.id}
                        </span>
                        <h4 className="font-bold text-base text-slate-900">
                          {selectedStudent.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedStudent.email}</p>
                    </div>

                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Đóng bảng chi tiết"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Summary Score & Time */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-center">
                    <div>
                      <span className="text-slate-500 text-[11px]">Điểm số đạt được</span>
                      <p className="text-xl font-extrabold text-[#1E3A6E] mt-0.5">
                        {selectedStudent.score > 0 ? `${selectedStudent.score} / 10` : 'Chưa nộp'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px]">Thời gian làm bài</span>
                      <p className="text-xl font-extrabold text-slate-800 mt-0.5">
                        {selectedStudent.timeSpent}
                      </p>
                    </div>
                  </div>

                  {/* STRENGTHS (ĐIỂM MẠNH) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <TrendingUp size={15} className="text-emerald-600" />
                      <span>Điểm mạnh đã thể hiện (Strengths):</span>
                    </div>

                    {selectedStudent.strengths.length > 0 ? (
                      <ul className="space-y-1.5 text-xs bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/80 text-emerald-950">
                        {selectedStudent.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                        Chưa có dữ liệu nộp bài để ghi nhận điểm mạnh.
                      </p>
                    )}
                  </div>

                  {/* WEAKNESSES (ĐIỂM YẾU & CẦN CẢI THIỆN) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <AlertCircle size={15} className="text-amber-600" />
                      <span>Điểm yếu & Cần củng cố (Weaknesses):</span>
                    </div>

                    {selectedStudent.weaknesses.length > 0 ? (
                      <ul className="space-y-1.5 text-xs bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-amber-950">
                        {selectedStudent.weaknesses.map((wk, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">⚠️</span>
                            <span>{wk}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                        Không phát hiện điểm yếu học thuật đáng kể.
                      </p>
                    )}
                  </div>

                  {/* AI RECOMMENDATION FOR INSTRUCTOR */}
                  <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#1E3A6E] text-[11px]">
                      <Sparkles size={13} />
                      <span>Khuyến nghị can thiệp sư phạm:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11.5px]">
                      {selectedStudent.recommendation}
                    </p>
                  </div>

                  {/* QUESTION-BY-QUESTION SHEET */}
                  {selectedStudent.answerSheet.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        Chi tiết câu hỏi làm đúng / sai:
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedStudent.answerSheet.map((ans) => (
                          <div
                            key={ans.qId}
                            className={`p-2 rounded-md text-xs flex items-center justify-between border ${
                              ans.isCorrect
                                ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                                : 'bg-red-50/40 border-red-200 text-red-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  ans.isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-red-500 text-white'
                                }`}
                              >
                                {ans.qId}
                              </span>
                              <span className="truncate max-w-[180px]">{ans.qText}</span>
                            </div>

                            <span className="font-mono text-[11px] shrink-0">
                              Chọn: <strong>{ans.studentChoice}</strong>{' '}
                              {!ans.isCorrect && `(Đúng: ${ans.correctChoice})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEND ACTION BUTTON */}
                  <div className="pt-2">
                    <button
                      onClick={() =>
                        alert(`Đã gửi email phản hồi và tài liệu bổ trợ tới ${selectedStudent.email}!`)
                      }
                      className="w-full py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send size={13} />
                      <span>Gửi email kèm tài liệu bổ trợ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
