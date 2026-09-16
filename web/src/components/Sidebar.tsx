import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, HelpCircle, LayoutDashboard, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { VinUniLogo } from './VinUniLogo';
import { useAuth, useCurrentUser } from '../lib/auth';
import { initials } from '../lib/format';

function SidebarItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        `w-full flex flex-col items-center justify-center py-3 px-1 transition-all relative group cursor-pointer ${
          isActive
            ? 'bg-white text-[#1E3A6E] font-bold border-l-4 border-[#C8232C] shadow-sm'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`mb-1 ${isActive ? 'text-[#1E3A6E]' : 'text-slate-300 group-hover:text-white'}`}>{icon}</div>
          <span className="text-[11px] leading-tight text-center">{label}</span>
        </>
      )}
    </NavLink>
  );
}

const ROLE_BADGE: Record<string, string> = {
  student: 'STUDENT',
  instructor: 'INSTRUCTOR',
  ta: 'TA',
  admin: 'ADMIN',
};

export function Sidebar() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-24 bg-[#1E3A6E] flex flex-col justify-between shrink-0 border-r border-slate-200/10 z-20 h-full">
      <div>
        <div className="py-3.5 flex flex-col items-center justify-center border-b border-white/10 gap-1 select-none">
          <VinUniLogo size={42} />
          <span className="text-[10px] font-black tracking-wider text-white uppercase text-center leading-tight">
            CECS Hub
          </span>
        </div>

        <nav className="mt-3 space-y-1">
          <SidebarItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <SidebarItem to="/courses" icon={<BookOpen size={20} />} label="Courses" />
          {user.role === 'admin' && <SidebarItem to="/admin" icon={<ShieldCheck size={20} />} label="Admin" />}
          <SidebarItem to="/help" icon={<HelpCircle size={20} />} label="Help" />
        </nav>
      </div>

      <div className="pb-3 border-t border-white/10 space-y-1">
        <SidebarItem to="/account" icon={<Settings size={20} />} label="Account" />

        <div className="mx-2 my-2 p-2 bg-white/10 border border-white/15 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full border border-amber-300/60 bg-[#14274E] text-white text-xs font-bold flex items-center justify-center mb-1 shadow-xs">
            {initials(user.name)}
          </div>
          <span className="font-bold text-[11px] text-white leading-tight line-clamp-1 truncate max-w-[72px]" title={user.name}>
            {user.name}
          </span>
          <span className="text-[8.5px] font-bold tracking-wider text-amber-300 uppercase mt-0.5">
            {ROLE_BADGE[user.role]}
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full py-2 px-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#FF4D4D] hover:bg-[#FF4D4D]/10 hover:text-red-300 transition-colors cursor-pointer"
          title="Log Out"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
