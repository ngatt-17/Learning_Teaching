import React from 'react';
import type { Question } from './quizData';

interface QuestionShortAnswerProps {
  currentQ: Question;
  shortAnswerText: string;
  setShortAnswerText: (val: string) => void;
  isSubmitted: boolean;
}

export const QuestionShortAnswer: React.FC<QuestionShortAnswerProps> = ({
  currentQ,
  shortAnswerText,
  setShortAnswerText,
  isSubmitted,
}) => {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-5 my-2">
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
          Nhập câu trả lời của bạn:
        </label>
        <textarea
          value={shortAnswerText}
          onChange={(e) => setShortAnswerText(e.target.value)}
          disabled={isSubmitted}
          placeholder="Gõ đáp án vào đây..."
          className="w-full h-32 p-4 rounded-xl border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800 font-semibold text-base transition-all resize-none disabled:bg-slate-100 disabled:text-slate-600"
        />
      </div>

      {isSubmitted && (
        <div className="w-full bg-blue-50/80 border border-blue-200 rounded-2xl p-5 shadow-sm text-left space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-blue-600 text-white shadow-xs">
              Đáp án chuẩn & Lời giải thích
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 text-slate-800 space-y-1">
            <p className="text-xs text-slate-500 font-bold">Đáp án chuẩn:</p>
            <p className="text-sm font-extrabold text-emerald-700">{currentQ.correctShortAnswer}</p>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-blue-100">
            {currentQ.explanation}
          </p>
        </div>
      )}
    </div>
  );
};