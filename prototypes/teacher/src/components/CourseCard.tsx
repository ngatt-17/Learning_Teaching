import React from 'react';
import { MoreVertical, Users, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export interface Course {
  id: number;
  code: string;
  name: string;
  department: string;
  patternType: 'waves' | 'grid' | 'abstract' | 'stripes';
  enrolledStudents: number;
  materialsCount: number;
  quizzesCount: number;
  pendingReviews?: number;
  status: 'Ready' | 'Review Needed' | 'Processing' | 'Archived';
}

interface CourseCardProps {
  course: Course;
  onSelectCourse?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelectCourse }) => {
  // SVG background patterns for course cover header (identical to vin-uni)
  const renderBannerPattern = () => {
    switch (course.patternType) {
      case 'waves':
        return (
          <svg className="w-full h-full object-cover" viewBox="0 0 400 200" preserveAspectRatio="none">
            <rect width="400" height="200" fill="#F8C053" />
            <path d="M0 40 Q 100 10 200 40 T 400 40 L 400 0 L 0 0 Z" fill="#EEAB28" opacity="0.5" />
            <path d="M0 90 Q 100 60 200 90 T 400 90 L 400 0 L 0 0 Z" fill="#EEAB28" opacity="0.4" />
            <path d="M0 140 Q 100 110 200 140 T 400 140 L 400 0 L 0 0 Z" fill="#EEAB28" opacity="0.3" />
            <path d="M0 180 Q 100 150 200 180 T 400 180 L 400 0 L 0 0 Z" fill="#E49B18" opacity="0.25" />
          </svg>
        );
      case 'grid':
        return (
          <svg className="w-full h-full object-cover" viewBox="0 0 400 200" preserveAspectRatio="none">
            <rect width="400" height="200" fill="#4B6B94" />
            <circle cx="100" cy="80" r="120" fill="#3B5A82" opacity="0.6" />
            <circle cx="320" cy="140" r="90" fill="#2E4A6F" opacity="0.7" />
          </svg>
        );
      case 'stripes':
        return (
          <svg className="w-full h-full object-cover" viewBox="0 0 400 200" preserveAspectRatio="none">
            <rect width="400" height="200" fill="#48956F" />
            <path d="M -50 0 L 200 200 L 250 200 L 0 0 Z" fill="#3A7E5D" opacity="0.5" />
            <path d="M 50 0 L 300 200 L 350 200 L 100 0 Z" fill="#3A7E5D" opacity="0.5" />
            <path d="M 150 0 L 400 200 L 450 200 L 200 0 Z" fill="#3A7E5D" opacity="0.5" />
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full object-cover" viewBox="0 0 400 200" preserveAspectRatio="none">
            <rect width="400" height="200" fill="#8C5296" />
            <circle cx="200" cy="100" r="140" fill="#784082" opacity="0.5" />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={() => onSelectCourse?.(course)}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:border-[#1E3A6E]/40"
    >
      {/* Course Banner */}
      <div className="h-40 w-full relative overflow-hidden">
        {renderBannerPattern()}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {course.status === 'Ready' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700/85 text-white backdrop-blur-xs shadow-xs">
              <CheckCircle2 size={12} />
              Ready for Students
            </span>
          )}
          {course.status === 'Review Needed' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-600/90 text-white backdrop-blur-xs shadow-xs">
              <AlertTriangle size={12} />
              {course.pendingReviews} Drafts Pending Review
            </span>
          )}
          {course.status === 'Processing' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600/90 text-white backdrop-blur-xs shadow-xs">
              <Clock size={12} className="animate-spin" />
              Processing Slides
            </span>
          )}
        </div>
      </div>

      {/* Course Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-[#1E3A6E] transition-colors"
              title={`${course.code} - ${course.name}`}
            >
              {course.code} - {course.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
              title="Course options"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{course.department}</p>

          {/* Teacher Course Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
            <div className="bg-slate-50 rounded-lg p-1.5" title="Enrolled Students">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px]">
                <Users size={12} />
                <span>Students</span>
              </div>
              <span className="font-bold text-xs text-slate-800">{course.enrolledStudents}</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-1.5" title="Approved Materials">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px]">
                <FileText size={12} />
                <span>Materials</span>
              </div>
              <span className="font-bold text-xs text-slate-800">{course.materialsCount} files</span>
            </div>

            <div className="bg-slate-50 rounded-lg p-1.5" title="Active Practice Quizzes">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px]">
                <CheckCircle2 size={12} />
                <span>Quizzes</span>
              </div>
              <span className="font-bold text-xs text-slate-800">{course.quizzesCount} sets</span>
            </div>
          </div>
        </div>

        {/* Enter Course Action Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#1E3A6E] group-hover:text-[#14274E]">
          <span>Xem chi tiết khóa học</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
