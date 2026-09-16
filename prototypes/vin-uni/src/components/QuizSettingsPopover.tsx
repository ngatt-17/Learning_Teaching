import React from 'react';
import { Volume2, VolumeX, Music, Bell, X } from 'lucide-react';

interface QuizSettingsPopoverProps {
  ttsEnabled: boolean;
  setTtsEnabled: (val: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (val: boolean) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (val: boolean) => void;
  onClose: () => void;
  onPlayClickSfx: () => void;
}

export const QuizSettingsPopover: React.FC<QuizSettingsPopoverProps> = ({
  ttsEnabled,
  setTtsEnabled,
  musicEnabled,
  setMusicEnabled,
  sfxEnabled,
  setSfxEnabled,
  onClose,
  onPlayClickSfx,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-2xl z-50 space-y-3 text-slate-100 text-xs">
      <div className="font-bold text-emerald-400 border-b border-slate-800 pb-2 flex items-center justify-between">
        <span>Cài đặt Quizz</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Toggle 1: Đọc to văn bản (TTS) */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80">
        <div className="flex items-center gap-2">
          {ttsEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} className="text-slate-400" />}
          <span>Đọc to văn bản (TTS)</span>
        </div>
        <button
          onClick={() => {
            setTtsEnabled(!ttsEnabled);
            onPlayClickSfx();
          }}
          className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
            ttsEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Toggle 2: Nhạc nền */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80">
        <div className="flex items-center gap-2">
          <Music size={16} className="text-emerald-400" />
          <span>Nhạc nền (BGM)</span>
        </div>
        <button
          onClick={() => {
            setMusicEnabled(!musicEnabled);
            onPlayClickSfx();
          }}
          className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
            musicEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Toggle 3: Hiệu ứng âm thanh */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-emerald-400" />
          <span>Hiệu ứng âm thanh</span>
        </div>
        <button
          onClick={() => {
            setSfxEnabled(!sfxEnabled);
            onPlayClickSfx();
          }}
          className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
            sfxEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
          }`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md" />
        </button>
      </div>
    </div>
  );
};
