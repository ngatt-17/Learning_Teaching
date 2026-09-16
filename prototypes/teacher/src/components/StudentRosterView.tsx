import React, { useState } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Award,
  BookOpen,
  Mail,
  RefreshCw,
  X,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Calendar,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  score: number;
  quizCompleted: number;
  totalQuizzes: number;
  status: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần hỗ trợ' | 'Chưa nộp';
  trend: 'up' | 'down' | 'same';
  trendValue: string;
  lastUpdated: string;
  strengths: {
    topic: string;
    detail: string;
    accuracy: number;
  }[];
  weaknesses: {
    topic: string;
    detail: string;
    recommendedSlide: string;
    recommendedPage: string;
  }[];
  recommendation: string;
  quizHistory: {
    title: string;
    score: number;
    submitTime: string;
    status: 'Passed' | 'NeedsHelp' | 'Pending';
  }[];
}

interface StudentRosterViewProps {
  courseCode: string;
  enrolledStudentsCount: number;
  totalQuizzesCount: number;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  courseCode: _courseCode,
  enrolledStudentsCount: _enrolledStudentsCount,
  totalQuizzesCount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'excellent' | 'good' | 'needsHelp' | 'pending'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Mock Students with comprehensive strengths and weaknesses updated frequently
  const [students] = useState<StudentProfile[]>([
    {
      id: '22010314',
      name: 'Phạm Hồng Phúc',
      email: 'phuc.ph@vinuni.edu.vn',
      avatarColor: 'bg-purple-600',
      score: 9.6,
      quizCompleted: 3,
      totalQuizzes: 3,
      status: 'Xuất sắc',
      trend: 'up',
      trendValue: '+0.6',
      lastUpdated: '15 phút trước • Sau Quiz tổng hợp',
      strengths: [
        { topic: 'Khung tác tử thông minh (PEAS)', detail: 'Nắm vững 100% các thành phần P-E-A-S và môi trường phức tạp', accuracy: 100 },
        { topic: 'Thuật toán Heuristic & A*', detail: 'Hiểu bản chất hàm đánh giá f(n) = g(n) + h(n) và tính chấp nhận được (Admissibility)', accuracy: 98 },
        { topic: 'Tác tử dựa trên độ thỏa dụng (Utility)', detail: 'Phân tích đa tiêu chí và ra quyết định tối ưu', accuracy: 95 },
      ],
      weaknesses: [
        {
          topic: 'Kiểm tra kỹ lưỡng các bẫy định nghĩa',
          detail: 'Làm bài với tốc độ rất nhanh, đôi khi lướt qua một số tiểu tiết trong câu hỏi lý thuyết dài.',
          recommendedSlide: 'AI(1).pdf',
          recommendedPage: 'Trang 15',
        },
      ],
      recommendation: 'Sinh viên có năng lực vượt trội. Đề xuất giao thêm các bài toán mở rộng hoặc mời làm Trợ giảng (TA) hỗ trợ lớp.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 9.5, submitTime: '15/09 14:10', status: 'Passed' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 9.8, submitTime: '15/09 17:30', status: 'Passed' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 9.5, submitTime: '15/09 21:00', status: 'Passed' },
      ],
    },
    {
      id: '22010045',
      name: 'Nguyễn Văn An',
      email: 'an.nv@vinuni.edu.vn',
      avatarColor: 'bg-blue-600',
      score: 9.0,
      quizCompleted: 3,
      totalQuizzes: 3,
      status: 'Xuất sắc',
      trend: 'up',
      trendValue: '+0.5',
      lastUpdated: 'Hôm nay 14:20 • Sau Quiz 1',
      strengths: [
        { topic: 'Định nghĩa & Bản chất Tác tử AI', detail: 'Hiểu chính xác hàm tác tử f: P* -> A và tính hợp lý Rationality', accuracy: 96 },
        { topic: 'Tìm kiếm chi phí đồng nhất (UCS)', detail: 'Tính toán chính xác thứ tự mở rộng nút theo chi phí g(n)', accuracy: 92 },
      ],
      weaknesses: [
        {
          topic: 'Nhầm lẫn Toàn tri (Omniscience) vs Hợp lý (Rationality)',
          detail: 'Cần đọc kỹ giả thiết bài toán để phân biệt rõ tính hợp lý không đồng nghĩa với biết trước tương lai.',
          recommendedSlide: 'AI(1).pdf',
          recommendedPage: 'Trang 3',
        },
      ],
      recommendation: 'Nắm vững kiến thức nền tảng, duy trì sự ổn định trong các bài kiểm tra tiếp theo.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 9.0, submitTime: '15/09 14:20', status: 'Passed' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 8.8, submitTime: '15/09 18:00', status: 'Passed' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 9.2, submitTime: '15/09 21:15', status: 'Passed' },
      ],
    },
    {
      id: '22010182',
      name: 'Trần Thị Mai',
      email: 'mai.tt@vinuni.edu.vn',
      avatarColor: 'bg-emerald-600',
      score: 8.5,
      quizCompleted: 3,
      totalQuizzes: 3,
      status: 'Tốt',
      trend: 'up',
      trendValue: '+0.3',
      lastUpdated: 'Hôm nay 15:10',
      strengths: [
        { topic: 'Phân loại môi trường tác tử', detail: 'Phân biệt xuất sắc giữa môi trường Rời rạc (Discrete) vs Liên tục (Continuous)', accuracy: 94 },
        { topic: 'Tác tử học tập (Learning Agent)', detail: 'Nắm chắc 4 khối chức năng: Learning element, Critic, Performance element, Problem generator', accuracy: 90 },
      ],
      weaknesses: [
        {
          topic: 'Nhầm lẫn giữa Goal-based và Simple Reflex',
          detail: 'Chưa phân biệt rạch ròi việc duy trì trạng thái mục tiêu (Goal) so với phản xạ điều kiện nếu-thì.',
          recommendedSlide: 'AI(1).pdf (Slide 12)',
          recommendedPage: 'Trang 12',
        },
      ],
      recommendation: 'Nên dành 15 phút ôn lại sơ đồ khối Goal-based Agent tại Slide 12 trước kỳ thi giữa kỳ.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 8.5, submitTime: '15/09 15:10', status: 'Passed' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 8.5, submitTime: '15/09 18:25', status: 'Passed' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 8.5, submitTime: '15/09 21:30', status: 'Passed' },
      ],
    },
    {
      id: '22010112',
      name: 'Vũ Đức Mạnh',
      email: 'manh.vd@vinuni.edu.vn',
      avatarColor: 'bg-indigo-600',
      score: 8.0,
      quizCompleted: 3,
      totalQuizzes: 3,
      status: 'Tốt',
      trend: 'same',
      trendValue: '0.0',
      lastUpdated: 'Hôm nay 20:00',
      strengths: [
        { topic: 'Khung PEAS cho xe tự hành', detail: 'Xác định đầy đủ Performance measure, Environment, Actuators, Sensors', accuracy: 90 },
        { topic: 'Tìm kiếm theo chiều rộng (BFS)', detail: 'Hiểu tính chất tối ưu (Optimality) và đầy đủ (Completeness) của BFS', accuracy: 88 },
      ],
      weaknesses: [
        {
          topic: 'Thước đo hiệu suất khách quan',
          detail: 'Có xu hướng chọn thước đo theo hành vi chủ quan của tác tử thay vì theo kết quả môi trường mong muốn.',
          recommendedSlide: 'AI(1).pdf',
          recommendedPage: 'Trang 5',
        },
      ],
      recommendation: 'Cần chú ý câu hỏi phân tích logic về thước đo hiệu suất trong các đề thi trắc nghiệm.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 8.0, submitTime: '15/09 20:00', status: 'Passed' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 8.0, submitTime: '15/09 20:45', status: 'Passed' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 8.0, submitTime: '15/09 21:40', status: 'Passed' },
      ],
    },
    {
      id: '22010091',
      name: 'Lê Hoàng Nam',
      email: 'nam.lh@vinuni.edu.vn',
      avatarColor: 'bg-amber-600',
      score: 7.0,
      quizCompleted: 2,
      totalQuizzes: 3,
      status: 'Khá',
      trend: 'down',
      trendValue: '-0.5',
      lastUpdated: 'Hôm qua 16:05',
      strengths: [
        { topic: 'Tính hợp lý Rationality', detail: 'Nắm được công thức cơ bản và phân tích hành vi tác tử ở mức cơ bản', accuracy: 80 },
      ],
      weaknesses: [
        {
          topic: 'Thuật toán DFS & Bẫy chu trình lặp vô hạn',
          detail: 'Yếu phần thuật toán DFS trên không gian trạng thái vô hạn; hay quên kiểm tra danh sách nút đã thăm (explored set).',
          recommendedSlide: 'AI(2).pdf',
          recommendedPage: 'Trang 18-22',
        },
        {
          topic: 'Tốc độ hoàn thành bài thi',
          detail: 'Thời gian làm bài trung bình 16m30s, sát giờ hết hạn làm bài.',
          recommendedSlide: 'Tài liệu Luyện tập',
          recommendedPage: 'Quiz ngân hàng',
        },
      ],
      recommendation: 'Khuyến khích tham gia buổi Office Hours của Trợ giảng để thực hành vẽ cây tìm kiếm DFS.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 7.0, submitTime: '15/09 16:05', status: 'Passed' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 7.0, submitTime: '15/09 19:10', status: 'Passed' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 0, submitTime: 'Chưa làm', status: 'Pending' },
      ],
    },
    {
      id: '22010419',
      name: 'Hoàng Thùy Dương',
      email: 'duong.ht@vinuni.edu.vn',
      avatarColor: 'bg-rose-600',
      score: 5.5,
      quizCompleted: 2,
      totalQuizzes: 3,
      status: 'Cần hỗ trợ',
      trend: 'down',
      trendValue: '-1.0',
      lastUpdated: 'Hôm qua 19:12',
      strengths: [
        { topic: 'Định nghĩa khái niệm nhập môn', detail: 'Nắm được các định nghĩa cơ bản về Agent, Sensor, Actuator', accuracy: 65 },
      ],
      weaknesses: [
        {
          topic: 'Nhầm lẫn nghiêm trọng cấu trúc 4 loại tác tử',
          detail: 'Sai liên tiếp các câu về Tác tử phản xạ, tác tử có mô hình và tác tử học tập.',
          recommendedSlide: 'AI(1).pdf (Slide 8-14)',
          recommendedPage: 'Trang 8-14',
        },
        {
          topic: 'Môi trường quan sát một phần (Partially Observable)',
          detail: 'Chưa hiểu cách tác tử duy trì niềm tin trạng thái bên trong (Internal State) khi thông tin cảm biến bị thiếu.',
          recommendedSlide: 'AI(1).pdf',
          recommendedPage: 'Trang 7',
        },
      ],
      recommendation: 'CẦN CAN THIỆP SỚM: Đề nghị giảng viên hẹn lịch Office Hours 1-1 để giải đáp lỗ hổng kiến thức trước bài kiểm tra kế tiếp.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 5.5, submitTime: '15/09 19:12', status: 'NeedsHelp' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 5.5, submitTime: '15/09 20:30', status: 'NeedsHelp' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 0, submitTime: 'Chưa làm', status: 'Pending' },
      ],
    },
    {
      id: '22010255',
      name: 'Đỗ Minh Quân',
      email: 'quan.dm@vinuni.edu.vn',
      avatarColor: 'bg-slate-600',
      score: 0.0,
      quizCompleted: 0,
      totalQuizzes: 3,
      status: 'Chưa nộp',
      trend: 'down',
      trendValue: '—',
      lastUpdated: 'Chưa tham gia làm bài',
      strengths: [],
      weaknesses: [
        {
          topic: 'Chưa hoàn thành bất kỳ bài quiz nào',
          detail: 'Chưa nộp Quiz 1, Quiz 2 và Quiz tổng hợp giữa kỳ. Có nguy cơ không đủ điều kiện chuyên cần.',
          recommendedSlide: 'Tất cả slide Chương 1 & 2',
          recommendedPage: 'Toàn bộ',
        },
      ],
      recommendation: 'Hệ thống đã tự động gửi email nhắc nhở thời hạn nộp bài. Giảng viên cần nhắc nhở trực tiếp trên lớp.',
      quizHistory: [
        { title: 'Quiz 1: Giới thiệu AI & Khung PEAS', score: 0, submitTime: 'Chưa nộp', status: 'Pending' },
        { title: 'Quiz 2: Thuật toán tìm kiếm mù', score: 0, submitTime: 'Chưa nộp', status: 'Pending' },
        { title: 'Quiz tổng hợp giữa kỳ (Chương 1 & 2)', score: 0, submitTime: 'Chưa nộp', status: 'Pending' },
      ],
    },
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Simulate AI update sync
  const handleSyncAI = () => {
    setIsSyncingAI(true);
    setTimeout(() => {
      setIsSyncingAI(false);
      triggerToast(`Đã đồng bộ kết quả Quiz mới nhất và cập nhật lại hồ sơ cho ${students.length} sinh viên!`);
    }, 900);
  };

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.id.includes(searchTerm) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'excellent') return st.score >= 9.0;
    if (statusFilter === 'good') return st.score >= 7.5 && st.score < 9.0;
    if (statusFilter === 'needsHelp') return st.status === 'Cần hỗ trợ';
    if (statusFilter === 'pending') return st.status === 'Chưa nộp';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-md z-40 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white cursor-pointer ml-4">
            ✕
          </button>
        </div>
      )}

      {/* HEADER & OVERVIEW CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Hồ sơ Sinh viên & Phân tích Năng lực AI ({students.length} sinh viên)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Sparkles size={11} className="text-purple-600" />
                Cập nhật thường xuyên từ Quiz
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống AI tự động phân tích câu trả lời từ các bài Quiz để đánh giá liên tục điểm mạnh, điểm yếu và đề xuất lộ trình bổ trợ cho từng sinh viên.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncAI}
              disabled={isSyncingAI}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Đồng bộ lại điểm mạnh/điểm yếu sau các lần sinh viên làm bài quiz"
            >
              <RefreshCw size={14} className={isSyncingAI ? 'animate-spin text-[#1E3A6E]' : 'text-slate-500'} />
              <span>{isSyncingAI ? 'Đang phân tích AI...' : 'Cập nhật phân tích AI'}</span>
            </button>
          </div>
        </div>

        {/* 4 STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Sĩ số sinh viên</span>
              <GraduationCap size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{students.length}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">100% tài khoản chính thức</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Điểm trung bình lớp</span>
              <Award size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-[#1E3A6E]">
              {students.length > 0
                ? (students.reduce((acc, s) => acc + s.score, 0) / (students.filter((s) => s.score > 0).length || 1)).toFixed(1)
                : '8.1'}{' '}
              <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} />
              <span>+0.4 điểm so với đầu kỳ</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Nhóm Xuất sắc & Tốt</span>
              <UserCheck size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {students.filter((s) => s.score >= 7.5).length}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {students.length} SV</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {students.length > 0
                ? Math.round((students.filter((s) => s.score >= 7.5).length / students.length) * 100)
                : 80}% nắm vững kiến thức
            </div>
          </div>

          <div className="bg-white border border-red-200 bg-red-50/20 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Cần trợ giúp / Chưa nộp</span>
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div className="text-2xl font-extrabold text-red-600">
              {students.filter((s) => s.status === 'Cần hỗ trợ' || s.status === 'Chưa nộp').length}{' '}
              <span className="text-xs text-slate-400 font-normal">SV</span>
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Có cảnh báo AI cần can thiệp</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên sinh viên, MSSV hoặc email VinUni..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A6E]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#1E3A6E] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Tất cả ({students.length})
          </button>
          <button
            onClick={() => setStatusFilter('excellent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'excellent'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            Xuất sắc (≥ 9.0)
          </button>
          <button
            onClick={() => setStatusFilter('good')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'good'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-[#1E3A6E] border border-blue-200'
            }`}
          >
            Tốt & Khá
          </button>
          <button
            onClick={() => setStatusFilter('needsHelp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'needsHelp'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            Cần hỗ trợ
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'pending'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Chưa nộp
          </button>
        </div>
      </div>

      {/* STUDENT TABLE WITH DYNAMIC STRENGTHS & WEAKNESSES */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="p-3.5 pl-4">Sinh viên & MSSV</th>
                <th className="p-3.5 text-center">Điểm TB Quiz</th>
                <th className="p-3.5 text-center">Tiến độ nộp bài</th>
                <th className="p-3.5">Cập nhật lần cuối</th>
                <th className="p-3.5 text-right pr-4">Chi tiết hồ sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((st) => (
                <tr
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                >
                  {/* Column 1: Student info */}
                  <td className="p-3.5 pl-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${st.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                      >
                        {st.name
                          .split(' ')
                          .slice(-2)
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-[#1E3A6E] transition-colors flex items-center gap-1.5">
                          <span>{st.name}</span>
                          {st.status === 'Xuất sắc' && (
                            <span title="Sinh viên xuất sắc">
                              <Award size={13} className="text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{st.id}</span> • <span>{st.email}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{st.lastUpdated}</div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Average score & trend */}
                  <td className="p-3.5 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-extrabold text-sm text-[#1E3A6E]">
                        {st.score > 0 ? `${st.score}/10` : '—'}
                      </span>

                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                            st.status === 'Xuất sắc'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : st.status === 'Tốt'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : st.status === 'Khá'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : st.status === 'Cần hỗ trợ'
                              ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {st.status}
                        </span>

                        {st.trend === 'up' && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                            <TrendingUp size={11} />
                            {st.trendValue}
                          </span>
                        )}
                        {st.trend === 'down' && st.status !== 'Chưa nộp' && (
                          <span className="text-[10px] font-bold text-red-500 flex items-center">
                            <TrendingDown size={11} />
                            {st.trendValue}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Quiz progress */}
                  <td className="p-3.5 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-semibold text-slate-800 text-xs">
                        {st.quizCompleted} / {totalQuizzesCount || 3}
                      </span>
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            st.quizCompleted === (totalQuizzesCount || 3) ? 'bg-emerald-500' : 'bg-[#1E3A6E]'
                          }`}
                          style={{
                            width: `${(st.quizCompleted / (totalQuizzesCount || 3)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Column 4: Last updated & activity */}
                  <td className="p-3.5">
                    <div className="text-xs text-slate-600 font-medium">{st.lastUpdated}</div>
                    <div className="text-[10.5px] text-slate-400">
                      {st.quizHistory.filter((q) => q.status === 'Passed').length} bài đạt yêu cầu
                    </div>
                  </td>

                  {/* Column 5: Action */}
                  <td className="p-3.5 pr-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(st);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#1E3A6E] hover:text-white bg-white hover:bg-[#1E3A6E] border border-blue-200 rounded-lg transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    >
                      <span>Xem chi tiết AI</span>
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            Không tìm thấy sinh viên nào phù hợp với bộ lọc tìm kiếm.
          </div>
        )}
      </div>

      {/* STUDENT DETAIL DRAWER (SLIDE-OVER FROM RIGHT) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* DRAWER HEADER */}
            <div className="bg-[#1E3A6E] text-white p-5 shrink-0 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full ${selectedStudent.avatarColor} border-2 border-white/40 text-white flex items-center justify-center font-extrabold text-base shadow-md`}
                >
                  {selectedStudent.name
                    .split(' ')
                    .slice(-2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-semibold text-white">
                      {selectedStudent.status}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 mt-0.5">
                    MSSV: {selectedStudent.id} • {selectedStudent.email}
                  </p>
                  <p className="text-[11px] text-blue-200 mt-1 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-300" />
                    <span>Dữ liệu AI: {selectedStudent.lastUpdated}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng hồ sơ"
              >
                <X size={18} />
              </button>
            </div>

            {/* DRAWER BODY (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {/* CARD 1: OVERVIEW METRICS */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Điểm trung bình</span>
                  <span className="text-xl font-extrabold text-[#1E3A6E] mt-0.5 block">
                    {selectedStudent.score > 0 ? `${selectedStudent.score}/10` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Quiz hoàn thành</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">
                    {selectedStudent.quizCompleted} / {totalQuizzesCount || 3}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Xu hướng điểm</span>
                  <span
                    className={`text-xl font-extrabold mt-0.5 flex items-center justify-center gap-1 ${
                      selectedStudent.trend === 'up'
                        ? 'text-emerald-600'
                        : selectedStudent.trend === 'down'
                        ? 'text-red-500'
                        : 'text-slate-600'
                    }`}
                  >
                    {selectedStudent.trend === 'up' && <TrendingUp size={18} />}
                    {selectedStudent.trend === 'down' && <TrendingDown size={18} />}
                    {selectedStudent.trendValue}
                  </span>
                </div>
              </div>

              {/* CARD 2: STRENGTHS DETAIL (AI INSIGHT) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={16} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Chi tiết Điểm mạnh đã được kiểm chứng ({selectedStudent.strengths.length})
                  </h4>
                </div>

                {selectedStudent.strengths.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedStudent.strengths.map((st, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-emerald-900">{st.topic}</span>
                          <span className="text-[11px] font-extrabold text-emerald-700">
                            Độ chính xác: {st.accuracy}%
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">{st.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa đủ dữ liệu bài làm để tổng hợp điểm mạnh.</p>
                )}
              </div>

              {/* CARD 3: WEAKNESSES & REMEDIATION (AI INSIGHT) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-1 rounded bg-amber-100 text-amber-700">
                    <AlertTriangle size={16} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Điểm yếu & Lỗ hổng kiến thức cần ôn tập ({selectedStudent.weaknesses.length})
                  </h4>
                </div>

                {selectedStudent.weaknesses.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.weaknesses.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-amber-950">{w.topic}</span>
                          <span className="text-[10.5px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.2 rounded">
                            Cần ôn tập
                          </span>
                        </div>

                        <p className="text-[11px] text-amber-900 leading-relaxed">{w.detail}</p>

                        <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-[#1E3A6E] font-semibold">
                            <BookOpen size={13} />
                            <span>Tài liệu: {w.recommendedSlide}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-medium">{w.recommendedPage}</span>
                          </div>

                          <button
                            onClick={() => {
                              triggerToast(`Đã gửi đề xuất ôn tập "${w.recommendedSlide}" tới email ${selectedStudent.email}`);
                            }}
                            className="text-[11px] font-bold text-[#1E3A6E] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Gửi tài liệu ôn</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>Sinh viên làm chủ toàn bộ nội dung đã kiểm tra, không phát hiện lỗ hổng lớn.</span>
                  </p>
                )}
              </div>

              {/* CARD 4: RECOMMENDATION NOTE */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A6E]">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>Đề xuất can thiệp sư phạm của AI:</span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                  {selectedStudent.recommendation}
                </p>
              </div>

              {/* CARD 5: QUIZ SUBMISSION HISTORY */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Lịch sử kết quả bài Quiz đã nộp
                </h4>

                <div className="divide-y divide-slate-100">
                  {selectedStudent.quizHistory.map((q, qIdx) => (
                    <div key={qIdx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{q.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Nộp lúc: {q.submitTime}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-extrabold text-sm ${
                            q.score >= 8.5
                              ? 'text-emerald-600'
                              : q.score >= 7.0
                              ? 'text-[#1E3A6E]'
                              : q.score > 0
                              ? 'text-red-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {q.score > 0 ? `${q.score}/10` : 'Chưa làm'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DRAWER FOOTER ACTIONS */}
            <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  triggerToast(`Đã gửi email nhắc nhở ôn tập cá nhân hóa đến ${selectedStudent.email}!`);
                }}
                className="flex-1 py-2 px-3 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Mail size={14} />
                <span>Gửi tài liệu ôn tập cá nhân hóa</span>
              </button>

              <button
                onClick={() => {
                  triggerToast(`Đã đặt lịch hẹn Office Hours với sinh viên ${selectedStudent.name}!`);
                }}
                className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar size={14} className="text-slate-500" />
                <span>Đặt lịch Office Hours</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
