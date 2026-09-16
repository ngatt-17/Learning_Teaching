import React from 'react';
import { Check, X, Award, Lightbulb } from 'lucide-react';
import type { Question } from './quizData';

interface QuestionMatchingProps {
  currentQ: Question;
  isSubmitted: boolean;
  matchingPairs: Record<string, string>;
  selectedLeft: string | null;
  handleMatchingClickLeft: (leftId: string) => void;
  handleMatchingClickRight: (rightId: string) => void;
}

export const QuestionMatching: React.FC<QuestionMatchingProps> = ({
  currentQ,
  isSubmitted,
  matchingPairs,
  selectedLeft,
  handleMatchingClickLeft,
  handleMatchingClickRight,
}) => {
  const correctMap = currentQ.correctMapping || {};

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Cột Trái */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">
            Cột Trái (Khái niệm)
          </span>
          {currentQ.leftItems?.map((item) => {
            const isSelected = selectedLeft === item.id;
            const matchedRightId = matchingPairs[item.id];
            const isPairCorrect = isSubmitted && matchedRightId === correctMap[item.id];

            let style = 'bg-white text-slate-800 border-slate-300 hover:border-blue-400 hover:bg-slate-50';
            let statusIcon = null;

            if (isSubmitted) {
              if (isPairCorrect) {
                style = 'bg-emerald-50 text-emerald-900 border-emerald-500 font-bold';
                statusIcon = <Check size={18} className="text-emerald-600" />;
              } else {
                style = 'bg-rose-50 text-rose-900 border-rose-500 border-dashed font-bold';
                statusIcon = <X size={18} className="text-rose-600" />;
              }
            } else if (isSelected) {
              style = 'bg-blue-600 text-white border-blue-600 shadow-md font-bold';
            } else if (matchedRightId) {
              style = 'bg-blue-50 text-blue-800 border-blue-400 font-semibold';
            }

            return (
              <button
                key={item.id}
                onClick={() => handleMatchingClickLeft(item.id)}
                disabled={isSubmitted}
                className={`w-full p-3.5 rounded-xl border-2 text-sm text-left transition-all cursor-pointer flex items-center justify-between ${style}`}
              >
                <span>{item.label}</span>
                {statusIcon}
              </button>
            );
          })}
        </div>

        {/* Cột Phải */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-center bg-slate-100 py-1.5 rounded-lg border border-slate-200">
            Cột Phải (Ứng dụng)
          </span>
          {currentQ.rightItems?.map((item) => {
            const matchedLeftKey = Object.keys(matchingPairs).find((k) => matchingPairs[k] === item.id);
            const isMatched = !!matchedLeftKey;

            let style = 'bg-white text-slate-800 border-slate-300';
            let statusIcon = null;

            if (isSubmitted) {
              const expectedLeftKey = Object.keys(correctMap).find((k) => correctMap[k] === item.id);
              const isCorrectPair = matchedLeftKey && matchedLeftKey === expectedLeftKey;
              if (isCorrectPair) {
                style = 'bg-emerald-50 text-emerald-900 border-emerald-500 font-bold';
                statusIcon = <Check size={18} className="text-emerald-600" />;
              } else {
                style = 'bg-rose-50 text-rose-900 border-rose-500 border-dashed font-bold';
                statusIcon = <X size={18} className="text-rose-600" />;
              }
            } else if (isMatched) {
              style = 'bg-blue-50 text-blue-800 border-blue-400 font-semibold';
            } else if (selectedLeft) {
              style = 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 cursor-pointer animate-pulse';
            }

            return (
              <button
                key={item.id}
                onClick={() => handleMatchingClickRight(item.id)}
                disabled={isSubmitted}
                className={`w-full p-3.5 rounded-xl border-2 text-sm text-left transition-all flex items-center justify-between ${style}`}
              >
                <span>{item.label}</span>
                {statusIcon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Giải thích khi submitted */}
      {isSubmitted && (
        <div className="w-full space-y-3 pt-2 animate-fadeIn">
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left space-y-2">
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-blue-600 text-white inline-block">
              Nối cặp chuẩn xác & Lời giải thích
            </span>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 space-y-1">
              <p className="text-amber-800 uppercase tracking-wide">Các cặp chính xác:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {Object.entries(correctMap).map(([leftId, rightId]) => {
                  const leftItem = currentQ.leftItems?.find((i) => i.id === leftId);
                  const rightItem = currentQ.rightItems?.find((i) => i.id === rightId);
                  return (
                    <li key={leftId}>
                      <span className="font-extrabold">{leftItem?.label}</span> ➔ <span className="font-extrabold">{rightItem?.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
              {currentQ.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
