import React, { useState } from 'react';
import type { Course } from './CourseCard';
import {
  ArrowLeft,
  Upload,
  FileText,
  BarChart2,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  HelpCircle,
  CheckCircle,
  Sparkles,
  Layers,
  Library,
} from 'lucide-react';
import { SlideView } from './SlideView';
import { ReportView } from './ReportView';
import { CreateQuizView } from './CreateQuizView';
import { StudentRosterView } from './StudentRosterView';
import { UploadModal, type UploadedSlideData } from './UploadModal';

export interface SlideItem {
  id: string;
  fileName: string;
  title?: string;
  pageCount: number;
  fileSize: string;
  statusNote: string;
  fileUrl?: string;
}

export interface QuizItem {
  id: string;
  title: string;
  questionCount: number;
  sourceSlides: string[];
  isApproved: boolean;
  completedStudents: number;
  totalStudents: number;
  averageScore: number;
  statusText: string;
  isComprehensive?: boolean;
  targetChapters?: string[];
}

export interface ChapterItem {
  id: string;
  title: string;
  isPublished: boolean;
  slides: SlideItem[];
  quizzes: QuizItem[];
}

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, onBack }) => {
  const [courseTab, setCourseTab] = useState<'Home' | 'Quiz' | 'Students'>('Home');

  // Page routing state (replaces popups with full-screen pages)
  const [activeView, setActiveView] = useState<'course' | 'report' | 'create-quiz' | 'view-slide'>('course');
  const [activeChapterId, setActiveChapterId] = useState<string>('ch1');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuizTitle, setActiveQuizTitle] = useState<string | null>(null);
  const [isComprehensiveQuiz, setIsComprehensiveQuiz] = useState<boolean>(false);
  const [activeSlide, setActiveSlide] = useState<SlideItem | null>(null);

  // Comprehensive Quizzes (Bộ đề Quiz tổng hợp liên chương)
  const [comprehensiveQuizzes, setComprehensiveQuizzes] = useState<QuizItem[]>([
    {
      id: 'comp_q1',
      title: 'Quiz tổng hợp kiến thức: Tổng quan AI & Tìm kiếm mù',
      questionCount: 15,
      sourceSlides: ['AI(1).pdf', 'AI(2).pdf'],
      isApproved: true,
      completedStudents: 52,
      totalStudents: course.enrolledStudents || 74,
      averageScore: 7.9,
      statusText: 'Đã phát hành • 52/74 sinh viên đã hoàn thành',
      isComprehensive: true,
      targetChapters: ['Chương 1: Giới thiệu về trí tuệ nhân tạo', 'Chương 2: Tìm kiếm mù'],
    },
  ]);

  // Upload modal state & alert
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Mock chapters state with support for multiple slides and multiple quizzes per chapter
  const [chapters, setChapters] = useState<ChapterItem[]>([
    {
      id: 'ch1',
      title: 'Chương 1: Giới thiệu về trí tuệ nhân tạo',
      isPublished: true,
      slides: [
        {
          id: 's1',
          fileName: 'AI(1).pdf',
          title: 'Bài giảng Tổng quan AI & Khung tác tử thông minh',
          pageCount: 28,
          fileSize: '4.5 MB',
          statusNote: '28 trang • 4.5 MB • Đã phân tích RAG và lập chỉ mục trang',
        },
      ],
      quizzes: [
        {
          id: 'q1_1',
          title: 'Quiz 1: Giới thiệu AI & Khung tác tử thông minh (PEAS)',
          questionCount: 10,
          sourceSlides: ['AI(1).pdf'],
          isApproved: true,
          completedStudents: 68,
          totalStudents: 74,
          averageScore: 8.4,
          statusText: 'Câu hỏi quiz đã được duyệt • 68/74 sinh viên đã hoàn thành',
        },
      ],
    },
    {
      id: 'ch2',
      title: 'Chương 2: Tìm kiếm mù',
      isPublished: false,
      slides: [
        {
          id: 's2',
          fileName: 'AI(2).pdf',
          title: 'Bài giảng Thuật toán tìm kiếm mù (BFS, DFS, UCS)',
          pageCount: 36,
          fileSize: '5.8 MB',
          statusNote: '36 trang • 5.8 MB • Mới tải lên (Chưa tạo quiz để phát hành)',
        },
      ],
      quizzes: [],
    },
  ]);



  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Toggle publish status on button click
  const handleTogglePublish = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id === chapterId) {
          const nextStatus = !ch.isPublished;
          triggerToast(
            nextStatus
              ? `Đã xuất bản "${ch.title}" thành công cho sinh viên!`
              : `Đã chuyển "${ch.title}" về trạng thái Chưa xuất bản (Bản nháp).`
          );
          return { ...ch, isPublished: nextStatus };
        }
        return ch;
      })
    );
  };

  // Open slide continuous reader
  const handleOpenSlide = (chapterId: string, slide: SlideItem) => {
    setActiveChapterId(chapterId);
    setActiveSlide(slide);
    setActiveView('view-slide');
  };

  // Open report full page for a specific quiz
  const handleOpenReport = (chapterId: string, quizId?: string, customTitle?: string) => {
    setActiveChapterId(chapterId);
    setActiveQuizId(quizId || null);
    setActiveQuizTitle(customTitle || null);
    setActiveView('report');
  };

  // Open create quiz full page (Supports both single-chapter and comprehensive multi-chapter)
  const handleOpenCreateQuiz = (chapterId?: string, isComprehensive: boolean = false) => {
    setIsComprehensiveQuiz(isComprehensive);
    if (chapterId) {
      setActiveChapterId(chapterId);
    } else if (chapters.length > 0) {
      setActiveChapterId(chapters[0].id);
    }
    setActiveView('create-quiz');
  };

  // Publish quiz from CreateQuizView (Handles comprehensive quizzes and chapter quizzes)
  const handlePublishQuizSuccess = (quizData: {
    title: string;
    count: number;
    selectedSlides: string[];
    isComprehensive?: boolean;
    targetChapterTitles?: string[];
  }) => {
    if (quizData.isComprehensive) {
      const newQuiz: QuizItem = {
        id: `comp_${Date.now()}`,
        title: quizData.title,
        questionCount: quizData.count,
        sourceSlides: quizData.selectedSlides,
        isApproved: true,
        completedStudents: 0,
        totalStudents: course.enrolledStudents || 74,
        averageScore: 0,
        statusText: `Mới phát hành (${quizData.count} câu) • 0/${course.enrolledStudents || 74} sinh viên hoàn thành`,
        isComprehensive: true,
        targetChapters: quizData.targetChapterTitles,
      };

      setComprehensiveQuizzes((prev) => [newQuiz, ...prev]);
      setActiveView('course');
      setCourseTab('Quiz');
      triggerToast(`Đã xuất bản bài Quiz tổng hợp "${quizData.title}" (${quizData.count} câu) thành công!`);
    } else {
      setChapters((prev) =>
        prev.map((ch) => {
          if (ch.id === activeChapterId) {
            const newQuiz: QuizItem = {
              id: `q_${Date.now()}`,
              title: quizData.title,
              questionCount: quizData.count,
              sourceSlides: quizData.selectedSlides,
              isApproved: true,
              completedStudents: 0,
              totalStudents: course.enrolledStudents,
              averageScore: 0,
              statusText: `Mới phát hành (${quizData.count} câu) • 0/${course.enrolledStudents} sinh viên hoàn thành`,
            };

            return {
              ...ch,
              isPublished: true, // Auto publish chapter when a quiz is published
              quizzes: [...ch.quizzes, newQuiz],
            };
          }
          return ch;
        })
      );
      setActiveView('course');
      triggerToast(`Đã xuất bản "${quizData.title}" (${quizData.count} câu) cho chương học thành công!`);
    }
  };

  // Upload handler with local device multiple slides & titles
  const handleUploadSuccess = (result: {
    mode: 'existing' | 'new';
    chapterId?: string;
    newChapterTitle?: string;
    uploadedSlides: UploadedSlideData[];
    autoPublish: boolean;
  }) => {
    if (result.mode === 'new' && result.newChapterTitle) {
      const newCh: ChapterItem = {
        id: `ch_${Date.now()}`,
        title: result.newChapterTitle,
        isPublished: result.autoPublish,
        slides: result.uploadedSlides.map((s) => ({
          id: s.id,
          fileName: s.fileName,
          title: s.title,
          pageCount: s.pageCount,
          fileSize: s.fileSize,
          statusNote: s.ragMessage,
          fileUrl: s.fileUrl,
        })),
        quizzes: [],
      };
      setChapters((prev) => [...prev, newCh]);
      triggerToast(
        `Đã tạo mới "${result.newChapterTitle}" và tải lên thành công ${result.uploadedSlides.length} slide bài giảng!`
      );
    } else if (result.mode === 'existing' && result.chapterId) {
      setChapters((prev) =>
        prev.map((ch) => {
          if (ch.id === result.chapterId) {
            const addedSlides: SlideItem[] = result.uploadedSlides.map((s) => ({
              id: s.id,
              fileName: s.fileName,
              title: s.title,
              pageCount: s.pageCount,
              fileSize: s.fileSize,
              statusNote: s.ragMessage,
              fileUrl: s.fileUrl,
            }));
            return {
              ...ch,
              isPublished: result.autoPublish ? true : ch.isPublished,
              slides: [...ch.slides, ...addedSlides],
            };
          }
          return ch;
        })
      );
      triggerToast(`Đã bổ sung ${result.uploadedSlides.length} slide bài giảng vào chương thành công!`);
    }
  };

  const currentActiveChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];
  const totalQuizzesCount =
    chapters.reduce((acc, c) => acc + c.quizzes.length, 0) + comprehensiveQuizzes.length;

  // SUB-PAGES RENDERING
  if (activeView === 'view-slide') {
    return (
      <SlideView
        courseCode={course.code}
        courseName={course.name}
        chapterTitle={currentActiveChapter.title}
        slideName={activeSlide?.fileName || 'Slide.pdf'}
        slideTitle={activeSlide?.title}
        fileUrl={activeSlide?.fileUrl}
        onBack={() => setActiveView('course')}
        onGoToQuiz={() => {
          handleOpenCreateQuiz(currentActiveChapter.id, false);
        }}
      />
    );
  }

  if (activeView === 'report') {
    return (
      <ReportView
        courseCode={course.code}
        courseName={course.name}
        chapterTitle={currentActiveChapter.title}
        quizTitle={activeQuizTitle || undefined}
        onBack={() => setActiveView('course')}
      />
    );
  }

  if (activeView === 'create-quiz') {
    return (
      <CreateQuizView
        courseCode={course.code}
        courseName={course.name}
        chapterTitle={currentActiveChapter.title}
        availableSlides={currentActiveChapter.slides.map((s) => ({
          id: s.id,
          name: s.fileName,
          title: s.title,
          pageCount: s.pageCount,
        }))}
        allChapters={chapters.map((c) => ({
          id: c.id,
          title: c.title,
          slides: c.slides.map((s) => ({
            id: s.id,
            name: s.fileName,
            title: s.title,
            pageCount: s.pageCount,
          })),
        }))}
        isComprehensiveDefault={isComprehensiveQuiz}
        onBack={() => setActiveView('course')}
        onPublishQuiz={handlePublishQuizSuccess}
      />
    );
  }

  // DEFAULT VIEW: MAIN COURSE WORKSPACE
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* TOAST SUCCESS BANNER */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md z-30 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-white" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-white/80 hover:text-white text-xs cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP COURSE HEADER (Docked edge-to-edge) */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Quay lại danh sách khóa học"
          >
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <span className="text-slate-300">|</span>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {course.code} • {course.department}
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1E3A6E] tracking-tight">
              Welcome to {course.code.split('-')[1] || course.code}: {course.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1E3A6E] border border-blue-200/60">
            <Users size={13} />
            <span>{course.enrolledStudents} Sinh viên</span>
          </span>
        </div>
      </header>

      {/* WORKSPACE BODY WITH DOCKED LEFT SUB-NAV */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* LEFT SUB-NAVIGATION TABS (Docked directly against the dark-blue sidebar) */}
        <aside className="w-48 sm:w-56 bg-white border-r border-slate-200 p-4 shrink-0 flex flex-col justify-between h-full">
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
              Khóa học
            </div>

            {/* Tab 1: Home */}
            <button
              onClick={() => setCourseTab('Home')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left cursor-pointer ${
                courseTab === 'Home'
                  ? 'bg-[#1E3A6E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Home</span>
            </button>

            {/* Tab 2: Quiz */}
            <button
              onClick={() => setCourseTab('Quiz')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left cursor-pointer ${
                courseTab === 'Quiz'
                  ? 'bg-[#1E3A6E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Quiz</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full ${
                  courseTab === 'Quiz' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {totalQuizzesCount}
              </span>
            </button>

            {/* Tab 3: Students */}
            <button
              onClick={() => setCourseTab('Students')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-left cursor-pointer ${
                courseTab === 'Students'
                  ? 'bg-[#1E3A6E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>Students</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full ${
                  courseTab === 'Students' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {course.enrolledStudents}
              </span>
            </button>
          </nav>

          {/* Quick Help box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
              <HelpCircle size={14} className="text-[#1E3A6E]" />
              <span>Ghi chú AI Tutor</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Mọi tài liệu PDF sau khi upload từ máy cá nhân sẽ được lập chỉ mục trang tự động cho trợ lý AI Socratic.
            </p>
          </div>
        </aside>

        {/* MAIN TAB CONTENT AREA (Scrollbar on the right edge of screen) */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
            {/* TAB: HOME */}
            {courseTab === 'Home' && (
              <>
                {/* TOP ACTION: UPLOAD BUTTON */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-5 py-2.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-sm font-semibold rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>Upload bài giảng</span>
                  </button>

                  <span className="text-xs text-slate-500">
                    Tổng số chương: <strong className="text-slate-800">{chapters.length}</strong> • Đã xuất bản:{' '}
                    <strong className="text-emerald-600">
                      {chapters.filter((c) => c.isPublished).length}
                    </strong>
                  </span>
                </div>

                {/* LIST OF CHAPTERS */}
                <div className="space-y-6">
                  {chapters.map((chapter) => {
                    const isPublished = chapter.isPublished;

                    return (
                      <div
                        key={chapter.id}
                        className={`rounded-xl shadow-2xs overflow-hidden transition-all border ${
                          isPublished
                            ? 'bg-white border-slate-200 hover:shadow-md'
                            : 'bg-slate-50/80 border-slate-300/80 text-slate-600'
                        }`}
                      >
                        {/* Chapter Header Row */}
                        <div
                          className={`p-4 sm:px-6 flex items-center justify-between border-b ${
                            isPublished ? 'border-slate-100 bg-white' : 'border-slate-200 bg-slate-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-bold text-base ${
                                isPublished ? 'text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {chapter.title}
                            </h3>
                          </div>

                          {/* INTERACTIVE PUBLISH BUTTON (Xanh nếu đã xuất bản, Xám nếu chưa xuất bản) */}
                          <button
                            onClick={() => handleTogglePublish(chapter.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                              isPublished
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                            }`}
                            title={
                              isPublished
                                ? 'Đã xuất bản (Nhấn để chuyển về bản nháp)'
                                : 'Chưa xuất bản (Nhấn để xuất bản cho sinh viên)'
                            }
                          >
                            {isPublished ? (
                              <>
                                <CheckCircle2 size={13} className="text-white" />
                                <span>Đã xuất bản</span>
                              </>
                            ) : (
                              <>
                                <Clock size={13} className="text-slate-500" />
                                <span>Chưa xuất bản</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* LIST OF SLIDES IN THIS CHAPTER (Supports multiple slides per chapter) */}
                        <div className="divide-y divide-slate-100">
                          {chapter.slides.map((slide) => (
                            <div
                              key={slide.id}
                              className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isPublished ? 'bg-white' : 'bg-slate-50/50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-2 rounded-lg shrink-0 ${
                                    isPublished ? 'bg-red-50 text-[#C8232C]' : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      onClick={() => handleOpenSlide(chapter.id, slide)}
                                      className={`font-bold text-sm cursor-pointer hover:underline ${
                                        isPublished
                                          ? 'text-slate-800 hover:text-[#1E3A6E]'
                                          : 'text-slate-700 hover:text-slate-900'
                                      }`}
                                    >
                                      {slide.fileName}
                                    </span>
                                    {slide.title && (
                                      <span className="text-xs text-slate-600 font-medium">
                                        — {slide.title}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">{slide.statusNote}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                <button
                                  onClick={() => handleOpenSlide(chapter.id, slide)}
                                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer font-semibold ${
                                    isPublished
                                      ? 'text-slate-700 hover:text-[#1E3A6E] hover:bg-slate-100 border-slate-200'
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-slate-300'
                                  }`}
                                  title="Mở toàn màn hình xem slide dạng cuộn dọc nền trắng"
                                >
                                  <Eye size={13} />
                                  <span>{isPublished ? 'Xem slide' : 'Xem trước'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* QUIZZES SECTION (Requirement: Cho phép tạo nhiều quiz, mỗi quiz có xem báo cáo, và bên dưới có nút tạo thêm quiz) */}
                        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:px-6 space-y-3">
                          {/* List of existing quizzes in this chapter */}
                          {chapter.quizzes.length > 0 ? (
                            <div className="space-y-2.5">
                              {chapter.quizzes.map((quiz, qIdx) => (
                                <div
                                  key={quiz.id}
                                  className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-[#1E3A6E] text-white flex items-center justify-center text-[10px] font-bold">
                                        Q{qIdx + 1}
                                      </span>
                                      <span className="font-bold text-xs text-slate-800">
                                        {quiz.title}
                                      </span>
                                      <span className="text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full">
                                        {quiz.questionCount} câu
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 ml-7">
                                      {quiz.statusText}
                                      {quiz.averageScore > 0 && ` • Điểm TB: ${quiz.averageScore}/10`}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => handleOpenReport(chapter.id, quiz.id)}
                                    className="px-3.5 py-1.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs self-start sm:self-auto"
                                    title="Mở toàn trang xem báo cáo chi tiết"
                                  >
                                    <BarChart2 size={13} />
                                    <span>Xem báo cáo</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 py-1">
                              <span className="font-medium text-slate-600">Trạng thái bài tập: </span>
                              <span>Chưa tạo câu hỏi quiz cho chương này</span>
                            </div>
                          )}

                          {/* ACTION BUTTON: TẠO THÊM QUIZ DƯỚI MỖI CHƯƠNG */}
                          <div className="pt-1 flex items-center justify-between">
                            <button
                              onClick={() => handleOpenCreateQuiz(chapter.id, true)}
                              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#1E3A6E] border border-blue-200 hover:border-blue-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Tạo thêm bài tập quiz mới cho chương này"
                            >
                              <PlusCircle size={14} className="text-[#1E3A6E]" />
                              <span>
                                {chapter.quizzes.length > 0
                                  ? '+ Tạo thêm quiz'
                                  : 'Tạo quiz'}
                              </span>
                            </button>

                            {chapter.quizzes.length > 0 && (
                              <span className="text-[11px] text-slate-400">
                                Đã có {chapter.quizzes.length} bộ đề quiz cho chương này
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB: QUIZ */}
            {courseTab === 'Quiz' && (
              <div className="space-y-6">
                {/* TAB HEADER & ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Ngân hàng câu hỏi & Luyện tập ({course.code})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quản lý các bộ đề thi trắc nghiệm: Đề thi tổng hợp liên chương & Đề kiểm tra theo từng bài học.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {/* BUTTON: TẠO QUIZ TỔNG HỢP (Exclusive Quiz creation action) */}
                    <button
                      onClick={() => handleOpenCreateQuiz(undefined, true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#1E3A6E] to-indigo-800 hover:from-[#14274E] hover:to-indigo-900 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
                      title="Tạo bài kiểm tra tổng hợp kiến thức từ các bài/chương và slide bài giảng"
                    >
                      <Sparkles size={14} className="text-amber-400" />
                      <span>+ Tạo Quiz tổng hợp</span>
                    </button>
                  </div>
                </div>

                {/* SECTION 1: QUIZ TỔNG HỢP LIÊN CHƯƠNG */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-purple-100 text-purple-800">
                        <Library size={16} />
                      </span>
                      <h4 className="font-bold text-sm text-slate-800">
                        Bộ đề Quiz tổng hợp liên chương ({comprehensiveQuizzes.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Đề thi tích hợp nhiều bài giảng & chương học
                    </span>
                  </div>

                  {comprehensiveQuizzes.length > 0 ? (
                    <div className="space-y-3">
                      {comprehensiveQuizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="bg-white border-2 border-purple-200/80 hover:border-purple-300 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                <Sparkles size={11} className="text-purple-600" />
                                <span>Quiz tổng hợp liên chương</span>
                              </span>
                              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                {quiz.questionCount} câu hỏi
                              </span>
                            </div>

                            <h5 className="font-bold text-sm sm:text-base text-slate-900">
                              {quiz.title}
                            </h5>

                            {quiz.targetChapters && quiz.targetChapters.length > 0 && (
                              <p className="text-xs text-indigo-700 font-medium flex items-center gap-1 flex-wrap">
                                <span className="text-slate-400">Phạm vi:</span>
                                {quiz.targetChapters.join(' • ')}
                              </p>
                            )}

                            <p className="text-xs text-slate-500">
                              {quiz.statusText} • Điểm trung bình:{' '}
                              <span className="font-semibold text-slate-700">
                                {quiz.averageScore > 0 ? `${quiz.averageScore}/10` : 'Đang cập nhật'}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <button
                              onClick={() =>
                                handleOpenReport(chapters[0]?.id || 'ch1', quiz.id, quiz.title)
                              }
                              className="px-3.5 py-2 text-xs font-semibold bg-[#1E3A6E] hover:bg-[#14274E] text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Xem báo cáo chi tiết cho bài quiz tổng hợp này"
                            >
                              <BarChart2 size={13} />
                              <span>Xem báo cáo</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs text-slate-500">
                      Chưa có đề thi quiz tổng hợp nào. Nhấn "+ Tạo Quiz tổng hợp" để tạo bài kiểm tra liên chương.
                    </div>
                  )}
                </div>

                {/* SECTION 2: QUIZ THEO TỪNG CHƯƠNG */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-100 text-[#1E3A6E]">
                        <Layers size={16} />
                      </span>
                      <h4 className="font-bold text-sm text-slate-800">
                        Đề thi Quiz theo từng chương học (
                        {chapters.reduce((acc, c) => acc + c.quizzes.length, 0)})
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {chapters.flatMap((c) =>
                      c.quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-sm text-slate-900">{quiz.title}</h5>
                              <span className="text-[11px] font-semibold bg-blue-50 text-[#1E3A6E] border border-blue-200 px-2 py-0.5 rounded-full">
                                {c.title}
                              </span>
                              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                {quiz.questionCount} câu
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {quiz.statusText} • Điểm trung bình:{' '}
                              <span className="font-semibold text-slate-700">
                                {quiz.averageScore > 0 ? `${quiz.averageScore}/10` : 'Đang cập nhật'}
                              </span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenReport(c.id, quiz.id, quiz.title)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#1E3A6E] border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                          >
                            Xem báo cáo
                          </button>
                        </div>
                      ))
                    )}

                    {chapters.reduce((acc, c) => acc + c.quizzes.length, 0) === 0 && (
                      <div className="p-6 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                        Chưa có quiz nào cho các chương học đơn lẻ.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STUDENTS (Hồ sơ sinh viên, Điểm số, Điểm mạnh & Điểm yếu AI) */}
            {courseTab === 'Students' && (
              <StudentRosterView
                courseCode={course.code}
                enrolledStudentsCount={course.enrolledStudents}
                totalQuizzesCount={totalQuizzesCount}
              />
            )}
          </div>
        </main>
      </div>

      {/* UPLOAD MODAL */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        existingChapters={chapters.map((c) => ({ id: c.id, title: c.title }))}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};
