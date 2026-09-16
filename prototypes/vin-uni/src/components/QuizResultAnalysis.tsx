import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  BookOpen,
  AlertTriangle,
  BarChart2,
  Zap,
  ArrowRight,
  RefreshCw,
  Award,
  ChevronDown,
  ChevronUp,
  Bot,
  Send,
  User,
} from 'lucide-react';
import { sampleQuizQuestions } from './quizData';

interface QuizResultAnalysisProps {
  quizTitle: string;
  scoreTimer: number;
  userAnswers: Record<number, { isCorrect: boolean; selected: any }>;
  onClose: () => void;
  onReset: () => void;
  playSfx: (type: 'click' | 'correct' | 'wrong') => void;
}

export const QuizResultAnalysis: React.FC<QuizResultAnalysisProps> = ({
  quizTitle,
  scoreTimer,
  userAnswers,
  onClose,
  onReset,
  playSfx,
}) => {
  const [showRemedialQuestions, setShowRemedialQuestions] = useState(false);
  const [remedialAnswers, setRemedialAnswers] = useState<Record<number, string | null>>({});
  const [remedialSubmitted, setRemedialSubmitted] = useState<Record<number, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    {
      sender: 'bot',
      text: 'Chúc mừng bạn đã hoàn thành bài Quiz! Tôi là AI Tutor. Bạn muốn thảo luận thêm về câu hỏi nào không?',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const totalQ = sampleQuizQuestions.length;
  const correctCount = Object.values(userAnswers).filter((ans) => ans.isCorrect).length;
  const scorePercent = Math.round((correctCount / totalQ) * 100);

  const toggleExpandQuestion = (idx: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSendFinalChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Về thắc mắc "${userMsg}": AI Tutor ghi nhận bạn đạt ${scorePercent}% ở bài test này. Bạn nên ôn lại các tài liệu chương liên quan.`,
        },
      ]);
    }, 600);
  };

  const remedialQuizData = [
    {
      id: 'rem1',
      topic: 'Thuật toán gợi ý sản phẩm (Recommendation Systems)',
      question: 'Trong thương mại điện tử, thuật toán Collaborative Filtering dựa vào yếu tố nào để gợi ý sản phẩm?',
      options: [
        { id: 'r1_a', text: 'A. Hành vi và sở thích của nhóm người dùng tương đồng (User-User hoặc Item-Item)', isCorrect: true },
        { id: 'r1_b', text: 'B. Chỉ phân tích từ khóa mã sản phẩm trong kho database', isCorrect: false },
        { id: 'r1_c', text: 'C. Vị trí địa lý IP router của người truy cập', isCorrect: false },
      ],
      explanation: 'Collaborative Filtering phân tích mối tương quan giữa các người dùng có thói quen mua sắm giống nhau để đưa ra đề xuất phù hợp nhất (Syllabus Ch.3 - Recommendation Systems).',
      citation: 'Tài liệu: Giáo trình E-Commerce & AI - Chương 3, Trang 48',
    },
    {
      id: 'rem2',
      topic: 'Quản trị rủi ro & Bảo mật dữ liệu AI',
      question: 'Khi triển khai chatbot AI chăm sóc khách hàng, rủi ro về Hallucination (ảo giác thông tin) là gì?',
      options: [
        { id: 'r2_a', text: 'A. Chatbot phản hồi thông tin bị sai sự thật nhưng với thái độ rất tự tin', isCorrect: true },
        { id: 'r2_b', text: 'B. Chatbot bị ngắt kết nối mạng internet đột ngột', isCorrect: false },
        { id: 'r2_c', text: 'C. Khách hàng gửi ảnh quá dung lượng cho phép', isCorrect: false },
      ],
      explanation: 'Hallucination trong LLM xảy ra khi mô hình sinh ra các thông tin không chính xác so với cơ sở dữ liệu thực tế (Syllabus Ch.5 - Risk Management).',
      citation: 'Tài liệu: Giáo trình E-Commerce & AI - Chương 5, Trang 112',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award size={26} className="text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1">
                <Sparkles size={12} /> AI Instant Evaluation
              </span>
              <span className="text-xs text-slate-400">Thời gian làm bài: {Math.floor((829 - scoreTimer) / 10)}s</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">{quizTitle}</h1>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/90 border border-slate-700/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Điểm số tổng kết</span>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 my-1">
            {scorePercent}%
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Đúng {correctCount}/{totalQ} câu hỏi trắc nghiệm
          </p>
        </div>

        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-400" /> Biểu đồ Phân tích Năng lực (Strengths & Weaknesses)
            </h3>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              Phân tích bởi AI Hub
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Khái niệm E-Commerce & AI Tổng quan</span>
                <span className="text-emerald-400 font-bold">100% (Thành thạo)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
      {/* Chi tiết từng câu hỏi có thể thu gọn / mở rộng */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" /> Kết quả Chi tiết Từng câu hỏi
        </h3>

        <div className="space-y-3">
          {sampleQuizQuestions.map((q, idx) => {
            const result = userAnswers[idx];
            const isCorrect = result?.isCorrect;
            const isExpanded = !!expandedQuestions[idx];

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all"
              >
                <div
                  onClick={() => toggleExpandQuestion(idx)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={22} className="text-rose-500 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-500 block uppercase">
                        Câu {idx + 1} • {q.type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{q.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-black rounded-full border ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <p className="font-semibold text-slate-800">
                        <span className="font-bold text-slate-500">Lời giải thích:</span> {q.explanation}
                      </p>
                      {q.citation && (
                        <p className="text-blue-600 font-medium text-[11px] flex items-center gap-1">
                          <BookOpen size={12} /> {q.citation}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Tutor Interactive Chat Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Trò chuyện cùng AI Tutor Post-Quiz</h3>
            <p className="text-[11px] text-slate-500 font-medium">Hỏi đáp trực tiếp về kết quả bài thi của bạn</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 h-48 overflow-y-auto space-y-3">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendFinalChat()}
            placeholder="Nhập thắc mắc của bạn về bài làm..."
            className="flex-1 text-xs px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
          />
          <button
            onClick={handleSendFinalChat}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Send size={14} /> Gửi
          </button>
        </div>
      </div>
                <span className="text-slate-300">Thuật toán Gợi ý (Recommendation Algorithms)</span>
                <span className="text-amber-400 font-bold">50% (Cần củng cố)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-300">Quản trị Rủi ro & Bảo mật AI</span>
                <span className="text-rose-400 font-bold">33% (Kiến thức hổng)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '33%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-800/50 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
          <Brain size={22} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            Đánh giá cá nhân hóa từ AI Tutor:
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Bạn nắm vững lý thuyết nền tảng của môn học, tuy nhiên đang gặp khó khăn ở các câu hỏi liên quan đến <strong className="text-amber-300">Thuật toán Gợi ý</strong> và <strong className="text-rose-300">Quản trị Rủi ro Bảo mật AI</strong>. AI đã tự động tổng hợp câu hỏi đối chiếu tài liệu và bộ luyện tập bù đắp bên dưới cho bạn.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-400" /> 
          1. Chấm điểm chi tiết & Đối chiếu Giáo trình bài giảng
        </h3>

        <div className="space-y-3">
          {sampleQuizQuestions.map((q, idx) => {
            const ans = userAnswers[idx];
            const isUserCorrect = ans?.isCorrect ?? false;
            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUserCorrect
                    ? 'bg-slate-900/80 border-emerald-900/60'
                    : 'bg-slate-900/90 border-rose-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                    {isUserCorrect ? (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-rose-400 shrink-0" />
                    )}
                    <span>Câu {idx + 1}: {q.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                      isUserCorrect
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {isUserCorrect ? 'Chính xác (+10đ)' : 'Chưa đúng (0đ)'}
                  </span>
                </div>

                <div className="mt-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                  <p className="text-slate-300 font-medium">
                    <strong className="text-blue-400">Lời giải thích chi tiết:</strong> {q.explanation}
                  </p>
                  {q.citation && (
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-mono text-[11px] pt-1 border-t border-slate-800/80">
                      <BookOpen size={13} className="shrink-0" />
                      <span>Đối chiếu: {q.citation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            2. Luyện tập bù đắp lỗ hổng kiến thức (Adaptive Practice)
          </h3>
          {!showRemedialQuestions && (
            <button
              onClick={() => setShowRemedialQuestions(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Sparkles size={14} /> Bắt đầu luyện tập bù đắp
            </button>
          )}
        </div>

        {showRemedialQuestions && (
          <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-800/50">
              <AlertTriangle size={16} className="shrink-0" />
              <span>AI đã tạo riêng 2 câu hỏi củng cố tập trung đúng vào phần bạn trả lời sai ở bài Quiz chính.</span>
            </div>

            {remedialQuizData.map((rq, rIdx) => {
              const isSub = remedialSubmitted[rIdx];
              const selected = remedialAnswers[rIdx];
              return (
                <div key={rq.id} className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                      Chủ đề: {rq.topic}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-100">{rq.question}</p>

                  <div className="space-y-2">
                    {rq.options.map((opt) => {
                      const isSelected = selected === opt.id;
                      let btnStyle = 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800';
                      if (isSub) {
                        if (opt.isCorrect) btnStyle = 'border-emerald-600 bg-emerald-950/60 text-emerald-200 font-bold';
                        else if (isSelected) btnStyle = 'border-rose-600 bg-rose-950/60 text-rose-200 font-bold';
                      } else if (isSelected) {
                        btnStyle = 'border-blue-500 bg-blue-950/60 text-blue-200 font-bold';
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isSub}
                          onClick={() => setRemedialAnswers((prev) => ({ ...prev, [rIdx]: opt.id }))}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${btnStyle}`}
                        >
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>

                  {!isSub ? (
                    <button
                      disabled={!selected}
                      onClick={() => {
                        playSfx('correct');
                        setRemedialSubmitted((prev) => ({ ...prev, [rIdx]: true }));
                      }}
                      className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Xác nhận câu hỏi bù đắp
                    </button>
                  ) : (
                    <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                      <p className="text-emerald-400 font-bold">✓ Giải thích từ AI Hub:</p>
                      <p className="text-slate-300">{rq.explanation}</p>
                      <p className="text-amber-300/80 text-[11px] font-mono mt-1">{rq.citation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onReset}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Làm lại Quiz
        </button>

        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg cursor-pointer transition-all"
        >
          Hoàn thành & Trở về khóa học <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};