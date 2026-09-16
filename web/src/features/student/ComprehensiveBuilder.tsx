import { useState } from 'react';
import { Layers, Lock } from 'lucide-react';
import { platform } from '../../lib/api';
import type { Topic } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { InlineError } from '../../components/StateViews';
import { btn } from '../../components/styles';

/**
 * Composite review quiz built from already-studied weeks. Questions come only from
 * instructor-published lesson quizzes (Platform rule), so nothing unreviewed is shown.
 */
export function ComprehensiveBuilder({
  courseId,
  onCreated,
  compact = false,
}: {
  courseId: string;
  onCreated: (quizId: string) => void;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useAsync(
    () => platform.get<{ topics: Topic[]; min_topics_for_comprehensive: number }>(`/courses/${courseId}/quizzes/topics`),
    [courseId],
  );
  if (!data) return null;
  const min = data.min_topics_for_comprehensive;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await platform.post<{ quiz_id: string }>(`/courses/${courseId}/quizzes/comprehensive`, {
        week_numbers: selected,
        questions_per_topic: 2,
      });
      onCreated(res.quiz_id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${compact ? '' : 'mt-6'} border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3`}>
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-[#1E3A6E]" />
        <h3 className="font-bold text-sm text-slate-900">Quiz tổng hợp nhiều tuần</h3>
      </div>
      <p className="text-xs text-slate-600">
        Chọn ít nhất {min} tuần đã học. Câu hỏi được lấy từ các quiz giảng viên đã phát hành; điểm tính vào mục quiz tổng hợp.
      </p>
      {data.topics.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Khóa học chưa có tuần nào được phân loại tài liệu.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.topics.map((t) => {
            const active = selected.includes(t.week_number);
            return (
              <button
                key={t.week_number}
                type="button"
                disabled={!t.available}
                title={t.locked_reason ?? undefined}
                onClick={() =>
                  setSelected((s) => (active ? s.filter((w) => w !== t.week_number) : [...s, t.week_number]))
                }
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  !t.available
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : active
                      ? 'bg-[#1E3A6E] text-white border-[#1E3A6E] cursor-pointer'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-[#EDF2FA] cursor-pointer'
                }`}
              >
                {!t.available && <Lock size={11} />}
                Week {t.week_number}: {t.lesson_title}
              </button>
            );
          })}
        </div>
      )}
      <InlineError message={error} />
      <button onClick={create} disabled={busy || selected.length < min} className={btn.primary}>
        {busy ? 'Đang tạo…' : `Tạo quiz tổng hợp (${selected.length} tuần)`}
      </button>
    </section>
  );
}
