import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Settings,
  LogOut,
  FileQuestion,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { VinUniLogo } from './VinUniLogo';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center py-2.5 px-1 transition-colors relative group ${
      active
        ? 'bg-[#14274E] text-white border-l-4 border-[#C8232C]'
        : 'text-slate-300 hover:bg-[#14274E]/60 hover:text-white'
    }`}
    title={label}
  >
    <div className="mb-1 relative">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-2.5 bg-[#C8232C] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#1E3A6E]">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10.5px] font-medium leading-tight text-center line-clamp-1">{label}</span>
  </button>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <aside className="w-24 bg-[#1E3A6E] flex flex-col justify-between shrink-0 border-r border-slate-200/10 z-20 sticky top-0 h-screen">
      {/* TOP PORTION */}
      <div>
        {/* Logo */}
        <div className="py-4 flex flex-col items-center justify-center border-b border-white/10">
          <VinUniLogo />
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 mt-1 flex items-center gap-1">
            <ShieldCheck size={10} /> ADMIN
          </span>
        </div>

        {/* Primary Navigation */}
        <nav className="mt-2 space-y-0.5">
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
            icon={<FileQuestion size={20} />}
            label="Question Bank"
            active={activeTab === 'Question Bank'}
            onClick={() => setActiveTab('Question Bank')}
            badge={3}
          />
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Insights"
            active={activeTab === 'Insights'}
            onClick={() => setActiveTab('Insights')}
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
        {/* Account Settings */}
        <SidebarItem
          icon={<Settings size={20} />}
          label="acount setting"
          active={activeTab === 'acount setting'}
          onClick={() => setActiveTab('acount setting')}
        />

        {/* User Card Box (System Admin) */}
        <div className="mx-2 my-2 p-2 bg-[#14274E]/90 border border-amber-400/30 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Admin Avatar"
              className="w-9 h-9 rounded-full border-2 border-amber-400 object-cover mb-1 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#14274E]"></span>
          </div>
          <span className="font-bold text-[11px] text-white leading-tight line-clamp-1">Admin Tùng NT</span>
          <span className="text-[8px] font-black tracking-wider text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded uppercase mt-0.5 border border-amber-400/40">
            SYSTEM ADMIN
          </span>
        </div>

        {/* Log Out Button */}
        <button
          onClick={() => setActiveTab('LogOut')}
          className="w-full py-2 px-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#FF4D4D] hover:bg-[#FF4D4D]/10 hover:text-red-300 transition-colors"
          title="Log Out"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
