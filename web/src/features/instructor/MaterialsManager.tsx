import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, CheckCircle2, Eye, RefreshCw, Trash2, Undo2, Upload } from 'lucide-react';
import { platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import type { Material, MaterialStatus } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDateTime } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, InlineError, Loading } from '../../components/StateViews';
import { MaterialStatusBadge } from '../../components/Badges';
import { ConfirmDialog } from '../../components/Dialog';
import { btn } from '../../components/styles';
import { UploadMaterialDialog } from './UploadMaterialDialog';

export function MaterialsManager() {
  const course = useCourse();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const canApprove = user.role === 'instructor' || user.role === 'admin';
  const { data: materials, error, loading, reload } = useAsync(
    () => platform.get<Material[]>(`/courses/${course.id}/materials/manage`),
    [course.id],
  );
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<Material | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const act = async (material: Material, action: () => Promise<unknown>) => {
    setBusyId(material.id);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(`${material.title}: ${errorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (m: Material, status: MaterialStatus) =>
    act(m, () => platform.patch(`/courses/${course.id}/materials/${m.id}/status`, { status }));

  if (loading && !materials) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const list = materials ?? [];
  const counts = {
    approved: list.filter((m) => m.status === 'approved').length,
    pending: list.filter((m) => m.status === 'draft' || m.status === 'processing').length,
    failed: list.filter((m) => m.status === 'failed').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tài liệu khóa học</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {counts.approved} đã duyệt • {counts.pending} chờ duyệt • {counts.failed} lỗi xử lý — sinh viên và Trợ giảng AI chỉ dùng tài liệu đã duyệt.
          </p>
        </div>
        <button onClick={() => setUploading(true)} className={btn.primary}>
          <Upload size={14} /> Tải tài liệu lên
        </button>
      </div>

      <InlineError message={actionError} />
      {list.length === 0 && <Empty title="Chưa có tài liệu">Tải lên PDF/TXT/MD; tài liệu ở trạng thái chờ duyệt cho đến khi bạn phê duyệt.</Empty>}

      {list.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Tuần</th>
                <th className="text-left px-3 py-2">Tài liệu</th>
                <th className="text-left px-3 py-2">Trạng thái</th>
                <th className="text-right px-3 py-2">Trang</th>
                <th className="text-left px-3 py-2">Tải lên</th>
                <th className="text-right px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((m) => (
                <tr key={m.id} className={busyId === m.id ? 'opacity-50' : 'hover:bg-slate-50/60'}>
                  <td className="px-3 py-2.5 align-top whitespace-nowrap font-semibold text-slate-700">{m.week_number ? `W${m.week_number}` : '—'}</td>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-semibold text-slate-900">{m.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {m.lesson_title}
                      {m.original_filename ? ` • ${m.original_filename}` : ''}
                    </p>
                    {m.processing_error && <p className="text-[11px] text-rose-700 mt-0.5">{m.processing_error}</p>}
                  </td>
                  <td className="px-3 py-2.5 align-top"><MaterialStatusBadge status={m.status} /></td>
                  <td className="px-3 py-2.5 align-top text-right tabular-nums">{m.page_count}</td>
                  <td className="px-3 py-2.5 align-top text-slate-500 whitespace-nowrap">
                    {m.uploaded_by_name ?? '—'}
                    <br />
                    <span className="text-[10px]">{formatDateTime(m.created_at)}</span>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button onClick={() => navigate(`/courses/${course.id}/materials/${m.id}`)} className={btn.ghost} title="Xem nội dung">
                        <Eye size={13} /> Xem
                      </button>
                      {canApprove && (m.status === 'draft' || m.status === 'processing' || m.status === 'archived') && (
                        <button onClick={() => setStatus(m, 'approved')} className={`${btn.ghost} text-emerald-700`} disabled={m.page_count === 0} title={m.page_count === 0 ? 'Tài liệu chưa có nội dung' : 'Duyệt cho sinh viên & AI'}>
                          <CheckCircle2 size={13} /> Duyệt
                        </button>
                      )}
                      {canApprove && m.status === 'approved' && (
                        <button onClick={() => setStatus(m, 'archived')} className={btn.ghost} title="Gỡ khỏi sinh viên và AI">
                          <Archive size={13} /> Gỡ
                        </button>
                      )}
                      {canApprove && m.status === 'archived' && (
                        <button onClick={() => setStatus(m, 'draft')} className={btn.ghost} title="Chuyển về chờ duyệt">
                          <Undo2 size={13} /> Về nháp
                        </button>
                      )}
                      {m.status === 'failed' && m.has_file && (
                        <button onClick={() => act(m, () => platform.post(`/courses/${course.id}/materials/${m.id}/reprocess`))} className={btn.ghost} title="Thử trích xuất lại">
                          <RefreshCw size={13} /> Thử lại
                        </button>
                      )}
                      {canApprove && (
                        <button onClick={() => setRemoving(m)} className={`${btn.ghost} text-rose-700`} title="Xóa tài liệu">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {uploading && (
        <UploadMaterialDialog
          courseId={course.id}
          onClose={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false);
            reload();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Xóa tài liệu?"
          message={`"${removing.title}" và toàn bộ nội dung trích xuất sẽ bị xóa. Quiz đã dùng tài liệu này vẫn giữ câu hỏi.`}
          confirmLabel="Xóa tài liệu"
          danger
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            const m = removing;
            setRemoving(null);
            void act(m, () => platform.del(`/courses/${course.id}/materials/${m.id}`));
          }}
        />
      )}
    </div>
  );
}
