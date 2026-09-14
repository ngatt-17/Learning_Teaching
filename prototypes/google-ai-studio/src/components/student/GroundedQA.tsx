import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Sparkles,
  Globe,
  ShieldCheck,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Layers,
  BarChart3,
  Lock,
  X,
  Plus,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  ArrowLeft,
  BookOpen,
  Play,
  Award,
  Video,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { ReportDialog } from '../common/ReportDialog';
import { QuizQuestion, SourceCitation } from '../../types';

interface GroundedQAProps {
  onNavigateTab?: (tab: string) => void;
}

export const GroundedQA: React.FC<GroundedQAProps> = ({ onNavigateTab }) => {
  const {
    activeCourse,
    currentUser,
    materials,
    activeConversation,
    askGroundedQuestion,
    rateAnswer,
    setActiveCitation,
    personalMaterials,
    addPersonalMaterial,
    questionBanks,
    recordPracticeAttempt
  } = useApp();

  const [inputQuestion, setInputQuestion] = useState('');
  const [includeWeb, setIncludeWeb] = useState(false);
  const [selectedMaterialScope, setSelectedMaterialScope] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<
    'idle' | 'understanding' | 'searching' | 'composing'
  >('idle');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Active view tab in main study canvas (Matching Image 2: Overview, Notes, Comments/Checkpoints)
  const [activeStudyTab, setActiveStudyTab] = useState<'overview' | 'notes' | 'sources' | 'checkpoints'>('overview');

  // Curriculum accordion expansion state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'mod-2': true,
    'mod-1': false,
    'mod-3': false
  });

  const [selectedLessonId, setSelectedLessonId] = useState<string>('les-2-3');

  // Reporting dialog state
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);

  // Inline Concept Checkpoint State
  const [openCheckpointMsgId, setOpenCheckpointMsgId] = useState<string | null>(null);
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<string, string>>({});
  const [checkpointSubmitted, setCheckpointSubmitted] = useState<Record<string, boolean>>({});

  // Slide-out Notes Drawer State
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteExcerpt, setNewNoteExcerpt] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const approvedMaterials = materials.filter(
    (m) => m.courseId === activeCourse.id && m.approvedForAI
  );

  const coursePublishedBanks = questionBanks.filter(
    (b) => b.courseId === activeCourse.id && b.status === 'published'
  );

  const coursePersonalNotes = personalMaterials.filter(
    (p) => p.courseId === activeCourse.id
  );

  const availableQuestions = coursePublishedBanks.flatMap((b) => b.questions);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendQuestion = async (customText?: string) => {
    const text = customText || inputQuestion;
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStage('understanding');

    await new Promise((r) => setTimeout(r, 600));
    setGenerationStage('searching');

    await new Promise((r) => setTimeout(r, 800));
    setGenerationStage('composing');

    await new Promise((r) => setTimeout(r, 600));
    await askGroundedQuestion({
      question: text,
      courseId: activeCourse.id,
      includeWeb,
      materialScopeId: selectedMaterialScope === 'all' ? undefined : selectedMaterialScope
    });

    setIsGenerating(false);
    setGenerationStage('idle');
    setInputQuestion('');
    setActiveStudyTab('overview');
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSaveToNotes = (msgId: string, content: string) => {
    const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 60);
    const title = `Takeaway: ${firstLine || activeCourse.currentTopic}`;
    addPersonalMaterial({
      title,
      filename: `${activeCourse.code}_Takeaway_${new Date().toISOString().slice(0, 10)}.txt`,
      contentExcerpt: content.slice(0, 400),
      isAssignmentDraft: false
    });
    showToast('Saved takeaway to your Private Study Notes');
  };

  const handleCreateQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;

    addPersonalMaterial({
      title: newNoteTitle.trim(),
      filename: `${newNoteTitle.trim().replace(/\s+/g, '_')}.txt`,
      contentExcerpt: newNoteExcerpt.trim() || 'Private study note.',
      isAssignmentDraft: false
    });

    setNewNoteTitle('');
    setNewNoteExcerpt('');
    setIsNotesDrawerOpen(false);
    showToast('Note added to your private workspace');
  };

  const handleCheckpointSelect = (msgId: string, optionIndex: string) => {
    if (checkpointSubmitted[msgId]) return;
    setCheckpointAnswers((prev) => ({ ...prev, [msgId]: optionIndex }));
  };

  const handleCheckpointSubmit = (msgId: string, question: QuizQuestion) => {
    const selected = checkpointAnswers[msgId];
    if (!selected) return;

    setCheckpointSubmitted((prev) => ({ ...prev, [msgId]: true }));
    const isCorrect = selected === question.correctAnswer;

    recordPracticeAttempt({
      studentId: currentUser.id,
      courseId: activeCourse.id,
      questionBankId: 'inline-checkpoint',
      activityTitle: `Checkpoint: ${question.topic}`,
      bankTitle: `Checkpoint: ${question.topic}`,
      totalQuestions: 1,
      correctCount: isCorrect ? 1 : 0,
      score: isCorrect ? 1 : 0,
      percentage: isCorrect ? 100 : 0,
      topic: question.topic,
      misconceptionsEncountered: isCorrect
        ? []
        : [`Review suggested on ${question.topic}`],
      misconceptionsIdentified: isCorrect
        ? []
        : [`Review suggested on ${question.topic}`],
      canvasExportStatus: 'not_exported',
      answers: [
        {
          questionId: question.id,
          studentAnswer: selected,
          isCorrect,
          timeSpentSeconds: 35
        }
      ]
    });
  };

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Syllabus modules mimicking Image 2's curriculum hierarchy
  const curriculumModules = [
    {
      id: 'mod-1',
      title: 'Course Intro & Foundations',
      status: 'completed',
      lessons: [
        { id: 'les-1-1', title: 'Welcome to Operating Systems', type: 'reading', status: 'completed' },
        { id: 'les-1-2', title: 'Kernel Architecture & Syscalls', type: 'reading', status: 'completed' }
      ]
    },
    {
      id: 'mod-2',
      title: 'Process Concurrency & Mutexes',
      status: 'in_progress',
      lessons: [
        { id: 'les-2-1', title: 'Welcome to Multi-threading', type: 'reading', status: 'completed' },
        { id: 'les-2-2', title: 'Critical Sections & Invariants', type: 'reading', status: 'info' },
        { id: 'les-2-3', title: 'Working with Mutexes & Locks', type: 'video', duration: '15:00 mins', status: 'active' },
        { id: 'les-2-4', title: 'Semaphores & Condition Variables', type: 'video', duration: '08:45 mins', status: 'completed' },
        { id: 'les-2-5', title: 'Peterson’s Algorithm & Barriers', type: 'reading', status: 'pending' },
        { id: 'les-2-6', title: 'Diagnostic Checkpoint Quiz', type: 'quiz', status: 'quiz' }
      ]
    },
    {
      id: 'mod-3',
      title: 'Deadlocks & Resource Allocation',
      status: 'upcoming',
      lessons: [
        { id: 'les-3-1', title: 'Coffman Conditions Overview', type: 'reading', status: 'pending' },
        { id: 'les-3-2', title: 'Banker’s Safety Algorithm', type: 'video', duration: '12:30 mins', status: 'pending' }
      ]
    }
  ];

  const samplePrompts = [
    'Why does a race condition occur when two threads update a shared counter simultaneously?',
    'What is the conceptual difference between a Mutex Lock and a Binary Semaphore?',
    'Explain the four Coffman conditions that lead to system deadlocks with course examples.',
    'How does Peterson’s algorithm guarantee Mutual Exclusion and Progress?'
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2328] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Course Title Breadcrumb (Image 2 style: Back arrow + Course Title) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab?.('progress')}
            className="p-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#656D76] hover:text-[#1F2328] transition-colors shadow-2xs"
            title="Back to My Progress"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2328] tracking-tight">
              {activeCourse.code}: {activeCourse.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#656D76] mt-0.5">
              <span>Week {activeCourse.currentWeek}</span>
              <span>•</span>
              <span className="font-semibold text-[#183059]">{activeCourse.currentTopic}</span>
              <span>•</span>
              <span className="text-[#183059] font-medium">{approvedMaterials.length} Certified Sources Active</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => onNavigateTab?.('practice')}
            className="px-3.5 py-1.5 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#183059] flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#183059]" />
            <span>Practice Banks ({coursePublishedBanks.length})</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Split Layout (Directly inspired by Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Curriculum Syllabus Tree (Matching Image 2 left panel) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs space-y-4">
          {/* Progress Indicator */}
          <div className="space-y-2 pb-3 border-b border-[#F0F2F5]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1F2328] text-sm">68% Completed</span>
              <button
                onClick={() => showToast('Course progress refreshed with Canvas sync')}
                className="p-1 rounded-lg text-[#656D76] hover:text-[#183059] hover:bg-[#F8F9FC] transition-colors"
                title="Sync syllabus progress"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Progress Bar (Image 2 style) */}
            <div className="w-full bg-[#F0F2F5] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#183059] h-2 rounded-full transition-all duration-500"
                style={{ width: '68%' }}
              />
            </div>
          </div>

          {/* Module Accordions */}
          <div className="space-y-2 text-xs">
            {curriculumModules.map((mod) => {
              const isExpanded = !!expandedModules[mod.id];
              return (
                <div key={mod.id} className="rounded-xl border border-[#F0F2F5] overflow-hidden">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full text-left px-3.5 py-2.5 bg-[#F8F9FC] hover:bg-[#F0F2F5] transition-colors flex items-center justify-between font-semibold text-[#1F2328]"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {mod.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#183059] shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-[#183059] shrink-0 flex items-center justify-center text-[8px] text-[#183059]" />
                      )}
                      <span className="truncate">{mod.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#656D76] transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Lessons list */}
                  {isExpanded && (
                    <div className="divide-y divide-[#F0F2F5] bg-white">
                      {mod.lessons.map((les) => {
                        const isSelected = selectedLessonId === les.id;
                        return (
                          <button
                            key={les.id}
                            onClick={() => setSelectedLessonId(les.id)}
                            className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-all ${
                              isSelected
                                ? 'bg-blue-50/80 border-l-3 border-[#183059] font-semibold text-[#183059]'
                                : 'hover:bg-[#F8F9FC] text-[#24292F]'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {les.status === 'completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#183059]" />
                              )}
                              {les.status === 'info' && (
                                <Info className="w-3.5 h-3.5 text-[#245084]" />
                              )}
                              {les.status === 'active' && (
                                <BookOpen className="w-3.5 h-3.5 text-[#183059]" />
                              )}
                              {les.status === 'quiz' && (
                                <Award className="w-3.5 h-3.5 text-[#183059]" />
                              )}
                              {les.status === 'pending' && (
                                <span className="w-3.5 h-3.5 rounded-full border border-[#D0D7DE] inline-block" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="truncate text-xs">{les.title}</div>
                              <div className="text-[10px] text-[#656D76] capitalize">
                                {les.type} {les.duration ? `• ${les.duration}` : ''}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Main Study Hub & Interactive Canvas (Image 2 style) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Topic Banner (Simulating the rich media / conceptual canvas from Image 2) */}
          <div className="bg-gradient-to-br from-[#183059] to-[#0E1F3B] text-white rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
            {/* Background Decorative Pattern */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-6 translate-y-6">
              <Sparkles className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider">
                  Active Lesson
                </span>
                <span className="text-xs text-blue-100">
                  Slide Deck L04 • Page 14–26
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Working with Mutexes & Critical Sections
              </h3>

              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Explore atomic lock acquisition (`pthread_mutex_lock`), critical section invariants, and how spinlocks contrast with blocking mutexes under POSIX threads.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleSendQuestion('Explain how pthread_mutex_lock prevents race conditions in multi-threaded programs.');
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-[#183059] hover:bg-blue-50 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#183059]" />
                  <span>Explain Mutex Invariant</span>
                </button>

                <button
                  onClick={() => {
                    const firstCourseCit = approvedMaterials[0];
                    if (firstCourseCit) {
                      setActiveCitation({
                        id: firstCourseCit.id,
                        title: firstCourseCit.title,
                        sourceType: 'course',
                        location: 'Slide 18, Chapter 6',
                        excerptText: firstCourseCit.contentExcerpt
                      });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Certified Slide</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pill Tab Bar & "Take Note" Action Button (Directly matching Image 2) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-2 border border-[#E5E8EB] shadow-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveStudyTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeStudyTab === 'overview'
                    ? 'bg-blue-50 text-[#183059] font-bold shadow-2xs'
                    : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Overview & AI Q&A</span>
              </button>

              <button
                onClick={() => setActiveStudyTab('notes')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeStudyTab === 'notes'
                    ? 'bg-blue-50 text-[#183059] font-bold shadow-2xs'
                    : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Notes ({coursePersonalNotes.length})</span>
              </button>

              <button
                onClick={() => setActiveStudyTab('sources')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeStudyTab === 'sources'
                    ? 'bg-blue-50 text-[#183059] font-bold shadow-2xs'
                    : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Certified Sources ({approvedMaterials.length})</span>
              </button>

              <button
                onClick={() => setActiveStudyTab('checkpoints')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeStudyTab === 'checkpoints'
                    ? 'bg-blue-50 text-[#183059] font-bold shadow-2xs'
                    : 'text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Checkpoints</span>
              </button>
            </div>

            {/* Action Button on the Right: "Take Note" (Matching Image 2 button) */}
            <button
              id="take-note-btn"
              onClick={() => setIsNotesDrawerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-[#183059] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#183059]" />
              <span>Take Note</span>
            </button>
          </div>

          {/* TAB 1: Overview & Grounded Q&A Assistant */}
          {activeStudyTab === 'overview' && (
            <div className="space-y-6">
              {/* Warning if Course has ZERO approved sources */}
              {approvedMaterials.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-xs text-[#C8102E] flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#C8102E] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#C8102E]">Course AI Assistant Paused</h4>
                    <p className="text-[#24292F] leading-relaxed">
                      <strong>{activeCourse.code}</strong> has 0 approved lecture sources. Under CECS academic integrity policy, AI responses are paused until certified course materials are uploaded.
                    </p>
                  </div>
                </div>
              )}

              {/* Conversation Messages */}
              <div className="space-y-4">
                {activeConversation?.messages.map((msg, msgIdx) => {
                  const checkpointQuestion =
                    availableQuestions[msgIdx % Math.max(1, availableQuestions.length)] ||
                    availableQuestions[0];
                  const isCheckpointOpen = openCheckpointMsgId === msg.id;
                  const selectedOption = checkpointAnswers[msg.id];
                  const isSubmitted = checkpointSubmitted[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`rounded-2xl p-5 sm:p-6 transition-all ${
                        msg.sender === 'user'
                          ? 'bg-white border border-[#E5E8EB] ml-6 sm:ml-12 shadow-2xs text-[#1F2328]'
                          : 'bg-white border border-[#E5E8EB] shadow-xs mr-2 sm:mr-6 text-[#1F2328]'
                      }`}
                    >
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-2">
                          {msg.sender === 'user' ? (
                            <div className="font-bold text-[#183059] flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#183059] text-white flex items-center justify-center text-[10px] font-bold">
                                You
                              </span>
                              <span>Student Inquiry</span>
                            </div>
                          ) : (
                            <div className="font-bold text-[#1F2328] flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#183059] flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5" />
                              </div>
                              <span>VinUni CECS Assistant</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-[#183059] border border-blue-200 font-bold">
                                Certified
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#656D76]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className="text-sm text-[#1F2328] leading-relaxed whitespace-pre-line space-y-3">
                        {msg.content}
                      </div>

                      {/* Supporting Citations Badges */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-[#F0F2F5] space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#656D76] uppercase tracking-wider text-[10px]">
                              Course Sources & Evidence Excerpts
                            </span>
                            <span className="text-[11px] text-[#656D76] font-medium">
                              Click badge to inspect slide excerpt
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.citations.map((cit) => (
                              <button
                                key={cit.id}
                                id={`citation-badge-${cit.id}`}
                                onClick={() => setActiveCitation(cit)}
                                className="text-left p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 text-xs transition-all flex items-start gap-2 group shadow-2xs"
                              >
                                <div className="mt-0.5">
                                  <ShieldCheck className="w-4 h-4 text-[#183059]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-[#183059]">
                                      {cit.sourceType}
                                    </span>
                                    <span className="text-[11px] font-semibold text-[#1F2328] truncate">
                                      {cit.title}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#656D76] mt-0.5 truncate">
                                    {cit.location}
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-[#656D76] group-hover:text-[#183059] transition-colors" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Formative Checkpoint */}
                      {msg.sender === 'assistant' && checkpointQuestion && (
                        <div className="mt-4 pt-3.5 border-t border-[#F0F2F5]">
                          {!isCheckpointOpen ? (
                            <button
                              onClick={() => setOpenCheckpointMsgId(msg.id)}
                              className="w-full text-left p-3 rounded-xl bg-[#F8F9FC] hover:bg-blue-50/50 border border-[#E5E8EB] transition-all flex items-center justify-between group shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5 text-xs">
                                <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#183059] flex items-center justify-center font-bold text-[11px]">
                                  ?
                                </div>
                                <span className="font-bold text-[#1F2328]">
                                  Quick Checkpoint: Test understanding on this answer
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-[#183059] group-hover:underline flex items-center gap-1">
                                Checkpoint Question
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          ) : (
                            <div className="bg-[#F8F9FC] rounded-2xl border border-[#E5E8EB] p-5 text-xs space-y-3.5 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between pb-2 border-b border-[#E5E8EB]">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#183059] border border-blue-200 font-bold text-[10px] uppercase">
                                    Diagnostic Checkpoint
                                  </span>
                                  <span className="font-semibold text-[#1F2328]">{checkpointQuestion.topic}</span>
                                </div>
                                <button
                                  onClick={() => setOpenCheckpointMsgId(null)}
                                  className="text-[#656D76] hover:text-[#1F2328] p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <p className="font-semibold text-sm text-[#1F2328] leading-relaxed">
                                {checkpointQuestion.stem}
                              </p>

                              <div className="space-y-2">
                                {(checkpointQuestion.options || []).map((opt, optIdx) => {
                                  const optKey = checkpointQuestion.type === 'true_false' ? opt : optIdx.toString();
                                  const isSelected = selectedOption === optKey;
                                  const isCorrectOpt = optKey === checkpointQuestion.correctAnswer;

                                  let btnStyle = 'bg-white border-[#E5E8EB] text-[#1F2328] hover:bg-[#F0F2F5]';
                                  if (isSubmitted) {
                                    if (isCorrectOpt) {
                                      btnStyle = 'bg-blue-50 border-blue-300 text-[#183059] font-bold';
                                    } else if (isSelected && !isCorrectOpt) {
                                      btnStyle = 'bg-red-50 border-red-300 text-[#C8102E]';
                                    }
                                  } else if (isSelected) {
                                    btnStyle = 'bg-blue-50 border-[#183059] text-[#183059] font-bold ring-1 ring-[#183059]';
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      disabled={isSubmitted}
                                      onClick={() => handleCheckpointSelect(msg.id, optKey)}
                                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start gap-3 ${btnStyle}`}
                                    >
                                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                        {checkpointQuestion.type === 'true_false'
                                          ? opt[0]
                                          : String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="flex-1">{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {isSubmitted && (
                                <div
                                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                    selectedOption === checkpointQuestion.correctAnswer
                                      ? 'bg-blue-50 border-blue-200 text-[#183059]'
                                      : 'bg-red-50 border-red-200 text-[#C8102E]'
                                  }`}
                                >
                                  <div className="font-bold flex items-center gap-1.5">
                                    {selectedOption === checkpointQuestion.correctAnswer ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 text-[#183059]" />
                                        <span>Correct understanding! Mastered in this topic.</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 text-[#C8102E]" />
                                        <span>Diagnostic Feedback: Review recommended</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-[#24292F] leading-relaxed">
                                    {checkpointQuestion.explanation}
                                  </p>
                                </div>
                              )}

                              <div className="pt-2 flex items-center justify-between">
                                {!isSubmitted ? (
                                  <button
                                    onClick={() => handleCheckpointSubmit(msg.id, checkpointQuestion)}
                                    disabled={!selectedOption}
                                    className="px-4 py-2 bg-[#183059] hover:bg-[#0E1F3B] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40 shadow-2xs"
                                  >
                                    Submit Answer
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[#183059] font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    Recorded to Mastery Progress
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Actions */}
                      {msg.sender === 'assistant' && (
                        <div className="mt-4 pt-3 border-t border-[#F0F2F5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#656D76]">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-[#F8F9FC] hover:text-[#1F2328] transition-colors flex items-center gap-1"
                              title="Copy answer"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-[#183059]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span className="text-[11px]">{copiedMessageId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              onClick={() => handleSaveToNotes(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-[#F8F9FC] hover:text-[#183059] transition-colors flex items-center gap-1 text-[11px]"
                              title="Save takeaway to Notes"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5 text-[#183059]" />
                              <span>Clip to Notes</span>
                            </button>

                            <button
                              onClick={() => rateAnswer(activeConversation.id, msg.id, 'helpful')}
                              className={`p-1.5 rounded-lg hover:bg-[#F8F9FC] transition-colors flex items-center gap-1 ${
                                msg.helpfulRating === 'helpful' ? 'text-[#183059] font-bold bg-blue-50' : ''
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Helpful</span>
                            </button>

                            <button
                              onClick={() => rateAnswer(activeConversation.id, msg.id, 'unhelpful')}
                              className={`p-1.5 rounded-lg hover:bg-[#F8F9FC] transition-colors flex items-center gap-1 ${
                                msg.helpfulRating === 'unhelpful' ? 'text-[#C8102E] font-bold bg-red-50' : ''
                              }`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => setReportingMsgId(msg.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-[#C8102E] transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Staged Generating Indicator */}
                {isGenerating && (
                  <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs mr-8 animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#183059] text-white flex items-center justify-center">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="text-xs font-bold text-[#183059]">
                        {generationStage === 'understanding' && 'Stage 1: Analyzing query invariants...'}
                        {generationStage === 'searching' && 'Stage 2: Scanning certified lecture slides & textbooks...'}
                        {generationStage === 'composing' && 'Stage 3: Synthesizing verified response with citations...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Prompts */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#656D76] uppercase tracking-wider">
                  Recommended Inquiries
                </div>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuestion(p)}
                      disabled={isGenerating || approvedMaterials.length === 0}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FC] border border-[#E5E8EB] hover:border-[#183059] text-xs text-[#24292F] transition-all text-left shadow-2xs disabled:opacity-50"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Composer Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#F0F2F5] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#656D76]">Material Scope:</span>
                    <select
                      value={selectedMaterialScope}
                      onChange={(e) => setSelectedMaterialScope(e.target.value)}
                      className="rounded-xl border border-[#E5E8EB] bg-white px-3 py-1 text-xs text-[#1F2328] font-medium"
                    >
                      <option value="all">All Certified Course Sources ({approvedMaterials.length})</option>
                      {approvedMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeWeb}
                      onChange={(e) => setIncludeWeb(e.target.checked)}
                      className="w-4 h-4 rounded text-[#183059] focus:ring-[#183059] border-[#E5E8EB]"
                    />
                    <span className="flex items-center gap-1 text-[#24292F] font-semibold text-xs">
                      <Globe className="w-3.5 h-3.5 text-[#245084]" />
                      Include Verified Web Sources
                    </span>
                  </label>
                </div>

                <div className="flex gap-2.5">
                  <textarea
                    rows={2}
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendQuestion();
                      }
                    }}
                    placeholder={`Ask about ${activeCourse.currentTopic}... (Enter to send)`}
                    className="flex-1 rounded-xl border border-[#E5E8EB] p-3 text-xs text-[#1F2328] placeholder-[#656D76] focus:outline-hidden focus:border-[#183059] resize-none"
                  />
                  <button
                    onClick={() => handleSendQuestion()}
                    disabled={!inputQuestion.trim() || isGenerating || approvedMaterials.length === 0}
                    className="px-5 bg-[#183059] hover:bg-[#0E1F3B] disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Ask</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Notes View */}
          {activeStudyTab === 'notes' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2328]">My Private Study Notes ({coursePersonalNotes.length})</h4>
                  <p className="text-xs text-[#656D76]">Local private notes stored securely in this browser.</p>
                </div>
                <button
                  onClick={() => setIsNotesDrawerOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#183059] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Note</span>
                </button>
              </div>

              {coursePersonalNotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#656D76]">
                  No private notes taken for this topic yet. Click "Take Note" above to write down key lecture insights.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coursePersonalNotes.map((note) => (
                    <div key={note.id} className="p-4 rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] space-y-2">
                      <div className="font-bold text-xs text-[#1F2328]">{note.title}</div>
                      <p className="text-xs text-[#656D76] line-clamp-3">{note.contentExcerpt}</p>
                      <div className="text-[10px] text-[#656D76] pt-2 border-t border-[#E5E8EB]">
                        Saved locally • Zero passback
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Certified Sources */}
          {activeStudyTab === 'sources' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#F0F2F5]">
                <h4 className="text-sm font-bold text-[#1F2328]">Faculty Certified Course Sources ({approvedMaterials.length})</h4>
                <p className="text-xs text-[#656D76]">
                  Only instructor-certified slides and textbooks are used to ground AI responses.
                </p>
              </div>

              <div className="space-y-3">
                {approvedMaterials.map((mat) => (
                  <div key={mat.id} className="p-4 rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-[#183059] border border-blue-200">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1F2328]">{mat.title}</div>
                        <div className="text-[11px] text-[#656D76]">{mat.filename} • {mat.coverageSummary}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveCitation({
                          id: mat.id,
                          title: mat.title,
                          sourceType: 'course',
                          location: 'Certified Document',
                          excerptText: mat.contentExcerpt
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#E5E8EB] bg-white hover:bg-blue-50 text-xs font-bold text-[#183059] transition-colors shadow-2xs"
                    >
                      Inspect Excerpt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Diagnostic Checkpoints */}
          {activeStudyTab === 'checkpoints' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2328]">Course Question Bank Checkpoints</h4>
                  <p className="text-xs text-[#656D76]">Faculty prepared practice questions for formative self-assessment.</p>
                </div>
                <button
                  onClick={() => onNavigateTab?.('practice')}
                  className="text-xs font-bold text-[#183059] hover:underline flex items-center gap-1"
                >
                  <span>Open Full Practice Generator</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>

              <div className="space-y-3">
                {availableQuestions.slice(0, 4).map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#183059] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {q.topic}
                      </span>
                      <span className="text-[11px] text-[#656D76] uppercase font-semibold">{q.difficulty}</span>
                    </div>
                    <p className="text-xs font-medium text-[#1F2328]">{q.stem}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Notes Drawer (Image 2 "Take Note" flow) */}
      {isNotesDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 space-y-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#183059]">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2328]">Take Study Note</h3>
                    <p className="text-[11px] text-[#656D76]">Saved to your private study workspace.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotesDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#F8F9FC] text-[#656D76]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickNote} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[#1F2328] block mb-1">Note Title</label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="e.g. Critical Section Invariants & Mutexes"
                    className="w-full rounded-xl border border-[#E5E8EB] p-2.5 text-xs focus:outline-hidden focus:border-[#183059]"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1F2328] block mb-1">Key Takeaway / Excerpt</label>
                  <textarea
                    rows={6}
                    value={newNoteExcerpt}
                    onChange={(e) => setNewNoteExcerpt(e.target.value)}
                    placeholder="Write your study notes or paste key explanations..."
                    className="w-full rounded-xl border border-[#E5E8EB] p-2.5 text-xs focus:outline-hidden focus:border-[#183059] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Save to Notes
                </button>
              </form>
            </div>

            <div className="text-[11px] text-[#656D76] p-3 rounded-xl bg-[#F8F9FC] border border-[#E5E8EB]">
              🔒 Private to you: Notes are stored in browser local storage and never graded or shared with other students.
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Dialog */}
      {reportingMsgId && (
        <ReportDialog
          messageId={reportingMsgId}
          onClose={() => setReportingMsgId(null)}
        />
      )}
    </div>
  );
};
