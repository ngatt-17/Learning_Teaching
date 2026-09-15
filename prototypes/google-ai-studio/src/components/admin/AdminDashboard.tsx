import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Users,
  BookOpen,
  FileText,
  Activity,
  UserCheck,
  RotateCcw,
  Check,
  Send,
  Building,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { GovernanceItem } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    courses,
    materials,
    governanceItems,
    auditLogs,
    resolveGovernanceItem,
    assignSupportOwner,
    currentUser,
    setActiveCourseId
  } = useApp();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<
    'portfolio' | 'governance' | 'cross_course' | 'audit'
  >('portfolio');

  const [supportAssignModal, setSupportAssignModal] = useState<GovernanceItem | null>(null);
  const [selectedSupportOwner, setSelectedSupportOwner] = useState(currentUser.name);

  const unresolvedGov = governanceItems.filter((g) => g.status === 'unresolved');
  const totalEnrolled = courses.reduce((acc, c) => acc + c.enrolledStudentsCount, 0);
  const totalApprovedMaterials = materials.filter((m) => m.approvedForAI).length;

  const handleAssignSupport = () => {
    if (!supportAssignModal) return;
    assignSupportOwner(supportAssignModal.id, selectedSupportOwner);
    setSupportAssignModal(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-[#C8102E] border border-red-200">
              CECS Institutional Administration
            </span>
            <span className="text-[#656D76] font-medium">Accreditation & AI Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1F2328] tracking-tight">
            College Adoption & Governance Dashboard
          </h1>
          <p className="text-xs text-[#656D76] mt-1 max-w-2xl">
            Oversight of course readiness, certified source health, student reports, and audit logs across all CECS programs without infringing on student conversation privacy.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-[#F8F9FC] p-1.5 rounded-2xl text-xs font-semibold border border-[#E5E8EB] shrink-0">
          <button
            onClick={() => setActiveAdminSubTab('portfolio')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeAdminSubTab === 'portfolio'
                ? 'bg-[#183059] text-white shadow-xs font-bold'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Course Portfolio
          </button>
          <button
            onClick={() => setActiveAdminSubTab('governance')}
            className={`px-4 py-2 rounded-xl transition-all relative ${
              activeAdminSubTab === 'governance'
                ? 'bg-[#183059] text-white shadow-xs font-bold'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Governance ({unresolvedGov.length})
          </button>
          <button
            onClick={() => setActiveAdminSubTab('cross_course')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeAdminSubTab === 'cross_course'
                ? 'bg-[#183059] text-white shadow-xs font-bold'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Cross-Course
          </button>
          <button
            onClick={() => setActiveAdminSubTab('audit')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeAdminSubTab === 'audit'
                ? 'bg-[#183059] text-white shadow-xs font-bold'
                : 'text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* High-Level Institutional Metrics (Matching Image 1 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Active Programs</div>
            <div className="text-2xl font-bold text-[#1F2328] tracking-tight">{courses.length}</div>
            <div className="text-[11px] text-[#183059] font-semibold">3 Ready • 1 Attention</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Enrolled Cohort</div>
            <div className="text-2xl font-bold text-[#1F2328] tracking-tight">{totalEnrolled}</div>
            <div className="text-[11px] text-[#656D76]">VinUni SSO Synced</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] border border-blue-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Approved Sources</div>
            <div className="text-2xl font-bold text-[#183059] tracking-tight">{totalApprovedMaterials}</div>
            <div className="text-[11px] text-[#183059] font-semibold">Certified AI Grounding</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E8EB] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#C8102E] border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#656D76] font-medium">Governance Queue</div>
            <div className="text-2xl font-bold text-[#C8102E] tracking-tight">{unresolvedGov.length}</div>
            <div className="text-[11px] text-[#C8102E] font-medium">Needs Resolution</div>
          </div>
        </div>
      </div>

      {/* Tab 1: Course Readiness & Portfolio Overview */}
      {activeAdminSubTab === 'portfolio' && (
        <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-xs overflow-hidden space-y-4 p-6 sm:p-7">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">
                Course Readiness & Source Coverage Index
              </h3>
              <p className="text-xs text-[#656D76]">
                Identifies courses with missing sources where the AI assistant is disabled.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E8EB] text-[#656D76] font-semibold bg-[#F8F9FC]">
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Students</th>
                  <th className="py-3 px-4">Approved Sources</th>
                  <th className="py-3 px-4">AI Readiness Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {courses.map((c) => {
                  const isReady = c.aiReadinessStatus === 'ready';

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#F8F9FC] transition-colors ${
                        !isReady ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1F2328]">{c.code}</div>
                        <div className="text-[11px] text-[#656D76]">{c.name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#24292F]">{c.instructorName}</div>
                        <div className="text-[11px] text-[#656D76]">{c.instructorEmail}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-[#24292F]">
                        {c.enrolledStudentsCount}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#183059]">
                        {c.approvedSourcesCount} sources
                      </td>

                      <td className="py-3 px-4">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#183059] border border-blue-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready (Active)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-[#C8102E] border border-red-200 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            Needs Sources (AI Paused)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveCourseId(c.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] font-semibold text-[11px] transition-colors shadow-xs"
                        >
                          Switch Context
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Governance & Reported Issues Queue */}
      {activeAdminSubTab === 'governance' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">Governance & Hallucination Issue Queue</h3>
              <p className="text-xs text-[#656D76]">
                Issues reported by students, parsing errors, and course readiness alerts requiring resolution.
              </p>
            </div>
            <span className="text-xs font-bold text-[#C8102E] bg-red-50 px-3 py-1 rounded-full border border-red-200">
              {unresolvedGov.length} Unresolved
            </span>
          </div>

          <div className="space-y-3">
            {governanceItems.map((item) => {
              const isUnresolved = item.status === 'unresolved';

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                    isUnresolved
                      ? 'bg-red-50/20 border-red-200 shadow-xs'
                      : 'bg-[#F8F9FC] border-[#E5E8EB] opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-white text-[#1F2328] border border-[#E5E8EB] text-[10px]">
                        {item.courseCode}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.type === 'reported_ai_answer'
                            ? 'bg-red-50 text-[#C8102E] border border-red-200'
                            : 'bg-red-50/80 text-[#C8102E] border border-red-200'
                        }`}
                      >
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#E5E8EB]">•</span>
                      <span className="text-[#656D76]">
                        {new Date(item.reportedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.assignedSupportOwner && (
                        <span className="text-[11px] text-[#24292F] bg-white px-3 py-1 rounded-xl border border-[#E5E8EB]">
                          Owner: <strong className="text-[#1F2328]">{item.assignedSupportOwner}</strong>
                        </span>
                      )}

                      {isUnresolved && (
                        <>
                          <button
                            id={`assign-support-${item.id}-btn`}
                            onClick={() => setSupportAssignModal(item)}
                            className="px-3.5 py-1.5 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] font-semibold text-[11px] transition-colors shadow-xs"
                          >
                            Assign Support
                          </button>
                          <button
                            id={`resolve-gov-${item.id}-btn`}
                            onClick={() => resolveGovernanceItem(item.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold text-[11px] transition-colors shadow-xs"
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#1F2328] text-xs">{item.title}</h4>
                    <p className="text-[#24292F] text-[11px] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="text-[10px] text-[#656D76]">
                    Reported by: {item.reportedBy} • Status: {item.status.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Cross-Course Insights */}
      {activeAdminSubTab === 'cross_course' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">
                Cross-Course Learning & Adoption Insights
              </h3>
              <p className="text-xs text-[#656D76]">
                Identifies systemic misconception themes across computer science and engineering cohorts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3">
              <div className="font-bold text-[#183059] text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#183059]" />
                Cross-Course Conceptual Synergies
              </div>
              <p className="text-[#24292F] leading-relaxed text-[11px]">
                Students struggling with <strong className="text-[#1F2328]">COMP2030 (Race Conditions)</strong> also show lower confidence in <strong className="text-[#1F2328]">DSA2010 (Thread-Safe Priority Queues)</strong>. Recommending a joint workshop between Prof. Miller and Prof. Sen during Midterm Review week.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-3">
              <div className="font-bold text-[#183059] text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#183059]" />
                Accreditation & ABET Learning Evidence
              </div>
              <p className="text-[#24292F] leading-relaxed text-[11px]">
                84% of enrolled students engaged with course-grounded formative diagnostic practice. Zero academic integrity complaints logged regarding direct exam solution leakage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Trail */}
      {activeAdminSubTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5E8EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">CECS Governance Audit Trail</h3>
              <p className="text-xs text-[#656D76]">
                Tamper-evident record of high-impact actions, approvals, and Canvas transmissions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E8EB] text-[#656D76] font-semibold bg-[#F8F9FC]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Details & Compliance Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8F9FC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#656D76]">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1F2328]">{log.actorName}</div>
                      <span className="text-[10px] uppercase font-semibold text-[#656D76]">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#183059]">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[#24292F]">{log.target}</td>
                    <td className="py-3 px-4">
                      <div className="text-[#24292F]">{log.details}</div>
                      {log.complianceFlag && (
                        <div className="text-[10px] text-[#183059] font-semibold mt-0.5">
                          ✓ {log.complianceFlag}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Support Owner Modal */}
      {supportAssignModal && (
        <div className="fixed inset-0 z-50 bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#E5E8EB] text-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1F2328]">Assign Institutional Support Owner</h3>
            <p className="text-[#656D76]">
              Assign an academic consultant or instructional designer to investigate:
              <strong className="block text-[#1F2328] mt-1">{supportAssignModal.title}</strong>
            </p>

            <div>
              <label className="block font-bold text-[#1F2328] mb-1">Support Owner</label>
              <select
                value={selectedSupportOwner}
                onChange={(e) => setSelectedSupportOwner(e.target.value)}
                className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] focus:bg-white focus:ring-2 focus:ring-[#183059]"
              >
                <option value="Dr. Elena Rossi (Vice Dean)">Dr. Elena Rossi (Vice Dean)</option>
                <option value="Instructional Designer Lead">Instructional Designer Lead</option>
                <option value="Prof. David Miller (Course Lead)">Prof. David Miller (Course Lead)</option>
                <option value="Alex Le (Graduate TA)">Alex Le (Graduate TA)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2F5]">
              <button
                type="button"
                onClick={() => setSupportAssignModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignSupport}
                className="px-5 py-2 rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white font-bold transition-colors shadow-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
