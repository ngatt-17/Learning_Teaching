import { Link } from 'react-router-dom';
import { Lock, SearchX } from 'lucide-react';

export function NotFound({ denied = false }: { denied?: boolean }) {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        {denied ? <Lock size={28} className="mx-auto text-[#C8232C]" /> : <SearchX size={28} className="mx-auto text-slate-400" />}
        <h1 className="mt-3 text-lg font-bold text-slate-900">{denied ? 'Không có quyền truy cập' : 'Không tìm thấy trang'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {denied ? 'Trang này dành cho vai trò khác.' : 'Đường dẫn không tồn tại hoặc đã thay đổi.'}
        </p>
        <Link to="/courses" className="mt-4 inline-block text-sm font-semibold text-[#1E3A6E] hover:underline">
          Về danh sách khóa học
        </Link>
      </div>
    </main>
  );
}
