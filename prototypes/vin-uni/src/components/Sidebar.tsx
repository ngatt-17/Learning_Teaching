import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Settings,
  LogOut,
} from 'lucide-react';
import { VinUniLogo } from './VinUniLogo';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center py-3 px-1 transition-all relative group cursor-pointer ${
      active
        ? 'bg-white text-[#1E3A6E] font-bold border-l-4 border-[#C8232C] shadow-sm'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`}
    title={label}
  >
    <div className={`mb-1 ${active ? 'text-[#1E3A6E]' : 'text-slate-300 group-hover:text-white'}`}>{icon}</div>
    <span className="text-[11px] leading-tight text-center">{label}</span>
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userName = 'Thanh Tùng',
}) => {
  return (
    <aside className="w-24 bg-[#1E3A6E] flex flex-col justify-between shrink-0 border-r border-slate-200/10 z-20 sticky top-0 h-screen">
      {/* TOP PORTION */}
      <div>
        {/* Logo & Project Name */}
        <div className="py-3.5 flex flex-col items-center justify-center border-b border-white/10 gap-1 select-none">
          <VinUniLogo size={42} />
          <span className="text-[10px] font-black tracking-wider text-white uppercase text-center leading-tight">
            CECS Hub
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="mt-3 space-y-1">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeTab === 'Dashboard'}
            onClick={() => setActiveTab('Dashboard')}
          />
          <SidebarItem
            icon={<BookOpen size={20} />}
            label="Courses"
            active={activeTab === 'Courses'}
            onClick={() => setActiveTab('Courses')}
          />
          <SidebarItem
            icon={<HelpCircle size={20} />}
            label="Help"
            active={activeTab === 'Help'}
            onClick={() => setActiveTab('Help')}
          />
        </nav>
      </div>

      {/* BOTTOM PORTION */}
      <div className="pb-3 border-t border-white/10 space-y-1">
        {/* Account item (changed from 'acount setting' to 'Account' as requested) */}
        <SidebarItem
          icon={<Settings size={20} />}
          label="Account"
          active={activeTab === 'Account'}
          onClick={() => setActiveTab('Account')}
        />

        {/* User Card Box (Student Role as requested) */}
        <div className="mx-2 my-2 p-2 bg-white/10 border border-white/15 rounded-xl flex flex-col items-center justify-center text-center">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Student Avatar"
            className="w-9 h-9 rounded-full border border-amber-300/60 object-cover mb-1 shadow-xs"
          />
          <span className="font-bold text-[11px] text-white leading-tight line-clamp-1 truncate max-w-[72px]">
            {userName}
          </span>
          <span className="text-[8.5px] font-bold tracking-wider text-amber-300 uppercase mt-0.5">
            STUDENT
          </span>
        </div>

        {/* Log Out Button */}
        <button
          onClick={() => setActiveTab('LogOut')}
          className="w-full py-2 px-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#FF4D4D] hover:bg-[#FF4D4D]/10 hover:text-red-300 transition-colors cursor-pointer"
          title="Log Out"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
