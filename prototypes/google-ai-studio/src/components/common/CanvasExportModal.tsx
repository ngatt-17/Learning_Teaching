import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, X, Shield, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

interface CanvasExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityTitle: string;
  questionsAttempted: number;
}

export const CanvasExportModal: React.FC<CanvasExportModalProps> = ({
  isOpen,
  onClose,
  activityTitle,
  questionsAttempted
}) => {
  const { activeCourse, currentUser, exportToCanvas } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 800));
    await exportToCanvas({
      courseId: activeCourse.id,
      activityTitle,
      questionsAttempted
    });
    setIsExporting(false);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="canvas-export-modal-box"
        className="w-full max-w-lg bg-white text-[#1F2328] rounded-2xl shadow-2xl border border-[#E5E8EB] overflow-hidden transform transition-all animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#F8F9FC] border-b border-[#F0F2F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C8102E] flex items-center justify-center text-white font-bold text-base shadow-xs">
              C
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2328]">Canvas Participation Record</h3>
              <p className="text-xs text-[#656D76]">VinUni Canvas LMS Formative Integration</p>
            </div>
          </div>
          <button
            id="close-canvas-export-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#656D76] hover:text-[#1F2328] hover:bg-[#E5E8EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!isSuccess ? (
            <>
              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 text-xs text-[#183059] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#183059]">
                  <Shield className="w-4 h-4 text-[#183059]" />
                  Zero-Grade Privacy Guarantee (PRD Section 7.8)
                </div>
                <p className="text-[#24292F] leading-relaxed">
                  Only your completion status and attempt count will be logged as formative engagement.
                  <strong className="text-[#C8102E]"> No score, quiz grade, chat logs, or private notes will be sent to Canvas.</strong>
                </p>
              </div>

              {/* Exact Data Payload Preview */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#656D76] mb-2">
                  Preview of Transmitted Data Payload
                </div>
                <div className="rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] divide-y divide-[#F0F2F5] text-xs overflow-hidden">
                  <div className="p-3 flex justify-between">
                    <span className="text-[#656D76] font-medium">Course Code:</span>
                    <span className="font-mono font-semibold text-[#1F2328]">{activeCourse.code} ({activeCourse.term})</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#656D76] font-medium">Student Identity:</span>
                    <span className="font-mono font-semibold text-[#1F2328]">{currentUser.name} (VNU_{currentUser.id.toUpperCase()})</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#656D76] font-medium">Activity Title:</span>
                    <span className="font-semibold text-[#1F2328]">{activityTitle}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#656D76] font-medium">Questions Attempted:</span>
                    <span className="font-mono font-semibold text-[#183059]">{questionsAttempted} questions</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-[#656D76] font-medium">Participation Status:</span>
                    <span className="font-semibold text-[#183059]">Completed (Formative)</span>
                  </div>
                  <div className="p-3 flex justify-between bg-blue-50/50">
                    <span className="text-[#656D76] font-medium">Grade Passback:</span>
                    <span className="font-semibold text-[#183059]">DISABLED (Policy Standard)</span>
                  </div>
                  <div className="p-3 flex justify-between bg-blue-50/50">
                    <span className="text-[#656D76] font-medium">Chat Logs / Verbatim:</span>
                    <span className="font-semibold text-[#183059]">EXCLUDED (Protected)</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#183059] flex items-center justify-center mx-auto border border-blue-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1F2328]">Participation Record Synced</h4>
                <p className="text-xs text-[#656D76] mt-1 max-w-sm mx-auto">
                  Your formative practice session was successfully transmitted to the VinUni Canvas participation log.
                </p>
              </div>
              <div className="p-3 bg-[#F8F9FC] rounded-xl border border-[#E5E8EB] text-xs font-mono text-[#183059]">
                Record ID: CANV-SYNC-{Date.now().toString().slice(-6)} • Status: 200 OK
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F8F9FC] border-t border-[#F0F2F5] flex justify-end gap-2">
          {!isSuccess ? (
            <>
              <button
                id="cancel-canvas-export-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F] transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-canvas-export-btn"
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#C8102E] hover:bg-[#A40E26] text-white transition-colors inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Transmitting to Canvas...
                  </>
                ) : (
                  <>
                    Confirm & Send Record
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              id="done-canvas-export-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#183059] hover:bg-[#0E1F3B] text-white transition-colors shadow-xs"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
