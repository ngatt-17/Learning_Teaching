import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Paperclip, Rocket } from 'lucide-react';
import type { Course } from './CourseCard';
import { PdfViewerModal, type ViewerItem, type ViewerModule } from './PdfViewerModal';

interface CourseHomeTabProps {
  course: Course;
  onOpenQuiz?: (quizTitle: string) => void;
}

export const CourseHomeTab: React.FC<CourseHomeTabProps> = ({ course, onOpenQuiz }) => {
  const [selectedViewerItem, setSelectedViewerItem] = useState<{
    item: ViewerItem;
    module: ViewerModule;
  } | null>(null);

  const modules: ViewerModule[] = [
    {
      id: 'intro',
      title: 'Giới thiệu chung - Course Introduction & Syllabus',
      items: [
        { id: 'i1', type: 'file', title: 'Course_Syllabus_2026.pdf', category: 'document' },
        { id: 'i2', type: 'file', title: 'Grading_Policy_and_Schedule.pdf', category: 'document' },
      ],
    },
    {
      id: 'week1',
      title: 'Week 01 - Overview & Foundations',
      items: [
        { id: 'w1-1', type: 'file', title: 'Lecture 0_Course Introduction.pdf', category: 'slide' },
        { id: 'w1-2', type: 'file', title: 'Lecture 1_Introduction to ML.pdf', category: 'slide' },
      ],
    },
    {
      id: 'week2',
      title: 'Week 02 - Fundamental Concepts & Models',
      items: [
        { id: 'w2-1', type: 'file', title: 'Lecture 2_General Concepts for ML.pdf', category: 'slide' },
        { id: 'w2-2', type: 'quiz', title: 'Quiz 02', subtitle: '3 pts', category: 'quiz' },
      ],
    },
    {
      id: 'week3',
      title: 'Week 03 - Regression Analysis & Evaluation',
      items: [
        { id: 'w3-1', type: 'file', title: 'HW03.pdf', category: 'document' },
        { id: 'w3-2', type: 'file', title: 'Lecture 03_Linear Regression.pdf', category: 'slide' },
        { id: 'w3-3', type: 'quiz', title: 'Quiz 03', subtitle: '2 pts', category: 'quiz' },
      ],
    },
  ];

  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({});

  const toggleModule = (id: string) => {
    setExpandedModuleIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleItemClick = (item: ViewerItem, mod: ViewerModule) => {
    if (item.type === 'quiz' && onOpenQuiz) {
      onOpenQuiz(item.title);
      return;
    }
    setSelectedViewerItem({ item, module: mod });
  };

  return (
    <div className="space-y-4">
      {selectedViewerItem && (
        <PdfViewerModal
          initialItem={selectedViewerItem.item}
          initialModule={selectedViewerItem.module}
          allModules={modules}
          onClose={() => setSelectedViewerItem(null)}
        />
      )}

      <div className="border-b border-slate-200 pb-3 mb-4">
        <h2 className="text-xl font-bold text-slate-800">{course.name}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{course.department} • Code: {course.code}</p>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => {
          const isExpanded = !!expandedModuleIds[mod.id];
          return (
            <div key={mod.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-slate-100/90 hover:bg-slate-200/70 text-slate-800 text-sm font-semibold transition-colors text-left cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown size={18} className="text-slate-600 shrink-0" />
                ) : (
                  <ChevronRight size={18} className="text-slate-600 shrink-0" />
                )}
                <span>{mod.title}</span>
              </button>

              {isExpanded && (
                <div className="divide-y divide-slate-100 bg-white">
                  {mod.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item, mod)}
                      className="flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50 border-l-4 border-emerald-600 transition-colors cursor-pointer"
                    >
                      {item.type === 'file' ? (
                        <Paperclip size={18} className="text-slate-500 shrink-0" />
                      ) : (
                        <Rocket size={18} className="text-slate-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
