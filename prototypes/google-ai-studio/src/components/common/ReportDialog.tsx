import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, X, Send } from 'lucide-react';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  messageId: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  conversationId,
  messageId
}) => {
  const { reportAnswer } = useApp();
  const [reasonCategory, setReasonCategory] = useState('Hallucination / Factually Incorrect');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = `${reasonCategory}: ${details || 'No additional details provided'}`;
    reportAnswer(conversationId, messageId, fullReason);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0E1F3B]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="report-dialog-box"
        className="w-full max-w-md bg-white text-[#1F2328] rounded-2xl shadow-2xl border border-[#E5E8EB] overflow-hidden transform transition-all animate-in zoom-in-95"
      >
        <div className="px-6 py-4 bg-red-50/60 border-b border-red-100 flex items-center justify-between text-[#C8102E]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C8102E]" />
            <h3 className="font-bold text-sm text-[#1F2328]">Report AI Answer / Discrepancy</h3>
          </div>
          <button
            id="close-report-dialog-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-[#656D76] hover:text-[#1F2328] hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <p className="text-[#656D76] leading-relaxed">
              Flagging an answer sends it directly to the <strong className="text-[#1F2328]">CECS Governance & Course Instructor Review Queue</strong> for audit and source grounding refinement.
            </p>

            <div>
              <label htmlFor="report-category-select" className="block font-bold text-[#1F2328] mb-1.5">
                Issue Category
              </label>
              <select
                id="report-category-select"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] px-3.5 py-2.5 text-xs text-[#1F2328] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#183059]"
              >
                <option value="Hallucination / Factually Incorrect">Hallucination / Factually Incorrect</option>
                <option value="Conflicts with Course Lecture Slides">Conflicts with Course Lecture Slides</option>
                <option value="Misleading or Incomplete Citation Excerpt">Misleading or Incomplete Citation Excerpt</option>
                <option value="Unsupported Web Claim without Evidence">Unsupported Web Claim without Evidence</option>
                <option value="Active Graded Assessment Over-Assistance">Active Graded Assessment Over-Assistance</option>
              </select>
            </div>

            <div>
              <label htmlFor="report-details-input" className="block font-bold text-[#1F2328] mb-1.5">
                Specific Discrepancy or Note (Optional)
              </label>
              <textarea
                id="report-details-input"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain which slide, textbook page, or definition this conflicts with..."
                className="w-full rounded-xl border border-[#E5E8EB] bg-[#F8F9FC] p-3 text-xs text-[#1F2328] placeholder:text-[#656D76] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#183059]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#F0F2F5]">
              <button
                id="cancel-report-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8EB] bg-white hover:bg-[#F8F9FC] text-[#24292F]"
              >
                Cancel
              </button>
              <button
                id="submit-report-btn"
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#C8102E] hover:bg-[#A40E26] text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Submit to Governance
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#183059] flex items-center justify-center mx-auto border border-blue-200">
              ✓
            </div>
            <h4 className="font-bold text-[#1F2328] text-sm">Issue Logged</h4>
            <p className="text-xs text-[#656D76]">
              Added to Course Audit & Administrator Governance Queue. Thank you for maintaining source integrity!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
