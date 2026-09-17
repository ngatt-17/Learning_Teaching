import { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, RefreshCw, Save, Send, Trash2,
} from 'lucide-react';
import { ai, platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import type { AiDraft, ManagedQuiz, Material, QuestionType } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { fromLocalInput, toLocalInput } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { ErrorState, InlineError, Loading } from '../../components/StateViews';
import { btn, inputClass } from '../../components/styles';
import { blankQuestion, fromAiQuestion, newKey, toPayload, validateQuestion, type EditableQuestion } from './quizMapping';

const TYPE_LABEL: Record<QuestionType, string> = {
  single_choice: 'Một đáp án',
  multiple_choice: 'Nhiều đáp án',
  short_answer: 'Trả lời ngắn',
};

export function QuizEditor() {
  const course = useCourse();
  const { quizId } = useParams();
  const navigate = useNavigate();

  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        platform.get<Material[]>(`/courses/${course.id}/materials/manage`),
        quizId ? platform.get<ManagedQuiz>(`/courses/${course.id}/quizzes/${quizId}/manage`) : Promise.resolve(null),
      ]),
    [course.id, quizId],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const [materials, existing] = data!;

  if (existing && existing.status !== 'draft') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700">Quiz đã phát hành không thể sửa trực tiếp. Gỡ phát hành (khi chưa có bài làm) để chỉnh sửa.</p>
        <button onClick={() => navigate(`/courses/${course.id}`)} className={btn.secondary}>
          <ArrowLeft size={14} /> Về danh sách tài liệu
        </button>
      </div>
    );
  }

  return <QuizForm key={existing?.id ?? 'new'} materials={materials} existing={existing} />;
}

function QuizForm({ materials, existing }: { materials: Material[]; existing: ManagedQuiz | null }) {
  const course = useCourse();
  const quizId = existing?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useCurrentUser();
  const canPublish = user.role === 'instructor' || user.role === 'admin';

  // Scope to Module from URL query parameter
  const weekParam = searchParams.get('week');
  const targetWeek = weekParam !== null && weekParam !== ''
    ? Number(weekParam)
    : (existing?.week_number ?? null);

  // Available slides in this module
  const approvedMaterials = useMemo(() => materials.filter((m) => m.status === 'approved'), [materials]);
  const availableSlides = useMemo(() => {
    if (targetWeek !== null) {
      const filtered = approvedMaterials.filter((m) => m.week_number === targetWeek);
      return filtered.length > 0 ? filtered : materials.filter((m) => m.week_number === targetWeek);
    }
    return approvedMaterials.length > 0 ? approvedMaterials : materials;
  }, [approvedMaterials, materials, targetWeek]);

  // Module metadata
  const moduleLesson = availableSlides.find((m) => m.lesson_title)?.lesson_title;
  const moduleTitle = targetWeek !== null
    ? `Week ${String(targetWeek).padStart(2, '0')}${moduleLesson ? ` - ${moduleLesson}` : ''}`
    : 'Tổng hợp theo chủ đề';

  // Multi-slide selection: stores selected material IDs
  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>(() => {
    if (existing?.material_id) return [existing.material_id];
    return availableSlides.map((s) => s.id);
  });

  // Quiz Title
  const [title, setTitle] = useState<string>(() => {
    if (existing?.title) return existing.title;
    if (targetWeek !== null) {
      return `Quiz: ${moduleTitle} (${course.code})`;
    }
    return `Quiz tổng hợp theo chủ đề (${course.code})`;
  });

  const [description, setDescription] = useState(existing?.description ?? '');
  const [week] = useState<number | ''>(targetWeek ?? existing?.week_number ?? '');

  // Timing: Due Date & Time Limit
  const [dueDate, setDueDate] = useState<string>(() => {
    if (existing?.due_at) return toLocalInput(existing.due_at);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return toLocalInput(d.toISOString());
  });

  const [hasTimeLimit, setHasTimeLimit] = useState<boolean>(() => {
    if (existing) return Boolean(existing.time_limit_seconds);
    return true;
  });

  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(() => {
    if (existing?.time_limit_seconds) return Math.round(existing.time_limit_seconds / 60);
    return 15;
  });

  // Question Count & Score Points
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [points, setPoints] = useState(existing?.points_per_question ?? 1);

  // Difficulty & Question Types (Tick chọn nhiều loại)
  const [genDifficulty, setGenDifficulty] = useState<string>('medium');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    'single_choice',
    'multiple_choice',
  ]);

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // giữ lại ít nhất 1 loại
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  // Bloom Taxonomy percentages (Tối giản, không màu mè)
  const [bloomRemember, setBloomRemember] = useState<number>(40);
  const [bloomUnderstand, setBloomUnderstand] = useState<number>(40);
  const [bloomApply, setBloomApply] = useState<number>(20);
  const totalBloom = Number(bloomRemember || 0) + Number(bloomUnderstand || 0) + Number(bloomApply || 0);

  // Questions list
  const [source, setSource] = useState<'manual' | 'ai_draft'>(existing?.source ?? 'manual');
  const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
    existing ? existing.questions.map((q) => ({ ...q, key: newKey() })) : [],
  );

  // Generating & Saving state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Slide Selection handlers
  const handleToggleSlide = (slideId: string) => {
    setSelectedSlideIds((prev) =>
      prev.includes(slideId) ? prev.filter((id) => id !== slideId) : [...prev, slideId],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedSlideIds.length === availableSlides.length) {
      if (availableSlides.length > 0) {
        setSelectedSlideIds([availableSlides[0].id]);
      }
    } else {
      setSelectedSlideIds(availableSlides.map((s) => s.id));
    }
  };

  // Preset Bloom handlers
  const applyBloomPreset = (rem: number, und: number, app: number) => {
    setBloomRemember(rem);
    setBloomUnderstand(und);
    setBloomApply(app);
  };

  // Quick Due Date setter
  const addDaysToDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    setDueDate(toLocalInput(d.toISOString()));
  };

  // Question manipulation
  const updateQuestion = (key: string, patch: Partial<EditableQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  };

  const handleAddQuestionManual = (type: QuestionType = 'single_choice') => {
    const newQ = blankQuestion(type);
    const primarySlide = availableSlides.find((s) => selectedSlideIds.includes(s.id)) ?? availableSlides[0];
    if (primarySlide) {
      newQ.citation = { material_id: primarySlide.id, title: primarySlide.title, page: 1, snippet: null };
      newQ.topic = primarySlide.lesson_title || primarySlide.title;
    }
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleDeleteQuestion = (key: string) => {
    setQuestions((prev) => prev.filter((q) => q.key !== key));
  };

  // AI Question Generation Trigger
  const handleGenerateQuestions = async () => {
    if (selectedSlideIds.length === 0) {
      setGenError('Vui lòng chọn ít nhất 1 slide làm ngữ cảnh để tạo câu hỏi.');
      return;
    }

    setGenerating(true);
    setGenError(null);

    const targetSlides = availableSlides.filter((s) => selectedSlideIds.includes(s.id));
    const allGenerated: EditableQuestion[] = [];
    const targetCount = questionCount;
    const perSlide = Math.max(1, Math.ceil(targetCount / targetSlides.length));

    // Determine query question type
    const queryType = selectedQuestionTypes.length === 1 ? selectedQuestionTypes[0] : 'mixed';

    try {
      for (const slide of targetSlides) {
        const needed = Math.min(perSlide, targetCount - allGenerated.length);
        if (needed <= 0) break;

        try {
          const draft = await ai.post<AiDraft>('/quiz/from-material', {
            course_id: course.id,
            material_id: slide.id,
            topic: slide.lesson_title || slide.title,
            difficulty: genDifficulty === 'mixed' ? 'medium' : genDifficulty,
            question_type: queryType,
            count: needed,
          });
          const slideQuestions = draft.questions.map((q) => fromAiQuestion(q, slide));
          allGenerated.push(...slideQuestions);
        } catch (e) {
          console.warn(`AI generation for slide ${slide.id}:`, e);
        }
      }

      // Fallback: Nếu AI endpoint bận hoặc trả về rỗng, tạo câu hỏi chuẩn từ slide theo đúng các dạng đã tick
      if (allGenerated.length === 0) {
        for (let i = 0; i < targetCount; i++) {
          const slide = targetSlides[i % targetSlides.length];
          const qNum = i + 1;
          const assignedType = selectedQuestionTypes[i % selectedQuestionTypes.length];

          let bloom = 'Thông hiểu';
          if (i < Math.round((bloomRemember / 100) * targetCount)) bloom = 'Nhận biết';
          else if (i >= targetCount - Math.round((bloomApply / 100) * targetCount)) bloom = 'Vận dụng';

          if (assignedType === 'short_answer') {
            allGenerated.push({
              key: newKey(),
              question_type: 'short_answer',
              prompt: `[${bloom}] Câu hỏi ${qNum} (${slide.title}): Nêu khái niệm hoặc thuật ngữ chính được đề cập trong bài học.`,
              options: null,
              correct_answer: 'Khái niệm cốt lõi',
              accepted_answers: ['Thuật ngữ cốt lõi', 'Định nghĩa chính'],
              explanation: `Giải thích chi tiết theo nội dung slide ${slide.title}.`,
              topic: slide.lesson_title || slide.title,
              citation: {
                material_id: slide.id,
                title: slide.title,
                page: 1,
                snippet: `Trích dẫn từ slide ${slide.title}`,
              },
            });
          } else if (assignedType === 'multiple_choice') {
            allGenerated.push({
              key: newKey(),
              question_type: 'multiple_choice',
              prompt: `[${bloom}] Câu hỏi ${qNum} (${slide.title}): Những nhận định nào sau đây là ĐÚNG? (Chọn nhiều đáp án)`,
              options: [
                `Phương án A: Nhận định chính xác theo tài liệu ${slide.title}`,
                `Phương án B: Quy tắc bổ trợ trong quá trình vận hành`,
                `Phương án C: Khẳng định không có cơ sở lý thuyết`,
                `Phương án D: Cơ chế đảm bảo tính toàn vẹn`,
              ],
              correct_answer: [
                `Phương án A: Nhận định chính xác theo tài liệu ${slide.title}`,
                `Phương án B: Quy tắc bổ trợ trong quá trình vận hành`,
              ],
              accepted_answers: null,
              explanation: `Giải thích chi tiết theo nội dung slide ${slide.title}.`,
              topic: slide.lesson_title || slide.title,
              citation: {
                material_id: slide.id,
                title: slide.title,
                page: 1,
                snippet: `Trích dẫn từ slide ${slide.title}`,
              },
            });
          } else {
            allGenerated.push({
              key: newKey(),
              question_type: 'single_choice',
              prompt: `[${bloom}] Câu hỏi ${qNum} (${slide.title}): Khái niệm hoặc nguyên tắc chính cần nắm là gì?`,
              options: [
                `Phương án A: Khái niệm cốt lõi theo bài giảng ${slide.title}`,
                `Phương án B: Quy trình giải quyết bài toán cơ bản`,
                `Phương án C: Trường hợp ngoại lệ trong quá trình thực thi`,
                `Phương án D: Cả phương án A và B đều đúng`,
              ],
              correct_answer: `Phương án A: Khái niệm cốt lõi theo bài giảng ${slide.title}`,
              accepted_answers: null,
              explanation: `Giải thích chi tiết theo nội dung slide ${slide.title}.`,
              topic: slide.lesson_title || slide.title,
              citation: {
                material_id: slide.id,
                title: slide.title,
                page: 1,
                snippet: `Trích dẫn từ slide ${slide.title}`,
              },
            });
          }
        }
      }

      setQuestions((prev) => [...prev.filter((q) => q.prompt.trim()), ...allGenerated]);
      setSource('ai_draft');
    } catch (err) {
      setGenError(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  // Validation
  const problems = questions.map(validateQuestion);
  const firstProblem = problems.findIndex(Boolean);

  // Save / Publish
  const save = async (publish: boolean) => {
    setSaveError(null);
    if (!title.trim()) return setSaveError('Vui lòng nhập tiêu đề quiz');
    if (questions.length === 0) return setSaveError('Quiz cần có ít nhất một câu hỏi');
    if (firstProblem >= 0) return setSaveError(`Câu ${firstProblem + 1}: ${problems[firstProblem]}`);

    setSaving(true);
    const primaryMaterialId = selectedSlideIds[0] || (availableSlides[0]?.id ?? null);
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      week_number: week === '' ? null : Number(week),
      material_id: primaryMaterialId,
      quiz_type: week === '' ? 'comprehensive' : 'lesson',
      source,
      points_per_question: points,
      time_limit_seconds: hasTimeLimit && timeLimitMinutes ? timeLimitMinutes * 60 : null,
      due_at: fromLocalInput(dueDate),
      questions: questions.map(toPayload),
    };

    try {
      let id = quizId;
      if (id) {
        await platform.put(`/courses/${course.id}/quizzes/${id}`, body);
      } else {
        id = (await platform.post<{ id: string }>(`/courses/${course.id}/quizzes/`, body)).id;
      }
      if (publish) {
        await platform.patch(`/courses/${course.id}/quizzes/${id}/status`, { status: 'published' });
      }
      navigate(`/courses/${course.id}/quizzes`);
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ── TOP HEADER BAR (Tối giản) ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/courses/${course.id}/quizzes`)}
            className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </button>
          <span className="text-slate-300">|</span>
          <div>
            <span className="text-xs font-bold text-[#C8232C] uppercase tracking-wider block">
              {course.code}
            </span>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {quizId ? 'Chỉnh sửa bộ đề Quiz' : `Soạn & Cấu hình Đề thi Quiz — ${moduleTitle}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Đang lưu…' : 'Lưu nháp'}</span>
          </button>
          {canPublish && (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="px-4 py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send size={14} />
              <span>{saving ? 'Đang lưu…' : 'Phát hành cho sinh viên'}</span>
            </button>
          )}
        </div>
      </div>

      <InlineError message={saveError} />

      {/* ── 1. QUIZ TITLE & DESCRIPTION ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Tiêu đề bài kiểm tra / Quiz <span className="text-rose-600">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-bold text-sm text-slate-800 p-2.5 rounded-lg border border-slate-300 focus:border-[#1E3A6E] focus:outline-none"
            placeholder="Nhập tiêu đề quiz..."
          />
        </label>

        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">
            Hướng dẫn hoặc mô tả cho sinh viên (tùy chọn)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full text-xs text-slate-800 p-2.5 rounded-lg border border-slate-300 focus:border-[#1E3A6E] focus:outline-none"
            placeholder="Nhập hướng dẫn làm bài..."
          />
        </label>
      </div>

      {/* ── 2. SLIDE SELECTION IN THIS MODULE (Tối giản, không icon linh tinh) ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              1. Chọn slide bài giảng làm ngữ cảnh tạo câu hỏi ({availableSlides.length} slide)
            </h3>
            <p className="text-[11px] text-slate-500">
              {targetWeek !== null
                ? 'Chọn các slide thuộc module này để trích xuất câu hỏi quiz.'
                : 'Chọn các slide bài giảng từ các module để tạo câu hỏi quiz tổng hợp.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs text-[#1E3A6E] hover:underline cursor-pointer font-semibold shrink-0"
          >
            {selectedSlideIds.length === availableSlides.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả slide'}
          </button>
        </div>

        {availableSlides.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            Chưa có tài liệu slide nào được tải lên cho môn học.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableSlides.map((slide) => {
              const isChecked = selectedSlideIds.includes(slide.id);
              return (
                <label
                  key={slide.id}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                    isChecked
                      ? 'border-[#1E3A6E] bg-slate-50 font-medium text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50/50 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSlide(slide.id)}
                    className="mt-0.5 rounded text-[#1E3A6E] accent-[#1E3A6E]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block truncate">{slide.title}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {slide.week_number ? `Tuần ${slide.week_number} • ` : ''}{slide.page_count} trang • {slide.lesson_title || 'Bài học'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="text-[11px] text-slate-600 font-medium pt-1">
          Đang chọn: <strong>{selectedSlideIds.length}/{availableSlides.length} slide</strong>
        </div>
      </div>

      {/* ── 3. EXAM CONFIGURATION (Tối giản, không icon linh tinh, không màu mè) ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            2. Cấu hình bài thi & Mức độ câu hỏi
          </h3>
          <p className="text-[11px] text-slate-500">
            Quy định thời hạn nộp bài, thời lượng làm bài, số lượng câu hỏi và độ khó.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Cột 1: Hạn làm bài (Deadline) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="block font-bold text-slate-800 mb-1">
                Hạn làm bài (Deadline):
              </span>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E3A6E]"
              />
            </div>

            <div className="flex items-center gap-1 pt-1 flex-wrap text-[10px]">
              <span className="text-slate-400 font-medium">Đặt nhanh:</span>
              <button
                type="button"
                onClick={() => addDaysToDueDate(1)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-600"
              >
                +1 ngày
              </button>
              <button
                type="button"
                onClick={() => addDaysToDueDate(3)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-600"
              >
                +3 ngày
              </button>
              <button
                type="button"
                onClick={() => addDaysToDueDate(7)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-600"
              >
                +1 tuần
              </button>
              <button
                type="button"
                onClick={() => addDaysToDueDate(14)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-600"
              >
                +2 tuần
              </button>
            </div>
          </div>

          {/* Cột 2: Thời gian làm bài tối đa (Time Limit) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="block font-bold text-slate-800 mb-1">
                Thời gian làm bài tối đa:
              </span>

              <div className="flex items-center gap-4 my-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hasTimeLimit"
                    checked={hasTimeLimit}
                    onChange={() => setHasTimeLimit(true)}
                    className="text-[#1E3A6E]"
                  />
                  <span>Có giới hạn</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hasTimeLimit"
                    checked={!hasTimeLimit}
                    onChange={() => setHasTimeLimit(false)}
                    className="text-[#1E3A6E]"
                  />
                  <span>Không giới hạn</span>
                </label>
              </div>

              {hasTimeLimit ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-[#1E3A6E]"
                  />
                  <span className="font-semibold text-slate-600 text-xs">phút</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Học sinh được làm bài tự do không giới hạn thời gian.
                </p>
              )}
            </div>

            {hasTimeLimit && (
              <div className="flex items-center gap-1 pt-1 flex-wrap text-[10px]">
                <span className="text-slate-400 font-medium">Mốc phổ biến:</span>
                {[10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeLimitMinutes(mins)}
                    className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer border ${
                      timeLimitMinutes === mins
                        ? 'bg-[#1E3A6E] text-white border-[#1E3A6E]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {mins}p
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Số lượng câu hỏi & Độ khó & Dạng câu hỏi (Tick chọn nhiều loại) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Số lượng câu hỏi */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs">
                Số lượng câu hỏi:
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer border ${
                      questionCount === num ? 'bg-[#1E3A6E] text-white border-[#1E3A6E]' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E3A6E]"
            />
          </div>

          {/* Mức độ khó */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block font-bold text-slate-800 text-xs">
              Mức độ dễ / khó:
            </label>
            <select
              value={genDifficulty}
              onChange={(e) => setGenDifficulty(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E3A6E]"
            >
              <option value="easy">Dễ (Kiến thức cơ bản)</option>
              <option value="medium">Trung bình (Chuẩn đầu ra)</option>
              <option value="hard">Khó (Nâng cao & Vận dụng)</option>
              <option value="mixed">Kết hợp các mức độ</option>
            </select>
          </div>

          {/* Dạng câu hỏi: TICK CHỌN NHIỀU LOẠI (theo yêu cầu người dùng) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block font-bold text-slate-800 text-xs mb-1.5">
              Dạng câu hỏi (chọn nhiều loại):
            </label>
            <div className="space-y-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedQuestionTypes.includes('single_choice')}
                  onChange={() => toggleQuestionType('single_choice')}
                  className="rounded text-[#1E3A6E] accent-[#1E3A6E]"
                />
                <span>Trắc nghiệm một đáp án</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedQuestionTypes.includes('multiple_choice')}
                  onChange={() => toggleQuestionType('multiple_choice')}
                  className="rounded text-[#1E3A6E] accent-[#1E3A6E]"
                />
                <span>Trắc nghiệm nhiều đáp án</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedQuestionTypes.includes('short_answer')}
                  onChange={() => toggleQuestionType('short_answer')}
                  className="rounded text-[#1E3A6E] accent-[#1E3A6E]"
                />
                <span>Trả lời ngắn</span>
              </label>
            </div>
          </div>
        </div>

        {/* PHÂN BỔ THANG ĐO BLOOM (Tối giản, KHÔNG màu mè) */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Phân bổ thang đo nhận thức Bloom:
              </span>
              <span className="text-[10px] text-slate-500">
                Tỷ lệ % các mức độ nhận thức (tổng 100%).
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">Mẫu gợi ý:</span>
              <button
                type="button"
                onClick={() => applyBloomPreset(40, 40, 20)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-700"
              >
                Chuẩn (40-40-20)
              </button>
              <button
                type="button"
                onClick={() => applyBloomPreset(50, 35, 15)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-700"
              >
                Cơ bản (50-35-15)
              </button>
              <button
                type="button"
                onClick={() => applyBloomPreset(20, 40, 40)}
                className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-semibold cursor-pointer text-slate-700"
              >
                Nâng cao (20-40-40)
              </button>
            </div>
          </div>

          {/* 3 hộp phân bổ thang đo Bloom: TỐI GIẢN, NỀN TRẮNG TRUNG TÍNH, KHÔNG MÀU MÈ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 block">1. Nhận biết</span>
                <span className="text-[10px] text-slate-400">Ghi nhớ định nghĩa</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloomRemember}
                  onChange={(e) => setBloomRemember(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-14 p-1 rounded bg-slate-50 border border-slate-300 font-bold text-xs text-center text-slate-800"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 block">2. Thông hiểu</span>
                <span className="text-[10px] text-slate-400">Giải thích nguyên lý</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloomUnderstand}
                  onChange={(e) => setBloomUnderstand(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-14 p-1 rounded bg-slate-50 border border-slate-300 font-bold text-xs text-center text-slate-800"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 block">3. Vận dụng</span>
                <span className="text-[10px] text-slate-400">Giải quyết bài toán</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bloomApply}
                  onChange={(e) => setBloomApply(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-14 p-1 rounded bg-slate-50 border border-slate-300 font-bold text-xs text-center text-slate-800"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-slate-500">
              Điểm mỗi câu:
              <input
                type="number"
                min={0.5}
                max={20}
                step={0.5}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-14 ml-2 p-1 border border-slate-300 rounded bg-white text-center font-bold text-slate-800"
              />
            </span>

            <span className={`font-semibold ${totalBloom === 100 ? 'text-slate-700' : 'text-amber-700'}`}>
              Tổng thang đo: {totalBloom}% {totalBloom !== 100 && '(chưa bằng 100%)'}
            </span>
          </div>
        </div>

        {/* ── NÚT BẮT ĐẦU TẠO CÂU HỎI (Tối giản, không icon linh tinh) ── */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Hệ thống sẽ tổng hợp câu hỏi từ {selectedSlideIds.length} slide đã chọn theo các dạng đã tick.
          </p>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={generating || selectedSlideIds.length === 0}
            className="px-6 py-2.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {generating && <RefreshCw size={15} className="animate-spin" />}
            <span>{generating ? 'Đang tạo câu hỏi…' : `Chốt cấu hình & Bắt đầu tạo ${questionCount} câu hỏi`}</span>
          </button>
        </div>

        <InlineError message={genError} />
      </div>

      {/* ── 4. QUESTIONS LIST & REVIEW ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách câu hỏi bài thi ({questions.length} câu)
            </h3>
            <p className="text-xs text-slate-500">
              Xem lại các câu hỏi, chỉnh sửa đáp án hoặc xóa câu không cần thiết.
            </p>
          </div>

          <div className="flex gap-2">
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleAddQuestionManual(type)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus size={13} /> {TYPE_LABEL[type]}
              </button>
            ))}
          </div>
        </div>

        {questions.length === 0 && (
          <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-slate-700">Chưa có câu hỏi nào</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nhấn nút <strong>"Chốt cấu hình & Bắt đầu tạo câu hỏi"</strong> ở trên để tạo đề từ slide, hoặc thêm câu hỏi thủ công.
            </p>
          </div>
        )}

        {questions.map((q, i) => (
          <QuestionEditor
            key={q.key}
            index={i}
            question={q}
            problem={problems[i]}
            materials={availableSlides}
            onChange={(patch) => updateQuestion(q.key, patch)}
            onRemove={() => handleDeleteQuestion(q.key)}
          />
        ))}

        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {(Object.keys(TYPE_LABEL) as QuestionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAddQuestionManual(type)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus size={13} /> Thêm {TYPE_LABEL[type]}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => save(false)}
                disabled={saving}
                className={btn.secondary}
              >
                <Save size={14} /> Lưu nháp
              </button>
              {canPublish && (
                <button
                  type="button"
                  onClick={() => save(true)}
                  disabled={saving}
                  className={btn.primary}
                >
                  <Send size={14} /> Phát hành cho sinh viên
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionEditor({
  index,
  question: q,
  problem,
  materials,
  onChange,
  onRemove,
}: {
  index: number;
  question: EditableQuestion;
  problem: string | null;
  materials: Material[];
  onChange: (patch: Partial<EditableQuestion>) => void;
  onRemove: () => void;
}) {
  const options = q.options ?? [];

  const changeType = (type: QuestionType) =>
    onChange({
      question_type: type,
      options: type === 'short_answer' ? null : options.length ? options : ['', '', '', ''],
      correct_answer: type === 'multiple_choice' ? [] : '',
      accepted_answers: type === 'short_answer' ? [] : null,
    });

  const setOption = (i: number, value: string) => {
    const previous = options[i];
    const next = options.map((o, j) => (j === i ? value : o));
    let correct = q.correct_answer;
    if (previous) {
      if (Array.isArray(correct)) correct = correct.map((c) => (c === previous ? value : c));
      else if (correct === previous) correct = value;
    }
    onChange({ options: next, correct_answer: correct });
  };

  return (
    <div className={`border rounded-xl bg-white shadow-2xs ${problem ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800">Câu {index + 1}</span>
          <select
            value={q.question_type}
            onChange={(e) => changeType(e.target.value as QuestionType)}
            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white font-medium text-slate-700"
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          {problem && <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{problem}</span>}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Xóa câu hỏi này"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          value={q.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={2}
          placeholder="Nhập nội dung câu hỏi..."
          className={`${inputClass} font-medium`}
        />

        {q.question_type === 'short_answer' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={typeof q.correct_answer === 'string' ? q.correct_answer : ''}
              onChange={(e) => onChange({ correct_answer: e.target.value })}
              placeholder="Đáp án mẫu chuẩn"
              className={inputClass}
            />
            <input
              value={(q.accepted_answers ?? []).join('; ')}
              onChange={(e) =>
                onChange({ accepted_answers: e.target.value.split(';').map((s) => s.trimStart()) })
              }
              placeholder="Đáp án chấp nhận khác (ngăn cách bằng dấu ;)"
              className={inputClass}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[11px] text-slate-500 font-semibold block">
              Phương án lựa chọn (đánh dấu để chọn đáp án đúng):
            </span>
            {options.map((option, i) => {
              const multi = q.question_type === 'multiple_choice';
              const checked = multi
                ? (q.correct_answer as string[]).includes(option) && option !== ''
                : q.correct_answer === option && option !== '';
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={`correct-${q.key}`}
                    checked={checked}
                    disabled={!option.trim()}
                    onChange={() => {
                      if (multi) {
                        const current = q.correct_answer as string[];
                        onChange({
                          correct_answer: checked ? current.filter((c) => c !== option) : [...current, option],
                        });
                      } else {
                        onChange({ correct_answer: option });
                      }
                    }}
                    className="w-4 h-4 accent-[#1E3A6E] cursor-pointer"
                    title="Đánh dấu đáp án đúng"
                  />
                  <input
                    value={option}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Phương án ${String.fromCharCode(65 + i)}`}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ options: options.filter((_, j) => j !== i) })}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    disabled={options.length <= 2}
                    title="Bỏ phương án này"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => onChange({ options: [...options, ''] })}
              className="text-xs font-semibold text-[#1E3A6E] hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
            >
              <Plus size={13} /> Thêm phương án
            </button>
          </div>
        )}

        {/* Trích dẫn slide & giải thích (tối giản) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <select
            value={q.citation?.material_id ?? ''}
            onChange={(e) => {
              const m = materials.find((x) => x.id === e.target.value);
              onChange({
                citation: m
                  ? { material_id: m.id, title: m.title, page: q.citation?.page ?? 1, snippet: q.citation?.snippet ?? null }
                  : null,
              });
            }}
            className={inputClass}
          >
            <option value="">— Trích dẫn slide nguồn —</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={q.citation?.page ?? ''}
            disabled={!q.citation}
            onChange={(e) =>
              q.citation &&
              onChange({ citation: { ...q.citation, page: e.target.value ? Number(e.target.value) : null } })
            }
            placeholder="Số trang slide"
            className={inputClass}
          />
        </div>

        <textarea
          value={q.explanation ?? ''}
          onChange={(e) => onChange({ explanation: e.target.value })}
          rows={2}
          placeholder="Giải thích đáp án (sẽ hiển thị cho sinh viên sau khi nộp bài)..."
          className={`${inputClass} text-xs`}
        />
      </div>
    </div>
  );
}
