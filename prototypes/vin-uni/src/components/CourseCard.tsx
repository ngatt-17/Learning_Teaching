import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface Course {
  id: number;
  code: string;
  name: string;
  department: string;
  progress: number;
  patternType: 'waves' | 'grid' | 'abstract' | 'stripes';
}

interface CourseCardProps {
  course: Course;
  onSelect?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  // SVG background patterns for course cover header
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
      onClick={() => onSelect?.(course)}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
    >
      {/* Course Banner */}
      <div className="h-44 w-full relative overflow-hidden">
        {renderBannerPattern()}
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
              onClick={(e) => { e.stopPropagation(); }}
              className="text-slate-700 hover:text-slate-900 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Course options"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <p className="text-sm text-slate-500 mt-1.5 line-clamp-1">{course.department}</p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-6">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            {course.progress}% complete
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#1E3A6E] h-full rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

