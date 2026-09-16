import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Paperclip, Rocket } from 'lucide-react';
import { platform } from '../../lib/api';
import type { Material, QuizSummary } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatDeadline } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, Loading } from '../../components/StateViews';

interface WeekModule {
  week: number | null;
  title: string;
  materials: Material[];
  quizzes: QuizSummary[];
}

function groupByWeek(materials: Material[], quizzes: QuizSummary[]): WeekModule[] {
  const weeks = new Map<string, WeekModule>();
  const moduleFor = (week: number | null, lesson?: string | null) => {
    const key = week === null ? 'none' : String(week);
    if (!weeks.has(key)) {
      weeks.set(key, {
        week,
        title: week === null ? 'Tổng hợp' : `Week ${String(week).padStart(2, '0')}${lesson ? ` - ${lesson}` : ''}`,
        materials: [],
        quizzes: [],
      });
    }
    return weeks.get(key)!;
  };
  materials.forEach((m) => moduleFor(m.week_number, m.lesson_title).materials.push(m));
  quizzes.forEach((q) => moduleFor(q.week_number).quizzes.push(q));
  return [...weeks.values()].sort((a, b) => (a.week ?? 999) - (b.week ?? 999));
}

export function StudentHome() {
  const course = useCourse();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        platform.get<Material[]>(`/courses/${course.id}/materials/`),
        platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/`),
      ]),
    [course.id],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const [materials, quizzes] = data!;
  const modules = groupByWeek(materials, quizzes.filter((q) => q.quiz_type === 'lesson'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">Nội dung khóa học</h2>
        <span className="text-xs text-slate-500">Chỉ hiển thị tài liệu đã được giảng viên duyệt</span>
      </div>

      {modules.length === 0 && <Empty title="Giảng viên chưa phát hành tài liệu nào" />}

      {modules.map((mod) => {
        const key = String(mod.week);
        const isCollapsed = !!collapsed[key];
        return (
          <div key={key} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
              className="w-full flex items-center gap-2 px-4 py-3 bg-slate-100/90 hover:bg-slate-200/70 text-slate-800 text-sm font-semibold transition-colors text-left cursor-pointer"
            >
              {isCollapsed ? <ChevronRight size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-600" />}
              <span>{mod.title}</span>
            </button>
            {!isCollapsed && (
              <div className="bg-white divide-y divide-slate-100">
                {mod.materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/courses/${course.id}/materials/${m.id}`)}
                    style={{ borderLeft: '4px solid #059669' }}
                    className="w-full text-left flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <Paperclip size={18} className="text-slate-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.page_count} trang • Học cùng ghi chú riêng & Trợ giảng AI</p>
                    </div>
                  </button>
                ))}
                {mod.quizzes.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => navigate(`/courses/${course.id}/quizzes/${q.id}/take`)}
                    style={{ borderLeft: '4px solid #059669' }}
                    className="w-full text-left flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <Rocket size={18} className="text-slate-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">{q.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {q.question_count} câu • {q.max_score} điểm • Hạn: {formatDeadline(q.due_at)}
                        {q.my_attempts ? ` • Đã làm ${q.my_attempts} lần` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
