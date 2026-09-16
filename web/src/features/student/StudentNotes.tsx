import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { platform } from '../../lib/api';
import type { Material, Note } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDateTime } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, InlineError, Loading } from '../../components/StateViews';
import { OwnerOnlyBadge } from '../../components/Badges';
import { ConfirmDialog } from '../../components/Dialog';
import { btn, inputClass } from '../../components/styles';

export function StudentNotes() {
  const course = useCourse();
  const { data, error, loading, reload, setData } = useAsync(
    () =>
      Promise.all([
        platform.get<Note[]>(`/courses/${course.id}/notes`),
        platform.get<Material[]>(`/courses/${course.id}/materials/`),
      ]),
    [course.id],
  );
  const [editing, setEditing] = useState<Note | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const [notes, materials] = data!;
  const materialTitle = (id: string | null) => materials.find((m) => m.id === id)?.title;

  const startEdit = (note: Note | 'new') => {
    setEditing(note);
    setTitle(note === 'new' ? '' : note.title);
    setContent(note === 'new' ? '' : note.content);
    setFormError(null);
  };

  const save = async () => {
    setFormError(null);
    try {
      if (editing === 'new') {
        const created = await platform.post<Note>(`/courses/${course.id}/notes`, { title: title || 'Untitled Note', content });
        setData(([n, m]) => [[created, ...n], m]);
      } else if (editing) {
        const updated = await platform.patch<Note>(`/notes/${editing.id}`, { title, content });
        setData(([n, m]) => [n.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)), m]);
      }
      setEditing(null);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const remove = async (note: Note) => {
    await platform.del(`/notes/${note.id}`);
    setData(([n, m]) => [n.filter((x) => x.id !== note.id), m]);
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">Không gian ghi chú riêng</h2>
          <OwnerOnlyBadge />
        </div>
        <button onClick={() => startEdit('new')} className={btn.primary}>
          <Plus size={14} /> Ghi chú mới
        </button>
      </div>
      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        Ghi chú chỉ bạn đọc được. Giảng viên, trợ giảng, CECS admin và sinh viên khác không thể xem qua giao diện, API,
        báo cáo hay dashboard; ghi chú không được dùng làm dữ liệu cho Trợ giảng AI của lớp.
      </p>

      {editing && (
        <div className="border border-slate-300 rounded-xl p-4 space-y-2 bg-white">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" className={inputClass} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Nội dung ghi chú…" className={inputClass} />
          <InlineError message={formError} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className={btn.secondary}>Hủy</button>
            <button onClick={save} className={btn.primary}>Lưu ghi chú</button>
          </div>
        </div>
      )}

      {notes.length === 0 && !editing && (
        <Empty title="Chưa có ghi chú">Mở một tài liệu để ghi chú theo từng trang, hoặc tạo ghi chú tự do.</Empty>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {notes.map((note) => (
          <article key={note.id} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-slate-900 truncate">{note.title}</h3>
                <p className="text-[11px] text-slate-400">
                  Cập nhật {formatDateTime(note.updated_at)}
                  {note.material_id && (
                    <>
                      {' • '}
                      <Link to={`/courses/${course.id}/materials/${note.material_id}?page=${note.page_number ?? 1}`} className="text-[#1E3A6E] hover:underline">
                        {materialTitle(note.material_id) ?? 'Tài liệu'}, trang {note.page_number}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(note)} className={btn.ghost} title="Sửa"><Pencil size={13} /></button>
                <button onClick={() => setDeleting(note)} className={btn.ghost} title="Xóa"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-6">{note.content}</p>
          </article>
        ))}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Xóa ghi chú?"
          message={`Ghi chú "${deleting.title}" sẽ bị xóa vĩnh viễn.`}
          confirmLabel="Xóa"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove(deleting)}
        />
      )}
    </div>
  );
}
