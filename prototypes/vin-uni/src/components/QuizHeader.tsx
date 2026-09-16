import React from 'react';
import { Settings, X } from 'lucide-react';
import { QuizSettingsPopover } from './QuizSettingsPopover';

interface QuizHeaderProps {
  currentStep: number;
  totalQuestions: number;
  quizTitle: string;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (val: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (val: boolean) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (val: boolean) => void;
  onClose: () => void;
  playSfx: (type: 'click') => void;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentStep,
  totalQuestions,
  quizTitle,
  showSettings,
  setShowSettings,
  ttsEnabled,
  setTtsEnabled,
  musicEnabled,
  setMusicEnabled,
  sfxEnabled,
  setSfxEnabled,
  onClose,
  playSfx,
}) => {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs uppercase tracking-wider rounded-full border border-blue-200">
          Câu {currentStep + 1} / {totalQuestions}
        </span>
        <h2 className="text-sm font-bold text-slate-800 hidden sm:block truncate max-w-md">
          {quizTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              showSettings ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Cài đặt Âm thanh & Đọc to văn bản"
          >
            <Settings size={18} className={showSettings ? 'animate-spin' : ''} />
          </button>

          {showSettings && (
            <QuizSettingsPopover
              ttsEnabled={ttsEnabled}
              setTtsEnabled={setTtsEnabled}
              musicEnabled={musicEnabled}
              setMusicEnabled={setMusicEnabled}
              sfxEnabled={sfxEnabled}
              setSfxEnabled={setSfxEnabled}
              onClose={() => setShowSettings(false)}
              onPlayClickSfx={() => playSfx('click')}
            />
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
