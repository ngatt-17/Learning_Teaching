import React, { useState } from 'react';
import { Clock, Download, Calendar, Sparkles, Brain, PlayCircle } from 'lucide-react';
import type { Course } from './CourseCard';
import type { SubTab } from './CourseDetailView';
import { CourseHomeTab } from './CourseHomeTab';
import { QuizPlayerModal } from './QuizPlayerModal';

interface CourseContentTabsProps {
  course: Course;
  activeSubTab: SubTab;
  onOpenExamQuiz?: (config: {
    title: string;
    displayMode?: 'one-by-one' | 'all';
    timeLimitMinutes?: number;
    hasTimeLimit?: boolean;
  }) => void;
}

export const CourseContentTabs: React.FC<CourseContentTabsProps> = ({
  course,
  activeSubTab,
  onOpenExamQuiz,
}) => {
  const [activeQuizModal, setActiveQuizModal] = useState<string | null>(null);

  return (
    <main className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-xs overflow-y-auto">
      {activeQuizModal && (
        <QuizPlayerModal
          quizTitle={activeQuizModal}
          onClose={() => setActiveQuizModal(null)}
        />
      )}
      {activeSubTab === 'Home' && (
        <CourseHomeTab
          course={course}
          onOpenQuiz={(title) =>
            onOpenExamQuiz
              ? onOpenExamQuiz({
                  title: title === 'Quiz 02' ? 'Bài tập 8: Kiểm tra kiến thức E-Commerce & AI' : title,
                  displayMode: 'one-by-one',
                  timeLimitMinutes: 15,
                  hasTimeLimit: true,
                })
              : setActiveQuizModal(title)
          }
        />
      )}
      {activeSubTab === 'Assignments' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold border-b pb-3">Assignments</h2>
          <div className="p-4 border rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Assignment 1</h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Calendar size={13} /> Due Oct 10</p>
            </div>
            <span className="px-2.5 py-1 text-xs bg-amber-100 text-amber-800 rounded-full flex items-center gap-1"><Clock size={12} /> Pending</span>
          </div>
        </div>
      )}
      {activeSubTab === 'Quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-bold text-slate-800">Danh sách Quizzes môn học</h2>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">3 Bài Trắc nghiệm sẵn có</span>
          </div>

          {/* Quiz Item 1 (Canvas LMS Exam Interface matching user screenshot) */}
          <div className="p-5 border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl flex items-center justify-between transition-all shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#1E3A6E] text-white rounded-md uppercase">LMS Standard Exam</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">15 Phút • 5 Câu hỏi</span>
                <h4 className="font-extrabold text-slate-900 text-base">Bài tập 8: Kiểm tra kiến thức E-Commerce & AI</h4>
              </div>
              <p className="text-xs text-slate-600">
                Gồm các câu hỏi trắc nghiệm độ phân giải hiển thị, sàn TMĐT, tác tử AI PEAS, phân cụm máy học và đạo đức LLM.
              </p>
            </div>
            <button
              onClick={() =>
                onOpenExamQuiz
                  ? onOpenExamQuiz({
                      title: 'Bài tập 8: Kiểm tra kiến thức E-Commerce & AI',
                      displayMode: 'one-by-one',
                      timeLimitMinutes: 15,
                      hasTimeLimit: true,
                    })
                  : setActiveQuizModal('Bài tập 8: Kiểm tra kiến thức E-Commerce & AI')
              }
              className="px-5 py-2.5 text-xs font-black text-white bg-[#1E3A6E] hover:bg-[#14274E] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <PlayCircle size={16} />
              <span>Vào Làm Quizz</span>
            </button>
          </div>

          <div className="p-4 border rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Quiz 01: Machine Learning Foundations</h4>
              <p className="text-xs text-slate-500">5 Questions • 15 Mins • Chế độ hiện toàn bộ câu</p>
            </div>
            <button
              onClick={() =>
                onOpenExamQuiz
                  ? onOpenExamQuiz({
                      title: 'Quiz 01: Machine Learning Foundations',
                      displayMode: 'all',
                      timeLimitMinutes: 15,
                      hasTimeLimit: true,
                    })
                  : setActiveQuizModal('Quiz 01: Machine Learning Foundations')
              }
              className="px-4 py-1.5 text-xs text-white bg-[#1E3A6E] hover:bg-blue-900 rounded-lg cursor-pointer font-semibold"
            >
              Start
            </button>
          </div>

          <div className="p-4 border rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Quiz 03: Decision Trees & Scenario Analysis</h4>
              <p className="text-xs text-slate-500">5 Questions • Không giới hạn thời gian</p>
            </div>
            <button
              onClick={() =>
                onOpenExamQuiz
                  ? onOpenExamQuiz({
                      title: 'Quiz 03: Decision Trees & Scenario Analysis',
                      displayMode: 'one-by-one',
                      hasTimeLimit: false,
                    })
                  : setActiveQuizModal('Quiz 03: Decision Trees & Scenario Analysis')
              }
              className="px-4 py-1.5 text-xs text-white bg-[#1E3A6E] hover:bg-blue-900 rounded-lg cursor-pointer font-semibold"
            >
              Start
            </button>
          </div>
        </div>
      )}
      {activeSubTab === 'Active Learning' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-3">
            <Sparkles className="text-amber-500" size={20} />
            <h2 className="text-xl font-bold">Active Learning Space</h2>
          </div>
          <div className="p-4 border bg-indigo-50/50 rounded-xl space-y-2">
            <h3 className="font-bold text-[#1E3A6E] flex items-center gap-2"><Brain size={18} /> Flashcards</h3>
            <p className="text-xs text-slate-600">Daily 3-min AI recall exercises.</p>
            <button className="px-3 py-1.5 bg-[#1E3A6E] text-white text-xs rounded-lg cursor-pointer">Launch</button>
          </div>
        </div>
      )}
      {activeSubTab === 'Files' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold border-b pb-3">Course Files</h2>
          <div className="p-3 border rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium">Syllabus.pdf</span>
            <button className="p-1.5 text-slate-500 cursor-pointer"><Download size={18} /></button>
          </div>
        </div>
      )}
      {activeSubTab === 'Feedback' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold border-b pb-3">Feedback</h2>
          <textarea rows={3} placeholder="Feedback..." className="w-full text-sm p-3 border rounded-lg focus:outline-none focus:border-[#1E3A6E]" />
          <button className="px-4 py-2 bg-[#1E3A6E] text-white text-xs rounded-lg cursor-pointer">Submit</button>
        </div>
      )}
    </main>
  );
};

