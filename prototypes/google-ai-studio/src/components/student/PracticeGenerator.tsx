import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Send,
  Globe,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { QuizQuestion, StudentPracticeAttempt } from '../../types';
import { CanvasExportModal } from '../common/CanvasExportModal';

export interface PracticeGeneratorProps {
  onNavigateTab?: (tab: string) => void;
}

export const PracticeGenerator: React.FC<PracticeGeneratorProps> = ({ onNavigateTab }) => {
  const {
    activeCourse,
    currentUser,
    questionBanks,
    materials,
    personalMaterials,
    recordPracticeAttempt,
    setActiveCitation,
    practiceAttempts
  } = useApp();

  // Mode: 'configure' | 'active_session' | 'summary'
  const [sessionMode, setSessionMode] = useState<'configure' | 'active_session' | 'summary'>('configure');

  // Configuration options
  const [selectedTopic, setSelectedTopic] = useState('Thread Synchronization & Mutexes');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [sourceScope, setSourceScope] = useState<'course_only' | 'course_and_personal' | 'course_and_web'>('course_only');
  const [isGenerating, setIsGenerating] = useState(false);

  // Active quiz session state
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Canvas Modal
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);

  // Available published banks
  const publishedBanks = questionBanks.filter(
    (b) => b.courseId === activeCourse.id && b.status === 'published'
  );

  const handleStartGeneratedPractice = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 800));

    const pool = questionBanks
      .filter((b) => b.courseId === activeCourse.id)
      .flatMap((b) => b.questions);

    const questionsToUse = pool.slice(0, questionCount);
    setActiveQuestions(questionsToUse);
    setUserAnswers({});
    setSubmittedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeSpent(0);
    setIsGenerating(false);
    setSessionMode('active_session');
  };

  const handleStartPublishedBank = (bankId: string) => {
    const bank = questionBanks.find((b) => b.id === bankId);
    if (!bank) return;
    setActiveQuestions(bank.questions);
    setUserAnswers({});
    setSubmittedQuestions({});
    setCurrentQuestionIndex(0);
    setTimeSpent(0);
    setSessionMode('active_session');
  };

  const handleSelectOption = (questionId: string, optionIndex: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleToggleMultiSelect = (questionId: string, optionIndex: string) => {
    const current = (userAnswers[questionId] as string[]) || [];
    const next = current.includes(optionIndex)
      ? current.filter((i) => i !== optionIndex)
      : [...current, optionIndex];
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: next
    }));
  };

  const handleSubmitQuestion = (questionId: string) => {
    setSubmittedQuestions((prev) => ({
      ...prev,
      [questionId]: true
    }));
  };

  const currentQ = activeQuestions[currentQuestionIndex];

  const isCurrentCorrect = () => {
    if (!currentQ) return false;
    const ans = userAnswers[currentQ.id];
    if (Array.isArray(currentQ.correctAnswer)) {
      if (!Array.isArray(ans)) return false;
      return (
        ans.length === currentQ.correctAnswer.length &&
        ans.every((a) => currentQ.correctAnswer.includes(a))
      );
    }
    return ans === currentQ.correctAnswer;
  };

  const handleFinishQuiz = () => {
    let correct = 0;
    const misconceptions: string[] = [];

    activeQuestions.forEach((q) => {
      const ans = userAnswers[q.id];
      const isOk = Array.isArray(q.correctAnswer)
        ? Array.isArray(ans) &&
          ans.length === q.correctAnswer.length &&
          ans.every((a) => q.correctAnswer.includes(a))
        : ans === q.correctAnswer;

      if (isOk) {
        correct++;
      } else {
        if (q.stem.includes('counter++')) {
          misconceptions.push('Assuming compound operators like counter++ are atomic');
        } else if (q.stem.includes('semaphore')) {
          misconceptions.push('Confusing Mutex Locks with Binary Semaphores');
        } else {
          misconceptions.push(`Review recommended on: ${q.topic}`);
        }
      }
    });

    const pct = Math.round((correct / Math.max(1, activeQuestions.length)) * 100);

    recordPracticeAttempt({
      studentId: currentUser.id,
      courseId: activeCourse.id,
      activityTitle: `Personal Practice: ${selectedTopic}`,
      bankTitle: `Personal Practice: ${selectedTopic}`,
      totalQuestions: activeQuestions.length,
      correctCount: correct,
      score: correct,
      percentage: pct,
      topic: selectedTopic,
      misconceptionsEncountered: misconceptions,
      misconceptionsIdentified: misconceptions,
      canvasExportStatus: 'not_exported',
      answers: activeQuestions.map((q) => ({
        questionId: q.id,
        studentAnswer: userAnswers[q.id] || '',
        isCorrect: Array.isArray(q.correctAnswer)
          ? Array.isArray(userAnswers[q.id]) &&
            (userAnswers[q.id] as string[]).length === q.correctAnswer.length &&
            (userAnswers[q.id] as string[]).every((a) => q.correctAnswer.includes(a))
          : userAnswers[q.id] === q.correctAnswer,
        timeSpentSeconds: 35
      }))
    });

    setSessionMode('summary');
  };

  const handleRetryIncorrect = () => {
    const incorrectOnly = activeQuestions.filter((q) => {
      const ans = userAnswers[q.id];
      const isOk = Array.isArray(q.correctAnswer)
        ? Array.isArray(ans) &&
          ans.length === q.correctAnswer.length &&
          ans.every((a) => q.correctAnswer.includes(a))
        : ans === q.correctAnswer;
      return !isOk;
    });

    if (incorrectOnly.length > 0) {
      setActiveQuestions(incorrectOnly);
      setUserAnswers({});
      setSubmittedQuestions({});
      setCurrentQuestionIndex(0);
      setSessionMode('active_session');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Configure Practice Mode */}
      {sessionMode === 'configure' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#183059] border border-blue-200">
                  {activeCourse.code} Course Practice
                </span>
                <span className="text-[#656D76] font-medium">Safe Diagnostic Environment</span>
                <span className="text-[#E5E8EB]">•</span>
                <span className="text-xs font-semibold text-[#1F2328]">{activeCourse.currentTopic}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2328] tracking-tight">
                Course Practice Banks & Formative Quizzes
              </h1>
              <p className="text-xs text-[#656D76] mt-1">
                Faculty-curated question sets and on-demand diagnostic quizzes to test your intuition before exams.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="practice-header-nav-qa-btn"
                onClick={() => onNavigateTab?.('qa')}
                className="px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#183059] transition-colors shadow-2xs inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#183059]" />
                <span>Grounded Assistant</span>
              </button>

              <button
                id="practice-header-nav-progress-btn"
                onClick={() => onNavigateTab?.('progress')}
                className="px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-xs font-semibold text-[#183059] transition-colors shadow-2xs inline-flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-[#183059]" />
                <span>My Mastery</span>
              </button>
            </div>
          </div>

          {/* Quick Start from Instructor-Published Question Banks */}
          {publishedBanks.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#656D76] uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#183059]" />
                  <span>Faculty-Curated Practice Activities ({publishedBanks.length})</span>
                </div>
                <span className="text-[11px] font-normal text-[#656D76]">
                  Aligned with lecture checkpoints & midterm objectives
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedBanks.map((bank) => {
                  const pastAttempt = practiceAttempts?.find(
                    (h) => h.bankId === bank.id
                  );

                  return (
                    <div
                      key={bank.id}
                      className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs hover:border-[#183059]/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183059] border border-blue-200 font-bold text-[10px] uppercase">
                            Faculty Curated
                          </span>
                          <div className="flex items-center gap-2 text-[#656D76] text-[11px]">
                            <span>{bank.questions?.length || 0} questions</span>
                            {bank.averageScorePct && (
                              <>
                                <span>•</span>
                                <span>Class Avg: {bank.averageScorePct}%</span>
                              </>
                            )}
                          </div>
                        </div>

                        <h3 className="font-bold text-[#1F2328] text-sm sm:text-base mb-1.5">{bank.title}</h3>
                        <p className="text-xs text-[#656D76] line-clamp-2 leading-relaxed mb-3">
                          {bank.description}
                        </p>

                        <div className="text-[11px] text-[#656D76] flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-[#183059]" />
                          <span>Curated by {bank.createdBy || 'Course Faculty'}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-[#F0F2F5] flex items-center justify-between">
                        {pastAttempt ? (
                          <div className="text-[11px] text-[#183059] font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#183059]" />
                            <span>Score: {pastAttempt.score}/{pastAttempt.totalQuestions} ({pastAttempt.percentage}%)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#656D76]">Not yet attempted</span>
                        )}

                        <button
                          id={`start-published-bank-${bank.id}-btn`}
                          onClick={() => handleStartPublishedBank(bank.id)}
                          className="px-4 py-2 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          {pastAttempt ? 'Retake Practice' : 'Start Activity'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Practice Generator Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F0F2F5]">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2328]">Custom Formative Self-Quiz</h3>
                <p className="text-xs text-[#656D76]">
                  Generate diagnostic questions targeting your specific focus areas and certified materials.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Topic Selector */}
              <div>
                <label className="block font-bold text-[#1F2328] mb-1.5">Target Topic</label>
                <select
                  id="practice-topic-select"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E8EB] p-3 bg-white text-[#1F2328] font-medium focus:ring-2 focus:ring-[#183059]"
                >
                  <option value="Thread Synchronization & Mutexes">Thread Synchronization & Mutexes</option>
                  <option value="Deadlocks & Banker's Algorithm">Deadlocks & Banker's Algorithm</option>
                  <option value="Virtual Memory & Address Translation">Virtual Memory & Address Translation</option>
                  <option value="CPU Scheduling Algorithms">CPU Scheduling Algorithms</option>
                </select>
              </div>

              {/* Difficulty Selector */}
              <div>
                <label className="block font-bold text-[#1F2328] mb-1.5">Diagnostic Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      id={`difficulty-${lvl}-btn`}
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                        difficulty === lvl
                          ? 'bg-blue-50 border-[#183059] text-[#183059]'
                          : 'bg-white border-[#E5E8EB] text-[#656D76] hover:bg-[#F8F9FC]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block font-bold text-[#1F2328] mb-1.5">Question Count</label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      id={`question-count-${cnt}-btn`}
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        questionCount === cnt
                          ? 'bg-blue-50 border-[#183059] text-[#183059]'
                          : 'bg-white border-[#E5E8EB] text-[#656D76] hover:bg-[#F8F9FC]'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Scope */}
              <div>
                <label className="block font-bold text-[#1F2328] mb-1.5">Source Coverage</label>
                <select
                  id="practice-source-scope-select"
                  value={sourceScope}
                  onChange={(e) =>
                    setSourceScope(
                      e.target.value as 'course_only' | 'course_and_personal' | 'course_and_web'
                    )
                  }
                  className="w-full rounded-xl border border-[#E5E8EB] p-3 bg-white text-[#1F2328] font-medium focus:ring-2 focus:ring-[#183059]"
                >
                  <option value="course_only">Course-Approved Sources Only (Strict)</option>
                  <option value="course_and_personal">Course + My Personal Study Notes</option>
                  <option value="course_and_web">Course + Authoritative Web Sources</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0F2F5] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#656D76]">
                Targeting COMP2030 Week 5 objectives & past misconception signals.
              </span>
              <button
                id="generate-practice-session-btn"
                onClick={handleStartGeneratedPractice}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold text-xs transition-colors inline-flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Generating Quiz Set...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate & Start Practice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Practice Session Mode */}
      {sessionMode === 'active_session' && currentQ && (
        <div className="space-y-6">
          {/* Quiz Top Bar */}
          <div className="bg-white rounded-xl p-4 border border-[#D0D7DE] shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#183059]">
                Question {currentQuestionIndex + 1} of {activeQuestions.length}
              </span>
              <span className="text-[#D0D7DE]">•</span>
              <span className="capitalize px-2 py-0.5 rounded-md bg-[#F6F8FA] border border-[#D0D7DE] text-[#24292F] font-semibold">
                {currentQ.difficulty} Difficulty
              </span>
            </div>

            <button
              id="exit-practice-btn"
              onClick={() => setSessionMode('configure')}
              className="text-[#656D76] hover:text-[#1F2328] font-medium transition-colors"
            >
              Exit Practice
            </button>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl p-6 md:p-8 border border-[#D0D7DE] shadow-xs space-y-6">
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#183059]">
                {currentQ.topic}
              </div>
              <h2 className="text-base md:text-lg font-bold text-[#1F2328] leading-snug">
                {currentQ.stem}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQ.type === 'multiple_choice' &&
                currentQ.options?.map((opt, idx) => {
                  const idxStr = idx.toString();
                  const isSelected = userAnswers[currentQ.id] === idxStr;
                  const isSubmitted = submittedQuestions[currentQ.id];
                  const isCorrectChoice = currentQ.correctAnswer === idxStr;

                  let optionStyle =
                    'bg-white border-[#D0D7DE] text-[#1F2328] hover:border-[#183059] hover:bg-[#F6F8FA]';

                  if (isSubmitted) {
                    if (isCorrectChoice) {
                      optionStyle = 'bg-blue-50 border-blue-300 text-[#183059] font-semibold';
                    } else if (isSelected && !isCorrectChoice) {
                      optionStyle = 'bg-red-50 border-red-300 text-[#C8102E]';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-blue-50 border-[#183059] text-[#183059] font-semibold ring-1 ring-[#183059]';
                  }

                  return (
                    <button
                      key={idx}
                      id={`option-btn-${currentQ.id}-${idx}`}
                      onClick={() => !isSubmitted && handleSelectOption(currentQ.id, idxStr)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs leading-relaxed transition-all flex items-start gap-3 ${optionStyle}`}
                    >
                      <span className="w-5 h-5 rounded-md border border-current flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}

              {currentQ.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((tf) => {
                    const isSelected = userAnswers[currentQ.id] === tf;
                    const isSubmitted = submittedQuestions[currentQ.id];
                    const isCorrect = currentQ.correctAnswer === tf;

                    let btnStyle = 'bg-white border-[#D0D7DE] text-[#24292F] hover:bg-[#F6F8FA]';
                    if (isSubmitted) {
                      if (isCorrect) btnStyle = 'bg-blue-50 border-blue-300 text-[#183059] font-bold';
                      else if (isSelected && !isCorrect) btnStyle = 'bg-red-50 border-red-300 text-[#C8102E]';
                    } else if (isSelected) {
                      btnStyle = 'bg-blue-50 border-[#183059] text-[#183059] font-bold ring-1 ring-[#183059]';
                    }

                    return (
                      <button
                        key={tf}
                        id={`option-tf-${tf.toLowerCase()}-btn`}
                        onClick={() => !isSubmitted && handleSelectOption(currentQ.id, tf)}
                        disabled={isSubmitted}
                        className={`p-3.5 rounded-lg border text-xs font-bold transition-all text-center ${btnStyle}`}
                      >
                        {tf}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'multiple_select' &&
                currentQ.options?.map((opt, idx) => {
                  const idxStr = idx.toString();
                  const selectedArr = (userAnswers[currentQ.id] as string[]) || [];
                  const isSelected = selectedArr.includes(idxStr);
                  const isSubmitted = submittedQuestions[currentQ.id];
                  const correctArr = currentQ.correctAnswer as string[];
                  const isTarget = correctArr.includes(idxStr);

                  let style = 'bg-white border-[#D0D7DE] text-[#1F2328] hover:bg-[#F6F8FA]';
                  if (isSubmitted) {
                    if (isTarget) style = 'bg-blue-50 border-blue-300 text-[#183059] font-semibold';
                    else if (isSelected && !isTarget) style = 'bg-red-50 border-red-300 text-[#C8102E]';
                  } else if (isSelected) {
                    style = 'bg-blue-50 border-[#183059] text-[#183059] font-semibold ring-1 ring-[#183059]';
                  }

                  return (
                    <button
                      key={idx}
                      id={`option-ms-btn-${idx}`}
                      onClick={() => !isSubmitted && handleToggleMultiSelect(currentQ.id, idxStr)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs leading-relaxed transition-all flex items-start gap-3 ${style}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded text-[#183059] mt-0.5 pointer-events-none border-[#D0D7DE]"
                      />
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
            </div>

            {/* Explanation & Citations */}
            {submittedQuestions[currentQ.id] && (
              <div
                className={`p-4 rounded-lg text-xs space-y-2.5 border animate-in fade-in duration-200 ${
                  isCurrentCorrect()
                    ? 'bg-blue-50 border-blue-200 text-[#183059]'
                    : 'bg-red-50 border-red-200 text-[#C8102E]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCurrentCorrect() ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#183059]" />
                      <span className="text-[#183059]">Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-[#C8102E]" />
                      <span className="text-[#C8102E]">Incorrect — Diagnostic Review</span>
                    </>
                  )}
                </div>

                <p className="leading-relaxed text-[#24292F]">{currentQ.explanation}</p>

                {/* Supporting Source Citations */}
                {currentQ.citations && currentQ.citations.length > 0 && (
                  <div className="pt-2 border-t border-black/10 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#656D76] text-[11px]">Grounded in:</span>
                    {currentQ.citations.map((c) => (
                      <button
                        key={c.id}
                        id={`view-citation-${c.id}-btn`}
                        onClick={() => setActiveCitation(c)}
                        className="px-2.5 py-1 rounded-md bg-white border border-[#D0D7DE] text-[#183059] font-semibold hover:border-[#183059] transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#183059]" />
                        <span>
                          {c.title} ({c.location})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation & Submission Controls */}
            <div className="pt-4 border-t border-[#D0D7DE] flex items-center justify-between">
              <button
                id="prev-question-btn"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-md border border-[#D0D7DE] bg-white hover:bg-[#F6F8FA] text-xs font-semibold text-[#24292F] disabled:opacity-40"
              >
                Previous
              </button>

              {!submittedQuestions[currentQ.id] ? (
                <button
                  id="submit-answer-btn"
                  onClick={() => handleSubmitQuestion(currentQ.id)}
                  disabled={!userAnswers[currentQ.id]}
                  className="px-5 py-2 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-40"
                >
                  Check Answer
                </button>
              ) : currentQuestionIndex < activeQuestions.length - 1 ? (
                <button
                  id="next-question-btn"
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  Next Question
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="finish-practice-btn"
                  onClick={handleFinishQuiz}
                  className="px-5 py-2 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  Finish & Review Insights
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion & Summary Screen */}
      {sessionMode === 'summary' && (
        <div className="bg-white rounded-xl p-6 md:p-8 border border-[#D0D7DE] shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#183059] flex items-center justify-center mx-auto border border-blue-200">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F2328]">Formative Practice Complete</h2>
              <p className="text-xs text-[#656D76] mt-0.5">
                Activity: {selectedTopic} • {activeCourse.code}
              </p>
            </div>
          </div>

          {/* Formative Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-[#F6F8FA] border border-[#D0D7DE]">
              <div className="text-2xl font-bold text-[#1F2328]">
                {
                  activeQuestions.filter((q) => {
                    const ans = userAnswers[q.id];
                    return Array.isArray(q.correctAnswer)
                      ? Array.isArray(ans) &&
                          ans.length === q.correctAnswer.length &&
                          ans.every((a) => q.correctAnswer.includes(a))
                      : ans === q.correctAnswer;
                  }).length
                }{' '}
                / {activeQuestions.length}
              </div>
              <div className="text-[11px] font-semibold text-[#656D76] uppercase tracking-wider mt-0.5">
                Questions Mastered
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200">
              <div className="text-2xl font-bold text-[#183059]">Formative</div>
              <div className="text-[11px] font-semibold text-[#183059] uppercase tracking-wider mt-0.5">
                Practice Status
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200">
              <div className="text-2xl font-bold text-[#183059]">Course Grounded</div>
              <div className="text-[11px] font-semibold text-[#183059] uppercase tracking-wider mt-0.5">
                Source Integrity
              </div>
            </div>
          </div>

          {/* Canvas Export Callout */}
          <div className="p-4 rounded-lg bg-[#F6F8FA] border border-[#D0D7DE] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="font-bold text-xs text-[#1F2328] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[#C8102E] text-white flex items-center justify-center text-[10px] font-bold">
                  C
                </span>
                Canvas Participation Log Available
              </div>
              <p className="text-[11px] text-[#656D76] max-w-lg leading-relaxed">
                Log your formative completion to Canvas to show course engagement. Transmits only your attempt count and completion timestamp; zero grades or chat contents are shared.
              </p>
            </div>

            <button
              id="open-canvas-export-modal-btn"
              onClick={() => setIsCanvasModalOpen(true)}
              className="px-4 py-2 rounded-md bg-[#C8102E] hover:bg-[#A40E26] text-white text-xs font-bold transition-colors shrink-0 shadow-2xs inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send to Canvas
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D0D7DE]">
            <button
              id="retry-incorrect-questions-btn"
              onClick={handleRetryIncorrect}
              className="px-4 py-2 rounded-md border border-[#D0D7DE] bg-white hover:bg-[#F6F8FA] text-[#24292F] text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Incorrect Questions
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="summary-nav-qa-btn"
                onClick={() => onNavigateTab?.('qa')}
                className="px-4 py-2 rounded-md border border-[#D0D7DE] bg-white hover:bg-[#F6F8FA] text-[#24292F] text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#183059]" />
                <span>Return to Study Assistant</span>
              </button>

              <button
                id="summary-nav-progress-btn"
                onClick={() => onNavigateTab?.('progress')}
                className="px-4 py-2 rounded-md border border-[#D0D7DE] bg-white hover:bg-[#F6F8FA] text-[#24292F] text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#183059]" />
                <span>View Mastery</span>
              </button>

              <button
                id="create-another-practice-btn"
                onClick={() => setSessionMode('configure')}
                className="px-4 py-2 rounded-md bg-[#183059] hover:bg-[#0E1F3B] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                Choose Another Practice Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Export Modal */}
      <CanvasExportModal
        isOpen={isCanvasModalOpen}
        onClose={() => setIsCanvasModalOpen(false)}
        activityTitle={`Formative Practice: ${selectedTopic}`}
        questionsAttempted={activeQuestions.length}
      />
    </div>
  );
};
