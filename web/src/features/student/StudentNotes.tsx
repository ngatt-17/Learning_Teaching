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
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  // Filter notes by slide/material
  const [filterMaterialId, setFilterMaterialId] = useState<string>('all');

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const [notes, materials] = data!;

  const materialMap = new Map(materials.map((m) => [m.id, m]));
  const getMaterial = (id: string | null) => (id ? materialMap.get(id) : undefined);

  const startEdit = (note: Note | 'new') => {
    setEditing(note);
    if (note === 'new') {
      setTitle('');
      setContent('');
      setSelectedMaterialId('');
    } else {
      setTitle(note.title);
      setContent(note.content);
      setSelectedMaterialId(note.material_id ?? '');
    }
    setFormError(null);
  };

  const save = async () => {
    setFormError(null);
    try {
      const payloadMaterialId = selectedMaterialId || null;
      const defaultTitle = payloadMaterialId
        ? `Ghi chú: ${getMaterial(payloadMaterialId)?.title ?? 'Bài học'}`
        : 'Ghi chú tự do';

      if (editing === 'new') {
        const created = await platform.post<Note>(`/courses/${course.id}/notes`, {
          title: title.trim() || defaultTitle,
          content,
          material_id: payloadMaterialId,
          page_number: null,
        });
        setData(([n, m]) => [[created, ...n], m]);
      } else if (editing) {
        const updated = await platform.patch<Note>(`/notes/${editing.id}`, {
          title: title.trim() || defaultTitle,
          content,
        });
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

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (filterMaterialId === 'all') return true;
    if (filterMaterialId === 'unlinked') return !n.material_id;
    return n.material_id === filterMaterialId;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
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

      {/* Editor Modal / Card */}
      {editing && (
        <div className="border border-slate-300 rounded-xl p-4 space-y-3 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              {editing === 'new' ? 'Tạo ghi chú mới' : 'Chỉnh sửa ghi chú'}
            </h3>
            <span className="text-xs text-slate-400">Owner-only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tiêu đề ghi chú:
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề ghi chú…"
                className={inputClass}
              />
            </div>
            {editing === 'new' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Liên kết với Slide bài giảng:
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Ghi chú tự do (Không gắn với slide) --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.week_number ? `Week ${m.week_number}: ` : ''}{m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nội dung ghi chú:
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Nội dung ghi chú của bạn…"
              className={inputClass}
            />
          </div>

          <InlineError message={formError} />

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setEditing(null)} className={btn.secondary}>Hủy</button>
            <button onClick={save} className={btn.primary}>Lưu ghi chú</button>
          </div>
        </div>
      )}

      {/* Filter by Slide */}
      {notes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Lọc ghi chú:</span>
            <select
              value={filterMaterialId}
              onChange={(e) => setFilterMaterialId(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1 bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả ghi chú ({notes.length})</option>
              <option value="unlinked">Ghi chú tự do ({notes.filter((n) => !n.material_id).length})</option>
              {materials.map((m) => {
                const count = notes.filter((n) => n.material_id === m.id).length;
                if (count === 0) return null;
                return (
                  <option key={m.id} value={m.id}>
                    Slide: {m.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <span className="text-slate-500 font-medium">
            Hiển thị {filteredNotes.length} / {notes.length} ghi chú
          </span>
        </div>
      )}

      {/* Notes Grid */}
      {notes.length === 0 && !editing && (
        <Empty title="Chưa có ghi chú">
          Mở một slide bài học để tạo ghi chú gắn liền với slide, hoặc bấm &quot;Ghi chú mới&quot; ở trên.
        </Empty>
      )}

      {filteredNotes.length === 0 && notes.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-8 italic">
          Không tìm thấy ghi chú nào khớp với bộ lọc slide đã chọn.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredNotes.map((note) => {
          const mat = getMaterial(note.material_id);

          return (
            <article key={note.id} className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-white flex flex-col justify-between gap-3 shadow-2xs transition-colors">
              <div className="space-y-2">
                {/* Linked Slide Tag */}
                <div className="flex items-center justify-between gap-2">
                  {mat ? (
                    <Link
                      to={`/courses/${course.id}/materials/${mat.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E3A6E] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
                      title="Bấm để mở slide bài giảng này"
                    >
                      Slide: {mat.title}
                      {note.page_number ? ` (Trang ${note.page_number})` : ''}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Ghi chú tự do
                    </span>
                  )}

                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(note)} className={btn.ghost} title="Sửa"><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(note)} className={btn.ghost} title="Xóa"><Trash2 size={13} /></button>
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 leading-snug">{note.title}</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-6 leading-relaxed">{note.content}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                <span>Cập nhật {formatDateTime(note.updated_at)}</span>
                {mat && (
                  <Link
                    to={`/courses/${course.id}/materials/${mat.id}`}
                    className="text-xs font-semibold text-[#1E3A6E] hover:underline"
                  >
                    Vào học slide →
                  </Link>
                )}
              </div>
            </article>
          );
        })}
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
