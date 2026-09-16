import { Lock } from 'lucide-react';
import type { MaterialStatus, QuizStatus } from '../lib/types';

const MATERIAL_STATUS: Record<MaterialStatus, { label: string; cls: string }> = {
  draft: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  processing: { label: 'Đang xử lý', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  failed: { label: 'Xử lý lỗi', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  archived: { label: 'Đã gỡ', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const QUIZ_STATUS: Record<QuizStatus, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  published: { label: 'Đã phát hành', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  archived: { label: 'Đã lưu trữ', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const pill = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border whitespace-nowrap';

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const s = MATERIAL_STATUS[status];
  return <span className={`${pill} ${s.cls}`}>{s.label}</span>;
}

export function QuizStatusBadge({ status }: { status: QuizStatus }) {
  const s = QUIZ_STATUS[status];
  return <span className={`${pill} ${s.cls}`}>{s.label}</span>;
}

export function AiDraftBadge() {
  return <span className={`${pill} bg-indigo-50 text-indigo-800 border-indigo-200`}>Nháp AI — cần duyệt</span>;
}

/** Mandatory in the private study space (see .cursorrules). */
export function OwnerOnlyBadge() {
  return (
    <span className={`${pill} bg-slate-900 text-white border-slate-900`} title="Chỉ bạn xem được. Giảng viên, admin và sinh viên khác không truy cập được, kể cả qua API.">
      <Lock size={11} /> Owner-only access
    </span>
  );
}
