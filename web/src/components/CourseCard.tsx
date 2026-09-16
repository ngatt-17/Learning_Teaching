import type { ReactNode } from 'react';
import type { Course } from '../lib/types';

// Banner patterns from the Experience pair's prototype, picked deterministically per course.
const PATTERNS = ['waves', 'grid', 'stripes', 'abstract'] as const;

function patternFor(code: string) {
  let hash = 0;
  for (const ch of code) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PATTERNS[hash % PATTERNS.length];
}

function Banner({ code }: { code: string }) {
  switch (patternFor(code)) {
    case 'waves':
      return (
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <rect width="400" height="200" fill="#F8C053" />
          <path d="M0 40 Q 100 10 200 40 T 400 40 L 400 0 L 0 0 Z" fill="#EEAB28" opacity="0.5" />
          <path d="M0 90 Q 100 60 200 90 T 400 90 L 400 0 L 0 0 Z" fill="#EEAB28" opacity="0.4" />
          <path d="M0 140 Q 100 110 200 140 T 400 140 L 400 0 L 0 0 Z" fill="#EEAB28" opacity="0.3" />
        </svg>
      );
    case 'grid':
      return (
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <rect width="400" height="200" fill="#4B6B94" />
          <circle cx="100" cy="80" r="120" fill="#3B5A82" opacity="0.6" />
          <circle cx="320" cy="140" r="90" fill="#2E4A6F" opacity="0.7" />
        </svg>
      );
    case 'stripes':
      return (
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <rect width="400" height="200" fill="#48956F" />
          <path d="M -50 0 L 200 200 L 250 200 L 0 0 Z" fill="#3A7E5D" opacity="0.5" />
          <path d="M 50 0 L 300 200 L 350 200 L 100 0 Z" fill="#3A7E5D" opacity="0.5" />
          <path d="M 150 0 L 400 200 L 450 200 L 200 0 Z" fill="#3A7E5D" opacity="0.5" />
        </svg>
      );
    default:
      return (
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <rect width="400" height="200" fill="#8C5296" />
          <circle cx="200" cy="100" r="140" fill="#784082" opacity="0.5" />
        </svg>
      );
  }
}

export function CourseCard({ course, onSelect, footer }: { course: Course; onSelect: () => void; footer?: ReactNode }) {
  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      role="button"
      tabIndex={0}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#1E3A6E]/30"
    >
      <div className="h-36 w-full overflow-hidden">
        <Banner code={course.code} />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-[#1E3A6E] transition-colors">
            {course.code} - {course.name}
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 line-clamp-1">
            {course.term}
            {course.instructor_name ? ` • ${course.instructor_name}` : ''}
          </p>
        </div>
        {footer}
      </div>
    </div>
  );
}
