import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Plus,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Trash2,
  ShieldCheck,
  Send,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  X,
  FileCheck
} from 'lucide-react';
import { QuestionBank, QuizQuestion } from '../../types';

export const QuestionBankManager: React.FC = () => {
  const {
    activeCourse,
    currentUser,
    questionBanks,
    addQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    publishQuestionBank,
    unpublishQuestionBank,
    regenerateQuestion,
    setActiveCitation
  } = useApp();

  const [selectedBankId, setSelectedBankId] = useState<string>(
    questionBanks.find((b) => b.courseId === activeCourse.id)?.id || ''
  );

  // New Question Bank Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newBankTitle, setNewBankTitle] = useState('');
  const [newBankTopic, setNewBankTopic] = useState('Thread Synchronization & Mutexes');
  const [newBankCount, setNewBankCount] = useState(3);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Edit Question Modal
  const [editingQuestion, setEditingQuestion] = useState<{
    bankId: string;
    question: QuizQuestion;
  } | null>(null);

  // Student Preview Modal
  const [previewQuestion, setPreviewQuestion] = useState<QuizQuestion | null>(null);

  const courseBanks = questionBanks.filter((b) => b.courseId === activeCourse.id);
  const activeBank = courseBanks.find((b) => b.id === selectedBankId) || courseBanks[0];

  const isProfessor = currentUser.role === 'professor';
  const isTA = currentUser.role === 'ta';

  const handleGenerateBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSynthesizing(true);
    await new Promise((r) => setTimeout(r, 800));

    const generatedQuestions: QuizQuestion[] = [
      {
        id: `gen-q-${Date.now()}-1`,
        stem: `In ${newBankTopic}, how does the compare_and_swap (CAS) instruction guarantee atomic updates in multi-core processors?`,
        type: 'multiple_choice',
        options: [
          'By reading memory, comparing it with an expected value, and updating it in a single indivisible bus cycle',
          'By forcing all other CPU cores into sleep mode until interrupt completes',
          'By duplicating data across all L1 cache lines simultaneously',
          'By executing speculative branch execution without writeback'
        ],
        correctAnswer: '0',
        explanation: 'CAS atomically compares the contents of a memory location with a given value and, only if they are the same, modifies the contents to a new given value. This hardware-level primitive avoids software lock overhead.',
        difficulty: 'medium',
        topic: newBankTopic,
        citations: [
          {
            id: `cit-gen-1`,
            sourceType: 'course',
            title: 'Textbook Ch. 6: Synchronization Tools',
            location: 'Section 6.4 (Hardware Primitives)',
            excerpt: 'CAS executed atomically prevents interleaved updates across multi-core CPU architectures.',
            verifiedCourseApproved: true
          }
        ]
      },
      {
        id: `gen-q-${Date.now()}-2`,
        stem: `True or False: Peterson's algorithm works reliably without memory barrier fences on modern Intel and ARM out-of-order processors.`,
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'False. Peterson\'s algorithm assumes sequentially consistent memory models. On modern architectures with out-of-order execution, hardware memory barriers (mfence or smp_mb) are mandatory to prevent compiler/CPU store reordering.',
        difficulty: 'hard',
        topic: newBankTopic,
        citations: [
          {
            id: `cit-gen-2`,
            sourceType: 'course',
            title: 'Lecture 4: Mutex Locks and Semaphores',
            location: 'Slide 11 (Peterson\'s Solution Limitations)',
            excerpt: 'Modern processors reorder read and write operations; Peterson\'s algorithm requires explicit memory barriers to function correctly.',
            verifiedCourseApproved: true
          }
        ]
      }
    ];

    addQuestionBank({
      title: newBankTitle || `Question Bank: ${newBankTopic}`,
      description: `Draft question bank generated from approved ${activeCourse.code} lecture sources.`,
      topic: newBankTopic,
      questions: generatedQuestions
    });

    setIsSynthesizing(false);
    setIsGenerateModalOpen(false);
    setNewBankTitle('');
  };

  const handlePublishToggle = (bank: QuestionBank) => {
    if (bank.status === 'published') {
      unpublishQuestionBank(bank.id);
    } else {
      const res = publishQuestionBank(bank.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#183059] border border-blue-200">
              {activeCourse.code} Curation
            </span>
            <span className="text-[#656D76] font-medium">Formative Assessment Engineering</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2328] tracking-tight">
            Practice Question Banks & Curation
          </h1>
          <p className="text-xs text-[#656D76] mt-1 max-w-2xl">
            Synthesize verified question banks from approved course sources. Instructors review distractors, adjust explanations, and certify publication to student practice activities.
          </p>
        </div>

        <button
          id="generate-new-question-bank-btn"
          onClick={() => setIsGenerateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Bank
        </button>
      </div>

      {/* Metrics Row (Matching Image 1 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Total Banks</div>
            <div className="text-2xl font-bold text-[#1F2328] tracking-tight">{courseBanks.length}</div>
            <div className="text-[11px] text-[#183059] font-semibold">
              {courseBanks.reduce((acc, b) => acc + (b.questions?.length || 0), 0)} Total Questions
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Published Live</div>
            <div className="text-2xl font-bold text-[#183059] tracking-tight">
              {courseBanks.filter((b) => b.status === 'published').length}
            </div>
            <div className="text-[11px] text-[#656D76]">Active in student quizzes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Citations Verified</div>
            <div className="text-2xl font-bold text-[#183059] tracking-tight">100%</div>
            <div className="text-[11px] text-[#183059] font-semibold">Grounded in syllabus</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#C8102E] border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Drafts / In Review</div>
            <div className="text-2xl font-bold text-[#C8102E] tracking-tight">
              {courseBanks.filter((b) => b.status === 'draft').length}
            </div>
            <div className="text-[11px] text-[#C8102E] font-medium">Awaiting faculty check</div>
          </div>
        </div>
      </div>

      {/* Role Authority Cue */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E8EB] text-xs flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 text-[#24292F]">
          <ShieldCheck className="w-4 h-4 text-[#183059] shrink-0" />
          <span>
            Current Authority: <strong className="text-[#1F2328]">{currentUser.name}</strong> ({currentUser.title}) —{' '}
            {isProfessor
              ? 'Full Faculty Publishing Authority enabled.'
              : isTA
              ? 'Delegated TA Curation enabled (Draft & Edit; Publishing requires Prof. Miller).'
              : 'Viewer Authority.'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bank Selector & Status List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-[#656D76] uppercase tracking-wider px-1">
            Available Question Banks ({courseBanks.length})
          </div>

          <div className="space-y-2.5">
            {courseBanks.map((bank) => {
              const isSelected = activeBank?.id === bank.id;
              const isPublished = bank.status === 'published';

              return (
                <div
                  key={bank.id}
                  id={`bank-card-${bank.id}`}
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/60 border-[#183059] shadow-xs'
                      : 'bg-white border-[#E5E8EB] hover:bg-[#F8F9FC]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isPublished
                          ? 'bg-blue-50 text-[#183059] border border-blue-200'
                          : 'bg-red-50 text-[#C8102E] border border-red-200'
                      }`}
                    >
                      {isPublished ? 'Published to Students' : 'Draft / Under Review'}
                    </span>
                    <span className="text-[#656D76] font-mono text-[10px]">
                      {bank.questions?.length || 0} Qs
                    </span>
                  </div>

                  <h3 className="font-bold text-[#1F2328] text-xs leading-snug">{bank.title}</h3>
                  <div className="text-[11px] text-[#656D76] mt-1 line-clamp-1">
                    Created by: {bank.createdBy}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question Bank Review Queue & Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeBank ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs space-y-6">
              {/* Bank Metadata Bar & Publishing Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0F2F5] gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeBank.status === 'published'
                          ? 'bg-blue-50 text-[#183059] border border-blue-200'
                          : 'bg-red-50 text-[#C8102E] border border-red-200'
                      }`}
                    >
                      {activeBank.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#656D76]">{activeBank.topic}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1F2328]">{activeBank.title}</h2>
                  <p className="text-xs text-[#656D76] mt-0.5">{activeBank.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`publish-toggle-${activeBank.id}-btn`}
                    onClick={() => handlePublishToggle(activeBank)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                      activeBank.status === 'published'
                        ? 'bg-white hover:bg-[#F8F9FC] border border-[#E5E8EB] text-[#24292F]'
                        : 'bg-[#183059] hover:bg-[#0E1F3B] text-white'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    {activeBank.status === 'published' ? 'Unpublish to Draft' : 'Publish to Students'}
                  </button>
                </div>
              </div>

              {/* Questions Review List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#1F2328]">
                  <span>Questions in this Bank ({activeBank.questions?.length || 0})</span>
                  <span className="text-[11px] text-[#656D76] font-normal">
                    Individual questions can be regenerated or edited without discarding the bank
                  </span>
                </div>

                {(activeBank.questions || []).map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 sm:p-5 rounded-2xl border border-[#E5E8EB] bg-[#F8F9FC] space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white text-[#183059] font-bold flex items-center justify-center text-[10px] border border-[#E5E8EB]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#1F2328]">{q.topic}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white text-[#24292F] capitalize font-medium text-[10px] border border-[#E5E8EB]">
                          {q.difficulty}
                        </span>
                      </div>

                      {/* Action buttons on single question */}
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`preview-q-${q.id}-btn`}
                          onClick={() => setPreviewQuestion(q)}
                          className="px-3 py-1 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Preview
                        </button>

                        <button
                          id={`regenerate-single-q-${q.id}-btn`}
                          onClick={() => regenerateQuestion(activeBank.id, q.id)}
                          className="px-3 py-1 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/60 text-[#183059] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Regenerate only this question with fresh parameters"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Regenerate Q
                        </button>

                        <button
                          id={`edit-q-${q.id}-btn`}
                          onClick={() => setEditingQuestion({ bankId: activeBank.id, question: q })}
                          className="p-1.5 rounded-xl hover:bg-white text-[#656D76] hover:text-[#1F2328] transition-colors"
                          title="Edit question text"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Stem */}
                    <div className="font-semibold text-[#1F2328] text-xs leading-relaxed">
                      {q.stem}
                    </div>

                    {/* Options list */}
                    {q.options && (
                      <div className="space-y-1.5 pl-3 border-l-2 border-[#D0D7DE]">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(oIdx.toString())
                            : q.correctAnswer === oIdx.toString() || q.correctAnswer === opt;
                          return (
                            <div
                              key={oIdx}
                              className={`text-[11px] flex items-center gap-2 ${
                                isCorrect ? 'text-[#183059] font-bold' : 'text-[#656D76]'
                              }`}
                            >
                              <span>{String.fromCharCode(65 + oIdx)}.</span>
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-50 text-[#183059] font-bold border border-blue-200">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="p-3 bg-white rounded-lg border border-[#D0D7DE] text-[11px] text-[#24292F] leading-relaxed">
                      <span className="font-bold text-[#1F2328]">Pedagogical Explanation: </span>
                      {q.explanation}
                    </div>

                    {/* Validation Warnings */}
                    {q.validationWarnings && q.validationWarnings.length > 0 && (
                      <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-[11px] text-[#C8102E] space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#C8102E]" />
                          Validation Review Flag
                        </div>
                        {q.validationWarnings.map((w, wIdx) => (
                          <div key={wIdx} className="text-[#656D76]">
                            • {w}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations */}
                    {q.citations && q.citations.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-[#656D76] uppercase">
                          Grounded in:
                        </span>
                        {q.citations.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setActiveCitation(c)}
                            className="text-[10px] text-[#183059] hover:underline font-semibold"
                          >
                            {c.title} ({c.location})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#656D76] bg-white rounded-xl border border-[#D0D7DE]">
              No question bank selected. Generate or pick one from the list.
            </div>
          )}
        </div>
      </div>

      {/* Generate New Bank Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#E5E8EB] text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <h3 className="text-sm font-bold text-[#1F2328]">
                Generate Question Bank Specification
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded-lg text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateBankSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Question Bank Title</label>
                <input
                  type="text"
                  value={newBankTitle}
                  onChange={(e) => setNewBankTitle(e.target.value)}
                  placeholder="e.g. Concurrency Invariants & Deadlock Avoidance"
                  className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] placeholder:text-[#656D76] focus:bg-white focus:ring-2 focus:ring-[#183059]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1F2328] mb-1">Target Topic</label>
                  <select
                    value={newBankTopic}
                    onChange={(e) => setNewBankTopic(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] focus:bg-white focus:ring-2 focus:ring-[#183059]"
                  >
                    <option value="Thread Synchronization & Mutexes">
                      Thread Synchronization & Mutexes
                    </option>
                    <option value="Deadlocks & Banker's Algorithm">
                      Deadlocks & Banker's Algorithm
                    </option>
                    <option value="Virtual Memory & Address Translation">
                      Virtual Memory & Address Translation
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1F2328] mb-1">Number of Questions</label>
                  <select
                    value={newBankCount}
                    onChange={(e) => setNewBankCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] focus:bg-white focus:ring-2 focus:ring-[#183059]"
                  >
                    <option value={2}>2 Questions (Quick Review)</option>
                    <option value={5}>5 Questions (Standard Practice)</option>
                    <option value={10}>10 Questions (Comprehensive Bank)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-[11px] text-[#183059] space-y-1">
                <span className="font-bold">Automated Grounding Constraint:</span>
                <p className="text-[#24292F] leading-relaxed">
                  Questions will strictly reference certified materials (Lecture 4, Lecture 5, and Textbook Chapter 6). All outputs require verified explanations and claim-level citations.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2F5]">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSynthesizing}
                  className="px-5 py-2 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSynthesizing ? 'Synthesizing...' : 'Generate Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#E5E8EB] text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <h3 className="text-sm font-bold text-[#1F2328]">Edit Question Specification</h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Question Stem</label>
                <textarea
                  rows={3}
                  value={editingQuestion.question.stem}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, stem: e.target.value }
                    })
                  }
                  className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] focus:bg-white focus:ring-2 focus:ring-[#183059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1F2328] mb-1">Pedagogical Explanation</label>
                <textarea
                  rows={3}
                  value={editingQuestion.question.explanation}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, explanation: e.target.value }
                    })
                  }
                  className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] focus:bg-white focus:ring-2 focus:ring-[#183059]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2F5]">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const bank = courseBanks.find((b) => b.id === editingQuestion.bankId);
                  if (bank) {
                    const updatedQuestions = bank.questions.map((q) =>
                      q.id === editingQuestion.question.id ? editingQuestion.question : q
                    );
                    updateQuestionBank(bank.id, { questions: updatedQuestions });
                  }
                  setEditingQuestion(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold transition-colors shadow-xs"
              >
                Save Edits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#E5E8EB] text-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183059] font-bold text-[10px] border border-blue-200">
                Student View Preview (Formative)
              </span>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1 rounded-lg text-[#656D76] hover:text-[#1F2328] hover:bg-[#F8F9FC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-[#1F2328] text-sm">{previewQuestion.stem}</h3>
              {previewQuestion.options?.map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className="p-3.5 rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] hover:bg-white transition-colors flex items-center gap-2.5 text-[#24292F]"
                >
                  <span className="w-5 h-5 rounded-full border border-[#E5E8EB] bg-white flex items-center justify-center text-[10px] text-[#183059] font-bold">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#E5E8EB] hover:bg-[#F8F9FC] text-[#24292F] font-bold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
