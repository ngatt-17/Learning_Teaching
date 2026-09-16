import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowLeft, Award, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, FileText,
  HelpCircle, Layers, Presentation, RotateCcw, XCircle,
} from 'lucide-react';
import { platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import { isStaff } from '../../lib/roles';
import type { AiCitation, AnswerValue, Attempt, Material, StudentQuiz, SubmitResult } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDateTime, formatDeadline, formatDuration, formatScore, formatStarted } from '../../lib/format';
import { ErrorState, InlineError, Loading } from '../../components/StateViews';
import { ConfirmDialog, Dialog } from '../../components/Dialog';
import { btn } from '../../components/styles';
import { SlideViewer } from '../study/SlideViewer';
import { ComprehensiveBuilder } from '../student/ComprehensiveBuilder';
import { AnswerOptions, QuestionHeader, ReviewCard } from './QuestionParts';
import { isAnswered } from './answers';
import { CompetencyBox } from './CompetencyBox';
import { TutorPanel, type TutorChip } from './TutorPanel';
import { useQuizTutor } from './useQuizTutor';

type LeftTab = 'slides' | 'quizzes';
type DisplayMode = 'one-by-one' | 'all';

interface AttemptDraft {
  startedAt: number;
  answers: Record<string, AnswerValue>;
}

// In-progress answers survive a refresh of the tab (sessionStorage, per user and quiz).
const draftKey = (userId: string, quizId: string) => `cecs.quiz.${userId}.${quizId}`;

function loadDraft(key: string): AttemptDraft | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AttemptDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(key: string, draft: AttemptDraft | null) {
  try {
    if (draft) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch {
    // storage unavailable: the attempt still works, it just does not survive a reload
  }
}

interface ExamData {
  quiz: StudentQuiz;
  materials: Material[];
  attempts: Attempt[];
}

export function QuizExamPage() {
  const { courseId = '', quizId = '' } = useParams();
  const user = useCurrentUser();
  const { data, error, loading, reload } = useAsync<ExamData>(
    async () => {
      const [quiz, materials, attempts] = await Promise.all([
        platform.get<StudentQuiz>(`/courses/${courseId}/quizzes/${quizId}`),
        platform.get<Material[]>(`/courses/${courseId}/materials/`),
        platform.get<Attempt[]>(`/courses/${courseId}/quizzes/${quizId}/my-attempts`),
      ]);
      return { quiz, materials, attempts };
    },
    [courseId, quizId],
  );

  if (loading) return <Loading label="Đang tải bài kiểm tra…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <ExamView key={`${user.user_id}-${quizId}`} courseId={courseId} data={data!} />;
}

function ExamView({ courseId, data }: { courseId: string; data: ExamData }) {
  const { quiz, materials } = data;
  const questions = quiz.questions;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useCurrentUser();
  const staffPreview = isStaff(user.role);
  const storageKey = draftKey(user.user_id, quiz.id);

  const latestAttempt = data.attempts[data.attempts.length - 1] ?? null;
  const [attempt, setAttempt] = useState<Attempt | null>(
    searchParams.get('review') === 'latest' ? latestAttempt : null,
  );
  const [draft, setDraft] = useState<AttemptDraft>(() => loadDraft(storageKey) ?? { startedAt: Date.now(), answers: {} });
  const [displayMode, setDisplayMode] = useState<DisplayMode>('one-by-one');
  const [index, setIndex] = useState(0);
  const [leftTab, setLeftTab] = useState<LeftTab>('quizzes');
  const [slide, setSlide] = useState<{ materialId: string; page: number | null } | null>(null);
  const [timerHidden, setTimerHidden] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState<string | null>(null);
  const [elapsedAtSubmit, setElapsedAtSubmit] = useState<number | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const autoSubmitted = useRef(false);
  const centerRef = useRef<HTMLDivElement>(null);

  const tutor = useQuizTutor({ courseId, quizId: quiz.id });
  const reviewing = attempt !== null;
  const current = questions[Math.min(index, questions.length - 1)];
  const points = quiz.points_per_question;
  const maxScore = points * questions.length;
  const answeredCount = questions.filter((q) => isAnswered(draft.answers[q.id])).length;
  const elapsed = (now - draft.startedAt) / 1000;
  const limit = quiz.time_limit_seconds;
  const remaining = limit ? limit - elapsed : null;

  useEffect(() => {
    if (!reviewing && !staffPreview) saveDraft(storageKey, draft);
  }, [draft, reviewing, staffPreview, storageKey]);

  useEffect(() => {
    if (reviewing) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [reviewing]);

  // Show the result banner (after submitting) or the first question (after a retake).
  const attemptId = attempt?.attempt_id ?? null;
  useEffect(() => {
    centerRef.current?.scrollTo({ top: 0 });
  }, [attemptId]);

  const setAnswer = (questionId: string, value: AnswerValue) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [questionId]: value } }));

  const submit = useCallback(
    async (auto = false) => {
      if (staffPreview) return;
      setConfirming(false);
      setSubmitting(true);
      setSubmitError(null);
      try {
        const answers = questions.map((q) => ({ question_id: q.id, answer: draft.answers[q.id] ?? '' }));
        const result = await platform.post<SubmitResult>(`/courses/${courseId}/quizzes/${quiz.id}/submit`, { answers });
        const attempts = await platform.get<Attempt[]>(`/courses/${courseId}/quizzes/${quiz.id}/my-attempts`);
        const graded = attempts.find((a) => a.attempt_id === result.attempt_id) ?? attempts[attempts.length - 1];
        saveDraft(storageKey, null);
        setElapsedAtSubmit((Date.now() - draft.startedAt) / 1000);
        setSubmitNote(auto ? 'Hết giờ — bài đã được nộp tự động.' : result.note);
        setAttempt(graded);
        setLeftTab('quizzes');
        tutor.announce(
          `Bài đã được chấm: đúng ${graded.correct_count}/${graded.total_questions} câu. Bấm "HỎI AI" cạnh câu bất kỳ để xem giải thích kèm trang tài liệu.`,
        );
      } catch (err) {
        setSubmitError(errorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [staffPreview, questions, draft, courseId, quiz.id, storageKey, tutor],
  );

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !reviewing && !staffPreview && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit(true);
    }
  }, [remaining, reviewing, staffPreview, submit]);

  const requestSubmit = () => {
    if (answeredCount < questions.length) setConfirming(true);
    else void submit();
  };

  const retake = () => {
    saveDraft(storageKey, null);
    setDraft({ startedAt: Date.now(), answers: {} });
    setNow(Date.now());
    setAttempt(null);
    setIndex(0);
    setSubmitNote(null);
    setElapsedAtSubmit(null);
    autoSubmitted.current = false;
    setPracticeOpen(false);
    setSearchParams({});
  };

  const openCitation = (citation: Pick<AiCitation, 'material_id' | 'page'>) => {
    if (!citation.material_id) return;
    setSlide({ materialId: citation.material_id, page: citation.page ?? null });
    setLeftTab('slides');
  };

  const openSlidesTab = () => {
    setLeftTab('slides');
    if (!slide) {
      const first = materials.find((m) => m.id === quiz.material_id) ?? materials[0];
      if (first) setSlide({ materialId: first.id, page: null });
    }
  };

  const numberOf = (questionId: string) => questions.findIndex((q) => q.id === questionId) + 1;

  const askQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const ref = { id: question.id, number: numberOf(question.id), prompt: question.prompt };
    const graded = attempt?.answers.find((a) => a.question_id === questionId);
    if (attempt && graded) {
      void tutor.askAboutQuestion(ref, {
        attemptId: attempt.attempt_id,
        submitted: graded.submitted_answer,
        correct: graded.correct_answer,
      });
    } else {
      void tutor.askAboutQuestion(ref);
    }
  };

  const chips: TutorChip[] = useMemo(() => {
    let ids = tutor.askedQuestionIds.slice(0, 3);
    if (ids.length === 0) {
      ids = attempt
        ? attempt.answers.filter((a) => !a.is_correct).slice(0, 3).map((a) => a.question_id)
        : current
          ? [current.id]
          : [];
    }
    return ids
      .map((id) => ({ id, number: numberOf(id) }))
      .filter((x) => x.number > 0)
      .sort((a, b) => a.number - b.number)
      .map(({ id, number }) => ({
        label: `${tutor.askedQuestionIds.includes(id) ? 'Hỏi lại' : attempt ? 'Hỏi về' : 'Gợi ý'} Câu ${number}`,
        onClick: () => askQuestion(id),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutor.askedQuestionIds, attempt, current?.id]);

  const sendFreeText = (text: string) =>
    void tutor.send(text, {
      questionId: !attempt && displayMode === 'one-by-one' ? current?.id : undefined,
      attemptId: attempt?.attempt_id,
    });

  const jumpTo = (questionId: string, i: number) => {
    setLeftTab('quizzes');
    if (displayMode === 'one-by-one' && !reviewing) {
      setIndex(i);
    } else {
      document.getElementById(`question-card-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const shortTitle = quiz.title.split(':')[0] || quiz.title;
  const scorePercent = attempt ? Math.round((attempt.correct_count / Math.max(attempt.total_questions, 1)) * 100) : 0;

  return (
    <div className="flex-1 w-full bg-[#FDFDFD] text-slate-800 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0 flex items-center justify-between z-30 shadow-2xs w-full">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`/courses/${courseId}/quizzes`)}
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
                LMS VinUniversity • Trắc nghiệm trực tuyến
              </span>
              {quiz.quiz_type === 'comprehensive' && (
                <span className="px-2 py-px rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  Quiz tổng hợp
                </span>
              )}
              {staffPreview && (
                <span className="px-2 py-px rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                  Xem trước (giảng viên)
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">{quiz.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {!reviewing && leftTab === 'quizzes' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs" role="group" aria-label="Chế độ hiển thị">
              {(['one-by-one', 'all'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDisplayMode(mode)}
                  aria-pressed={displayMode === mode}
                  className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-all cursor-pointer ${
                    displayMode === mode ? 'bg-white text-[#1E3A6E] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'one-by-one' ? 'Hiện từng câu' : 'Hiện tất cả câu'}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 w-full flex min-h-0 overflow-hidden">
        {/* ── Left column: Slides | Quizz, question palette, timer ───────────── */}
        <aside className="w-64 sm:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden z-20 shadow-xs h-full">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-[#1E3A6E] font-bold text-xs shrink-0">
            <BookOpen size={16} />
            <span>Nội dung bài học</span>
          </div>

          <div className="p-2 border-b border-slate-200 bg-slate-100/70 shrink-0">
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs gap-1">
              <button
                onClick={openSlidesTab}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  leftTab === 'slides' ? 'bg-[#1E3A6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Presentation size={15} />
                <span>Slides</span>
              </button>
              <button
                onClick={() => setLeftTab('quizzes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  leftTab === 'quizzes' ? 'bg-[#1E3A6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <HelpCircle size={15} />
                <span>Quizz</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col min-h-0">
            {leftTab === 'slides' ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase px-1">Tài liệu đã duyệt</div>
                {materials.length === 0 && <p className="text-xs text-slate-500 italic px-1">Chưa có tài liệu được duyệt.</p>}
                {materials.map((m) => {
                  const active = slide?.materialId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSlide({ materialId: m.id, page: null })}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-start gap-2.5 border ${
                        active
                          ? 'bg-blue-50 border-blue-200 text-[#1E3A6E] font-bold shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <FileText size={16} className={active ? 'text-[#1E3A6E] shrink-0' : 'text-red-500 shrink-0'} />
                      <div className="min-w-0">
                        <p className="leading-snug line-clamp-2">{m.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{m.page_count} trang</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-1 shrink-0">
                  <span className="text-xs font-bold text-slate-900">Danh sách câu hỏi</span>
                  <span className="text-[11px] text-slate-400 font-semibold">{questions.length} câu</span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {questions.map((q, i) => {
                    const answered = isAnswered(draft.answers[q.id]);
                    const isCurrent = i === index && displayMode === 'one-by-one' && !reviewing;
                    const graded = attempt?.answers.find((a) => a.question_id === q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => jumpTo(q.id, i)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                          isCurrent
                            ? 'bg-blue-50 text-[#1E3A6E] border-blue-300 shadow-2xs ring-1 ring-blue-300'
                            : graded
                              ? graded.is_correct
                                ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/50'
                                : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100/50'
                              : answered
                                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {graded ? (
                            graded.is_correct ? (
                              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle size={15} className="text-rose-600 shrink-0" />
                            )
                          ) : answered ? (
                            <span className="text-emerald-600 font-black text-sm shrink-0 leading-none">✓</span>
                          ) : (
                            <HelpCircle size={14} className="text-blue-500 shrink-0" />
                          )}
                          <span className="truncate">Câu hỏi {i + 1}</span>
                        </div>
                        <span className="text-[10.5px] text-slate-400 font-normal shrink-0">{formatScore(points)} điểm</span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 space-y-2 pt-2 border-t border-slate-200">
                  {!reviewing && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            {limit ? 'Thời Gian Còn Lại:' : 'Thời Gian Đã Làm:'}
                          </p>
                          <p className={`text-xs font-black mt-0.5 ${remaining !== null && remaining < 60 ? 'text-[#C8232C]' : 'text-slate-800'}`}>
                            {timerHidden ? '••••••' : formatDuration(remaining ?? elapsed)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTimerHidden(!timerHidden)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
                        >
                          {timerHidden ? 'Hiện Thời Gian' : 'Ẩn Thời Gian'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!reviewing ? (
                    <button
                      type="button"
                      onClick={requestSubmit}
                      disabled={submitting || staffPreview}
                      title={staffPreview ? 'Chế độ xem trước không nộp bài' : undefined}
                      className="w-full py-2.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang nộp…' : 'Nộp bài kiểm tra'}
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setPracticeOpen(true)}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Layers size={13} />
                        <span>Làm đề củng cố</span>
                      </button>
                      <button
                        type="button"
                        onClick={retake}
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

        {/* ── Centre: slide reader or questions / review ───────────────────── */}
        <main className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-slate-50 relative">
          {leftTab === 'slides' ? (
            slide ? (
              <SlideViewer
                courseId={courseId}
                materialId={slide.materialId}
                page={slide.page}
                onPageChange={(page) => setSlide((s) => (s ? { ...s, page } : s))}
              />
            ) : (
              <p className="m-auto text-sm text-slate-500">Chọn một tài liệu ở cột bên trái.</p>
            )
          ) : (
            <div ref={centerRef} className="flex-1 h-full overflow-y-auto px-4 sm:px-7 py-4 space-y-4 scroll-smooth">
              <div className="border-b border-slate-200 pb-2.5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{shortTitle}</h2>
                  <span className="text-xs text-slate-500 font-medium shrink-0">Hạn nộp: {formatDeadline(quiz.due_at)}</span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  {attempt ? `Đã nộp: ${formatDateTime(attempt.submitted_at)}` : `Đã bắt đầu: ${formatStarted(draft.startedAt)}`}
                  {' • '}Điểm tối đa: {formatScore(maxScore)}
                </p>
                <h3 className="text-sm font-bold text-slate-800 mt-1.5">Hướng Dẫn Kiểm Tra</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {quiz.description ||
                    'Hãy đọc kỹ nội dung từng câu hỏi và chọn phương án chính xác nhất. Bạn có thể sử dụng bảng danh sách câu hỏi ở bên trái để chuyển nhanh giữa các câu.'}
                </p>
              </div>

              <InlineError message={submitError} />

              {attempt && (
                <div className="space-y-2.5">
                  <div className="bg-white border-2 border-emerald-300 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          Đã hoàn thành & Chấm điểm tự động
                        </span>
                        {elapsedAtSubmit !== null && (
                          <span className="text-xs text-slate-500 font-medium">Thời gian làm: {formatDuration(elapsedAtSubmit)}</span>
                        )}
                        <span className="text-xs text-slate-500">Lần làm thứ {attempt.attempt_number}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Kết quả bài kiểm tra của bạn</h4>
                      <p className="text-xs text-slate-600">
                        Bạn đã trả lời đúng <strong>{attempt.correct_count}</strong> trên tổng số{' '}
                        <strong>{attempt.total_questions}</strong> câu hỏi ({scorePercent}%).{' '}
                        {attempt.points_awarded > 0
                          ? `+${formatScore(attempt.points_awarded)} điểm vào bảng điểm môn học.`
                          : 'Lần làm lại chỉ để luyện tập, không cộng thêm điểm.'}
                      </p>
                      {submitNote && <p className="text-[11px] text-amber-800">{submitNote}</p>}
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                      <Award size={22} className="text-amber-500" />
                      <div>
                        <span className="text-[9.5px] text-emerald-800 font-semibold block uppercase">Điểm số đạt được</span>
                        <span className="text-lg font-black text-[#1E3A6E] leading-none">
                          {formatScore(attempt.score)} <span className="text-xs font-normal text-slate-400">/ {formatScore(attempt.max_score)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <CompetencyBox courseId={courseId} quizId={quiz.id} attemptId={attempt.attempt_id} />

                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-[#1E3A6E] font-semibold">
                      <ArrowDown size={13} />
                      Cuộn xuống để xem toàn bộ câu hỏi kèm đáp án & giải thích:
                    </span>
                    <span>{attempt.answers.length} câu hỏi</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {attempt ? (
                  attempt.answers.map((answer) => (
                    <ReviewCard
                      key={answer.question_id}
                      answer={answer}
                      number={numberOf(answer.question_id) || answer.position}
                      points={points}
                      onAskAi={() => askQuestion(answer.question_id)}
                      onOpenCitation={() => answer.citation && openCitation({ material_id: answer.citation.material_id ?? '', page: answer.citation.page ?? 1 })}
                    />
                  ))
                ) : displayMode === 'all' ? (
                  questions.map((q, i) => (
                    <div key={q.id} id={`question-card-${q.id}`} className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <QuestionHeader number={i + 1} points={points} answered={isAnswered(draft.answers[q.id])} />
                      <div className="p-4 sm:p-5 space-y-3">
                        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.prompt}</p>
                        <AnswerOptions question={q} value={draft.answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                      </div>
                    </div>
                  ))
                ) : current ? (
                  <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                    <QuestionHeader number={index + 1} points={points} answered={isAnswered(draft.answers[current.id])} />
                    <div className="p-6 sm:p-8 space-y-6">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">{current.prompt}</p>
                      <AnswerOptions question={current} value={draft.answers[current.id]} onChange={(v) => setAnswer(current.id, v)} large />
                    </div>
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        disabled={index === 0}
                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                      >
                        <ChevronLeft size={16} />
                        <span>Trước</span>
                      </button>
                      {index < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Tiếp theo</span>
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={requestSubmit}
                          disabled={submitting || staffPreview}
                          className="px-5 py-2 rounded-lg bg-[#1E3A6E] hover:bg-[#14274E] text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          Nộp bài kiểm tra
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Quiz này chưa có câu hỏi.</p>
                )}
              </div>

              <div className="pt-3 pb-8 border-t border-slate-200">
                {!attempt ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Đã trả lời: <strong>{answeredCount}</strong>/{questions.length} câu
                    </span>
                    <button
                      type="button"
                      onClick={requestSubmit}
                      disabled={submitting || staffPreview}
                      className="px-6 py-2.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang nộp…' : 'Hoàn thành & Nộp bài'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50 border border-amber-300 p-4 rounded-xl shadow-2xs">
                    <div>
                      <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                        <Layers size={16} className="text-amber-600" />
                        <span>Luyện tập củng cố</span>
                      </h4>
                      <p className="text-xs text-amber-900/80 mt-0.5">
                        Tạo quiz tổng hợp từ các tuần đã học (câu hỏi do giảng viên duyệt) hoặc làm lại bài này để luyện tập.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={retake} className={btn.secondary}>
                        <RotateCcw size={14} /> Làm lại bài này
                      </button>
                      <button type="button" onClick={() => setPracticeOpen(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer">
                        Làm đề củng cố
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ── Right column: Socratic tutor ─────────────────────────────────── */}
        <TutorPanel
          messages={tutor.messages}
          pending={tutor.pending}
          chips={chips}
          onSend={sendFreeText}
          onCite={openCitation}
        />
      </div>

      {confirming && (
        <ConfirmDialog
          title="Nộp bài kiểm tra?"
          message={`Bạn mới trả lời ${answeredCount}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ không?`}
          confirmLabel="Nộp bài"
          onCancel={() => setConfirming(false)}
          onConfirm={() => void submit()}
        />
      )}

      {practiceOpen && (
        <Dialog title="Làm đề củng cố" onClose={() => setPracticeOpen(false)} width="max-w-2xl">
          <ComprehensiveBuilder
            courseId={courseId}
            compact
            onCreated={(newQuizId) => {
              setPracticeOpen(false);
              navigate(`/courses/${courseId}/quizzes/${newQuizId}/take`);
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
