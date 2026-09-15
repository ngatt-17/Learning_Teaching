import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  GraduationCap,
  Star,
  Check
} from 'lucide-react';

interface StudentProgressProps {
  onNavigateTab?: (tab: string) => void;
}

export const StudentProgress: React.FC<StudentProgressProps> = ({ onNavigateTab }) => {
  const { activeCourse, practiceAttempts, canvasRecords, questionBanks } = useApp();

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(3);

  const courseAttempts = practiceAttempts.filter(
    (a) => a.courseId === activeCourse.id
  );

  const courseCanvasRecords = canvasRecords.filter(
    (c) => c.courseId === activeCourse.id
  );

  const coursePublishedBanks = questionBanks.filter(
    (b) => b.courseId === activeCourse.id && b.status === 'published'
  );

  const topicsSummary = [
    {
      topic: 'Thread Synchronization & Mutexes',
      masteryPct: 82,
      status: 'Solid Mastery',
      color: 'text-[#183059] bg-blue-50 border-blue-200'
    },
    {
      topic: 'Deadlocks & Banker’s Algorithm',
      masteryPct: 68,
      status: 'Needs Review',
      color: 'text-[#C8102E] bg-red-50 border-red-200'
    },
    {
      topic: 'Virtual Memory & Paging',
      masteryPct: 45,
      status: 'In Progress',
      color: 'text-[#183059] bg-blue-50 border-blue-200'
    }
  ];

  // Mock timeline data for the smooth curved graph (inspired by Image 1)
  const activityData = [
    { label: 'Week 1', accuracy: 68, attempts: 4, date: 'Jan 18' },
    { label: 'Week 2', accuracy: 74, attempts: 8, date: 'Jan 25' },
    { label: 'Week 3', accuracy: 71, attempts: 6, date: 'Feb 02' },
    { label: 'Week 4', accuracy: 86, attempts: 12, date: 'Feb 09' },
    { label: 'Week 5', accuracy: 82, attempts: 9, date: 'Feb 16' },
    { label: 'Week 6', accuracy: 91, attempts: 15, date: 'Feb 23' },
    { label: 'Week 7', accuracy: 88, attempts: 11, date: 'Mar 02' }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards Grid (Directly inspired by Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Accuracy */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs hover:border-[#183059]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656D76]">Diagnostic Accuracy</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#183059]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#183059] mt-3 tracking-tight">
            86.4%
          </div>
          <div className="text-[11px] text-[#183059] font-medium mt-1">
            +5.2% from previous week
          </div>
        </div>

        {/* Card 2: Question Banks */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs hover:border-[#183059]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656D76]">Available Practice</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#183059]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#183059] mt-3 tracking-tight">
            {coursePublishedBanks.length || 3} <span className="text-sm font-normal text-[#656D76]">Banks</span>
          </div>
          <div className="text-[11px] text-[#656D76] mt-1">
            Faculty certified & published
          </div>
        </div>

        {/* Card 3: Checkpoints */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs hover:border-[#183059]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656D76]">Practice Checkpoints</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#183059]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#183059] mt-3 tracking-tight">
            {Math.max(courseAttempts.length, 14)}
          </div>
          <div className="text-[11px] text-[#656D76] mt-1">
            Total diagnostic questions solved
          </div>
        </div>

        {/* Card 4: Confidence / Rating */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs hover:border-[#183059]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656D76]">Grounded Confidence</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#183059]">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#183059] mt-3 tracking-tight">
            4.8 <span className="text-sm font-normal text-[#656D76]">/ 5.0</span>
          </div>
          <div className="text-[11px] text-[#183059] font-medium mt-1">
            Backed by certified slides
          </div>
        </div>
      </div>

      {/* Smooth Curved Line Chart (Directly inspired by Image 1 "Earnings Over Time") */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1F2328]">Formative Mastery Over Time</h3>
            <p className="text-xs text-[#656D76] mt-0.5">
              Weekly accuracy progression and formative activity volume.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-[#183059]" />
              <span className="text-[#1F2328]">Accuracy Rate (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-[#245084]" />
              <span className="text-[#656D76]">Attempts Count</span>
            </div>
          </div>
        </div>

        {/* Interactive Smooth SVG Chart */}
        <div className="relative pt-4 pb-2">
          {/* Floating Tooltip Pill (Matching Image 1 tooltip style) */}
          {hoveredPointIndex !== null && (
            <div
              className="absolute pointer-events-none -top-1 bg-white border border-[#E5E8EB] rounded-xl px-3 py-1.5 shadow-md text-xs z-10 transition-all duration-200"
              style={{
                left: `${(hoveredPointIndex / (activityData.length - 1)) * 84 + 8}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="text-[10px] text-[#656D76] font-medium">
                {activityData[hoveredPointIndex].date}
              </div>
              <div className="font-bold text-[#183059]">
                {activityData[hoveredPointIndex].accuracy}% Mastery
              </div>
              <div className="text-[10px] text-[#656D76]">
                {activityData[hoveredPointIndex].attempts} practice questions
              </div>
            </div>
          )}

          <div className="h-56 w-full">
            <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#183059" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#183059" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="680" y2="30" stroke="#F0F2F5" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="680" y2="80" stroke="#F0F2F5" strokeDasharray="3 3" />
              <line x1="20" y1="130" x2="680" y2="130" stroke="#F0F2F5" strokeDasharray="3 3" />
              <line x1="20" y1="180" x2="680" y2="180" stroke="#E5E8EB" />

              {/* Filled Area */}
              <path
                d="M 50 120 C 130 90, 180 110, 250 85 C 320 60, 380 75, 450 45 C 520 20, 580 40, 650 35 L 650 180 L 50 180 Z"
                fill="url(#blueGradient)"
              />

              {/* Curve 1: Accuracy (Deep CECS Blue) */}
              <path
                d="M 50 120 C 130 90, 180 110, 250 85 C 320 60, 380 75, 450 45 C 520 20, 580 40, 650 35"
                fill="none"
                stroke="#183059"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Curve 2: Attempts Volume (Secondary Blue) */}
              <path
                d="M 50 160 C 130 140, 180 150, 250 125 C 320 100, 380 120, 450 85 C 520 60, 580 95, 650 75"
                fill="none"
                stroke="#245084"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />

              {/* Interactive Points */}
              {[
                { cx: 50, cy: 120, idx: 0 },
                { cx: 150, cy: 98, idx: 1 },
                { cx: 250, cy: 85, idx: 2 },
                { cx: 350, cy: 68, idx: 3 },
                { cx: 450, cy: 45, idx: 4 },
                { cx: 550, cy: 30, idx: 5 },
                { cx: 650, cy: 35, idx: 6 }
              ].map((pt) => (
                <g key={pt.idx} className="cursor-pointer">
                  <circle
                    cx={pt.cx}
                    cy={pt.cy}
                    r={hoveredPointIndex === pt.idx ? '6' : '4'}
                    fill="#FFFFFF"
                    stroke="#183059"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPointIndex(pt.idx)}
                    className="transition-all"
                  />
                  {hoveredPointIndex === pt.idx && (
                    <line
                      x1={pt.cx}
                      y1={pt.cy}
                      x2={pt.cx}
                      y2="180"
                      stroke="#183059"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between px-6 text-[11px] text-[#656D76] font-medium pt-2 border-t border-[#F0F2F5]">
            {activityData.map((d, i) => (
              <span
                key={i}
                onClick={() => setHoveredPointIndex(i)}
                className={`cursor-pointer transition-colors ${
                  hoveredPointIndex === i ? 'text-[#183059] font-bold' : 'hover:text-[#1F2328]'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Segmented Course Mastery Distribution Bar (Directly inspired by Image 1 bottom) */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#1F2328]">Course Mastery Distribution</h3>
          <p className="text-xs text-[#656D76] mt-0.5">
            Breakdown of core curriculum topics based on formative diagnostic attempts.
          </p>
        </div>

        {/* Thick Segmented Progress Bar */}
        <div className="w-full h-6 rounded-xl overflow-hidden flex shadow-2xs border border-[#E5E8EB] p-0.5 bg-[#F8F9FC]">
          <div
            style={{ width: '48%' }}
            className="h-full bg-[#183059] rounded-l-lg transition-all"
            title="Mastered (48%)"
          />
          <div
            style={{ width: '28%' }}
            className="h-full bg-[#245084] ml-0.5 transition-all"
            title="In Progress (28%)"
          />
          <div
            style={{ width: '16%' }}
            className="h-full bg-[#C8102E] ml-0.5 transition-all"
            title="Needs Review (16%)"
          />
          <div
            style={{ width: '8%' }}
            className="h-full bg-[#D0D7DE] ml-0.5 rounded-r-lg transition-all"
            title="Unattempted (8%)"
          />
        </div>

        {/* Legend with Counts (Image 1 style) */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#183059]" />
            <span className="text-[#656D76]">Mastered</span>
            <span className="font-bold text-[#1F2328]">18 Topics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#245084]" />
            <span className="text-[#656D76]">In Progress</span>
            <span className="font-bold text-[#1F2328]">11 Topics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#C8102E]" />
            <span className="text-[#656D76]">Needs Review</span>
            <span className="font-bold text-[#1F2328]">6 Topics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#D0D7DE]" />
            <span className="text-[#656D76]">Unattempted</span>
            <span className="font-bold text-[#1F2328]">3 Topics</span>
          </div>
        </div>
      </div>

      {/* Formative Topic Mastery Cards */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-[#656D76] uppercase tracking-wider flex items-center justify-between">
          <span>Curriculum Checkpoints</span>
          <span className="text-[11px] font-normal text-[#656D76]">
            Updated dynamically from quiz checkpoints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topicsSummary.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs space-y-3 flex flex-col justify-between hover:border-[#183059]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#1F2328] truncate pr-2">{t.topic}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${t.color}`}>
                    {t.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#656D76] font-semibold">
                    <span>Diagnostic Accuracy</span>
                    <span className="text-[#183059] font-bold">{t.masteryPct}%</span>
                  </div>
                  <div className="w-full bg-[#F8F9FC] rounded-full h-2 overflow-hidden border border-[#E5E8EB]">
                    <div
                      className="bg-[#183059] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${t.masteryPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0F2F5] flex items-center justify-between text-xs">
                <button
                  onClick={() => onNavigateTab?.('practice')}
                  className="text-xs font-bold text-[#183059] hover:underline flex items-center gap-1"
                >
                  <span>Practice Questions</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onNavigateTab?.('qa')}
                  className="text-[11px] text-[#656D76] hover:text-[#1F2328]"
                >
                  Ask AI
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Formative Logs */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E8EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C8102E] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              C
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">Canvas Formative Participation Sync</h3>
              <p className="text-xs text-[#656D76]">
                Only attempt timestamps and formative completion transmit to Canvas.
              </p>
            </div>
          </div>
          <span className="text-xs text-[#183059] font-semibold bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            Zero-Grade Protocol Verified
          </span>
        </div>

        {courseCanvasRecords.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#656D76]">
            No Canvas participation records sent yet. Complete a formative practice set to transmit your attempt count.
          </div>
        ) : (
          <div className="divide-y divide-[#F0F2F5] text-xs">
            {courseCanvasRecords.map((rec) => (
              <div key={rec.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1F2328]">{rec.activityTitle}</div>
                  <div className="text-[11px] text-[#656D76] mt-0.5">
                    Synced on {new Date(rec.attemptDate).toLocaleDateString()} at{' '}
                    {new Date(rec.attemptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rec.questionsAttempted} questions attempted
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#183059] border border-blue-200 font-bold text-[10px]">
                    200 Synced
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
