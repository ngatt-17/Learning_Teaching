import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  RotateCcw,
  BookOpen,
  Award,
  AlertTriangle,
  Presentation,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowDown,
} from 'lucide-react';
import { ViewerToolbar, type ToolType, type ViewModeType } from './ViewerToolbar';

export interface QuizQuestionItem {
  id: number;
  title: string;
  points: number;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  citation: string;
  topic: string;
}

interface StudentQuizExamViewProps {
  quizTitle?: string;
  initialDisplayMode?: 'one-by-one' | 'all';
  timeLimitMinutes?: number;
  hasTimeLimit?: boolean;
  onBack: () => void;
}

// Initial standard question bank (including exact question from user's screenshot)
const defaultQuestions: QuizQuestionItem[] = [
  {
    id: 1,
    title: 'Website nào dưới đây không phải là Sàn Thương mại điện tử độc lập?',
    points: 1,
    options: [
      { id: 'opt1_a', text: 'Lazada Việt Nam' },
      { id: 'opt1_b', text: 'Shopee Việt Nam' },
      { id: 'opt1_c', text: 'Tiki' },
      { id: 'opt1_d', text: 'Tiktok.com' },
    ],
    correctOptionId: 'opt1_d',
    explanation: 'Tiktok.com là nền tảng mạng xã hội chia sẻ video ngắn trực tuyến, trong khi TikTok Shop mới là giải pháp thương mại điện tử tích hợp. Lazada, Shopee và Tiki là các sàn thương mại điện tử thuần túy theo mô hình B2C/C2C.',
    citation: 'Tài liệu: Giáo trình E-Commerce Foundations — Chương 1, Trang 14',
    topic: 'Nền tảng E-Commerce',
  },
  {
    id: 2,
    title: 'Màn hình Full HD có độ phân giải tiêu chuẩn là bao nhiêu?',
    points: 1,
    options: [
      { id: 'opt2_a', text: '3840x2160' },
      { id: 'opt2_b', text: '2560x1440' },
      { id: 'opt2_c', text: '1920x1080' },
      { id: 'opt2_d', text: '1280x720' },
    ],
    correctOptionId: 'opt2_c',
    explanation: 'Độ phân giải Full HD (FHD / 1080p) có kích thước chuẩn là 1920 pixel chiều ngang nhân 1080 pixel chiều dọc (tỷ lệ 16:9). 3840x2160 là 4K UHD, 2560x1440 là 2K QHD, và 1280x720 là HD tiêu chuẩn.',
    citation: 'Tài liệu: Đồ họa máy tính & Thiết bị hiển thị — Chương 2, Trang 22',
    topic: 'Đồ họa & Hiển thị',
  },
  {
    id: 3,
    title: 'Trong trí tuệ nhân tạo, tác tử duy lý (Rational Agent) được định nghĩa là tác tử như thế nào?',
    points: 1,
    options: [
      { id: 'opt3_a', text: 'Tác tử hành động nhằm tối đa hóa thước đo hiệu năng kỳ vọng dựa trên chuỗi tri giác và tri thức tích lũy' },
      { id: 'opt3_b', text: 'Tác tử luôn đưa ra quyết định giống 100% hành vi của con người' },
      { id: 'opt3_c', text: 'Tác tử có tốc độ xử lý phần cứng nhanh nhất trong hệ thống' },
      { id: 'opt3_d', text: 'Tác tử không bao giờ mắc bất kỳ sai sót nào trong mọi tình huống tương lai' },
    ],
    correctOptionId: 'opt3_a',
    explanation: 'Tính duy lý (Rationality) không đồng nghĩa với toàn tri (Omniscience). Tác tử duy lý là tác tử lựa chọn hành động để tối đa hóa hiệu năng mong đợi dựa trên chuỗi tri giác đã nhận được và tri thức cơ sở.',
    citation: 'Tài liệu: AI Nâng cao — Slide AI(1).pdf, Trang 16',
    topic: 'Khung tác tử AI & PEAS',
  },
  {
    id: 4,
    title: 'Thuật toán nào dưới đây thuộc nhóm học máy không giám sát (Unsupervised Learning) dùng để phân cụm dữ liệu khách hàng?',
    points: 1,
    options: [
      { id: 'opt4_a', text: 'Linear Regression (Hồi quy tuyến tính)' },
      { id: 'opt4_b', text: 'K-Means Clustering' },
      { id: 'opt4_c', text: 'Convolutional Neural Network (CNN)' },
      { id: 'opt4_d', text: 'Decision Tree (Cây quyết định)' },
    ],
    correctOptionId: 'opt4_b',
    explanation: 'K-Means Clustering là thuật toán phân cụm không giám sát, tự động gom nhóm các điểm dữ liệu tương đồng mà không cần nhãn định sẵn. Linear Regression và Decision Tree là có giám sát.',
    citation: 'Tài liệu: Machine Learning & Khai phá dữ liệu — Chương 3, Trang 56',
    topic: 'Học máy & Phân cụm',
  },
  {
    id: 5,
    title: 'Hiện tượng "Ảo giác thông tin" (Hallucination) trong các mô hình ngôn ngữ lớn (LLM) là gì?',
    points: 1,
    options: [
      { id: 'opt5_a', text: 'Mô hình tự động tắt server khi quá tải truy cập' },
      { id: 'opt5_b', text: 'Mô hình sinh ra các thông tin sai lệch nhưng với giọng điệu rất tự tin và thuyết phục' },
      { id: 'opt5_c', text: 'Mô hình bị nhiễm virus phần cứng từ máy khách' },
      { id: 'opt5_d', text: 'Mô hình chỉ dịch được tiếng Anh mà không dịch được tiếng Việt' },
    ],
    correctOptionId: 'opt5_b',
    explanation: 'Hallucination là hiện tượng LLM tạo ra nội dung sai sự thật, không có trong dữ liệu huấn luyện hoặc tài liệu ngữ cảnh, nhưng được trình bày rất tự nhiên và tự tin.',
    citation: 'Tài liệu: Ứng dụng LLM & Đạo đức AI — Chương 4, Trang 82',
    topic: 'Mô hình ngôn ngữ lớn (LLM)',
  },
];

// Adaptive remedial questions generated when student requests personalized re-test
const adaptivePersonalizedQuestions: QuizQuestionItem[] = [
  {
    id: 1,
    title: '[Đề củng cố cá nhân hóa] Trong không gian màu kỹ thuật số, chuẩn màu sRGB và Display P3 khác nhau cơ bản ở điểm nào?',
    points: 1,
    options: [
      { id: 'ad1_a', text: 'Display P3 có dải không gian màu rộng hơn sRGB khoảng 25%, hiển thị màu đỏ và xanh lá rực rỡ hơn' },
      { id: 'ad1_b', text: 'Display P3 chỉ dùng cho màn hình đen trắng' },
      { id: 'ad1_c', text: 'sRGB có độ phân giải cao hơn Display P3 gấp 4 lần' },
      { id: 'ad1_d', text: 'Hai chuẩn màu này hoàn toàn giống nhau về số lượng màu sắc' },
    ],
    correctOptionId: 'ad1_a',
    explanation: 'Display P3 là dải màu rộng (Wide Color Gamut), bao phủ thêm 25% sắc thái màu so với sRGB, đặc biệt ở các dải màu xanh và đỏ.',
    citation: 'Tài liệu: Đồ họa máy tính — Chuyên đề Màu sắc kỹ thuật số, Trang 45',
    topic: 'Đồ họa & Hiển thị',
  },
  {
    id: 2,
    title: '[Đề củng cố cá nhân hóa] Thuật toán phân cụm K-Means khởi tạo K tâm cụm ban đầu. Phương pháp nào giúp giảm rủi ro rơi vào cực tiểu địa phương?',
    points: 1,
    options: [
      { id: 'ad2_a', text: 'Chạy thuật toán 1 lần duy nhất với K = 1' },
      { id: 'ad2_b', text: 'Sử dụng phương pháp K-Means++ để chọn các tâm cụm cách xa nhau tối đa' },
      { id: 'ad2_c', text: 'Bỏ qua bước cập nhật tọa độ tâm cụm' },
      { id: 'ad2_d', text: 'Chuyển toàn bộ dữ liệu về ma trận đường chéo' },
    ],
    correctOptionId: 'ad2_b',
    explanation: 'K-Means++ khởi tạo các tâm cụm ban đầu với xác suất tỷ lệ thuận với bình phương khoảng cách tới tâm cụm gần nhất, giúp phân bổ tâm cụm tối ưu và hội tụ nhanh hơn.',
    citation: 'Tài liệu: Machine Learning Nâng cao — Chương 3, Trang 62',
    topic: 'Học máy & Phân cụm',
  },
  {
    id: 3,
    title: '[Đề củng cố cá nhân hóa] Kỹ thuật RAG (Retrieval-Augmented Generation) giúp khắc phục nhược điểm nào lớn nhất của LLM?',
    points: 1,
    options: [
      { id: 'ad3_a', text: 'Giảm thiểu ảo giác thông tin (Hallucination) bằng cách truy xuất tài liệu thực tế của khóa học làm bằng chứng' },
      { id: 'ad3_b', text: 'Tăng kích thước file cài đặt của hệ điều hành' },
      { id: 'ad3_c', text: 'Loại bỏ hoàn toàn nhu cầu sử dụng chip GPU' },
      { id: 'ad3_d', text: 'Làm chậm tốc độ gõ phím của người dùng' },
    ],
    correctOptionId: 'ad3_a',
    explanation: 'RAG truy xuất các đoạn văn bản chuẩn xác từ slide/giáo trình và đưa vào prompt ngữ cảnh cho LLM, giúp câu trả lời luôn có nguồn dẫn chứng minh bạch và triệt tiêu ảo giác.',
    citation: 'Tài liệu: Kiến trúc RAG trong Giáo dục — Slide Tổng quan, Trang 18',
    topic: 'Mô hình ngôn ngữ lớn (LLM)',
  },
];

export const StudentQuizExamView: React.FC<StudentQuizExamViewProps> = ({
  quizTitle = 'Bài tập 8: Kiểm tra kiến thức E-Commerce & AI',
  initialDisplayMode = 'one-by-one',
  timeLimitMinutes = 15,
  hasTimeLimit = true,
  onBack,
}) => {
  // Navigation Mode between Slides and Quiz (matching user screenshot 2)
  const [activeLeftTab, setActiveLeftTab] = useState<'slides' | 'quizzes'>('quizzes');

  // Questions list (can be swapped when generating adaptive test)
  const [questions, setQuestions] = useState<QuizQuestionItem[]>(defaultQuestions);
  const [isAdaptiveTest, setIsAdaptiveTest] = useState(false);

  // Exam Progress State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<'one-by-one' | 'all'>(initialDisplayMode);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({
    // Pre-populate mock answers matching Screenshot 1 (score 4/10: correct 3 and 4, wrong 1, 2, 5)
    1: 'opt1_a', // User selected Lazada instead of Tiktok
    2: 'opt2_a', // User selected 3840x2160 instead of 1920x1080
    3: 'opt3_a', // Correct
    4: 'opt4_b', // Correct
    5: 'opt5_a', // Wrong
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(true); // Initial state submitted to show the full answers & explanation review like Screenshot 1
  const [showCompetencyDetail, setShowCompetencyDetail] = useState<boolean>(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    hasTimeLimit ? Math.max(0, timeLimitMinutes * 60 - 24) : 0
  ); // 14 Phút, 36 Giây matching Screenshot 1 (15 mins - 24s)
  const [secondsElapsed, setSecondsElapsed] = useState<number>(39); // 0 Phút, 39 Giây matching Screenshot 1
  const [isTimerHidden, setIsTimerHidden] = useState<boolean>(false);

  // Slide Viewer State (for <<Slides | Quiz>> integration)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewModeType>('single');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#C8232C');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [_isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const totalPages = 12;

  // Dedicated Full-Height Right-hand AI Chatbot State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'bot' | 'user'; text: string; citation?: string }>
  >([
    {
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý AI Socratic của VinUni. Sau khi xem lại bài làm, bạn có thể bấm nút "🤖 HỎI AI" cạnh bất kỳ câu hỏi nào để tôi giải thích chi tiết, hoặc gõ câu hỏi trực tiếp vào đây nhé!',
    },
    {
      sender: 'user',
      text: 'Giải thích chi tiết giúp em Câu 1: "Website nào dưới đây không phải là Sàn Thương mại điện tử độc lập?". Em đã chọn: "Lazada Việt Nam", tại sao đáp án đúng lại là: "Tiktok.com"?',
    },
    {
      sender: 'bot',
      text: 'Chào bạn! Về Câu số 1 ("Website nào dưới đây không phải là Sàn Thương mại điện tử độc lập?"):\n\n• **Phân tích vì sao đáp án đúng là "Tiktok.com":**\nTiktok.com bản chất là mạng xã hội chia sẻ video ngắn trực tuyến. Dù có tính năng TikTok Shop, nền tảng cốt lõi của tên miền này là Social Media chứ không phải là sàn thương mại điện tử chuyên dụng (E-Commerce Marketplace) như Lazada, Shopee hay Tiki.\n\n• **Căn cứ tài liệu bài giảng:** Giáo trình E-Commerce Foundations — Chương 1, Trang 14.\n\n💡 **Khuyến nghị ôn tập:** Bạn nên đọc lại Slide 14 của Chương 1 để phân biệt rõ giữa "Sàn TMĐT độc lập" và "Social Commerce".',
      citation: 'Giáo trình E-Commerce Foundations — Chương 1, Trang 14',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Timer tick
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
      if (hasTimeLimit) {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, hasTimeLimit]);

  const currentQ = questions[currentQuestionIndex] || questions[0];

  // Select an option for a question
  const handleSelectOption = (questionId: number, optionId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Submit the entire exam
  const handleSubmitExam = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?`
      );
      if (!confirmSubmit) return;
    }
    setIsSubmitted(true);
    setActiveLeftTab('quizzes');
  };

  // Calculate score and analytics
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctOptionId
  ).length;
  const scoreOutOf10 = Number(((correctCount / questions.length) * 10).toFixed(1));
  const scorePercent = Math.round((correctCount / questions.length) * 100);

  // Handle "HỎI AI" on a specific question
  const handleAskAiQuestion = (q: QuizQuestionItem) => {
    const chosenOpt = q.options.find((o) => o.id === selectedAnswers[q.id]);
    const correctOpt = q.options.find((o) => o.id === q.correctOptionId);

    const userPrompt = `Giải thích chi tiết giúp em Câu ${q.id}: "${q.title}". Em đã chọn: "${chosenOpt ? chosenOpt.text : 'Chưa chọn'}", tại sao đáp án đúng lại là: "${correctOpt?.text}"?`;

    // Add user message
    setChatMessages((prev) => [...prev, { sender: 'user', text: userPrompt }]);

    // AI automated pedagogical response
    setTimeout(() => {
      const aiReply = `Chào bạn! Về Câu số ${q.id} ("${q.title}"):\n\n• **Phân tích vì sao đáp án đúng là "${correctOpt?.text}":**\n${q.explanation}\n\n• **Căn cứ tài liệu bài giảng:** ${q.citation}.\n\n💡 **Lời khuyên sư phạm:** Bạn nên xem lại slide bài giảng để củng cố khái niệm "${q.topic}". Bạn có muốn tôi đưa ra một câu hỏi trắc nghiệm tương tự để bạn tự kiểm tra lại không?`;

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: aiReply,
          citation: q.citation,
        },
      ]);
    }, 500);
  };

  // Send custom chat message in the right panel
  const handleSendCustomChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');

    setTimeout(() => {
      const botAnswer = `Dựa trên bài kiểm tra và slide bài giảng môn học:\n\nVề câu hỏi "${msg}": Điểm cốt lõi ở đây là nắm vững khái niệm lý thuyết và ứng dụng thực tiễn của công nghệ. Bạn có thể bấm nút "🤖 HỎI AI" ở từng câu hỏi để tôi giải thích chi tiết đáp án và tài liệu tham khảo nhé!`;
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botAnswer }]);
    }, 600);
  };

  // Launch personalized remedial adaptive quiz
  const handleLaunchPersonalizedQuiz = () => {
    setQuestions(adaptivePersonalizedQuestions);
    setIsAdaptiveTest(true);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setSecondsElapsed(0);
    setSecondsRemaining(10 * 60); // 10 mins for remedial test
    setActiveLeftTab('quizzes');
    setChatMessages([
      {
        sender: 'bot',
        text: '🎯 Chào mừng bạn đến với Bài kiểm tra củng cố cá nhân hóa! AI đã tổng hợp 3 câu hỏi tập trung chính xác vào các chủ đề bạn vừa làm sai (Đồ họa, Phân cụm và RAG LLM) để giúp bạn thành thạo 100%. Hãy bắt đầu làm bài nhé!',
      },
    ]);
  };

  // Retake original test
  const handleRetakeOriginalTest = () => {
    setQuestions(defaultQuestions);
    setIsAdaptiveTest(false);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setSecondsElapsed(0);
    setSecondsRemaining(15 * 60);
    setActiveLeftTab('quizzes');
  };

  // Format time (MM Phút, SS Giây)
  const formatTimeVietnamese = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins} Phút, ${secs < 10 ? '0' : ''}${secs} Giây`;
  };

  return (
    <div className="h-screen w-full max-w-full bg-[#FDFDFD] text-slate-800 font-sans antialiased flex flex-col overflow-hidden">
      {/* ============================================================ */}
      {/* TOP HEADER: EDGE-TO-EDGE, NO MARGINS                        */}
      {/* ============================================================ */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0 flex items-center justify-between z-30 shadow-2xs w-full">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
            title="Quay lại khóa học"
          >
            <ArrowLeft size={16} />
            <span>Quay lại khóa học</span>
          </button>
          <span className="text-slate-300">|</span>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                LMS VINUNIVERSITY • TRẮC NGHIỆM TRỰC TUYẾN
              </span>
              {isAdaptiveTest && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-600" />
                  Đề luyện tập cá nhân hóa AI
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {quizTitle}
            </h1>
          </div>
        </div>

        {/* Right header controls: Mode switch during active test */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isSubmitted && activeLeftTab === 'quizzes' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setDisplayMode('one-by-one')}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-all cursor-pointer ${
                  displayMode === 'one-by-one'
                    ? 'bg-white text-[#1E3A6E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hiện từng câu
              </button>
              <button
                onClick={() => setDisplayMode('all')}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-all cursor-pointer ${
                  displayMode === 'all'
                    ? 'bg-white text-[#1E3A6E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hiện tất cả câu
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3-COLUMN FULL-WIDTH BODY (ZERO WASTED HORIZONTAL GUTTERS)    */}
      {/* ============================================================ */}
      <div className="flex-1 w-full flex min-h-0 overflow-hidden">
        {/* ============================================================ */}
        {/* COLUMN 1 (LEFT): << SLIDES | QUIZZ >> & QUESTION PALETTE    */}
        {/* ============================================================ */}
        <aside className="w-64 sm:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden z-20 shadow-xs h-full">
          {/* Header matching Screenshot 2 */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-[#1E3A6E] font-bold text-xs">
              <BookOpen size={16} />
              <span>Nội dung bài học</span>
            </div>
          </div>

          {/* Segmented Switcher: [ 🖥 Slides ] | [ ⏱ Quizz ] (Exact match to Screenshot 2) */}
          <div className="p-2 border-b border-slate-200 bg-slate-100/70 shrink-0">
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs gap-1">
              <button
                onClick={() => setActiveLeftTab('slides')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeLeftTab === 'slides'
                    ? 'bg-[#1E3A6E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Presentation size={15} />
                <span>Slides</span>
              </button>

              <button
                onClick={() => setActiveLeftTab('quizzes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeLeftTab === 'quizzes'
                    ? 'bg-[#1E3A6E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HelpCircle size={15} />
                <span>Quizz</span>
              </button>
            </div>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col justify-between">
            {/* SUB-VIEW A: SLIDES LIST */}
            {activeLeftTab === 'slides' ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  Bài giảng chương 1 & 2
                </div>
                {[
                  { id: 's1', title: 'Lecture 0: Giới thiệu chung.pdf', pages: 12 },
                  { id: 's2', title: 'DHMT_01: Đồ họa máy tính.pdf', pages: 12, active: true },
                  { id: 's3', title: 'Lecture 1: Thuật toán đồ họa cơ bản.pdf', pages: 28 },
                  { id: 's4', title: 'Lecture 2: Phép biến đổi không gian.pdf', pages: 35 },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-start gap-2.5 border ${
                      s.active
                        ? 'bg-blue-50 border-blue-200 text-[#1E3A6E] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileText size={16} className={s.active ? 'text-[#1E3A6E]' : 'text-red-500'} />
                    <div className="truncate">
                      <p className="truncate leading-snug">{s.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.pages} trang</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* SUB-VIEW B: QUIZ QUESTION PALETTE & TIMER (Placed on Left Column as requested!) */
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-1 shrink-0">
                  <span className="text-xs font-bold text-slate-900">Danh sách câu hỏi</span>
                  <span className="text-[11px] text-slate-400 font-semibold">{questions.length} câu</span>
                </div>

                {/* Question buttons with clear score & status */}
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isCurrent = currentQuestionIndex === idx && displayMode === 'one-by-one' && !isSubmitted;
                    const isCorrect = selectedAnswers[q.id] === q.correctOptionId;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          if (displayMode === 'one-by-one' && !isSubmitted) {
                            setCurrentQuestionIndex(idx);
                          } else {
                            const el = document.getElementById(`question-card-${q.id}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                          isCurrent
                            ? 'bg-blue-50 text-[#1E3A6E] border-blue-300 shadow-2xs ring-1 ring-blue-300'
                            : isSubmitted
                            ? isCorrect
                              ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/50'
                              : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100/50'
                            : isAnswered
                            ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSubmitted ? (
                            isCorrect ? (
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle size={15} className="text-rose-600 shrink-0" />
                            )
                          ) : isAnswered ? (
                            <span className="text-emerald-600 font-black text-sm shrink-0">✓</span>
                          ) : (
                            <HelpCircle size={14} className="text-blue-500 shrink-0" />
                          )}
                          <span className="truncate">Câu hỏi {idx + 1}</span>
                        </div>

                        <span className="text-[10.5px] text-slate-400 font-normal shrink-0">
                          {q.points} điểm
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 space-y-2 pt-2 border-t border-slate-200">
                  {/* TIMER DISPLAY BOX WITH "ẨN THỜI GIAN" (Placed in Left Column) */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <p className="text-[10.5px] text-slate-500 font-medium">
                          {hasTimeLimit ? 'Thời Gian Còn Lại:' : 'Thời Gian Đã Làm:'}
                        </p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">
                          {isTimerHidden
                            ? '••••••'
                            : hasTimeLimit
                            ? formatTimeVietnamese(secondsRemaining)
                            : formatTimeVietnamese(secondsElapsed)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsTimerHidden(!isTimerHidden)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer text-center shrink-0 shadow-2xs"
                      >
                        {isTimerHidden ? 'Hiện Thời Gian' : 'Ẩn Thời Gian'}
                      </button>
                    </div>
                  </div>

                  {/* Submit / Reset Action Buttons in Left Sidebar */}
                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="w-full py-2.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer text-center"
                    >
                      Nộp bài kiểm tra
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleLaunchPersonalizedQuiz}
                        className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={13} />
                        <span>Làm đề củng cố AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRetakeOriginalTest}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw size={12} />
                        <span>Làm lại bài này</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* COLUMN 2 (CENTER): SLIDE CANVAS OR SCROLLABLE QUIZ/REVIEW    */}
        {/* ============================================================ */}
        <main className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-slate-50 relative">
          {/* CASE 1: SLIDES MODE IS ACTIVE */}
          {activeLeftTab === 'slides' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-900/10">
              {/* Floating Toolbar Overlay */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-2rem)] overflow-visible">
                <ViewerToolbar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  zoomLevel={zoomLevel}
                  setZoomLevel={setZoomLevel}
                  isFullscreen={isFullscreen}
                  setIsFullscreen={setIsFullscreen}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  strokeWidth={strokeWidth}
                  setStrokeWidth={setStrokeWidth}
                  setIsNotesOpen={setIsNotesOpen}
                  isNotesOpen={false}
                  setIsAiChatOpen={() => {}}
                  onRequestClearAll={() => {}}
                />
              </div>

              {/* Slide Canvas Display */}
              <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-100">
                <iframe
                  key={`slide-${currentPage}`}
                  src={`/DHMT_01.pdf#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  className="absolute inset-0 w-full h-full border-none block bg-slate-100"
                  title="Bài giảng Slide Đồ họa máy tính"
                  style={{ zoom: `${zoomLevel}%` }}
                />
              </div>
            </div>
          ) : (
            /* CASE 2: QUIZ / REVIEW MODE IS ACTIVE */
            /* Fully scrollable container with a dedicated scrollbar so students can inspect all questions! */
            <div className="flex-1 h-full overflow-y-auto px-4 sm:px-7 py-4 space-y-4 scroll-smooth">
              {/* HEADER ROW (Matching user screenshot) */}
              <div className="border-b border-slate-200 pb-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {quizTitle.split(':')[0] || 'Bài tập 8'}
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Hạn nộp: 23:59, 24/09/2026
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Đã bắt đầu: Tháng 9 16 tại 14:50 • Điểm tối đa: 10
                </p>
                <h3 className="text-sm font-bold text-slate-800 mt-1.5">
                  Hướng Dẫn Kiểm Tra
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hãy đọc kỹ nội dung từng câu hỏi và chọn phương án chính xác nhất. Bạn có thể sử dụng bảng danh sách câu hỏi ở bên trái để chuyển nhanh giữa các câu.
                </p>
              </div>

              {/* COMPACT TOP SCORE BANNER & COMPETENCY (High-density design so Question 1 is 100% visible at 100% standard zoom!) */}
              {isSubmitted && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  {/* High-density score card */}
                  <div className="bg-white border-2 border-emerald-300 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          Đã hoàn thành & Chấm điểm tự động
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          Thời gian làm: {formatTimeVietnamese(secondsElapsed)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Kết quả bài kiểm tra của bạn
                      </h4>
                      <p className="text-xs text-slate-600">
                        Bạn đã trả lời đúng <strong>{correctCount}</strong> trên tổng số <strong>{questions.length}</strong> câu hỏi ({scorePercent}%).
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                      <Award size={22} className="text-amber-500" />
                      <div>
                        <span className="text-[9.5px] text-emerald-800 font-semibold block uppercase">Điểm số đạt được</span>
                        <span className="text-lg font-black text-[#1E3A6E] leading-none">
                          {scoreOutOf10} <span className="text-xs font-normal text-slate-400">/ 10</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sleek Competency Box (Collapsible / High-density) */}
                  <div className="bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/80 border border-indigo-200 rounded-xl p-3 shadow-2xs">
                    <div
                      onClick={() => setShowCompetencyDetail(!showCompetencyDetail)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="p-1 rounded-md bg-[#1E3A6E] text-white">
                          <Brain size={14} />
                        </div>
                        <span className="font-bold text-xs text-slate-900">
                          Phân tích năng lực học sinh & Khuyến nghị ôn tập (AI Learning Analytics)
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Độ hiểu bài: Cần củng cố
                        </span>
                      </div>
                      <button className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-semibold cursor-pointer">
                        <span>{showCompetencyDetail ? 'Thu gọn' : 'Xem chi tiết'}</span>
                        {showCompetencyDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {showCompetencyDetail && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 mt-2 border-t border-indigo-100 text-xs animate-in fade-in">
                        <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-1">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <Check size={13} className="text-emerald-600" />
                            Điểm mạnh đã nắm vững (Mastered Concepts):
                          </span>
                          <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 leading-relaxed">
                            <li><strong>Khung tác tử AI & Nền tảng E-Commerce:</strong> Hiểu rõ bản chất định nghĩa tính duy lý và phân loại sàn thương mại điện tử.</li>
                            <li><strong>Tốc độ xử lý:</strong> Hoàn thành các câu lý thuyết định nghĩa nhanh và chuẩn xác.</li>
                          </ul>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-rose-200 space-y-1">
                          <span className="font-bold text-rose-800 flex items-center gap-1">
                            <AlertTriangle size={13} className="text-rose-600" />
                            Lỗ hổng kiến thức cần củng cố (Needs Improvement):
                          </span>
                          <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 leading-relaxed">
                            <li><strong>Độ phân giải hiển thị & Phân cụm máy học:</strong> Có xu hướng nhầm lẫn giữa tỷ lệ màn hình đồ họa hoặc nhóm thuật toán có giám sát vs không giám sát.</li>
                            <li><strong>Đề xuất ôn tập:</strong> Đọc kỹ lại slide Chương 2 (Trang 22) và Chương 3 (Trang 56).</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Helpful scroll indicator cue */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-[#1E3A6E] font-semibold">
                      <ArrowDown size={13} className="animate-bounce" />
                      Cuộn xuống để xem toàn bộ các câu hỏi kèm đáp án & giải thích chi tiết:
                    </span>
                    <span>{questions.length} câu hỏi hiển thị đầy đủ</span>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* QUESTIONS LIST (FULL REVIEW OR IN-EXAM DISPLAY)             */}
              {/* ============================================================ */}
              <div className="space-y-4">
                {displayMode === 'all' || isSubmitted ? (
                  questions.map((q, idx) => {
                    const isAnswered = !!selectedAnswers[q.id];
                    const isCorrect = selectedAnswers[q.id] === q.correctOptionId;

                    return (
                      <div
                        key={q.id}
                        id={`question-card-${q.id}`}
                        className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${
                          isSubmitted
                            ? isCorrect
                              ? 'border-emerald-300 ring-1 ring-emerald-100'
                              : 'border-rose-300 ring-1 ring-rose-100'
                            : 'border-slate-300'
                        }`}
                      >
                        {/* Header of Question Card (Matching screenshot: [Bookmark] Câu hỏi X        1 điểm) */}
                        <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bookmark
                              size={16}
                              className={isAnswered ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}
                            />
                            <span className="font-bold text-xs sm:text-sm text-slate-800">
                              Câu hỏi {idx + 1}
                            </span>
                            {isSubmitted && (
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10.5px] font-bold ${
                                  isCorrect
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isCorrect ? '✓ Đúng (1 điểm)' : '✗ Sai (0 điểm)'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-semibold text-slate-500">
                              {q.points} điểm
                            </span>

                            {/* NÚT HỎI AI ĐẶT NGAY BÊN CẠNH MỖI CÂU HỎI NHƯ YÊU CẦU */}
                            {isSubmitted && (
                              <button
                                type="button"
                                onClick={() => handleAskAiQuestion(q)}
                                className="px-2.5 py-1 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                title="Gửi câu hỏi này sang Trợ lý AI Socratic bên phải để được giải thích cặn kẽ"
                              >
                                <Bot size={13} className="text-amber-300" />
                                <span>HỎI AI</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="p-4 sm:p-5 space-y-3">
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            {q.title}
                          </p>

                          {/* Options List */}
                          <div className="divide-y divide-slate-100 border-t border-slate-100">
                            {q.options.map((opt) => {
                              const isSelected = selectedAnswers[q.id] === opt.id;
                              const isThisCorrect = q.correctOptionId === opt.id;

                              let rowClass = 'hover:bg-slate-50 cursor-pointer';
                              if (isSubmitted) {
                                if (isThisCorrect) {
                                  rowClass = 'bg-emerald-50/80 font-bold text-emerald-900 border border-emerald-200 rounded-lg';
                                } else if (isSelected && !isThisCorrect) {
                                  rowClass = 'bg-rose-50/80 line-through text-rose-800 border border-rose-200 rounded-lg';
                                } else {
                                  rowClass = 'opacity-60';
                                }
                              } else if (isSelected) {
                                rowClass = 'bg-blue-50/60 font-semibold text-[#1E3A6E]';
                              }

                              return (
                                <label
                                  key={opt.id}
                                  onClick={() => handleSelectOption(q.id, opt.id)}
                                  className={`py-2.5 px-2 flex items-center gap-3 transition-colors text-xs sm:text-sm my-0.5 ${rowClass}`}
                                >
                                  <input
                                    type="radio"
                                    name={`q_input_${q.id}`}
                                    checked={isSelected}
                                    disabled={isSubmitted}
                                    onChange={() => handleSelectOption(q.id, opt.id)}
                                    className="w-4 h-4 text-[#1E3A6E] border-slate-300 focus:ring-[#1E3A6E] cursor-pointer"
                                  />
                                  <span>{opt.text}</span>
                                  {isSubmitted && isThisCorrect && (
                                    <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.2 rounded-full shrink-0">
                                      Đáp án chính xác
                                    </span>
                                  )}
                                  {isSubmitted && isSelected && !isThisCorrect && (
                                    <span className="ml-auto text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.2 rounded-full shrink-0">
                                      Bạn đã chọn
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>

                          {/* Pedagogical Explanation Block */}
                          {isSubmitted && (
                            <div className="mt-3 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#1E3A6E]">
                                <BookOpen size={13} />
                                <span>Giải thích đáp án & Căn cứ giáo trình:</span>
                              </div>
                              <p className="text-slate-700 text-xs leading-relaxed">
                                {q.explanation}
                              </p>
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                Trích dẫn: {q.citation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* ONE-BY-ONE MODE (Exact visual clone of user screenshot) */
                  <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                    {/* Header: [Bookmark] Câu hỏi X           1 điểm */}
                    <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Bookmark
                          size={18}
                          className={
                            selectedAnswers[currentQ.id]
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-400'
                          }
                        />
                        <span className="font-bold text-sm text-slate-800">
                          Câu hỏi {currentQuestionIndex + 1}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        {currentQ.points} điểm
                      </span>
                    </div>

                    {/* Question Statement & Options */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                        {currentQ.title}
                      </p>

                      <div className="divide-y divide-slate-100 border-t border-slate-100">
                        {currentQ.options.map((opt) => {
                          const isSelected = selectedAnswers[currentQ.id] === opt.id;
                          return (
                            <label
                              key={opt.id}
                              onClick={() => handleSelectOption(currentQ.id, opt.id)}
                              className={`py-3.5 px-2 flex items-center gap-3.5 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/60 font-semibold text-[#1E3A6E]' : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`one_q_${currentQ.id}`}
                                checked={isSelected}
                                onChange={() => handleSelectOption(currentQ.id, opt.id)}
                                className="w-4 h-4 text-[#1E3A6E] border-slate-300 focus:ring-[#1E3A6E] cursor-pointer"
                              />
                              <span className="text-xs sm:text-sm text-slate-800">{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Navigation Bar: ◀ Trước       Tiếp theo ▶ */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <ChevronLeft size={16} />
                        <span>Trước</span>
                      </button>

                      {currentQuestionIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                          }
                          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Tiếp theo</span>
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitExam}
                          className="px-5 py-2 rounded-lg bg-[#1E3A6E] hover:bg-[#14274E] text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Nộp bài kiểm tra</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="pt-3 pb-8 border-t border-slate-200">
                {!isSubmitted ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Đã trả lời: <strong>{Object.keys(selectedAnswers).length}</strong>/{questions.length} câu
                    </span>
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="px-6 py-2.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Hoàn thành & Nộp bài
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-xl shadow-2xs">
                    <div>
                      <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                        <Sparkles size={16} className="text-amber-600" />
                        <span>Luyện tập củng cố cá nhân hóa cùng AI</span>
                      </h4>
                      <p className="text-xs text-amber-900/80 mt-0.5">
                        Tạo ngay bộ đề mới nhắm đúng vào các câu bạn vừa làm sai (Đồ họa, K-Means & RAG) để đạt điểm tối đa.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLaunchPersonalizedQuiz}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <RotateCcw size={15} />
                      <span>Làm 1 bài kiểm tra mới (Cá nhân hóa theo điểm mạnh/yếu)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ============================================================ */}
        {/* COLUMN 3 (RIGHT): DEDICATED FULL-HEIGHT AI SOCRATIC ASSISTANT*/}
        {/* (CHIẾM TOÀN BỘ GÓC PHẢI NHƯ YÊU CẦU CỦA NGƯỜI DÙNG)          */}
        {/* ============================================================ */}
        <aside className="w-80 sm:w-96 shrink-0 h-full border-l border-slate-200 bg-white flex flex-col z-20 shadow-xs">
          {/* Header Chatbot */}
          <div className="bg-gradient-to-r from-[#1E3A6E] to-indigo-800 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shadow-xs">
                <Bot size={18} className="text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1">
                  <span>Trợ lý AI Socratic</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <span className="text-[10px] text-blue-200">Giải thích cặn kẽ bài kiểm tra</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full text-white/90">
              24/7 AI
            </span>
          </div>

          {/* Chat message stream (Full-height scrollable) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs">
            {chatMessages.map((msg, mIdx) => (
              <div
                key={mIdx}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-[#1E3A6E] text-white' : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={12} /> : <Bot size={13} />}
                </div>

                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#1E3A6E] text-white rounded-tr-none text-xs font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs text-[11.5px]'
                  }`}
                >
                  {msg.text}
                  {msg.citation && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 italic">
                      {msg.citation}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick suggested prompts for students */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto text-[10.5px]">
            <button
              onClick={() => handleAskAiQuestion(questions[0])}
              className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-[#1E3A6E] rounded-md font-medium shrink-0 cursor-pointer shadow-2xs"
            >
              Hỏi lại Câu 1
            </button>
            <button
              onClick={() => handleAskAiQuestion(questions[1])}
              className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-[#1E3A6E] rounded-md font-medium shrink-0 cursor-pointer shadow-2xs"
            >
              Hỏi lại Câu 2
            </button>
            <button
              onClick={() => handleAskAiQuestion(questions[4])}
              className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-[#1E3A6E] rounded-md font-medium shrink-0 cursor-pointer shadow-2xs"
            >
              Hỏi lại Câu 5
            </button>
          </div>

          {/* Chat Input at Bottom */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCustomChat()}
              placeholder="Hỏi AI về bất kỳ câu hỏi nào..."
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#1E3A6E] text-slate-800"
            />
            <button
              type="button"
              onClick={handleSendCustomChat}
              className="p-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white rounded-xl cursor-pointer transition-colors shadow-2xs shrink-0"
              title="Gửi câu hỏi"
            >
              <Send size={14} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
