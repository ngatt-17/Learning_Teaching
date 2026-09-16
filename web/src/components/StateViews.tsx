import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, Lock, RotateCcw } from 'lucide-react';
import { ApiError } from '../lib/api';

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500" role="status">
      <Loader2 size={18} className="animate-spin text-[#1E3A6E]" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError | Error; onRetry?: () => void }) {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 403) {
    return (
      <div className="max-w-lg mx-auto my-10 bg-white border border-slate-200 rounded-xl p-6 text-center shadow-xs">
        <Lock size={28} className="mx-auto text-[#C8232C]" />
        <h3 className="mt-2 font-bold text-slate-900">Không có quyền truy cập</h3>
        <p className="mt-1 text-sm text-slate-600">
          {error instanceof ApiError ? error.detail : error.message}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Quyền truy cập được kiểm tra trên máy chủ theo lớp học bạn được phân công. Liên hệ CECS admin nếu bạn cho rằng đây là nhầm lẫn.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-lg mx-auto my-10 bg-white border border-rose-200 rounded-xl p-6 text-center shadow-xs" role="alert">
      <AlertTriangle size={26} className="mx-auto text-rose-600" />
      <h3 className="mt-2 font-bold text-slate-900">{status === 404 ? 'Không tìm thấy' : 'Đã có lỗi xảy ra'}</h3>
      <p className="mt-1 text-sm text-slate-600">{error instanceof ApiError ? error.detail : error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
        >
          <RotateCcw size={13} /> Thử lại
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 bg-white">
      <Inbox size={24} className="mx-auto text-slate-400" />
      <p className="mt-2 font-semibold text-slate-700 text-sm">{title}</p>
      {children && <div className="mt-1 text-xs">{children}</div>}
    </div>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2" role="alert">
      {message}
    </p>
  );
}
