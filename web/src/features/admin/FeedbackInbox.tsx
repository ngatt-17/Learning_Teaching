import { ShieldCheck } from 'lucide-react';
import { platform } from '../../lib/api';
import type { FeedbackItem } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatDateTime } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, Loading } from '../../components/StateViews';

export function FeedbackInbox() {
  const course = useCourse();
  const { data: items, error, loading, reload } = useAsync(
    () => platform.get<FeedbackItem[]>(`/courses/${course.id}/feedback/`),
    [course.id],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">Góp ý ẩn danh ({items!.length})</h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" />
          Góp ý không lưu danh tính người gửi và hoàn toàn tách biệt với ghi chú riêng của sinh viên.
        </p>
      </div>
      {items!.length === 0 && <Empty title="Chưa có góp ý" />}
      <ul className="space-y-2">
        {items!.map((f) => (
          <li key={f.id} className="border border-slate-200 rounded-xl p-3 bg-white">
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{f.content}</p>
            <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(f.submitted_at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
