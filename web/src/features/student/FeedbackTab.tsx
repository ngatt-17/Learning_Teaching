import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { platform } from '../../lib/api';
import { errorMessage } from '../../lib/useAsync';
import { useCourse } from '../courses/CourseLayout';
import { InlineError } from '../../components/StateViews';
import { btn, inputClass } from '../../components/styles';

export function FeedbackTab() {
  const course = useCourse();
  const [content, setContent] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await platform.post(`/courses/${course.id}/feedback/`, { content: content.trim() });
      setSent(true);
      setContent('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold border-b pb-3 text-slate-800">Góp ý về môn học & nền tảng</h2>
      <p className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-px" />
        Góp ý được gửi ẩn danh tới CECS admin: hệ thống không lưu tên hay tài khoản của bạn cùng nội dung. Đây là kênh
        riêng, tách biệt với ghi chú cá nhân — ghi chú không bao giờ được gửi đi.
      </p>
      {sent && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={16} /> Cảm ơn bạn! Góp ý đã được ghi nhận ẩn danh.
        </p>
      )}
      <textarea
        rows={5}
        value={content}
        onChange={(e) => { setContent(e.target.value); setSent(false); }}
        placeholder="Nhịp độ bài giảng, tài liệu, trợ giảng AI, cơ sở vật chất…"
        className={inputClass}
      />
      <InlineError message={error} />
      <button onClick={submit} disabled={busy || content.trim().length < 3} className={btn.primary}>
        {busy ? 'Đang gửi…' : 'Gửi góp ý'}
      </button>
    </div>
  );
}
