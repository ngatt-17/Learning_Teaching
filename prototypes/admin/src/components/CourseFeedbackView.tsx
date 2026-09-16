import React, { useState } from 'react';
import type { Course } from './CourseCard';
import {
  Star,
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  UserCheck,
  Building2,
  GraduationCap,
  BookOpen,
  CheckSquare,
} from 'lucide-react';

export type FeedbackCategory = 'teacher' | 'material' | 'quality' | 'facility';
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative';
export type ResolutionStatus = 'resolved' | 'in_progress' | 'pending';

export interface StudentFeedbackItem {
  id: string;
  studentName: string;
  studentId: string;
  isAnonymous: boolean;
  avatarColor: string;
  date: string;
  category: FeedbackCategory;
  rating: number; // 1 to 5
  sentiment: FeedbackSentiment;
  title: string;
  comment: string;
  tags: string[];
  status: ResolutionStatus;
  adminNote?: string;
  assignedTo?: string;
}

interface CourseFeedbackViewProps {
  course: Course;
}

export const CourseFeedbackView: React.FC<CourseFeedbackViewProps> = ({ course }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | FeedbackCategory>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | FeedbackSentiment>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ResolutionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Feedback Mock Data covering all 4 required areas
  const [feedbackList, setFeedbackList] = useState<StudentFeedbackItem[]>([
    {
      id: 'fb-01',
      studentName: 'Phạm Hồng Phúc',
      studentId: '22010314',
      isAnonymous: false,
      avatarColor: 'bg-purple-600',
      date: '15/09/2026 18:30',
      category: 'teacher',
      rating: 5,
      sentiment: 'positive',
      title: 'Thầy Tùng giảng rất tận tâm và liên hệ thực tế sâu sắc',
      comment:
        'Thầy Tùng giải thích rất kỹ các thuật toán Heuristic và A*. Các ví dụ về PEAS trong xe tự hành và robot cờ vua giúp em hiểu ngay bản chất lý thuyết thay vì chỉ học thuộc công thức. Giờ Office Hours thầy giải đáp bài tập cực kỳ chu đáo!',
      tags: ['Nhiệt huyết', 'Office Hours', 'Thực tế'],
      status: 'resolved',
      adminNote: 'Đã tổng hợp vào báo cáo đánh giá thi đua giảng viên tháng 9.',
      assignedTo: 'Khoa CECS',
    },
    {
      id: 'fb-02',
      studentName: 'Hoàng Thùy Dương',
      studentId: '22010452',
      isAnonymous: false,
      avatarColor: 'bg-rose-500',
      date: '15/09/2026 14:15',
      category: 'facility',
      rating: 2,
      sentiment: 'negative',
      title: 'Mạng Wifi phòng Lab AI D302 chập chờn khi chạy thực hành RAG',
      comment:
        'Chiều nay lớp thực hành tải mô hình embedding và test chatbot trên nền tảng thì mạng Eduroam tại phòng Lab D302 bị ngắt kết nối liên tục. Máy chiếu phía góc phải màn hình hơi mờ, sinh viên ngồi hàng sau khó nhìn các sơ đồ tác tử.',
      tags: ['Wifi Lab', 'Máy chiếu', 'Phòng Lab D302'],
      status: 'in_progress',
      adminNote: 'Đã báo bộ phận IT và Quản lý cơ sở vật chất kiểm tra router D302.',
      assignedTo: 'Bộ phận IT & CSVC',
    },
    {
      id: 'fb-03',
      studentName: 'Lê Hoàng Nam',
      studentId: '22010091',
      isAnonymous: false,
      avatarColor: 'bg-blue-600',
      date: '14/09/2026 20:45',
      category: 'material',
      rating: 4,
      sentiment: 'positive',
      title: 'Slide bài giảng trực quan, tính năng trích dẫn AI RAG rất tiện lợi',
      comment:
        'Slide bài giảng Chương 1 & 2 trình bày đẹp và mạch lạc. Đặc biệt hệ thống chỉ mục trang kết nối với chatbot AI giúp em tra cứu định nghĩa rất nhanh. Em góp ý slide 24 Chương 2 nên bổ sung thêm hình động mô phỏng bước đi của BFS và DFS.',
      tags: ['Slide đẹp', 'Chỉ mục RAG', 'Minh họa động'],
      status: 'resolved',
      adminNote: 'Đã chuyển góp ý hình động cho giảng viên cập nhật vào bản slide v2.',
      assignedTo: 'Dr. Nguyễn Thanh Tùng',
    },
    {
      id: 'fb-04',
      studentName: 'Sinh viên ẩn danh',
      studentId: '2201****',
      isAnonymous: true,
      avatarColor: 'bg-slate-600',
      date: '13/09/2026 16:20',
      category: 'quality',
      rating: 3,
      sentiment: 'neutral',
      title: 'Đề thi Quiz chương 1 câu 4 hơi bẫy và thời gian hơi ngắn',
      comment:
        'Câu hỏi phân biệt Tác tử phản xạ và Tác tử có mô hình ở bài quiz chương 1 có nhiều từ đồng nghĩa gây nhầm lẫn. Đề 10 câu trắc nghiệm làm trong 15 phút với nhiều câu tình huống dài hơi gấp, mong khóa học tăng lên 20 phút để sinh viên suy nghĩ kỹ.',
      tags: ['Độ khó Quiz', 'Thời gian làm bài', 'Bẫy lý thuyết'],
      status: 'pending',
      adminNote: 'Cần thảo luận cùng giảng viên về việc điều chỉnh thời gian làm quiz.',
      assignedTo: 'Hội đồng chuyên môn môn học',
    },
    {
      id: 'fb-05',
      studentName: 'Đỗ Minh Quân',
      studentId: '22010889',
      isAnonymous: false,
      avatarColor: 'bg-emerald-600',
      date: '12/09/2026 11:05',
      category: 'facility',
      rating: 5,
      sentiment: 'positive',
      title: 'Hệ thống Server GPU cluster cấp phát cho sinh viên chạy rất mượt',
      comment:
        'Trường cấp tài nguyên tính toán GPU trên Learning Hub chạy suy luận các mô hình rất nhanh, không bị nghẽn lệnh. Môi trường phòng học thoáng mát, điều hòa hoạt động tốt.',
      tags: ['Server GPU', 'Điều hòa', 'Phòng học'],
      status: 'resolved',
      adminNote: 'Ghi nhận phản hồi tích cực về hạ tầng máy chủ AI.',
      assignedTo: 'Ban Quản trị Hạ tầng',
    },
    {
      id: 'fb-06',
      studentName: 'Vũ Thảo Nguyên',
      studentId: '22010567',
      isAnonymous: false,
      avatarColor: 'bg-amber-600',
      date: '10/09/2026 09:30',
      category: 'teacher',
      rating: 5,
      sentiment: 'positive',
      title: 'Tốc độ giảng dạy phù hợp, phản hồi email thắc mắc trong vòng 2 giờ',
      comment:
        'Thầy Tùng và trợ giảng phản hồi các thắc mắc về code bài tập trên diễn đàn cực nhanh. Bài tập có thang rubric rõ ràng giúp chúng em tự đánh giá được điểm số của mình.',
      tags: ['Phản hồi nhanh', 'Rubric rõ ràng', 'Hỗ trợ bài tập'],
      status: 'resolved',
      adminNote: 'Khen ngợi tinh thần hỗ trợ người học của đội ngũ giảng dạy.',
      assignedTo: 'Khoa CECS',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Toggle status resolution
  const handleUpdateStatus = (feedbackId: string, nextStatus: ResolutionStatus) => {
    setFeedbackList((prev) =>
      prev.map((fb) => {
        if (fb.id === feedbackId) {
          const updated = { ...fb, status: nextStatus };
          showToast(
            nextStatus === 'resolved'
              ? `Đã đánh dấu phản hồi "${fb.title}" là ĐÃ XỬ LÝ.`
              : nextStatus === 'in_progress'
              ? `Đã chuyển phản hồi "${fb.title}" sang trạng thái ĐANG XỬ LÝ.`
              : `Đã chuyển phản hồi "${fb.title}" về CHỜ XỬ LÝ.`
          );
          return updated;
        }
        return fb;
      })
    );
  };

  // Calculations for KPI Summary
  const totalFeedbacks = feedbackList.length;
  const avgRating = (
    feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / (totalFeedbacks || 1)
  ).toFixed(1);

  const positiveCount = feedbackList.filter((fb) => fb.rating >= 4).length;
  const positivePercentage = Math.round((positiveCount / (totalFeedbacks || 1)) * 100);

  const pendingCount = feedbackList.filter((fb) => fb.status === 'pending' || fb.status === 'in_progress').length;

  // Category average ratings
  const getCategoryStats = (cat: FeedbackCategory) => {
    const items = feedbackList.filter((fb) => fb.category === cat);
    if (items.length === 0) return { avg: 5.0, count: 0 };
    const avg = items.reduce((acc, curr) => acc + curr.rating, 0) / items.length;
    return { avg: Number(avg.toFixed(1)), count: items.length };
  };

  const teacherStats = getCategoryStats('teacher');
  const materialStats = getCategoryStats('material');
  const qualityStats = getCategoryStats('quality');
  const facilityStats = getCategoryStats('facility');

  // Filtered feedbacks
  const filteredFeedbacks = feedbackList.filter((fb) => {
    const matchesCategory = selectedCategory === 'all' || fb.category === selectedCategory;
    const matchesSentiment = selectedSentiment === 'all' || fb.sentiment === selectedSentiment;
    const matchesStatus = selectedStatus === 'all' || fb.status === selectedStatus;
    const matchesSearch =
      fb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSentiment && matchesStatus && matchesSearch;
  });

  const getCategoryBadge = (category: FeedbackCategory) => {
    switch (category) {
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1E3A6E] border border-blue-200">
            <GraduationCap size={12} />
            <span>Thầy cô & Giảng dạy</span>
          </span>
        );
      case 'material':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BookOpen size={12} />
            <span>Bài giảng & Slide</span>
          </span>
        );
      case 'quality':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <CheckSquare size={12} />
            <span>Chất lượng & Quiz</span>
          </span>
        );
      case 'facility':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Building2 size={12} />
            <span>Cơ sở vật chất & Hạ tầng</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: ResolutionStatus) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={12} />
            <span>Đã xử lý</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={12} />
            <span>Đang xử lý</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle size={12} />
            <span>Chờ ghi nhận</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="bg-[#1E3A6E] text-white px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white text-xs cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Khảo sát & Phản hồi sinh viên</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                Admin Analytics
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, phân loại và xử lý toàn diện các phản hồi của người học về giảng viên, bài giảng, chất lượng khảo thí và hạ tầng phòng lab.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Đã đồng bộ và trích xuất toàn bộ dữ liệu phản hồi khóa học sang Excel!')}
            className="px-3.5 py-2 border border-slate-300 hover:bg-white bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Send size={13} />
            <span>Xuất báo cáo Admin</span>
          </button>
        </div>
      </div>

      {/* 4 TOP-LEVEL KPI OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Điểm hài lòng trung bình */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Độ hài lòng chung</span>
            <Star size={16} className="text-amber-500 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-[#1E3A6E]">{avgRating}</span>
            <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>★ {positivePercentage}% Đánh giá xuất sắc</span>
          </div>
        </div>

        {/* Card 2: Tổng lượt phản hồi */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Tổng số phản hồi</span>
            <MessageSquare size={16} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-slate-900">{totalFeedbacks}</span>
            <span className="text-xs text-slate-500 font-normal">lượt gửi</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Từ {course.enrolledStudents} sinh viên đang theo học
          </div>
        </div>

        {/* Card 3: Tỉ lệ phản hồi tích cực */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Tỉ lệ tích cực</span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-emerald-600">{positivePercentage}%</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {positiveCount} trên {totalFeedbacks} đánh giá từ 4-5 sao
          </div>
        </div>

        {/* Card 4: Vấn đề cần xử lý */}
        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold mb-1">
            <span>Vấn đề cần can thiệp</span>
            <AlertCircle size={16} className="text-rose-600" />
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-rose-700">{pendingCount}</span>
            <span className="text-xs text-rose-600 font-medium">vấn đề</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium">
            IT Lab & điều chỉnh độ khó Quiz
          </div>
        </div>
      </div>

      {/* 4 SPECIFIC CATEGORY BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Thầy cô & Giảng dạy */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'teacher' ? 'all' : 'teacher')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'teacher'
              ? 'bg-blue-50/90 border-[#1E3A6E] shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-100 text-[#1E3A6E]">
              <GraduationCap size={18} />
            </div>
            <span className="text-sm font-extrabold text-[#1E3A6E]">{teacherStats.avg} ★</span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Thầy cô & Giảng dạy</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{teacherStats.count} phản hồi • Tận tâm, nhiệt tình</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-[#1E3A6E] h-1.5 rounded-full"
              style={{ width: `${(teacherStats.avg / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* 2. Bài giảng & Slide */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'material' ? 'all' : 'material')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'material'
              ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <BookOpen size={18} />
            </div>
            <span className="text-sm font-extrabold text-emerald-700">{materialStats.avg} ★</span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Bài giảng & Slide</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{materialStats.count} phản hồi • Trực quan, tra cứu RAG tốt</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${(materialStats.avg / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* 3. Chất lượng khóa học & Quiz */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'quality' ? 'all' : 'quality')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'quality'
              ? 'bg-purple-50/90 border-purple-600 shadow-xs'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
              <CheckSquare size={18} />
            </div>
            <span className="text-sm font-extrabold text-purple-700">{qualityStats.avg} ★</span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Chất lượng khóa học & Quiz</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{qualityStats.count} phản hồi • Quiz có tính phân hóa</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{ width: `${(qualityStats.avg / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* 4. Cơ sở vật chất & Hạ tầng */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'facility' ? 'all' : 'facility')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedCategory === 'facility'
              ? 'bg-amber-50/90 border-amber-600 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Building2 size={18} />
            </div>
            <span className="text-sm font-extrabold text-amber-700">{facilityStats.avg} ★</span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Cơ sở vật chất & Hạ tầng</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{facilityStats.count} phản hồi • Wifi phòng D302 cần xử lý</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-amber-600 h-1.5 rounded-full"
              style={{ width: `${(facilityStats.avg / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI SOCRATIC SENTIMENT & EXECUTIVE ACTION SUMMARY (Admin-exclusive intelligence) */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/80 border border-indigo-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1E3A6E] text-amber-400 rounded-xl shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Tổng hợp thông minh từ trợ lý AI Admin (Sentiment Analytics)
              </h4>
              <p className="text-[11px] text-slate-500">
                Phân tích cảm xúc đa chiều từ toàn bộ ý kiến khảo sát sinh viên trong học kỳ
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-3 py-1 rounded-full">
            Độ tin cậy: 98.4%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3.5 bg-white/90 border border-emerald-200 rounded-xl space-y-1.5 shadow-2xs">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Điểm sáng nổi bật (Praise Points):</span>
            </div>
            <ul className="text-slate-600 text-[11px] space-y-1 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Giảng viên & Trợ giảng:</strong> Nhận được sự đánh giá rất cao (4.8/5.0) về thái độ nhiệt tình, tốc độ giải đáp thắc mắc và tính ứng dụng thực tiễn trong bài giảng.
              </li>
              <li>
                <strong>Tài nguyên học tập:</strong> Slide bài giảng được khen ngợi rõ ràng; hệ thống chỉ mục trang RAG giúp ôn tập hiệu quả.
              </li>
              <li>
                <strong>Cụm Server GPU:</strong> Cấp phát tài nguyên cho bài tập lớn AI nhận được phản hồi tích cực từ sinh viên khá giỏi.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-white/90 border border-amber-200 rounded-xl space-y-1.5 shadow-2xs">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-600" />
              <span>Khuyến nghị hành động cho Ban Quản trị (Actionable Items):</span>
            </div>
            <ul className="text-slate-600 text-[11px] space-y-1 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Hạ tầng phòng Lab D302:</strong> Cần bộ phận IT kiểm tra lại bộ phát wifi và căn chỉnh lại độ sáng máy chiếu phòng D302 trước buổi học ngày mai.
              </li>
              <li>
                <strong>Thời gian làm bài Quiz:</strong> Khuyến nghị giảng viên cân nhắc tăng thêm 3-5 phút cho các đề trắc nghiệm có tình huống dài ở Chương 1 & 2.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo nội dung phản hồi, sinh viên, MSSV, từ khóa (wifi, slide, câu hỏi, đề thi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E3A6E] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Clear Filter */}
          {(selectedCategory !== 'all' || selectedSentiment !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSentiment('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 transition-colors cursor-pointer shrink-0"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phân loại:</span>

          {/* Category Pills */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#1E3A6E] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Tất cả danh mục ({feedbackList.length})
          </button>
          <button
            onClick={() => setSelectedCategory('teacher')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              selectedCategory === 'teacher'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-[#1E3A6E]'
            }`}
          >
            Thầy cô & Giảng dạy ({feedbackList.filter((f) => f.category === 'teacher').length})
          </button>
          <button
            onClick={() => setSelectedCategory('material')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              selectedCategory === 'material'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            Bài giảng & Slide ({feedbackList.filter((f) => f.category === 'material').length})
          </button>
          <button
            onClick={() => setSelectedCategory('quality')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              selectedCategory === 'quality'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800'
            }`}
          >
            Chất lượng & Quiz ({feedbackList.filter((f) => f.category === 'quality').length})
          </button>
          <button
            onClick={() => setSelectedCategory('facility')}
            className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              selectedCategory === 'facility'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            Cơ sở vật chất ({feedbackList.filter((f) => f.category === 'facility').length})
          </button>

          <span className="text-slate-300 mx-1">|</span>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-slate-100 text-slate-700 text-xs py-1 px-2.5 rounded-lg border border-slate-200 cursor-pointer focus:outline-none"
          >
            <option value="all">Mọi trạng thái xử lý</option>
            <option value="pending">Chờ ghi nhận</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
          </select>
        </div>
      </div>

      {/* FEEDBACK CARDS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Hiển thị <strong>{filteredFeedbacks.length}</strong> phản hồi phù hợp
          </span>
          <span className="text-[11px]">Sắp xếp: Mới nhất trước</span>
        </div>

        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-3 ${
                fb.rating <= 2 ? 'border-rose-200' : 'border-slate-200'
              }`}
            >
              {/* Card Top Row: Student info, date, category & status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${fb.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {fb.studentName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(-2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{fb.studentName}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({fb.studentId})</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{fb.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getCategoryBadge(fb.category)}
                  {getStatusBadge(fb.status)}
                </div>
              </div>

              {/* Card Rating and Title */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{fb.rating}.0 / 5.0</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{fb.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  "{fb.comment}"
                </p>
              </div>

              {/* Tags and Admin Resolution Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {fb.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Admin Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {fb.status !== 'resolved' ? (
                    <button
                      onClick={() => handleUpdateStatus(fb.id, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Đánh dấu vấn đề này đã được xử lý"
                    >
                      <CheckCircle2 size={13} />
                      <span>Đánh dấu Đã xử lý</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(fb.id, 'in_progress')}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Mở lại phản hồi này"
                    >
                      <Clock size={13} />
                      <span>Mở lại xử lý</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      showToast(
                        `Đã chuyển tiếp phản hồi của ${fb.studentName} đến đơn vị phụ trách (${fb.assignedTo || 'CECS'})!`
                      )
                    }
                    className="px-3 py-1.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Chuyển tiếp cho giảng viên hoặc phòng ban liên quan"
                  >
                    <Send size={13} />
                    <span>Chuyển tiếp</span>
                  </button>
                </div>
              </div>

              {/* Admin Note Box if available */}
              {fb.adminNote && (
                <div className="text-[11px] bg-indigo-50/70 border border-indigo-200/70 rounded-lg px-3 py-2 text-indigo-900 flex items-start gap-2">
                  <span className="font-bold shrink-0">Ghi chú Admin:</span>
                  <span>{fb.adminNote}</span>
                  {fb.assignedTo && (
                    <span className="ml-auto shrink-0 font-semibold text-[10px] bg-indigo-200/80 px-2 py-0.2 rounded-full">
                      Phụ trách: {fb.assignedTo}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">
            <p className="font-semibold text-slate-700 text-sm">Không tìm thấy phản hồi nào</p>
            <p className="text-xs mt-1">Vui lòng điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phân loại.</p>
          </div>
        )}
      </div>
    </div>
  );
};
