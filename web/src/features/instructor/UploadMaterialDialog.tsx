import { useState } from 'react';
import { FileUp } from 'lucide-react';
import { platform } from '../../lib/api';
import type { Material } from '../../lib/types';
import { errorMessage } from '../../lib/useAsync';
import { InlineError } from '../../components/StateViews';
import { Dialog } from '../../components/Dialog';
import { btn, inputClass } from '../../components/styles';

export function UploadMaterialDialog({
  courseId,
  onClose,
  onUploaded,
}: {
  courseId: string;
  onClose: () => void;
  onUploaded: (material: Material) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [week, setWeek] = useState(1);
  const [lesson, setLesson] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('title', title.trim() || file.name.replace(/\.[^.]+$/, ''));
    form.append('week_number', String(week));
    form.append('lesson_title', lesson.trim() || title.trim() || file.name);
    try {
      const material = await platform.post<Material>(`/courses/${courseId}/materials/upload`, form);
      onUploaded(material);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="Tải tài liệu lên"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btn.secondary}>Hủy</button>
          <button onClick={upload} disabled={!file || busy} className={btn.primary}>
            {busy ? 'Đang tải & trích xuất…' : 'Tải lên'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:bg-slate-50">
          <FileUp size={24} className="text-[#1E3A6E]" />
          <span className="text-xs text-slate-600">{file ? file.name : 'Chọn file PDF, TXT hoặc MD (tối đa 25 MB)'}</span>
          <input
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
            }}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Tiêu đề</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Tuần</span>
            <input type="number" min={1} value={week} onChange={(e) => setWeek(Math.max(1, Number(e.target.value)))} className={`${inputClass} mt-1`} />
          </label>
          <label className="block col-span-2">
            <span className="text-xs font-semibold text-slate-700">Chủ đề bài học</span>
            <input value={lesson} onChange={(e) => setLesson(e.target.value)} className={`${inputClass} mt-1`} />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Văn bản được trích xuất theo từng trang để trích dẫn chính xác. Tài liệu mới ở trạng thái <strong>chờ duyệt</strong> — sinh viên và Trợ giảng AI chưa thấy cho đến khi bạn duyệt. File scan không có chữ sẽ báo lỗi xử lý.
        </p>
        <InlineError message={error} />
      </div>
    </Dialog>
  );
}
