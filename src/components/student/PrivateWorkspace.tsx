import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Upload,
  FileText,
  Trash2,
  Send,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { PersonalStudyMaterial } from '../../types';

interface PrivateWorkspaceProps {
  onNavigateTab?: (tab: string) => void;
}

export const PrivateWorkspace: React.FC<PrivateWorkspaceProps> = ({ onNavigateTab }) => {
  const {
    activeCourse,
    currentUser,
    personalMaterials,
    addPersonalMaterial,
    deletePersonalMaterial,
    askPrivateWorkspaceQuestion,
    setActiveCitation,
    conversations
  } = useApp();

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isAssignment, setIsAssignment] = useState(false);
  const [assignmentName, setAssignmentName] = useState(
    activeCourse.activeAssignmentPolicy?.assignmentName || 'Assignment 2'
  );

  const [selectedFileId, setSelectedFileId] = useState<string>(
    personalMaterials[0]?.id || ''
  );
  const [questionText, setQuestionText] = useState('');
  const [guidedMode, setGuidedMode] = useState<
    'explain' | 'socratic' | 'review_attempt' | 'next_steps'
  >('review_attempt');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coursePersonal = personalMaterials.filter(
    (p) => p.courseId === activeCourse.id
  );

  // Filter conversations that belong to private workspace
  const privateThreads = conversations.filter(
    (c) => c.isPrivateWorkspace && c.courseId === activeCourse.id
  );

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    addPersonalMaterial({
      title: uploadTitle,
      filename: `${uploadTitle.replace(/\s+/g, '_')}.txt`,
      contentExcerpt: uploadContent || 'Notes on lecture synchronization primitives.',
      isAssignmentDraft: isAssignment,
      assignmentName: isAssignment ? assignmentName : undefined
    });

    setUploadTitle('');
    setUploadContent('');
    setIsAssignment(false);
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    await new Promise((r) => setTimeout(r, 700));
    await askPrivateWorkspaceQuestion({
      question: questionText,
      courseId: activeCourse.id,
      personalMaterialId: selectedFileId || undefined,
      isAssignmentWork: isAssignment || Boolean(activeCourse.activeAssignmentPolicy?.guidedHelpOnly),
      guidedHelpMode: guidedMode
    });

    setQuestionText('');
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-[#D0D7DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-[#183059] border border-blue-200">
              <Lock className="w-3.5 h-3.5" />
              Private Study Workspace
            </span>
            <span className="text-xs text-[#656D76] font-medium">Student-Only Space</span>
          </div>
          <h1 className="text-xl font-bold text-[#1F2328] tracking-tight">
            Personal Notes & Drafts
          </h1>
          <p className="text-xs text-[#656D76] mt-1 max-w-2xl">
            Upload personal lecture summaries and draft code. Personal files are strictly excluded from official course knowledge and cohort analytics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            id="workspace-nav-qa-btn"
            onClick={() => onNavigateTab?.('qa')}
            className="px-3 py-1.5 rounded-lg border border-[#D0D7DE] bg-white hover:bg-[#F6F8FA] hover:border-[#183059] text-xs font-semibold text-[#1F2328] transition-colors shadow-2xs inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#183059]" />
            <span>Study Assistant</span>
          </button>

          {/* Academic Policy Cue */}
          <div className="p-3 bg-[#F6F8FA] rounded-lg border border-[#D0D7DE] text-xs space-y-1">
            <div className="font-bold text-[#1F2328] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#183059]" />
              Zero Surveillance Guarantee
            </div>
            <p className="text-[11px] text-[#656D76] max-w-xs">
              Instructors and CECS admins cannot view your private notes or verbatim workspace chats.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal File Manager & Upload Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Card */}
          <div className="bg-white rounded-xl p-5 border border-[#D0D7DE] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#183059]" />
              <h3 className="text-sm font-bold text-[#1F2328]">Upload Personal Note or Draft</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Title / Document Name</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. My Concurrency Lecture Notes or Lab Attempt"
                  className="w-full rounded-md border border-[#D0D7DE] bg-white p-2.5 text-xs text-[#1F2328] placeholder:text-[#656D76] focus:ring-2 focus:ring-[#183059]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Content Snippet or Code</label>
                <textarea
                  rows={3}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Paste lecture summary points, pseudo-code, or questions..."
                  className="w-full rounded-md border border-[#D0D7DE] bg-white p-2.5 text-xs font-mono text-[#1F2328] placeholder:text-[#656D76] focus:ring-2 focus:ring-[#183059]"
                />
              </div>

              {/* Assignment Declaration Checkbox */}
              <div className="p-3 rounded-lg bg-red-50/60 border border-red-200 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAssignment}
                    onChange={(e) => setIsAssignment(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C8102E] mt-0.5 border-[#D0D7DE] focus:ring-[#C8102E]"
                  />
                  <div className="text-[11px] text-[#C8102E] leading-tight">
                    <span className="font-bold block">Active Graded Assessment Declaration</span>
                    Check if this work is part of an active graded assignment (e.g. Assignment 2). Guided-help safeguards will automatically be applied.
                  </div>
                </label>

                {isAssignment && (
                  <input
                    type="text"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    placeholder="Assignment Name"
                    className="w-full rounded-md border border-red-300 bg-white p-2 text-xs text-[#1F2328] focus:ring-2 focus:ring-[#C8102E]"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold text-xs transition-colors shadow-2xs"
              >
                Save to Private Workspace
              </button>
            </form>
          </div>

          {/* List of Student Personal Uploads */}
          <div className="bg-white rounded-xl p-5 border border-[#D0D7DE] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1F2328] uppercase tracking-wider text-[11px]">
                My Personal Files ({coursePersonal.length})
              </span>
              <span className="text-[#656D76] text-[10px]">Private to you</span>
            </div>

            <div className="space-y-2">
              {coursePersonal.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFileId(item.id)}
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedFileId === item.id
                      ? 'bg-blue-50/70 border-blue-300 text-[#1F2328] shadow-2xs'
                      : 'bg-white border-[#D0D7DE] hover:bg-[#F6F8FA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#183059] shrink-0" />
                      <div>
                        <div className="font-bold text-[#1F2328]">{item.title}</div>
                        <div className="text-[10px] text-[#656D76] mt-0.5">
                          {new Date(item.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePersonalMaterial(item.id);
                      }}
                      className="text-[#656D76] hover:text-[#C8102E] p-1 transition-colors"
                      title="Delete personal file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2 text-[11px] text-[#24292F] font-mono bg-[#F6F8FA] p-2 rounded-md border border-[#D0D7DE] line-clamp-2">
                    {item.contentExcerpt}
                  </div>

                  {item.isAssignmentDraft && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-[#C8102E] border border-red-200">
                      <ShieldAlert className="w-3 h-3 text-[#C8102E]" />
                      Active Assignment Draft (Guided Help Only)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Guided-Help Assistant with Active Safeguards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-[#D0D7DE] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D0D7DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2328]">Guided Study Assistant</h3>
                  <p className="text-xs text-[#656D76]">
                    Targeted pedagogical assistance on your drafts without code handoffs.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#183059] border border-blue-200">
                Personal Grounding
              </span>
            </div>

            {/* Guided Help Mode Selector */}
            <div>
              <label className="block font-bold text-xs text-[#1F2328] mb-2">
                Select Pedagogical Help Mode
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    id: 'review_attempt',
                    title: 'Feedback on My Attempt',
                    desc: 'Review code invariants & race conditions'
                  },
                  {
                    id: 'socratic',
                    title: 'Socratic Inquiry',
                    desc: 'Ask guiding questions to find bugs'
                  },
                  {
                    id: 'explain',
                    title: 'Explain Concepts',
                    desc: 'Deconstruct underlying theory'
                  },
                  {
                    id: 'next_steps',
                    title: 'Suggest Next Steps',
                    desc: 'Outline debugging & edge cases'
                  }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGuidedMode(mode.id as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      guidedMode === mode.id
                        ? 'bg-blue-50/80 border-[#183059] text-[#183059] shadow-2xs font-semibold'
                        : 'bg-white border-[#D0D7DE] text-[#24292F] hover:bg-[#F6F8FA]'
                    }`}
                  >
                    <div className="font-bold text-xs">{mode.title}</div>
                    <div className="text-[10px] text-[#656D76] mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Safeguard Notice for Active Graded Assessments */}
            <div className="p-3.5 rounded-lg bg-red-50/60 border border-red-200 text-xs text-[#C8102E] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Guided-Help Safeguards Active</span>
                <p className="text-[11px] text-[#24292F] leading-relaxed">
                  Direct submission-ready code generation is prohibited for active graded work. The assistant will guide your conceptual invariants and point out edge cases.
                </p>
              </div>
            </div>

            {/* Composer */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Ask for feedback on your selected note or attempt (e.g. 'Can you review my producer semaphore order for deadlocks?')..."
                className="w-full rounded-md border border-[#D0D7DE] bg-[#F6F8FA] p-3 text-xs text-[#1F2328] placeholder:text-[#656D76] focus:bg-white focus:ring-2 focus:ring-[#183059]"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#656D76]">
                  Target: {coursePersonal.find((p) => p.id === selectedFileId)?.title || 'All Notes'}
                </span>
                <button
                  onClick={handleAskQuestion}
                  disabled={!questionText.trim() || isSubmitting}
                  className="px-5 py-2 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Analyzing Draft...' : 'Request Guided Feedback'}
                </button>
              </div>
            </div>
          </div>

          {/* Conversation History in Private Workspace */}
          <div className="space-y-4">
            {privateThreads.map((thread) => (
              <div key={thread.id} className="space-y-3">
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-5 rounded-xl border text-xs leading-relaxed space-y-3 ${
                      m.sender === 'user'
                        ? 'bg-blue-50/50 border-blue-200 ml-6 text-[#1F2328]'
                        : 'bg-white border-[#D0D7DE] shadow-xs mr-4 text-[#1F2328]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#656D76]">
                      <span className="font-bold text-[#1F2328]">
                        {m.sender === 'user' ? 'You' : 'Guided Pedagogical Assistant'}
                      </span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="whitespace-pre-line text-xs text-[#1F2328] space-y-2">
                      {m.content}
                    </div>

                    {m.citations && m.citations.length > 0 && (
                      <div className="pt-3 border-t border-[#D0D7DE] flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-[#656D76] uppercase">Citations:</span>
                        {m.citations.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setActiveCitation(c)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-blue-50 text-[#183059] border-blue-200"
                          >
                            {c.sourceType === 'personal' ? 'Personal Source: ' : 'Course: '}
                            {c.title} ({c.location})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
