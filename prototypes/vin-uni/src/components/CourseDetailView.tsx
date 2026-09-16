import React, { useState } from 'react';
import { ArrowLeft, Home, FileText, HelpCircle, Brain, Folder, MessageSquare } from 'lucide-react';
import type { Course } from './CourseCard';
import { CourseContentTabs } from './CourseContentTabs';
import { StudentQuizExamView } from './StudentQuizExamView';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

export type SubTab = 'Home' | 'Assignments' | 'Quizzes' | 'Active Learning' | 'Files' | 'Feedback';

export const CourseDetailView: React.FC<CourseDetailProps> = ({ course, onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Home');
  const [activeExamQuiz, setActiveExamQuiz] = useState<{
    title: string;
    displayMode?: 'one-by-one' | 'all';
    timeLimitMinutes?: number;
    hasTimeLimit?: boolean;
  } | null>(null);

  if (activeExamQuiz) {
    return (
      <StudentQuizExamView
        quizTitle={activeExamQuiz.title}
        initialDisplayMode={activeExamQuiz.displayMode || 'one-by-one'}
        timeLimitMinutes={activeExamQuiz.timeLimitMinutes || 15}
        hasTimeLimit={activeExamQuiz.hasTimeLimit !== false}
        onBack={() => setActiveExamQuiz(null)}
      />
    );
  }

  const subNavs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'Home', label: 'Home', icon: <Home size={18} /> },
    { id: 'Assignments', label: 'Assignments', icon: <FileText size={18} /> },
    { id: 'Quizzes', label: 'Quizzes', icon: <HelpCircle size={18} /> },
    { id: 'Active Learning', label: 'Active Learning', icon: <Brain size={18} /> },
    { id: 'Files', label: 'Files', icon: <Folder size={18} /> },
    { id: 'Feedback', label: 'Feedback', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* HEADER: Nền trắng với đường viền xám nhạt */}
      <div className="bg-white text-slate-800 py-4 px-6 shrink-0 flex items-center justify-between border-b border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div>
            <span className="text-xs font-bold text-[#C8232C] uppercase tracking-wider">{course.code}</span>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">{course.name}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <aside className="w-full md:w-56 bg-white border border-slate-200 rounded-xl p-2 shrink-0 shadow-xs h-fit">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 mb-2">
            Course Menu
          </div>
          <nav className="space-y-1">
            {subNavs.map((item) => {
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-100 text-[#1E3A6E] font-semibold border-l-4 border-[#C8232C]'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-[#C8232C]' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <CourseContentTabs
          course={course}
          activeSubTab={activeSubTab}
          onOpenExamQuiz={(cfg) => setActiveExamQuiz(cfg)}
        />
      </div>
    </div>
  );
};

