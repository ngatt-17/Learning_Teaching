import { useState, useEffect } from 'react';
import { platform, ai } from '../../lib/api';
import type { Topic, Material, QuizSummary, CompetencyReport, QuestionType } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { fromLocalInput, toLocalInput } from '../../lib/format';
import { InlineError } from '../../components/StateViews';
import { btn, inputClass } from '../../components/styles';

/**
 * Composite review quiz built from selected modules and published slides.
 * Strictly filters for approved materials only and provides AI-driven recommendations
 * based on student competency (strengths/weaknesses).
 * Includes full quiz configuration: time limit, due date, question count, question types, and Bloom taxonomy.
 */
export function ComprehensiveBuilder({
  courseId,
  onCreated,
  compact = false,
  quizzes = [],
}: {
  courseId: string;
  onCreated: (quizId: string) => void;
  compact?: boolean;
  quizzes?: QuizSummary[];
}) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);

  // ── Quiz Configuration State (Thời gian làm bài, Hạn nộp, Số câu, Dạng câu, Thang đo) ──
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [hasTimeLimit, setHasTimeLimit] = useState<boolean>(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return toLocalInput(d.toISOString());
  });
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    'single_choice',
    'multiple_choice',
  ]);

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Giữ lại ít nhất 1 loại
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  // Bloom Taxonomy percentages
  const [bloomRemember, setBloomRemember] = useState<number>(40);
  const [bloomUnderstand, setBloomUnderstand] = useState<number>(40);
  const [bloomApply, setBloomApply] = useState<number>(20);
  const totalBloom = Number(bloomRemember || 0) + Number(bloomUnderstand || 0) + Number(bloomApply || 0);

  const applyBloomPreset = (rem: number, und: number, app: number) => {
    setBloomRemember(rem);
    setBloomUnderstand(und);
    setBloomApply(app);
  };

  const addDaysToDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    setDueDate(toLocalInput(d.toISOString()));
  };

  // AI Recommendation state
  const [aiSuggestion, setAiSuggestion] = useState<{
    text: string;
    suggestedWeeks: number[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Fetch topics and materials in parallel
  const { data: topicsData } = useAsync(
    () => platform.get<{ topics: Topic[]; min_topics_for_comprehensive: number }>(`/courses/${courseId}/quizzes/topics`),
    [courseId],
  );

  const { data: materialsData } = useAsync(
    () => platform.get<Material[]>(`/courses/${courseId}/materials/`),
    [courseId],
  );

  // Strictly filter approved materials only (published)
  const publishedMaterials = (materialsData || []).filter(
    (m) => m.status === 'approved' && m.approved_for_ai
  );

  // Automatically fetch AI recommendation from recent attempt competency
  useEffect(() => {
    let active = true;
    async function loadRecommendation() {
      const attempted = quizzes.find((q) => (q.my_attempts ?? 0) > 0);
      if (!attempted) {
        if (active) {
          setAiSuggestion({
            text: 'Bạn chưa có dữ liệu làm bài trước đó. AI đề xuất bạn nên bắt đầu ôn tập từ Module 1 để củng cố nền tảng.',
            suggestedWeeks: [1],
          });
        }
        return;
      }

      setLoadingAi(true);
      try {
        const report = await ai.post<CompetencyReport>(
          `/api/ai/courses/${courseId}/quizzes/${attempted.id}/competency`,
          {}
        );
        if (!active) return;
        const weaknesses = report?.competency_summary?.weaknesses ?? [];
        const strengths = report?.competency_summary?.strengths ?? [];

        if (weaknesses.length > 0) {
          const weakTopicsStr = weaknesses.map((w) => `"${w.topic}"`).join(', ');
          const matchedWeeks: number[] = [];
          if (topicsData?.topics) {
            for (const t of topicsData.topics) {
              if (
                t.available &&
                weaknesses.some(
                  (w) =>
                    t.lesson_title.toLowerCase().includes(w.topic.toLowerCase()) ||
                    w.topic.toLowerCase().includes(t.lesson_title.toLowerCase())
                )
              ) {
                matchedWeeks.push(t.week_number);
              }
            }
          }
          const suggestedWeeks = matchedWeeks.length > 0 ? matchedWeeks : [topicsData?.topics?.[0]?.week_number ?? 1];

          setAiSuggestion({
            text: `Dựa trên bài làm gần đây, bạn còn gặp khó khăn ở các chủ đề: ${weakTopicsStr}. AI khuyến nghị bạn nên chọn ôn tập các Module/Slide tương ứng để khắc phục lỗ hổng.`,
            suggestedWeeks,
          });
        } else if (strengths.length > 0) {
          setAiSuggestion({
            text: `Bạn đã nắm vững các chủ đề: ${strengths.map((s) => `"${s.topic}"`).join(', ')}. Hãy kết hợp ôn tập thêm các Module tiếp theo để thử thách bản thân.`,
            suggestedWeeks: topicsData?.topics?.filter((t) => t.available).map((t) => t.week_number).slice(0, 2) || [1],
          });
        } else {
          setAiSuggestion({
            text: 'AI đề xuất bạn chọn các Module và Slide đã học bên dưới để tạo bài tập rèn luyện kiến thức tổng hợp.',
            suggestedWeeks: [1],
          });
        }
      } catch {
        if (active) {
          setAiSuggestion({
            text: 'AI đề xuất bạn chọn các Module và Slide đã học bên dưới để tạo đề ôn tập tổng hợp phù hợp.',
            suggestedWeeks: [1],
          });
        }
      } finally {
        if (active) setLoadingAi(false);
      }
    }

    if (topicsData) {
      void loadRecommendation();
    }
    return () => {
      active = false;
    };
  }, [courseId, quizzes, topicsData]);

  if (!topicsData) return null;
  const topics = topicsData.topics || [];

  const toggleWeek = (weekNumber: number) => {
    const isSelected = selectedWeeks.includes(weekNumber);
    const weekSlides = publishedMaterials.filter((m) => m.week_number === weekNumber).map((m) => m.id);

    if (isSelected) {
      setSelectedWeeks((prev) => prev.filter((w) => w !== weekNumber));
      setSelectedSlideIds((prev) => prev.filter((id) => !weekSlides.includes(id)));
    } else {
      setSelectedWeeks((prev) => [...prev, weekNumber]);
      setSelectedSlideIds((prev) => Array.from(new Set([...prev, ...weekSlides])));
    }
  };

  const toggleSlide = (slideId: string, weekNumber: number) => {
    const isSlideSelected = selectedSlideIds.includes(slideId);
    let newSlideIds: string[];

    if (isSlideSelected) {
      newSlideIds = selectedSlideIds.filter((id) => id !== slideId);
    } else {
      newSlideIds = [...selectedSlideIds, slideId];
    }
    setSelectedSlideIds(newSlideIds);

    const weekSlides = publishedMaterials.filter((m) => m.week_number === weekNumber).map((m) => m.id);
    const hasAnySlideInWeek = weekSlides.some((id) => newSlideIds.includes(id));

    if (hasAnySlideInWeek && !selectedWeeks.includes(weekNumber)) {
      setSelectedWeeks((prev) => [...prev, weekNumber]);
    } else if (!hasAnySlideInWeek && selectedWeeks.includes(weekNumber)) {
      setSelectedWeeks((prev) => prev.filter((w) => w !== weekNumber));
    }
  };

  const toggleExpandWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekNumber) ? prev.filter((w) => w !== weekNumber) : [...prev, weekNumber]
    );
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion || aiSuggestion.suggestedWeeks.length === 0) return;
    const weeksToSelect = aiSuggestion.suggestedWeeks.filter((w) => {
      const topic = topics.find((t) => t.week_number === w);
      return topic ? topic.available : false;
    });

    const finalWeeks = weeksToSelect.length > 0 ? weeksToSelect : [topics.find((t) => t.available)?.week_number ?? 1];
    setSelectedWeeks(finalWeeks);

    const slideIds = publishedMaterials
      .filter((m) => finalWeeks.includes(m.week_number ?? -1))
      .map((m) => m.id);
    setSelectedSlideIds(slideIds);
  };

  const create = async () => {
    if (selectedWeeks.length < 1) return;
    setBusy(true);
    setError(null);
    try {
      const perTopic = Math.max(1, Math.ceil(questionCount / selectedWeeks.length));
      const res = await platform.post<{ quiz_id: string }>(`/courses/${courseId}/quizzes/comprehensive`, {
        week_numbers: selectedWeeks,
        questions_per_topic: perTopic,
        question_count: questionCount,
        title: quizTitle.trim() || undefined,
        time_limit_seconds: hasTimeLimit ? timeLimitMinutes * 60 : null,
        due_at: dueDate ? fromLocalInput(dueDate) : null,
        question_types: selectedQuestionTypes,
        difficulty,
        bloom_remember: bloomRemember,
        bloom_understand: bloomUnderstand,
        bloom_apply: bloomApply,
      });
      onCreated(res.quiz_id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const selectedCount = selectedWeeks.length;

  return (
    <section className={`${compact ? 'space-y-4' : 'mb-6 border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4'}`}>
      {/* Header - only display when not in compact/collapsible mode */}
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A6E] bg-blue-100 px-2 py-0.5 rounded">
                Tạo đề ôn tập
              </span>
              <h3 className="font-bold text-base text-slate-900">Quiz tổng hợp theo chủ đề</h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Chọn ít nhất 1 chủ đề (Module hoặc Slide đã học) để hệ thống tổng hợp câu hỏi từ ngân hàng bài tập đã duyệt.
            </p>
          </div>
          <div className="shrink-0 text-xs font-medium text-slate-600">
            Đã chọn: <strong className="text-[#1E3A6E]">{selectedCount}</strong> chủ đề
          </div>
        </div>
      )}

      {/* AI Recommendation Box */}
      <div className="border border-blue-200 bg-white rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E3A6E]">Gợi ý từ trợ lý AI:</span>
            {loadingAi && <span className="text-slate-400 italic">Đang phân tích kết quả...</span>}
          </div>
          {aiSuggestion && (
            <button
              type="button"
              onClick={applyAiSuggestion}
              className="text-xs font-bold text-[#1E3A6E] hover:underline cursor-pointer bg-blue-50 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Áp dụng gợi ý của AI
            </button>
          )}
        </div>
        {aiSuggestion && (
          <p className="text-slate-700 leading-relaxed">
            {aiSuggestion.text}
          </p>
        )}
      </div>

      {/* Topics & Slides Hierarchy */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Danh sách Module & Slide bài giảng đã phát hành:
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">
              Đã chọn: <strong className="text-[#1E3A6E]">{selectedCount}</strong> chủ đề
            </span>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedWeeks([]);
                  setSelectedSlideIds([]);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
        </div>

        {topics.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Khóa học chưa có chủ đề bài giảng nào được phát hành.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map((t) => {
              const weekMaterials = publishedMaterials.filter((m) => m.week_number === t.week_number);
              const isWeekActive = selectedWeeks.includes(t.week_number);
              const isExpanded = expandedWeeks.includes(t.week_number);

              return (
                <div
                  key={t.week_number}
                  className={`border rounded-lg p-3 transition-colors ${
                    !t.available
                      ? 'bg-slate-100 border-slate-200 opacity-60'
                      : isWeekActive
                      ? 'bg-white border-[#1E3A6E] ring-1 ring-[#1E3A6E]/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Module Level */}
                  <div className="flex items-start justify-between gap-2">
                    <label className={`flex items-start gap-2.5 flex-1 select-none ${t.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                      <input
                        type="checkbox"
                        disabled={!t.available}
                        checked={isWeekActive}
                        onChange={() => toggleWeek(t.week_number)}
                        className="mt-0.5 rounded border-slate-300 text-[#1E3A6E] focus:ring-[#1E3A6E]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          Module {t.week_number}: {t.lesson_title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {!t.available
                            ? t.locked_reason || 'Chưa mở khóa'
                            : `${weekMaterials.length} slide bài giảng đã duyệt`}
                        </div>
                      </div>
                    </label>

                    {t.available && weekMaterials.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandWeek(t.week_number)}
                        className="text-[11px] font-semibold text-[#1E3A6E] hover:underline shrink-0 cursor-pointer px-1 py-0.5"
                      >
                        {isExpanded ? 'Ẩn slides' : `Xem slides (${weekMaterials.length})`}
                      </button>
                    )}
                  </div>

                  {/* Slide Level (Indented) */}
                  {t.available && isExpanded && weekMaterials.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 pl-6 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Slide / Tài liệu trong Module:
                      </div>
                      {weekMaterials.map((m) => {
                        const isSlideActive = selectedSlideIds.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isSlideActive}
                              onChange={() => toggleSlide(m.id, t.week_number)}
                              className="rounded border-slate-300 text-[#1E3A6E] focus:ring-[#1E3A6E]"
                            />
                            <span className="truncate" title={m.title}>
                              {m.title}
                            </span>
                            {m.page_count && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                ({m.page_count} trang)
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── THÔNG TIN CẤU HÌNH BÀI QUIZ (Thời gian, Hạn nộp, Số câu, Dạng câu hỏi, Thang đo) ── */}
      <div className="border-t border-slate-200 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Cấu hình bài thi:
          </span>
          <span className="text-xs text-slate-500">
            Tùy chỉnh thời gian, số câu hỏi và phân bổ độ khó
          </span>
        </div>

        {/* Tiêu đề bài Quiz (Tùy chọn) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tiêu đề bài Quiz (Tùy chọn)
          </label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder={
              selectedWeeks.length > 0
                ? `Quiz tổng hợp — Tuần ${selectedWeeks.slice().sort((a, b) => a - b).join(', ')}`
                : 'Nhập tiêu đề hoặc để trống để tạo tự động'
            }
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Thời gian làm bài */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasTimeLimit}
                  onChange={(e) => setHasTimeLimit(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A6E] focus:ring-[#1E3A6E]"
                />
                <span>Thời gian làm bài</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                {hasTimeLimit ? `${timeLimitMinutes} phút` : 'Tự do'}
              </span>
            </div>

            {hasTimeLimit ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Math.max(1, Number(e.target.value) || 1))}
                    className={`${inputClass} text-center font-bold`}
                  />
                  <span className="text-xs text-slate-500 shrink-0">Phút</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[10, 15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTimeLimitMinutes(m)}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                        timeLimitMinutes === m
                          ? 'bg-[#1E3A6E] text-white border-[#1E3A6E]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {m}p
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-1">
                Không giới hạn thời gian làm bài kiểm tra.
              </p>
            )}
          </div>

          {/* Hạn nộp bài */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Hạn nộp bài
              </label>
              {dueDate ? (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Không hạn
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">Không có hạn</span>
              )}
            </div>

            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: '+3 ngày', days: 3 },
                { label: '+7 ngày', days: 7 },
                { label: '+14 ngày', days: 14 },
              ].map((btnOption) => (
                <button
                  key={btnOption.label}
                  type="button"
                  onClick={() => addDaysToDueDate(btnOption.days)}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white text-slate-600 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  {btnOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Số lượng câu hỏi */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Số lượng câu hỏi
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                {questionCount} câu
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(2, Math.min(50, Number(e.target.value) || 2)))}
                className={`${inputClass} text-center font-bold`}
              />
              <span className="text-xs text-slate-500 shrink-0">Câu</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[5, 10, 15, 20, 25].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-[#1E3A6E] text-white border-[#1E3A6E]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cnt} câu
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dạng câu hỏi & Mức độ khó */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dạng câu hỏi */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              Dạng câu hỏi (chọn nhiều loại):
            </div>
            <div className="flex items-center gap-4 flex-wrap pt-1">
              {[
                { type: 'single_choice' as QuestionType, label: 'Một đáp án' },
                { type: 'multiple_choice' as QuestionType, label: 'Nhiều đáp án' },
                { type: 'short_answer' as QuestionType, label: 'Trả lời ngắn' },
              ].map(({ type, label }) => {
                const checked = selectedQuestionTypes.includes(type);
                return (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuestionType(type)}
                      className="rounded border-slate-300 text-[#1E3A6E] focus:ring-[#1E3A6E]"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Mức độ khó */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              Mức độ khó:
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {[
                { id: 'easy', label: 'Dễ' },
                { id: 'medium', label: 'Trung bình' },
                { id: 'hard', label: 'Khó' },
                { id: 'mixed', label: 'Hỗn hợp' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    difficulty === diff.id
                      ? 'bg-[#1E3A6E] text-white border-[#1E3A6E]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phân bổ thang đo nhận thức Bloom (Tối giản, không màu mè) */}
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Phân bổ thang đo nhận thức Bloom:
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                totalBloom === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Tổng: {totalBloom}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyBloomPreset(50, 40, 10)}
                className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white text-slate-600 border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                Cơ bản (50/40/10)
              </button>
              <button
                type="button"
                onClick={() => applyBloomPreset(40, 40, 20)}
                className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white text-slate-600 border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                Cân bằng (40/40/20)
              </button>
              <button
                type="button"
                onClick={() => applyBloomPreset(20, 40, 40)}
                className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white text-slate-600 border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                Nâng cao (20/40/40)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-700">Nhận biết (Remember)</div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloomRemember}
                  onChange={(e) => setBloomRemember(Number(e.target.value) || 0)}
                  className={`${inputClass} text-center font-bold`}
                />
                <span className="text-xs text-slate-500 font-bold">%</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-700">Thông hiểu (Understand)</div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloomUnderstand}
                  onChange={(e) => setBloomUnderstand(Number(e.target.value) || 0)}
                  className={`${inputClass} text-center font-bold`}
                />
                <span className="text-xs text-slate-500 font-bold">%</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-700">Vận dụng (Apply)</div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloomApply}
                  onChange={(e) => setBloomApply(Number(e.target.value) || 0)}
                  className={`${inputClass} text-center font-bold`}
                />
                <span className="text-xs text-slate-500 font-bold">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InlineError message={error} />

      {/* Action button */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <span className="text-xs text-slate-500">
          {selectedCount === 0
            ? 'Vui lòng chọn ít nhất 1 chủ đề'
            : `Sẵn sàng tạo quiz tổng hợp từ ${selectedCount} chủ đề • ${questionCount} câu • ${hasTimeLimit ? `${timeLimitMinutes} phút` : 'Tự do'}`}
        </span>
        <button
          type="button"
          onClick={create}
          disabled={busy || selectedCount < 1}
          className={btn.primary}
        >
          {busy ? 'Đang tạo quiz…' : `Tạo quiz tổng hợp (${questionCount} câu)`}
        </button>
      </div>
    </section>
  );
}
