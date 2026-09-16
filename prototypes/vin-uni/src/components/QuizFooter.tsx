import React from 'react';
import { ArrowRight, Award } from 'lucide-react';

interface QuizFooterProps {
  scoreTimer: number;
  isSubmitted: boolean;
  currentStep: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  shortAnswerText?: string;
  questionType: string;
  handleSubmitAnswer: () => void;
  handleNextQuestion: () => void;
}

export const QuizFooter: React.FC<QuizFooterProps> = ({
  scoreTimer,
  isSubmitted,
  currentStep,
  totalQuestions,
  selectedAnswer,
  shortAnswerText,
  questionType,
  handleSubmitAnswer,
  handleNextQuestion,
}) => {
  const isSubmitDisabled =
    (questionType === 'single_choice' && !selectedAnswer) ||
    (questionType === 'true_false' && !selectedAnswer) ||
    (questionType === 'short_answer' && !shortAnswerText?.trim());

  return (
    <div className="space-y-3 pt-2 shrink-0 border-t border-slate-100 bg-white">
      {/* Thanh đếm ngược màu sắc thanh lịch sáng */}
      <div className="relative w-full max-w-lg mx-auto h-7 bg-slate-100 border border-slate-300 rounded-full overflow-hidden shadow-inner flex items-center justify-center">
        <div
          className="absolute left-0 top-0 bottom-0 transition-all duration-300 rounded-full"
          style={{
            width: `${(scoreTimer / 1000) * 100}%`,
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              #3B82F6,
              #3B82F6 14px,
              #EF4444 14px,
              #EF4444 28px,
              #FFFFFF 28px,
              #FFFFFF 42px
            )`,
          }}
        />
        <span className="relative z-10 font-extrabold text-xs text-slate-800 tracking-widest uppercase bg-white/80 px-3 py-0.5 rounded-full border border-slate-200 shadow-2xs">
          {scoreTimer} Pts
        </span>
      </div>

      <div className="flex items-center justify-end gap-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitDisabled}
            className={`px-8 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all transform active:scale-95 border shadow-sm cursor-pointer ${
              isSubmitDisabled
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-200'
            }`}
          >
            XÁC NHẬN ĐÁP ÁN
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm border border-blue-500 shadow-md transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>{currentStep < totalQuestions - 1 ? 'CÂU TIẾP THEO' : 'HOÀN THÀNH QUIZZ'}</span>
            {currentStep < totalQuestions - 1 ? <ArrowRight size={18} /> : <Award size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};
