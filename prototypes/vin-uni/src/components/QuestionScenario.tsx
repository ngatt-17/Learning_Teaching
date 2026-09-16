import React from 'react';
import type { Question, ScenarioNode } from './quizData';

interface QuestionScenarioProps {
  currentQ: Question;
  isSubmitted: boolean;
  currentBranchId: string;
  handleSelectScenarioOpt: (opt: { text: string; nextBranchId?: string; feedback: string; isGoodChoice: boolean }) => void;
}

export const QuestionScenario: React.FC<QuestionScenarioProps> = ({
  currentQ,
  isSubmitted,
  currentBranchId,
  handleSelectScenarioOpt,
}) => {
  if (!currentQ.branches) return null;
  const node: ScenarioNode | undefined = currentQ.branches[currentBranchId];
  if (!node) return null;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-3">
      <div className="bg-[#0F172A] border-2 border-blue-500/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="p-3 bg-[#1E3A8A]/40 rounded-xl border border-blue-300/30 text-blue-100 text-xs sm:text-sm font-medium leading-relaxed">
          {node.context}
        </div>

        <h3 className="text-sm sm:text-base font-extrabold text-white text-center">
          {node.question}
        </h3>

        <div className="space-y-2 pt-1">
          {node.options.map((opt: { text: string; nextBranchId?: string; feedback: string; isGoodChoice: boolean }, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelectScenarioOpt(opt)}
              disabled={isSubmitted}
              className="w-full text-left p-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-rose-500 hover:text-white hover:border-rose-600 text-slate-900 font-extrabold text-xs sm:text-sm transition-all transform active:scale-[0.99] shadow-md cursor-pointer flex items-center justify-between"
            >
              <span>{opt.text}</span>
              <span className="text-[10px] uppercase font-bold text-rose-600 group-hover:text-white px-2 py-0.5 rounded bg-rose-50">
                Lựa chọn
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
