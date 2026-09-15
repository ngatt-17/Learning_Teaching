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
    className={`w-full flex flex-col items-center justify-center py-3 px-1 transition-colors relative group ${
      active
        ? 'bg-[#14274E] text-white border-l-4 border-[#C8232C]'
        : 'text-slate-300 hover:bg-[#14274E]/60 hover:text-white'
    }`}
    title={label}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-[11px] font-medium leading-tight text-center">{label}</span>
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
        <div className="py-4 flex items-center justify-center border-b border-white/10">
          <VinUniLogo />
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
        {/* Account Settings item (label changed to 'acount setting' as requested) */}
        <SidebarItem
          icon={<Settings size={20} />}
          label="acount setting"
          active={activeTab === 'acount setting'}
          onClick={() => setActiveTab('acount setting')}
        />

        {/* User Card Box (Loops - ADMINISTRATOR) */}
        <div className="mx-2 my-2 p-2 bg-[#14274E]/80 border border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Loops Avatar"
            className="w-9 h-9 rounded-full border border-amber-300/40 object-cover mb-1"
          />
          <span className="font-bold text-xs text-white leading-tight">Loops</span>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
            ADMINISTRATOR
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




