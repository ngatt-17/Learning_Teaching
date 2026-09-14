import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, ExternalLink, ShieldCheck, FileText, Globe, UserCheck, AlertTriangle } from 'lucide-react';

export const CitationDrawer: React.FC = () => {
  const { activeCitation, setActiveCitation } = useApp();

  if (!activeCitation) return null;

  const isCourse = activeCitation.sourceType === 'course';
  const isPersonal = activeCitation.sourceType === 'personal';
  const isWeb = activeCitation.sourceType === 'web';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0E1F3B]/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div
        id="citation-drawer-panel"
        className="w-full max-w-lg bg-white text-[#1F2328] h-full shadow-2xl flex flex-col transform transition-transform duration-200 border-l border-[#E5E8EB] animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#F0F2F5] flex items-start justify-between bg-[#F8F9FC]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isCourse && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#183059] border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#183059]" />
                  Course Source (Approved)
                </span>
              )}
              {isPersonal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#C8102E] border border-red-200">
                  <UserCheck className="w-3.5 h-3.5 text-[#C8102E]" />
                  Personal Source (Student Draft)
                </span>
              )}
              {isWeb && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#183059] border border-blue-200">
                  <Globe className="w-3.5 h-3.5 text-[#183059]" />
                  External Web Search
                </span>
              )}
              <span className="text-xs text-[#656D76] font-medium">Claim-Level Grounding</span>
            </div>
            <h2 className="text-base font-bold text-[#1F2328] leading-snug">{activeCitation.title}</h2>
          </div>
          <button
            id="close-citation-drawer-btn"
            onClick={() => setActiveCitation(null)}
            className="p-1.5 rounded-lg text-[#656D76] hover:text-[#1F2328] hover:bg-[#E5E8EB] transition-colors"
            title="Close source inspection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* Exact Citation Location */}
          <div className="bg-[#F8F9FC] rounded-2xl p-4 border border-[#E5E8EB]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#656D76] mb-1">
              Referenced Location in Document
            </div>
            <div className="font-semibold text-[#1F2328] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#183059]" />
              {activeCitation.location}
            </div>
          </div>

          {/* Verbatim Excerpt */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#656D76] mb-2">
              Extracted Source Passage
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F9FC] text-[#24292F] font-mono text-xs leading-relaxed border border-[#E5E8EB]">
              "{activeCitation.excerpt}"
            </div>
          </div>

          {/* Differentiated Source Metadata & Policy Notes */}
          {isCourse && (
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs text-[#183059]">
              <div className="font-semibold flex items-center gap-1.5 text-[#183059]">
                <ShieldCheck className="w-4 h-4 text-[#183059]" />
                Academic Authority Verification
              </div>
              <p className="text-[#24292F] leading-relaxed">
                This material has been indexed and officially certified by course faculty for COMP2030. AI answers citing this source conform to professor-approved terminology and exam criteria.
              </p>
            </div>
          )}

          {isPersonal && (
            <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200 space-y-2 text-xs text-[#C8102E]">
              <div className="font-semibold flex items-center gap-1.5 text-[#C8102E]">
                <AlertTriangle className="w-4 h-4 text-[#C8102E]" />
                Personal Source — Not Instructor Approved
              </div>
              <p className="text-[#24292F] leading-relaxed">
                This document is stored exclusively in your <strong>Private Study Workspace</strong>. It is not shared with other students or instructors, cannot become an official course source, and is excluded from cohort analytics by default.
              </p>
            </div>
          )}

          {isWeb && (
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs text-[#183059]">
              <div className="font-semibold flex items-center gap-1.5 text-[#183059]">
                <Globe className="w-4 h-4 text-[#183059]" />
                Secondary Web Source Disclaimer
              </div>
              <p className="text-[#24292F] leading-relaxed">
                Retrieved via controlled web expansion. If terminology or guidelines from this external source conflict with course lecture slides, the instructor's approved materials remain the primary authority.
              </p>
              {activeCitation.authorOrPublisher && (
                <div className="pt-1 text-[#24292F]">
                  <span className="font-semibold text-[#1F2328]">Publisher/Standard:</span> {activeCitation.authorOrPublisher}
                </div>
              )}
              {activeCitation.accessDate && (
                <div className="text-[#656D76]">
                  <span className="font-semibold text-[#24292F]">Accessed:</span> {activeCitation.accessDate}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#F0F2F5] bg-[#F8F9FC] flex items-center justify-between">
          <span className="text-xs text-[#656D76]">Verified Evidence Citation</span>
          <button
            id="dismiss-citation-btn"
            onClick={() => setActiveCitation(null)}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white transition-colors shadow-xs"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
