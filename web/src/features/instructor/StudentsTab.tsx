import { ShieldCheck } from 'lucide-react';
import { platform } from '../../lib/api';
import type { StudentScore } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatScore } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, Loading } from '../../components/StateViews';

interface ClassSummary {
  total_active_students: number;
  average_quiz_score: number;
  average_comprehensive_score: number;
  average_streak_days: number;
  privacy_guarantee: string;
}

export function StudentsTab() {
  const course = useCourse();
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        platform.get<{ students: StudentScore[] }>(`/courses/${course.id}/scores/students`),
        platform.get<ClassSummary>(`/courses/${course.id}/scores/class-summary`),
      ]),
    [course.id],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const [{ students }, summary] = data!;

  const stats = [
    { label: 'Sinh viên trong lớp', value: students.length },
    { label: 'Sinh viên đã hoạt động', value: summary.total_active_students },
    { label: 'Điểm quiz TB', value: formatScore(summary.average_quiz_score) },
    { label: 'Chuỗi ngày học TB', value: formatScore(summary.average_streak_days) },
  ];

  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">Sinh viên & kết quả học tập</h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" /> {summary.privacy_guarantee}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-slate-200 rounded-xl p-3 bg-white">
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className="text-xl font-black text-[#1E3A6E] tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {students.length === 0 ? (
        <Empty title="Chưa có sinh viên được phân công" />
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Sinh viên</th>
                <th className="text-right px-3 py-2">Chuỗi ngày</th>
                <th className="text-right px-3 py-2">Quiz</th>
                <th className="text-right px-3 py-2">Quiz tổng hợp</th>
                <th className="text-right px-3 py-2">Tổng</th>
                <th className="text-left px-3 py-2">Hoạt động gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.student_id}>
                  <td className="px-3 py-2"><p className="font-semibold text-slate-900">{s.name}</p><p className="text-[11px] text-slate-500">{s.email}</p></td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.streak_days}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatScore(s.quiz_score)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatScore(s.comprehensive_score)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1E3A6E]">{formatScore(s.total_score)}</td>
                  <td className="px-3 py-2 text-slate-500">{s.last_active_date ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
