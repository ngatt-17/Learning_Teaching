import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUp, Bot, BookmarkPlus, CheckCircle2, ChevronLeft, FileText, Loader2, MessageSquare, NotebookPen, User, X } from 'lucide-react';
import { ai, platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import { isStaff } from '../../lib/roles';
import type { AiCitation, ChatAnswer, Note } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDateTime } from '../../lib/format';
import { CitationList, RichText } from '../../components/RichText';
import { OwnerOnlyBadge } from '../../components/Badges';
import { InlineError } from '../../components/StateViews';
import { SlideViewer, type PagesPayload } from './SlideViewer';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  citations?: AiCitation[];
  generation?: ChatAnswer['generation'];
  insufficient?: boolean;
  failed?: boolean;
}

const firstSentence = (text: string) => {
  const sentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return sentence.length > 140 ? `${sentence.slice(0, 137)}…` : sentence;
};

/**
 * Student 3-in-1 workspace: private notes (left) · approved material (centre) · grounded AI (right).
 * Notes are stored through the Platform's owner-only RLS table; the AI never reads them.
 */
export function MaterialWorkspace() {
  const { courseId = '', materialId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const staff = isStaff(user.role);

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : null;
  const setPage = useCallback(
    (p: number) => setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    }, { replace: true }),
    [setSearchParams],
  );

  const [payload, setPayload] = useState<PagesPayload | null>(null);
  const [notesOpen, setNotesOpen] = useState(!staff);
  const [chatOpen, setChatOpen] = useState(true);

  const currentPage = payload?.pages.find((p) => p.page_number === page) ?? payload?.pages[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0">
            <ChevronLeft size={18} />
            <span>Quay lại</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-800 truncate">{payload?.material.title ?? 'Tài liệu'}</h1>
            <p className="text-[11px] text-slate-500 truncate">
              {payload?.material.week_number ? `Week ${payload.material.week_number} • ${payload.material.lesson_title ?? ''}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!staff && (
            <button
              onClick={() => setNotesOpen((o) => !o)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${notesOpen ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              <NotebookPen size={14} /> Ghi chú riêng
            </button>
          )}
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${chatOpen ? 'bg-[#EDF2FA] border-[#1E3A6E]/20 text-[#1E3A6E]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            <MessageSquare size={14} /> Trợ giảng AI
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {notesOpen && !staff && payload && currentPage && (
          <NotesPanel
            courseId={courseId}
            materialId={materialId}
            materialTitle={payload.material.title}
            page={currentPage.page_number}
            onClose={() => setNotesOpen(false)}
          />
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <SlideViewer courseId={courseId} materialId={materialId} page={page} onPageChange={setPage} onLoaded={setPayload} />
        </div>

        {chatOpen && payload && (
          <ChatPanel
            courseId={courseId}
            materialId={materialId}
            page={currentPage?.page_number ?? null}
            pageText={currentPage?.content ?? ''}
            canSaveToNotes={!staff}
            onClose={() => setChatOpen(false)}
            onCite={(c) => (c.material_id === materialId ? setPage(c.page) : navigate(`/courses/${courseId}/materials/${c.material_id}?page=${c.page}`))}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── private notes ───────────────────────────

// Lets the chat panel append an answer to the open note without prop drilling.
const noteAppendListeners = new Set<(text: string) => void>();

function NotesPanel({
  courseId,
  materialId,
  materialTitle,
  page,
  onClose,
}: {
  courseId: string;
  materialId: string;
  materialTitle: string;
  page: number;
  onClose: () => void;
}) {
  const { data: notes, setData, error: loadError } = useAsync(
    () => platform.get<Note[]>(`/courses/${courseId}/notes?material_id=${materialId}`),
    [courseId, materialId],
  );
  const note = notes?.find((n) => n.page_number === page);

  const onSaved = useCallback(
    (saved: Note) =>
      setData((list) => (list.some((n) => n.id === saved.id) ? list.map((n) => (n.id === saved.id ? { ...n, ...saved } : n)) : [saved, ...list])),
    [setData],
  );

  const pagesWithNotes = (notes ?? []).filter((n) => n.page_number !== null && n.content.trim());

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-10">
      <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800">Ghi chú bài học</h2>
            <span className="text-[11px] text-slate-500 font-medium">Trang {page}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-100" title="Thu gọn ghi chú">
          <X size={16} />
        </button>
      </div>
      <div className="px-3 py-2 border-b border-slate-100">
        <OwnerOnlyBadge />
      </div>
      <div className="flex-1 p-3 flex flex-col overflow-y-auto gap-2">
        {loadError && <InlineError message={loadError.detail} />}
        {notes && (
          <PageNoteEditor
            key={page}
            courseId={courseId}
            materialId={materialId}
            materialTitle={materialTitle}
            page={page}
            note={note}
            onSaved={onSaved}
          />
        )}
      </div>
      {pagesWithNotes.length > 0 && (
        <div className="border-t border-slate-100 p-2.5 bg-slate-50/50 max-h-36 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Các trang đã ghi chú</div>
          {pagesWithNotes.map((n) => (
            <p key={n.id} className={`text-[11px] truncate px-1 py-0.5 ${n.page_number === page ? 'text-amber-900 font-semibold' : 'text-slate-600'}`}>
              Trang {n.page_number}: {n.content}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Editor for one page's note; remounted per page so its text always starts from the stored note. */
function PageNoteEditor({
  courseId,
  materialId,
  materialTitle,
  page,
  note,
  onSaved,
}: {
  courseId: string;
  materialId: string;
  materialTitle: string;
  page: number;
  note: Note | undefined;
  onSaved: (note: Note) => void;
}) {
  const [text, setText] = useState(note?.content ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const dirty = text !== (note?.content ?? '');

  const save = useCallback(
    async (content: string) => {
      setStatus('saving');
      setError(null);
      try {
        const saved = note
          ? await platform.patch<Note>(`/notes/${note.id}`, { content })
          : await platform.post<Note>(`/courses/${courseId}/notes`, {
              title: `${materialTitle} — Trang ${page}`,
              content,
              material_id: materialId,
              page_number: page,
            });
        onSaved(saved);
        setStatus('saved');
      } catch (err) {
        setError(errorMessage(err));
        setStatus('idle');
      }
    },
    [note, courseId, materialId, materialTitle, page, onSaved],
  );

  // The chat panel's "Lưu ghi chú" appends to whatever the student currently has open.
  const latest = useRef({ text, save });
  useEffect(() => {
    latest.current = { text, save };
  });
  useEffect(() => {
    const append = (snippet: string) => {
      const current = latest.current.text;
      const next = current ? `${current}\n\n[AI gợi ý]\n${snippet}` : `[AI gợi ý]\n${snippet}`;
      setText(next);
      void latest.current.save(next);
    };
    noteAppendListeners.add(append);
    return () => {
      noteAppendListeners.delete(append);
    };
  }, []);

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus('idle');
        }}
        placeholder={`Nhập ghi chú riêng cho Trang ${page}...`}
        className="w-full flex-1 min-h-[200px] text-xs p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-[#1E3A6E] focus:ring-2 focus:ring-[#1E3A6E]/10 bg-white leading-relaxed text-slate-800"
      />
      <InlineError message={error} />
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>
          {status === 'saved' ? (
            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Đã lưu</span>
          ) : note ? (
            `Cập nhật ${formatDateTime(note.updated_at)}`
          ) : (
            'Chưa lưu'
          )}
        </span>
        <button
          onClick={() => save(text)}
          disabled={!dirty || status === 'saving' || !text.trim()}
          className="px-2.5 py-1 rounded-md bg-[#1E3A6E] text-white text-[11px] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Đang lưu…' : 'Lưu ghi chú'}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────── grounded chat ───────────────────────────

function ChatPanel({
  courseId,
  materialId,
  page,
  pageText,
  canSaveToNotes,
  onClose,
  onCite,
}: {
  courseId: string;
  materialId: string;
  page: number | null;
  pageText: string;
  canSaveToNotes: boolean;
  onClose: () => void;
  onCite: (citation: AiCitation) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || pending) return;
    setInput('');
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: q }]);
    setPending(true);
    try {
      const res = await ai.post<ChatAnswer>(`/courses/${courseId}/chat`, { question: q, material_id: materialId, page_number: page });
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: 'assistant',
          text: res.answer,
          citations: res.citations,
          generation: res.generation,
          insufficient: res.evidence_level === 'insufficient',
        },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', text: `Không kết nối được Trợ giảng AI: ${errorMessage(err)}`, failed: true }]);
    } finally {
      setPending(false);
    }
  };

  const suggestion = pageText ? `Giải thích giúp em: ${firstSentence(pageText)}` : null;

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-lg z-10">
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EDF2FA] border border-[#1E3A6E]/15 flex items-center justify-center">
            <Bot size={18} className="text-[#1E3A6E]" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              Trợ giảng AI VinUni <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </h3>
            <p className="text-[10px] text-slate-500">Chỉ trả lời từ tài liệu đã được duyệt</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer" title="Đóng trợ giảng AI">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-center py-6 px-2">
            <div className="w-12 h-12 rounded-xl bg-[#1E3A6E] text-white flex items-center justify-center mx-auto mb-3">
              <Bot size={24} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hỏi về nội dung môn học. Mỗi câu trả lời kèm trích dẫn trang; nếu tài liệu đã duyệt không đủ thông tin, trợ giảng sẽ nói rõ.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${msg.role === 'user' ? 'bg-[#1E3A6E]' : 'bg-[#C8232C]'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={15} />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-[#1E3A6E] text-white rounded-tr-none'
                  : msg.failed
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none'
                    : msg.insufficient
                      ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              <RichText text={msg.text} citations={msg.citations} onCite={onCite} />
              {msg.citations && <CitationList citations={msg.citations} onCite={onCite} />}
              {msg.role === 'assistant' && !msg.failed && (
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span>{msg.generation === 'extractive' ? 'Chế độ trích dẫn — chưa bật LLM' : ''}</span>
                  {canSaveToNotes && !msg.insufficient && (
                    <button
                      onClick={() => noteAppendListeners.forEach((fn) => fn(msg.text))}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-[#C8232C] border border-rose-200 font-medium cursor-pointer"
                      title="Chèn câu trả lời vào ghi chú riêng của trang này"
                    >
                      <BookmarkPlus size={11} /> Lưu ghi chú
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Loader2 size={13} className="animate-spin" /> Đang tìm trong tài liệu đã duyệt…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestion && (
        <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200/80 text-[10px]">
          <button onClick={() => ask(suggestion)} disabled={pending} className="w-full text-left px-2 py-1 bg-white hover:bg-[#EDF2FA] text-[#1E3A6E] border border-slate-200 rounded-md font-medium cursor-pointer truncate disabled:opacity-50">
            Hỏi về trang {page}: {firstSentence(pageText)}
          </button>
        </div>
      )}

      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-[#1E3A6E] focus-within:bg-white transition-all p-1.5 pl-3.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(input)}
            placeholder={`Hỏi Trợ giảng AI về trang ${page ?? ''}...`}
            maxLength={1000}
            className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent border-none outline-none pr-10"
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || pending}
            className="absolute right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-[#1E3A6E] text-white disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
            title="Gửi câu hỏi"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
