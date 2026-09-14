import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
  Menu,
  Shield,
  Layers,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onToggleMobileSidebar
}) => {
  const {
    currentUser,
    allUsers,
    switchUser,
    activeCourse,
    courses,
    setActiveCourseId,
    governanceItems,
    questionBanks,
    personalMaterials,
    loadScenario,
    resetDemoData
  } = useApp();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('Spring 2025');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unresolvedGovCount = governanceItems.filter((g) => g.status === 'unresolved').length;
  const firstName = currentUser.name.split(' ')[0] || currentUser.name;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E5E8EB] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle + Warm Personalized Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl border border-[#E5E8EB] hover:bg-[#F8F9FC] text-[#656D76] lg:hidden transition-colors"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-[#1F2328] tracking-tight">
              Hi, {firstName} <span className="inline-block animate-wave">👋</span>
            </h1>
          </div>
          <p className="text-xs text-[#656D76] mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#183059]">{activeCourse.code}</span>
            <span>•</span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{activeCourse.name}</span>
            <span>•</span>
            <span>{activeCourse.enrolledStudentsCount} students enrolled</span>
          </p>
        </div>
      </div>

      {/* Right: Semester Filter Pill + Notifications + User Avatar Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Semester / Period Filter Pill */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E8EB] hover:border-[#183059]/40 bg-white text-xs font-semibold text-[#1F2328] shadow-2xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#656D76]" />
            <span>{selectedSemester}</span>
            <ChevronDown className="w-3 h-3 text-[#656D76]" />
          </button>

          {isTimeFilterOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-[#E5E8EB] py-1 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-bold uppercase text-[#656D76] bg-[#F8F9FC]">
                Academic Term
              </div>
              {['Spring 2025', 'Fall 2024', 'All Time'].map((sem) => (
                <button
                  key={sem}
                  onClick={() => {
                    setSelectedSemester(sem);
                    setIsTimeFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-[#F8F9FC] flex items-center justify-between ${
                    selectedSemester === sem ? 'font-bold text-[#183059] bg-blue-50/50' : 'text-[#1F2328]'
                  }`}
                >
                  <span>{sem}</span>
                  {selectedSemester === sem && <Check className="w-3.5 h-3.5 text-[#183059]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded-xl border border-[#E5E8EB] hover:bg-[#F8F9FC] text-[#656D76] hover:text-[#1F2328] transition-colors shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unresolvedGovCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C8102E] ring-2 ring-white" />
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E5E8EB] p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F2F5] mb-2 font-bold text-[#1F2328]">
                <span>Hub Notifications</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#183059] font-semibold">
                  {unresolvedGovCount} Alert{unresolvedGovCount === 1 ? '' : 's'}
                </span>
              </div>

              {unresolvedGovCount > 0 ? (
                <div className="space-y-2">
                  <div
                    onClick={() => {
                      if (currentUser.role === 'admin') onTabChange('governance');
                      setIsNotificationOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-red-50/50 border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    <div className="font-semibold text-[#C8102E] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Governance Review Pending
                    </div>
                    <div className="text-[11px] text-[#656D76] mt-1">
                      {unresolvedGovCount} student report or verification item requires institutional review.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[#656D76]">
                  All course systems verified and up to date!
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Persona & SSO Switcher */}
        <div className="relative">
          <button
            id="persona-switcher-btn"
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className="flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-xl border border-[#E5E8EB] hover:border-[#183059]/40 bg-white transition-all text-left shadow-2xs group"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#E5E8EB]"
            />
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-bold text-[#1F2328] flex items-center gap-1.5">
                {currentUser.name}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                    currentUser.role === 'student'
                      ? 'bg-blue-50 text-[#183059] border border-blue-200'
                      : currentUser.role === 'professor'
                      ? 'bg-red-50 text-[#C8102E] border border-red-200'
                      : currentUser.role === 'ta'
                      ? 'bg-blue-50 text-[#183059] border border-blue-200'
                      : 'bg-red-50 text-[#C8102E] border border-red-200'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-[#656D76] truncate max-w-[130px]">
                {currentUser.title}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#656D76] group-hover:text-[#183059] hidden sm:block" />
          </button>

          {isPersonaOpen && (
            <div
              id="persona-dropdown-menu"
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E5E8EB] py-2 z-50 text-xs overflow-hidden"
            >
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#656D76] bg-[#F8F9FC] border-b border-[#F0F2F5]">
                Switch Test Persona (Simulated SSO)
              </div>

              {allUsers.map((u) => (
                <button
                  key={u.id}
                  id={`switch-persona-${u.role}-btn`}
                  onClick={() => {
                    switchUser(u.id);
                    setIsPersonaOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 hover:bg-[#F8F9FC] flex items-center gap-3 transition-colors border-b border-[#F0F2F5] last:border-0 ${
                    u.id === currentUser.id ? 'bg-blue-50/60 font-medium' : ''
                  }`}
                >
                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-semibold text-[#1F2328] flex items-center gap-1.5">
                      {u.name}
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          u.role === 'student'
                            ? 'bg-blue-50 text-[#183059]'
                            : u.role === 'professor'
                            ? 'bg-red-50 text-[#C8102E]'
                            : u.role === 'ta'
                            ? 'bg-blue-50 text-[#183059]'
                            : 'bg-red-50 text-[#C8102E]'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#656D76] truncate">{u.title}</div>
                  </div>
                </button>
              ))}

              <div className="p-2.5 bg-[#F8F9FC] border-t border-[#F0F2F5] mt-1">
                <div className="text-[10px] text-[#656D76] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#183059]" />
                  VinUni Microsoft SSO: Connected
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
