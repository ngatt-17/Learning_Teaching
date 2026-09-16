import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth, useCurrentUser } from '../../lib/auth';
import { ROLE_LABEL } from '../../lib/roles';
import { initials } from '../../lib/format';
import { btn } from '../../components/styles';

export function AccountPage() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto overflow-y-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">Account</h1>
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1E3A6E] text-white font-bold text-lg flex items-center justify-center">{initials(user.name)}</div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-lg">{user.name}</p>
          <p className="text-sm text-slate-600">{user.email}</p>
          <p className="text-xs font-bold text-[#C8232C] uppercase tracking-wider mt-0.5">{ROLE_LABEL[user.role]}</p>
        </div>
      </section>
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-sm text-slate-700 space-y-2">
        <p>Tên, email và vai trò do CECS admin quản lý. Liên hệ admin nếu thông tin chưa đúng.</p>
        <p>Phiên đăng nhập được lưu trong tab trình duyệt hiện tại và hết hạn sau 24 giờ.</p>
      </section>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className={btn.danger}
      >
        <LogOut size={14} /> Đăng xuất
      </button>
    </main>
  );
}
