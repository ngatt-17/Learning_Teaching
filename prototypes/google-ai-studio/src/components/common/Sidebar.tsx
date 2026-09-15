import React from 'react';
import { useApp } from '../../context/AppContext';
import { VinUniLogo } from './VinUniLogo';
import {
  Sparkles,
  Layers,
  BarChart3,
  Lock,
  FileText,
  Users,
  BookOpen,
  Shield,
  RotateCcw,
  PlayCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Layers as LayersIcon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile
}) => {
  const {
    currentUser,
    activeCourse,
    courses,
    setActiveCourseId,
    governanceItems,
    questionBanks,
    personalMaterials,
    loadScenario,
    resetDemoData
  } = useApp();

  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = React.useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = React.useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false);

  const unresolvedGovCount = governanceItems.filter((g) => g.status === 'unresolved').length;
  const coursePublishedBanks = questionBanks.filter(
    (b) => b.courseId === activeCourse.id && b.status === 'published'
  ).length;
  const studentNotesCount = personalMaterials.filter(
    (p) => p.courseId === activeCourse.id
  ).length;

  const handleNavClick = (tab: string) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#0E1F3B]/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-[#E5E8EB] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Main Branding */}
        <div className="flex flex-col">
          <div className="h-16 px-5 flex items-center justify-between border-b border-[#F0F2F5]">
            <button
              onClick={() => handleNavClick(currentUser.role === 'admin' ? 'admin_dashboard' : currentUser.role === 'student' ? 'qa' : 'materials')}
              className="flex items-center gap-2.5 text-left group"
            >
              <VinUniLogo size="sm" />
              <div>
                <div className="font-bold text-sm text-[#183059] tracking-tight leading-none">
                  VinUni CECS
                </div>
                <div className="text-[10px] text-[#656D76] font-medium tracking-wide mt-0.5">
                  AI Learning Hub
                </div>
              </div>
            </button>
          </div>

          {/* Active Course Badge & Switcher */}
          <div className="px-4 py-3 border-b border-[#F0F2F5] bg-[#F8F9FC]/60">
            <div className="relative">
              <button
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5E8EB] hover:border-[#183059]/40 transition-all text-left shadow-2xs group"
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#183059]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#183059]" />
                    {activeCourse.code}
                  </div>
                  <div className="text-xs font-semibold text-[#1F2328] truncate mt-0.5">
                    {activeCourse.name}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#656D76] group-hover:text-[#183059] shrink-0" />
              </button>

              {isCourseDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-[#E5E8EB] py-1 z-50 text-xs overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#656D76] bg-[#F8F9FC] border-b border-[#F0F2F5]">
                    Select Enrolled Course
                  </div>
                  {courses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCourseId(c.id);
                        setIsCourseDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F8F9FC] transition-colors border-b border-[#F0F2F5] last:border-0 ${
                        c.id === activeCourse.id ? 'bg-blue-50/60 font-semibold text-[#183059]' : 'text-[#24292F]'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold">{c.code}</span>
                        <span className="text-[#656D76] ml-1 text-[11px] truncate">- {c.name}</span>
                      </div>
                      {c.id === activeCourse.id && (
                        <Check className="w-3.5 h-3.5 text-[#183059] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#656D76]">
              {currentUser.role === 'student' ? 'Student Workspace' : currentUser.role === 'admin' ? 'Administration' : 'Instructor Hub'}
            </div>

            {currentUser.role === 'student' && (
              <>
                <button
                  id="sidebar-nav-qa"
                  onClick={() => handleNavClick('qa')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'qa' || currentTab === 'overview'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#183059]" />
                    <span>Study Assistant</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100/50 text-[#183059] font-medium">
                    AI
                  </span>
                </button>

                <button
                  id="sidebar-nav-practice"
                  onClick={() => handleNavClick('practice')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'practice'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-[#183059]" />
                    <span>Course Practice Banks</span>
                  </div>
                  {coursePublishedBanks > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#183059] font-bold border border-blue-200">
                      {coursePublishedBanks}
                    </span>
                  )}
                </button>

                <button
                  id="sidebar-nav-progress"
                  onClick={() => handleNavClick('progress')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'progress'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-[#183059]" />
                    <span>My Mastery & Progress</span>
                  </div>
                </button>

                <button
                  id="sidebar-nav-workspace"
                  onClick={() => handleNavClick('private_workspace')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'private_workspace' || currentTab === 'workspace'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-[#183059]" />
                    <span>Private Notes</span>
                  </div>
                  {studentNotesCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#183059] font-bold border border-blue-200">
                      {studentNotesCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {(currentUser.role === 'professor' || currentUser.role === 'ta') && (
              <>
                <button
                  id="sidebar-nav-materials"
                  onClick={() => handleNavClick('materials')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'materials' || currentTab === 'overview'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#183059]" />
                    <span>Course Materials</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#183059] font-bold border border-blue-200">
                    {activeCourse.approvedSourcesCount}
                  </span>
                </button>

                <button
                  id="sidebar-nav-qbanks"
                  onClick={() => handleNavClick('question_banks')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'question_banks' || currentTab === 'questions'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-[#183059]" />
                    <span>Question Banks</span>
                  </div>
                </button>

                <button
                  id="sidebar-nav-insights"
                  onClick={() => handleNavClick('learning_insights')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'learning_insights' || currentTab === 'insights'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-[#183059]" />
                    <span>Cohort Insights</span>
                  </div>
                </button>

                <button
                  id="sidebar-nav-team"
                  onClick={() => handleNavClick('course_team')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'course_team' || currentTab === 'team'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-[#183059]" />
                    <span>Teaching Team</span>
                  </div>
                </button>
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button
                  id="sidebar-nav-admin-dashboard"
                  onClick={() => handleNavClick('admin_dashboard')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'admin_dashboard' || currentTab === 'admin'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-[#183059]" />
                    <span>Portfolio Overview</span>
                  </div>
                </button>

                <button
                  id="sidebar-nav-admin-governance"
                  onClick={() => handleNavClick('governance')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'governance'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[#183059]" />
                    <span>Governance & Issues</span>
                  </div>
                  {unresolvedGovCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-[#C8102E] border border-red-200 font-bold">
                      {unresolvedGovCount}
                    </span>
                  )}
                </button>

                <button
                  id="sidebar-nav-admin-audit"
                  onClick={() => handleNavClick('audit_logs')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'audit_logs'
                      ? 'bg-blue-50 text-[#183059] shadow-2xs font-bold'
                      : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#183059]" />
                    <span>Audit Trail</span>
                  </div>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Utility Card: Usability Scenarios & Reset */}
        <div className="p-3 border-t border-[#F0F2F5] space-y-2">
          {/* Usability Scenarios Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsScenarioOpen(!isScenarioOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8F9FC] hover:bg-blue-50/60 border border-[#E5E8EB] text-xs font-semibold text-[#183059] transition-all"
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="w-3.5 h-3.5 text-[#183059]" />
                <span>Test Scenarios</span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#656D76]" />
            </button>

            {isScenarioOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-white rounded-xl shadow-xl border border-[#E5E8EB] py-1.5 z-50 text-xs overflow-hidden">
                <div className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-[#656D76] bg-[#F8F9FC] border-b border-[#F0F2F5]">
                  Instant Usability Demos
                </div>
                <button
                  onClick={() => {
                    loadScenario('student_concurrency');
                    onTabChange('qa');
                    setIsScenarioOpen(false);
                    onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F9FC] flex items-start gap-2 transition-colors border-b border-[#F0F2F5]"
                >
                  <div className="p-1 rounded bg-blue-50 text-[#183059] shrink-0 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F2328]">Student: Concurrency Q&A</div>
                    <div className="text-[10px] text-[#656D76]">Grounded answers with course slides.</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    loadScenario('ta_question_bank');
                    onTabChange('question_banks');
                    setIsScenarioOpen(false);
                    onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F9FC] flex items-start gap-2 transition-colors border-b border-[#F0F2F5]"
                >
                  <div className="p-1 rounded bg-blue-50 text-[#183059] shrink-0 mt-0.5">
                    <LayersIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F2328]">TA: Draft Question Bank</div>
                    <div className="text-[10px] text-[#656D76]">Alex Le drafts practice questions.</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    loadScenario('prof_review');
                    onTabChange('question_banks');
                    setIsScenarioOpen(false);
                    onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F9FC] flex items-start gap-2 transition-colors border-b border-[#F0F2F5]"
                >
                  <div className="p-1 rounded bg-red-50 text-[#C8102E] shrink-0 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#1F2328]">Professor: Review & Publish</div>
                    <div className="text-[10px] text-[#656D76]">Faculty quality gate & approval.</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Reset Demo button */}
          <button
            onClick={() => setResetConfirmOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </aside>

      {/* Reset Confirm Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#E5E8EB]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 text-[#C8102E]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2328]">Reset Demo Data?</h3>
                <p className="text-xs text-[#656D76] mt-0.5">
                  Restores initial courses, materials, and simulated answers.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2F5]">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#656D76] hover:bg-[#F8F9FC]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setResetConfirmOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#C8102E] hover:bg-[#A40E26] transition-colors shadow-2xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
