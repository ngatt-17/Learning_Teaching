import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import type { AiCitation } from '../../lib/types';
import { CitationList, RichText } from '../../components/RichText';
import type { TutorMessage } from './useQuizTutor';

export interface TutorChip {
  label: string;
  onClick: () => void;
}

/** Right-hand "Trợ lý AI Socratic" column of the exam view. */
export function TutorPanel({
  messages,
  pending,
  chips,
  onSend,
  onCite,
}: {
  messages: TutorMessage[];
  pending: boolean;
  chips: TutorChip[];
  onSend: (text: string) => void;
  onCite: (citation: AiCitation) => void;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  const submit = () => {
    const text = input.trim();
    if (!text || pending) return;
    onSend(text);
    setInput('');
  };

  return (
    <aside className="w-80 xl:w-96 shrink-0 h-full border-l border-slate-200 bg-white flex flex-col z-20 shadow-xs" aria-label="Trợ lý AI Socratic">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EDF2FA] border border-[#1E3A6E]/15 flex items-center justify-center">
            <Bot size={18} className="text-[#1E3A6E]" />
          </div>
          <div>
            <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5 text-slate-900">
              <span>Trợ lý AI Socratic</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Trực tuyến" />
            </h4>
            <span className="text-[10px] text-slate-500">Giải thích cặn kẽ bài kiểm tra</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-full text-slate-600">24/7</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 text-xs" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === 'user' ? 'bg-[#1E3A6E] text-white' : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {msg.sender === 'user' ? <User size={12} /> : <Bot size={13} />}
            </div>
            <div
              className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#1E3A6E] text-white rounded-tr-none text-xs font-medium'
                  : msg.failed
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none text-[11.5px]'
                    : msg.insufficient
                      ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-none text-[11.5px]'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs text-[11.5px]'
              }`}
            >
              <RichText text={msg.text} citations={msg.citations} onCite={onCite} />
              {msg.citations && <CitationList citations={msg.citations} onCite={onCite} />}
              {msg.generation === 'extractive' && (
                <div className="mt-1.5 text-[9.5px] text-slate-400" title="Chưa cấu hình LLM: câu trả lời được ghép từ câu trong tài liệu đã duyệt.">
                  Chế độ trích dẫn — chưa bật LLM
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Loader2 size={13} className="animate-spin" /> Trợ lý đang đọc tài liệu…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {chips.length > 0 && (
        <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto text-[10.5px]">
          {chips.map((chip) => (
            <button
              key={chip.label}
              onClick={chip.onClick}
              disabled={pending}
              className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-[#1E3A6E] rounded-md font-medium shrink-0 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Hỏi AI về bất kỳ câu hỏi nào..."
          maxLength={1000}
          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-[#1E3A6E] text-slate-800"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !input.trim()}
          className="p-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white rounded-xl cursor-pointer transition-colors shadow-2xs shrink-0 disabled:opacity-50"
          title="Gửi câu hỏi"
        >
          <Send size={14} />
        </button>
      </div>
    </aside>
  );
}
