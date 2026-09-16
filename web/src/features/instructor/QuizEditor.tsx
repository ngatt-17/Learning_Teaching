import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, Plus, Save, Send, Trash2 } from 'lucide-react';
import { ai, platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import type { AiDraft, ManagedQuiz, Material, QuestionType } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { fromLocalInput, toLocalInput } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { ErrorState, InlineError, Loading } from '../../components/StateViews';
import { AiDraftBadge } from '../../components/Badges';
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
        <button onClick={() => navigate(`/courses/${course.id}/quizzes`)} className={btn.secondary}><ArrowLeft size={14} /> Về danh sách quiz</button>
      </div>
    );
  }
  return <QuizForm key={existing?.id ?? 'new'} courseId={course.id} materials={materials} existing={existing} />;
}

function QuizForm({ courseId, materials, existing }: { courseId: string; materials: Material[]; existing: ManagedQuiz | null }) {
  const course = { id: courseId };
  const quizId = existing?.id;
  const navigate = useNavigate();
  const user = useCurrentUser();
  const canPublish = user.role === 'instructor' || user.role === 'admin';

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [week, setWeek] = useState<number | ''>(existing?.week_number ?? '');
  const [materialId, setMaterialId] = useState(existing?.material_id ?? '');
  const [points, setPoints] = useState(existing?.points_per_question ?? 1);
  const [minutes, setMinutes] = useState<number | ''>(
    existing ? (existing.time_limit_seconds ? Math.round(existing.time_limit_seconds / 60) : '') : 15,
  );
  const [dueAt, setDueAt] = useState(toLocalInput(existing?.due_at));
  const [source, setSource] = useState<'manual' | 'ai_draft'>(existing?.source ?? 'manual');
  const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
    existing ? existing.questions.map((q) => ({ ...q, key: newKey() })) : [blankQuestion()],
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // AI generation panel
  const [genCount, setGenCount] = useState(5);
  const [genType, setGenType] = useState('mixed');
  const [genDifficulty, setGenDifficulty] = useState('medium');
  const [genTopic, setGenTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const approved = materials.filter((m) => m.status === 'approved' && m.approved_for_ai);
  const selectedMaterial = materials.find((m) => m.id === materialId);

  const update = (key: string, patch: Partial<EditableQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const generate = async () => {
    if (!materialId) return;
    setGenerating(true);
    setGenError(null);
    try {
      const draft = await ai.post<AiDraft>('/quiz/from-material', {
        course_id: course.id,
        material_id: materialId,
        topic: genTopic,
        difficulty: genDifficulty,
        question_type: genType,
        count: genCount,
      });
      const generated = draft.questions.map((q) => fromAiQuestion(q, selectedMaterial));
      setQuestions((qs) => [...qs.filter((q) => q.prompt.trim()), ...generated]);
      setSource('ai_draft');
      if (!title) setTitle(`Quiz — ${selectedMaterial?.lesson_title ?? selectedMaterial?.title ?? ''}`);
      if (week === '' && selectedMaterial?.week_number) setWeek(selectedMaterial.week_number);
    } catch (err) {
      setGenError(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const problems = questions.map(validateQuestion);
  const firstProblem = problems.findIndex(Boolean);

  const save = async (publish: boolean) => {
    setSaveError(null);
    if (!title.trim()) return setSaveError('Nhập tiêu đề quiz');
    if (questions.length === 0) return setSaveError('Quiz cần ít nhất một câu hỏi');
    if (firstProblem >= 0) return setSaveError(`Câu ${firstProblem + 1}: ${problems[firstProblem]}`);
    setSaving(true);
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      week_number: week === '' ? null : week,
      material_id: materialId || null,
      source,
      points_per_question: points,
      time_limit_seconds: minutes === '' ? null : minutes * 60,
      due_at: fromLocalInput(dueAt),
      questions: questions.map(toPayload),
    };
    try {
      let id = quizId;
      if (id) await platform.put(`/courses/${course.id}/quizzes/${id}`, body);
      else id = (await platform.post<{ id: string }>(`/courses/${course.id}/quizzes/`, body)).id;
      if (publish) await platform.patch(`/courses/${course.id}/quizzes/${id}/status`, { status: 'published' });
      navigate(`/courses/${course.id}/quizzes`);
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/courses/${course.id}/quizzes`)} className={btn.ghost}><ArrowLeft size={14} /></button>
          <h2 className="text-xl font-bold text-slate-800">{quizId ? 'Sửa quiz nháp' : 'Tạo quiz mới'}</h2>
          {source === 'ai_draft' && <AiDraftBadge />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => save(false)} disabled={saving} className={btn.secondary}><Save size={14} /> Lưu nháp</button>
          {canPublish && (
            <button onClick={() => save(true)} disabled={saving} className={btn.primary}><Send size={14} /> Lưu & phát hành</button>
          )}
        </div>
      </div>
      <InlineError message={saveError} />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Tiêu đề</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} placeholder="Bài tập 8: Kiểm tra kiến thức…" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-slate-700">Hướng dẫn cho sinh viên</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} mt-1`} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Tài liệu nguồn (đã duyệt)</span>
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className={`${inputClass} mt-1`}>
            <option value="">— Không gắn tài liệu —</option>
            {approved.map((m) => (
              <option key={m.id} value={m.id}>{m.week_number ? `W${m.week_number} • ` : ''}{m.title}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Tuần</span>
            <input type="number" min={1} value={week} onChange={(e) => setWeek(e.target.value === '' ? '' : Number(e.target.value))} className={`${inputClass} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Điểm / câu</span>
            <input type="number" min={0.5} max={20} step={0.5} value={points} onChange={(e) => setPoints(Number(e.target.value))} className={`${inputClass} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Thời gian làm bài (phút, để trống = không giới hạn)</span>
          <input type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(e.target.value === '' ? '' : Number(e.target.value))} className={`${inputClass} mt-1`} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Hạn nộp</span>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
      </section>

      <section className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[#1E3A6E]" />
          <h3 className="font-bold text-sm text-slate-900">Sinh câu hỏi nháp bằng AI từ tài liệu đã duyệt</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={genType} onChange={(e) => setGenType(e.target.value)} className={inputClass} aria-label="Dạng câu hỏi">
            <option value="mixed">Kết hợp 3 dạng</option>
            <option value="single_choice">Một đáp án</option>
            <option value="multiple_choice">Nhiều đáp án</option>
            <option value="short_answer">Trả lời ngắn</option>
          </select>
          <select value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)} className={inputClass} aria-label="Độ khó">
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
          <input type="number" min={1} max={20} value={genCount} onChange={(e) => setGenCount(Math.min(20, Math.max(1, Number(e.target.value))))} className={inputClass} aria-label="Số câu" />
          <input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="Chủ đề (tuỳ chọn)" className={inputClass} />
        </div>
        <InlineError message={genError} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Câu hỏi AI được thêm vào danh sách bên dưới để bạn xem lại và sửa; quiz luôn lưu ở trạng thái nháp.
          </p>
          <button onClick={generate} disabled={!materialId || generating} className={btn.primary} title={materialId ? undefined : 'Chọn tài liệu nguồn trước'}>
            {generating ? 'AI đang soạn…' : 'Sinh câu hỏi nháp'}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Câu hỏi ({questions.length})</h3>
        </div>
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.key}
            index={i}
            question={q}
            problem={problems[i]}
            materials={approved}
            onChange={(patch) => update(q.key, patch)}
            onRemove={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
          />
        ))}
        <div className="flex gap-2">
          {(Object.keys(TYPE_LABEL) as QuestionType[]).map((type) => (
            <button key={type} onClick={() => setQuestions((qs) => [...qs, blankQuestion(type)])} className={btn.secondary}>
              <Plus size={13} /> {TYPE_LABEL[type]}
            </button>
          ))}
        </div>
      </section>
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
    // Keep the correct-answer mark on an option while its text is edited — but only for an
    // option that already had text, so typing into a blank option never marks it correct.
    let correct = q.correct_answer;
    if (previous) {
      if (Array.isArray(correct)) correct = correct.map((c) => (c === previous ? value : c));
      else if (correct === previous) correct = value;
    }
    onChange({ options: next, correct_answer: correct });
  };

  return (
    <div className={`border rounded-xl bg-white ${problem ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800">Câu {index + 1}</span>
          <select value={q.question_type} onChange={(e) => changeType(e.target.value as QuestionType)} className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white">
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          {problem && <span className="text-[11px] text-amber-800">{problem}</span>}
        </div>
        <button onClick={onRemove} className={`${btn.ghost} text-rose-700`} title="Xóa câu"><Trash2 size={13} /></button>
      </div>
      <div className="p-4 space-y-2.5">
        <textarea value={q.prompt} onChange={(e) => onChange({ prompt: e.target.value })} rows={2} placeholder="Nội dung câu hỏi" className={inputClass} />

        {q.question_type === 'short_answer' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={typeof q.correct_answer === 'string' ? q.correct_answer : ''} onChange={(e) => onChange({ correct_answer: e.target.value })} placeholder="Đáp án mẫu" className={inputClass} />
            <input
              value={(q.accepted_answers ?? []).join('; ')}
              onChange={(e) => onChange({ accepted_answers: e.target.value.split(';').map((s) => s.trimStart()) })}
              placeholder="Đáp án chấp nhận khác (ngăn cách bằng ;)"
              className={inputClass}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            {options.map((option, i) => {
              const multi = q.question_type === 'multiple_choice';
              const checked = multi ? (q.correct_answer as string[]).includes(option) && option !== '' : q.correct_answer === option && option !== '';
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
                        onChange({ correct_answer: checked ? current.filter((c) => c !== option) : [...current, option] });
                      } else {
                        onChange({ correct_answer: option });
                      }
                    }}
                    className="w-4 h-4 accent-emerald-600"
                    title="Đánh dấu đáp án đúng"
                  />
                  <input value={option} onChange={(e) => setOption(i, e.target.value)} placeholder={`Phương án ${String.fromCharCode(65 + i)}`} className={inputClass} />
                  <button onClick={() => onChange({ options: options.filter((_, j) => j !== i) })} className={btn.ghost} disabled={options.length <= 2} title="Bỏ phương án">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
            <button onClick={() => onChange({ options: [...options, ''] })} className={btn.ghost}><Plus size={12} /> Thêm phương án</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={q.topic ?? ''} onChange={(e) => onChange({ topic: e.target.value })} placeholder="Chủ đề (dùng cho phân tích năng lực)" className={inputClass} />
          <select
            value={q.citation?.material_id ?? ''}
            onChange={(e) => {
              const m = materials.find((x) => x.id === e.target.value);
              onChange({ citation: m ? { material_id: m.id, title: m.title, page: q.citation?.page ?? 1, snippet: q.citation?.snippet ?? null } : null });
            }}
            className={inputClass}
            aria-label="Tài liệu trích dẫn"
          >
            <option value="">— Trích dẫn tài liệu —</option>
            {materials.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <input
            type="number"
            min={1}
            value={q.citation?.page ?? ''}
            disabled={!q.citation}
            onChange={(e) => q.citation && onChange({ citation: { ...q.citation, page: e.target.value ? Number(e.target.value) : null } })}
            placeholder="Trang"
            className={inputClass}
          />
        </div>
        <textarea value={q.explanation ?? ''} onChange={(e) => onChange({ explanation: e.target.value })} rows={2} placeholder="Giải thích đáp án (hiện cho sinh viên sau khi nộp)" className={inputClass} />
      </div>
    </div>
  );
}
