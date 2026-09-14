import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Brain,
  MessageSquare,
  Sparkles,
  CheckCircle,
  FileCheck,
  Shield,
  HelpCircle,
  ArrowRight,
  Send
} from 'lucide-react';
import { MisconceptionInsight } from '../../types';

export const LearningInsights: React.FC = () => {
  const { activeCourse, misconceptions } = useApp();

  const [activeTab, setActiveTab] = useState<'cohort_misconceptions' | 'student_progress'>('cohort_misconceptions');
  const [selectedMisc, setSelectedMisc] = useState<MisconceptionInsight | null>(null);
  const [actionAnnouncement, setActionAnnouncement] = useState<string | null>(null);

  const courseMisconceptions = misconceptions.filter(
    (m) => m.courseId === activeCourse.id
  );

  // Simulated enrolled student cohort for authorized instructor view (PRD Section 7.7)
  const studentCohort = [
    {
      id: 'stu-1',
      name: 'Linh Nguyen',
      email: 'linh.nguyen@vinuni.edu.vn',
      practiceCount: 5,
      accuracyPct: 84,
      strugglingTopic: 'None (Excelling)',
      supportFlag: false
    },
    {
      id: 'stu-2',
      name: 'Minh Tran',
      email: 'minh.tran@vinuni.edu.vn',
      practiceCount: 3,
      accuracyPct: 62,
      strugglingTopic: 'Mutex vs Binary Semaphore',
      supportFlag: true
    },
    {
      id: 'stu-3',
      name: 'Hoang Pham',
      email: 'hoang.pham@vinuni.edu.vn',
      practiceCount: 4,
      accuracyPct: 70,
      strugglingTopic: 'Volatile Atomicity',
      supportFlag: true
    },
    {
      id: 'stu-4',
      name: 'Thu Doan',
      email: 'thu.doan@vinuni.edu.vn',
      practiceCount: 6,
      accuracyPct: 91,
      strugglingTopic: 'None',
      supportFlag: false
    },
    {
      id: 'stu-5',
      name: 'Duc Nguyen',
      email: 'duc.nguyen@vinuni.edu.vn',
      practiceCount: 1,
      accuracyPct: 40,
      strugglingTopic: 'Deadlock Prevention',
      supportFlag: true
    }
  ];

  const handleCreateAnnouncement = (misc: MisconceptionInsight) => {
    setActionAnnouncement(
      `📢 Announcement Draft created: "Common Concurrency Clarification: Why Mutex Locks are NOT Semaphores". Assigned to Week 5 Announcements queue.`
    );
    setTimeout(() => setActionAnnouncement(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-[#D0D7DE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-[#183059] border border-blue-200">
              {activeCourse.code} Learning Signals
            </span>
            <span className="text-[#656D76] font-medium">Evidence-Based Pedagogical Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-[#1F2328] tracking-tight">
            Cohort Misconceptions & Learning Insights
          </h1>
          <p className="text-xs text-[#656D76] mt-1 max-w-2xl">
            Synthesizes formative practice attempt patterns and student inquiries into actionable teaching insights. Individual private conversations remain strictly protected.
          </p>
        </div>

        {/* View Switcher: Cohort vs Student Level */}
        <div className="flex items-center gap-1 bg-[#F6F8FA] p-1 rounded-lg text-xs font-semibold border border-[#D0D7DE]">
          <button
            onClick={() => setActiveTab('cohort_misconceptions')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'cohort_misconceptions'
                ? 'bg-white text-[#1F2328] shadow-2xs font-bold'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Cohort Misconceptions
          </button>
          <button
            onClick={() => setActiveTab('student_progress')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'student_progress'
                ? 'bg-white text-[#1F2328] shadow-2xs font-bold'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Authorized Student Signals
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionAnnouncement && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#183059] flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[#183059] shrink-0" />
          <span className="font-semibold">{actionAnnouncement}</span>
        </div>
      )}

      {/* Cohort Misconceptions Tab */}
      {activeTab === 'cohort_misconceptions' && (
        <div className="space-y-5">
          {/* Cohort High-Level Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-[#D0D7DE] shadow-xs">
              <div className="text-xs text-[#656D76] font-medium">Active Student Cohort</div>
              <div className="text-2xl font-bold text-[#1F2328] mt-1">
                48 <span className="text-xs font-normal text-[#656D76]">/ 48 Enrolled</span>
              </div>
              <div className="text-[11px] text-[#183059] mt-1 font-semibold">86% formative practice engagement</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D0D7DE] shadow-xs">
              <div className="text-xs text-[#656D76] font-medium">Identified Misconception Clusters</div>
              <div className="text-2xl font-bold text-[#C8102E] mt-1">
                {courseMisconceptions.length} Themes
              </div>
              <div className="text-[11px] text-[#656D76] mt-1">Min. sample size threshold enforced (N ≥ 35)</div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#D0D7DE] shadow-xs">
              <div className="text-xs text-[#656D76] font-medium">Top Confusion Topic</div>
              <div className="text-sm font-bold text-[#1F2328] mt-2 truncate">
                Mutex Ownership vs Semaphores
              </div>
              <div className="text-[11px] text-[#183059] mt-0.5 font-semibold">Affecting 38% of cohort attempts</div>
            </div>
          </div>

          {/* Misconception Deep-Dive Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#656D76] uppercase tracking-wider">
                Ranked Misconception Patterns (Cohort Level)
              </span>
              <span className="text-[11px] text-[#656D76]">
                Data generated from student question attempts & assistant feedback
              </span>
            </div>

            {courseMisconceptions.map((misc) => (
              <div
                key={misc.id}
                className="bg-white rounded-xl p-6 border border-[#D0D7DE] shadow-xs space-y-4 hover:border-[#183059]/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          misc.severity === 'high'
                            ? 'bg-red-50 text-[#C8102E] border border-red-200'
                            : misc.severity === 'medium'
                            ? 'bg-red-50/70 text-[#C8102E] border border-red-200'
                            : 'bg-blue-50 text-[#183059] border border-blue-200'
                        }`}
                      >
                        {misc.severity} Severity
                      </span>
                      <span className="text-xs font-semibold text-[#656D76]">{misc.topic}</span>
                      <span className="text-[#D0D7DE]">•</span>
                      <span className="text-xs text-[#656D76] font-mono">
                        Sample Size: {misc.sampleSize} students
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1F2328]">{misc.conceptTitle}</h3>
                    <p className="text-xs text-[#24292F] leading-relaxed max-w-3xl">
                      {misc.misconceptionDescription}
                    </p>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <div className="text-2xl font-bold text-[#183059]">
                      {misc.affectedStudentsPct}%
                    </div>
                    <div className="text-[10px] uppercase font-bold text-[#656D76]">
                      Cohort Error Rate
                    </div>
                  </div>
                </div>

                {/* Evidence Base Section */}
                <div className="p-4 rounded-lg bg-[#F6F8FA] border border-[#D0D7DE] text-xs space-y-2">
                  <div className="font-bold text-[#1F2328] flex items-center gap-1.5 text-[11px] uppercase">
                    <Brain className="w-3.5 h-3.5 text-[#183059]" />
                    Observed Formative Evidence
                  </div>
                  <ul className="space-y-1 text-[#24292F] list-disc list-inside text-[11px]">
                    {misc.evidenceQuotes.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Pedagogical Intervention */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#D0D7DE] text-xs">
                  <div className="text-[11px] text-[#183059] font-medium">
                    <span className="font-bold text-[#1F2328]">Recommended Action: </span>
                    {misc.recommendedAction}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`announcement-btn-${misc.id}`}
                      onClick={() => handleCreateAnnouncement(misc)}
                      className="px-3.5 py-1.5 rounded-md border border-[#D0D7DE] bg-white text-[#183059] hover:bg-[#F6F8FA] hover:border-[#183059] font-bold text-[11px] transition-colors shadow-2xs"
                    >
                      Draft Announcement
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authorized Student Progress Signals Tab */}
      {activeTab === 'student_progress' && (
        <div className="bg-white rounded-xl p-6 border border-[#D0D7DE] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#D0D7DE]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">
                Enrolled Student Formative Engagement ({studentCohort.length} Sampled)
              </h3>
              <p className="text-xs text-[#656D76]">
                Authorized for instructional support. Private verbatim chat conversations remain strictly hidden.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#183059] border border-blue-200 font-semibold text-xs flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Privacy Policy Compliant
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D0D7DE] text-[#656D76] font-semibold bg-[#F6F8FA]">
                  <th className="py-3 px-4">Student Name & Email</th>
                  <th className="py-3 px-4">Practice Sets Completed</th>
                  <th className="py-3 px-4">Diagnostic Accuracy</th>
                  <th className="py-3 px-4">Identified Misconception Need</th>
                  <th className="py-3 px-4">Support Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0D7DE]">
                {studentCohort.map((stu) => (
                  <tr key={stu.id} className="hover:bg-[#F6F8FA] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1F2328]">{stu.name}</div>
                      <div className="text-[11px] text-[#656D76]">{stu.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#24292F]">
                      {stu.practiceCount} sessions
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#183059]">{stu.accuracyPct}%</span>
                        <div className="w-16 bg-[#F6F8FA] rounded-full h-1.5 border border-[#D0D7DE]">
                          <div
                            className="bg-[#183059] h-1.5 rounded-full"
                            style={{ width: `${stu.accuracyPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#24292F]">{stu.strugglingTopic}</td>
                    <td className="py-3 px-4">
                      {stu.supportFlag ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-[#C8102E] border border-red-200 font-bold text-[10px]">
                          Needs Concurrency Recap
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#183059] border border-blue-200 font-bold text-[10px]">
                          On Track
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
