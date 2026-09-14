import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { VinUniLogo } from './components/common/VinUniLogo';
import { CitationDrawer } from './components/common/CitationDrawer';
import { CanvasExportModal } from './components/common/CanvasExportModal';
import { ReportDialog } from './components/common/ReportDialog';
import { GroundedQA } from './components/student/GroundedQA';
import { PracticeGenerator } from './components/student/PracticeGenerator';
import { PrivateWorkspace } from './components/student/PrivateWorkspace';
import { StudentProgress } from './components/student/StudentProgress';
import { MaterialsManager } from './components/instructor/MaterialsManager';
import { QuestionBankManager } from './components/instructor/QuestionBankManager';
import { LearningInsights } from './components/instructor/LearningInsights';
import { CourseTeam } from './components/instructor/CourseTeam';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AlertTriangle, BookOpen, ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentUser,
    activeCourse,
    isCanvasModalOpen,
    isReportDialogOpen,
    activeCitation,
    materials
  } = useApp();

  // Tab state: default depends on persona
  const getDefaultTab = () => {
    if (currentUser.role === 'admin') return 'admin_dashboard';
    if (currentUser.role === 'professor' || currentUser.role === 'ta') return 'materials';
    return 'qa';
  };

  const [currentTab, setCurrentTab] = useState<string>(getDefaultTab());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Listen for role changes to update tab logically
  React.useEffect(() => {
    if (currentUser.role === 'admin') {
      setCurrentTab('admin_dashboard');
    } else if (currentUser.role === 'professor' || currentUser.role === 'ta') {
      if (
        currentTab === 'admin' ||
        currentTab === 'admin_dashboard' ||
        currentTab === 'governance' ||
        currentTab === 'audit_logs' ||
        currentTab === 'workspace' ||
        currentTab === 'private_workspace'
      ) {
        setCurrentTab('materials');
      }
    } else if (currentUser.role === 'student') {
      if (
        currentTab === 'admin' ||
        currentTab === 'admin_dashboard' ||
        currentTab === 'governance' ||
        currentTab === 'audit_logs' ||
        currentTab === 'materials' ||
        currentTab === 'questions' ||
        currentTab === 'question_banks' ||
        currentTab === 'insights' ||
        currentTab === 'learning_insights' ||
        currentTab === 'team' ||
        currentTab === 'course_team'
      ) {
        setCurrentTab('qa');
      }
    }
  }, [currentUser.role]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex text-[#1F2328] font-sans antialiased selection:bg-blue-100 selection:text-[#183059]">
      {/* Left Navigation Sidebar (Inspired by Image 1) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen w-full transition-all">
        {/* Modern Top Greeting & Utility Bar */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Readiness Alert Banner (e.g. for SWE3020 with 0 approved sources) */}
        {activeCourse.aiReadinessStatus === 'needs_materials' && (
          <div className="bg-[#FEF2F2] text-[#C8102E] px-4 sm:px-8 py-3 text-xs font-medium flex items-center justify-between border-b border-[#FECACA]">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C8102E] shrink-0" />
                <span>
                  <strong className="text-[#A40E26] font-semibold">Course AI Grounding Paused:</strong> {activeCourse.code} currently has 0 certified sources. AI Q&A and question generation are paused until course materials are uploaded and certified.
                </span>
              </div>
              {(currentUser.role === 'professor' || currentUser.role === 'ta') && (
                <button
                  onClick={() => setCurrentTab('materials')}
                  className="px-3 py-1 bg-[#C8102E] hover:bg-[#A40E26] text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
                >
                  Upload Sources Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Routed View Container */}
        <main className="flex-1 w-full p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
          {(currentTab === 'qa' || (currentTab === 'overview' && currentUser.role === 'student')) && (
            <GroundedQA onNavigateTab={setCurrentTab} />
          )}
          {currentTab === 'practice' && <PracticeGenerator onNavigateTab={setCurrentTab} />}
          {(currentTab === 'workspace' || currentTab === 'private_workspace') && (
            <PrivateWorkspace onNavigateTab={setCurrentTab} />
          )}
          {currentTab === 'progress' && <StudentProgress onNavigateTab={setCurrentTab} />}
          {(currentTab === 'materials' || (currentTab === 'overview' && (currentUser.role === 'professor' || currentUser.role === 'ta'))) && <MaterialsManager />}
          {(currentTab === 'questions' || currentTab === 'question_banks') && <QuestionBankManager />}
          {(currentTab === 'insights' || currentTab === 'learning_insights') && <LearningInsights />}
          {(currentTab === 'team' || currentTab === 'course_team') && <CourseTeam />}
          {(currentTab === 'admin' || currentTab === 'admin_dashboard' || currentTab === 'governance' || currentTab === 'audit_logs') && <AdminDashboard />}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E5E8EB] py-4 px-4 sm:px-8 text-xs text-[#656D76] mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <VinUniLogo size="sm" />
              <span className="text-[#24292F] font-medium hidden sm:inline">
                VinUniversity CECS AI Learning Hub • Grounded Retrieval • Zero Grade Passback Compliance
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#656D76]">
              <span>Course: <strong className="text-[#1F2328]">{activeCourse.code}</strong></span>
              <span>•</span>
              <span>Signed in as: <strong className="text-[#1F2328]">{currentUser.name}</strong> (<span className="text-[#183059] uppercase font-semibold text-[11px]">{currentUser.role}</span>)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Drawers & Modals */}
      {activeCitation && <CitationDrawer />}
      {isCanvasModalOpen && <CanvasExportModal />}
      {isReportDialogOpen && <ReportDialog />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
