import React from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { Question } from './quizData';

interface QuestionSingleChoiceProps {
  currentQ: Question;
  selectedAnswer: string | null;
  isSubmitted: boolean;
  handleSelectOption: (optId: string) => void;
}

export const QuestionSingleChoice: React.FC<QuestionSingleChoiceProps> = ({
  currentQ,
  selectedAnswer,
  isSubmitted,
  handleSelectOption,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full py-2">
      {/* Cột trái: Các lựa chọn đáp án */}
      <div className="md:col-span-6 flex flex-col space-y-3.5">
        {currentQ.options?.map((opt) => {
          const isSelected = selectedAnswer === opt.id;
          const showCorrect = isSubmitted && opt.isCorrect;
          const showWrong = isSubmitted && isSelected && !opt.isCorrect;

          let buttonStyle = 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-slate-50 shadow-xs';

          if (selectedAnswer) {
            if (isSelected) {
              buttonStyle = 'bg-blue-600 text-white border-blue-600 shadow-md font-extrabold scale-[1.01]';
            } else {
              buttonStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
            }
          }

          if (isSubmitted) {
            if (opt.isCorrect) {
              buttonStyle = 'bg-emerald-50 text-emerald-900 border-emerald-500 font-extrabold shadow-sm ring-2 ring-emerald-300 scale-[1.01]';
            } else if (isSelected) {
              buttonStyle = 'bg-rose-50 text-rose-900 border-rose-500 font-extrabold shadow-sm ring-2 ring-rose-300';
            } else {
              buttonStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-40';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt.id)}
              disabled={isSubmitted}
              className={`w-full relative py-4 px-6 rounded-full border-2 font-bold text-base transition-all transform active:scale-98 flex items-center justify-between cursor-pointer ${buttonStyle}`}
            >
              <span className="mx-auto text-center tracking-wide">{opt.text}</span>
              {showCorrect && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={18} />
                </span>
              )}
              {showWrong && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs">
                  <XCircle size={18} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cột phải: Hình ảnh minh họa hoặc Lời giải thích */}
      <div className="md:col-span-6 flex justify-center h-full">
        {!isSubmitted ? (
          <div className="w-full min-h-[240px] bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-xs relative overflow-hidden group">
            {currentQ.image ? (
              <div className="w-full h-full min-h-[220px] max-h-[280px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative flex items-center justify-center bg-white">
                <img
                  src={currentQ.image}
                  alt={currentQ.title}
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs text-white font-medium flex items-center gap-1.5 bg-slate-900/80 px-3 py-1 rounded-full border border-white/20">
                    <Lightbulb size={14} className="text-amber-400" />
                    Hình ảnh minh họa câu hỏi
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
                <Lightbulb size={40} className="text-amber-500 animate-pulse" />
                <p className="text-sm font-semibold text-slate-600">Hình ảnh minh họa câu hỏi</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full min-h-[240px] bg-blue-50/80 border-2 border-blue-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between text-left space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-blue-600 text-white shadow-xs">
                Lời giải thích & Kiến thức
              </span>
            </div>
            <div className="flex-1 bg-white p-4 rounded-2xl border border-blue-100 flex flex-col justify-center shadow-xs">
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
            <div className="text-xs text-slate-500 italic text-right">
              * Đã xác nhận đáp án
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
