import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Question } from './quizData';

interface QuestionTrueFalseProps {
  currentQ: Question;
  selectedAnswer: string | null;
  isSubmitted: boolean;
  handleSelectOption: (optId: string) => void;
}

export const QuestionTrueFalse: React.FC<QuestionTrueFalseProps> = ({
  currentQ,
  selectedAnswer,
  isSubmitted,
  handleSelectOption,
}) => {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 my-1">
      <div className="grid grid-cols-2 gap-5">
        {currentQ.options?.map((opt) => {
          const isSelected = selectedAnswer === opt.id;
          const showCorrect = isSubmitted && opt.isCorrect;
          const showWrong = isSubmitted && isSelected && !opt.isCorrect;

          let btnStyle = 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-slate-50 shadow-xs';
          if (selectedAnswer) {
            if (isSelected) {
              btnStyle = 'bg-blue-600 text-white border-blue-600 font-extrabold scale-[1.01] shadow-md';
            } else {
              btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-50';
            }
          }

          if (isSubmitted) {
            if (opt.isCorrect) {
              btnStyle = 'bg-emerald-50 text-emerald-900 border-emerald-500 ring-2 ring-emerald-300 scale-[1.01] shadow-sm font-extrabold';
            } else if (isSelected) {
              btnStyle = 'bg-rose-50 text-rose-900 border-rose-500 ring-2 ring-rose-300 shadow-sm font-extrabold';
            } else {
              btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-30';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt.id)}
              disabled={isSubmitted}
              className={`py-6 px-4 rounded-2xl border-2 text-xl transition-all transform active:scale-95 shadow-xs flex items-center justify-center gap-3 relative cursor-pointer ${btnStyle}`}
            >
              <span>{opt.text}</span>
              {showCorrect && <CheckCircle2 size={24} className="text-emerald-600" />}
              {showWrong && <XCircle size={24} className="text-rose-600" />}
            </button>
          );
        })}
      </div>

      {/* Lời giải thích hiển thị khi đã submit */}
      {isSubmitted && (
        <div className="w-full bg-blue-50/80 border border-blue-200 rounded-2xl p-4 shadow-xs text-left space-y-2 animate-fadeIn">
          <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-blue-600 text-white inline-block shadow-xs">
            Lời giải thích
          </span>
          <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-blue-100">
            {currentQ.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
