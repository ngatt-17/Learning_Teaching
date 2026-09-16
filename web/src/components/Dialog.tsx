import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { btn } from './styles';

export function Dialog({
  title,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full ${width} bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer" title="Đóng">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto text-sm text-slate-700">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className={btn.secondary}>Hủy</button>
          <button onClick={onConfirm} className={danger ? btn.danger : btn.primary}>{confirmLabel}</button>
        </>
      }
    >
      {message}
    </Dialog>
  );
}
