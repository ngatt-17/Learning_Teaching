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
 * Student 3-in-1 workspace:
 * - Private notes for the entire slide (left) with resizable width
 * - Full vertical slide reader (centre)
 * - Grounded AI assistant (right) with resizable width
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

  // ── Resizable widths for Left (Notes) and Right (Chat) panels ──
  const [notesWidth, setNotesWidth] = useState(330);
  const [chatWidth, setChatWidth] = useState(380);
  const [isResizingNotes, setIsResizingNotes] = useState(false);
  const [isResizingChat, setIsResizingChat] = useState(false);

  const startResizeNotes = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingNotes(true);
  };

  const startResizeChat = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingChat(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingNotes) {
        const newWidth = Math.min(Math.max(220, e.clientX), 600);
        setNotesWidth(newWidth);
      }
      if (isResizingChat) {
        const newWidth = Math.min(Math.max(260, window.innerWidth - e.clientX), 700);
        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingNotes(false);
      setIsResizingChat(false);
    };

    if (isResizingNotes || isResizingChat) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingNotes, isResizingChat]);

  const currentPage = payload?.pages.find((p) => p.page_number === page) ?? payload?.pages[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* Workspace Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-xs z-10">
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer transition-colors ${notesOpen ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              <NotebookPen size={14} /> Ghi chú riêng
            </button>
          )}
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer transition-colors ${chatOpen ? 'bg-[#EDF2FA] border-[#1E3A6E]/20 text-[#1E3A6E]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            <MessageSquare size={14} /> Trợ giảng AI
          </button>
        </div>
      </div>

      {/* 3-Column Resizable Body */}
      <div className={`flex-1 flex min-h-0 overflow-hidden relative ${isResizingNotes || isResizingChat ? 'select-none' : ''}`}>
        {/* Left Column: Private Notes (for whole slide) */}
        {notesOpen && !staff && payload && (
          <div style={{ width: `${notesWidth}px` }} className="shrink-0 flex flex-col min-w-0 h-full border-r border-slate-200 bg-white shadow-xs z-10">
            <NotesPanel
              courseId={courseId}
              materialId={materialId}
              materialTitle={payload.material.title}
              onClose={() => setNotesOpen(false)}
            />
          </div>
        )}

        {/* Resizer Handle: Notes <-> Slide */}
        {notesOpen && !staff && (
          <div
            onMouseDown={startResizeNotes}
            title="Kéo sang trái/phải để điều chỉnh chiều rộng Ghi chú"
            className="w-1.5 hover:w-2 hover:bg-[#1E3A6E] active:bg-[#1E3A6E] bg-slate-200 cursor-col-resize shrink-0 transition-all z-20"
          />
        )}

        {/* Center Column: SlideViewer (Full vertical scroll of all slides) */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          <SlideViewer courseId={courseId} materialId={materialId} page={page} onPageChange={setPage} onLoaded={setPayload} />
        </div>

        {/* Resizer Handle: Slide <-> AI Chat */}
        {chatOpen && (
          <div
            onMouseDown={startResizeChat}
            title="Kéo sang trái/phải để điều chỉnh chiều rộng Trợ giảng AI"
            className="w-1.5 hover:w-2 hover:bg-[#1E3A6E] active:bg-[#1E3A6E] bg-slate-200 cursor-col-resize shrink-0 transition-all z-20"
          />
        )}

        {/* Right Column: Grounded AI Assistant */}
        {chatOpen && payload && (
          <div style={{ width: `${chatWidth}px` }} className="shrink-0 flex flex-col min-w-0 h-full border-l border-slate-200 bg-white shadow-xs z-10">
            <ChatPanel
              courseId={courseId}
              materialId={materialId}
              page={currentPage?.page_number ?? null}
              pageText={currentPage?.content ?? ''}
              canSaveToNotes={!staff}
              onClose={() => setChatOpen(false)}
              onCite={(c) => (c.material_id === materialId ? setPage(c.page) : navigate(`/courses/${courseId}/materials/${c.material_id}?page=${c.page}`))}
            />
          </div>
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
  onClose,
}: {
  courseId: string;
  materialId: string;
  materialTitle: string;
  onClose: () => void;
}) {
  const { data: notes, setData, error: loadError } = useAsync(
    () => platform.get<Note[]>(`/courses/${courseId}/notes?material_id=${materialId}`),
    [courseId, materialId],
  );

  // Single unified note for this material
  const primaryNote = notes?.[0];

  const onSaved = useCallback(
    (saved: Note) =>
      setData((list) => (list.some((n) => n.id === saved.id) ? list.map((n) => (n.id === saved.id ? { ...n, ...saved } : n)) : [saved, ...list])),
    [setData],
  );

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Panel Header */}
      <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-800">Ghi chú bài học</h2>
            <span className="text-[11px] text-slate-500 font-medium truncate block">
              Toàn bộ slide • {materialTitle}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 shrink-0" title="Thu gọn ghi chú">
          <X size={16} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <OwnerOnlyBadge />
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-3 flex flex-col overflow-y-auto gap-2 min-h-0">
        {loadError && <InlineError message={loadError.detail} />}
        {notes && (
          <SlideNoteEditor
            key={primaryNote?.id ?? 'new'}
            courseId={courseId}
            materialId={materialId}
            materialTitle={materialTitle}
            note={primaryNote}
            onSaved={onSaved}
          />
        )}
      </div>

      {/* Past notes list for this material if any extra */}
      {(notes ?? []).length > 1 && (
        <div className="border-t border-slate-100 p-2.5 bg-slate-50/50 max-h-36 overflow-y-auto shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Ghi chú khác của bài học</div>
          {(notes ?? []).slice(1).map((n) => (
            <p key={n.id} className="text-[11px] truncate px-1 py-0.5 text-slate-600">
              {n.title}: {n.content}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Editor for the whole slide deck's note; not split by page. */
function SlideNoteEditor({
  courseId,
  materialId,
  materialTitle,
  note,
  onSaved,
}: {
  courseId: string;
  materialId: string;
  materialTitle: string;
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
              title: `Ghi chú: ${materialTitle}`,
              content,
              material_id: materialId,
              page_number: null,
            });
        onSaved(saved);
        setStatus('saved');
      } catch (err) {
        setError(errorMessage(err));
        setStatus('idle');
      }
    },
    [note, courseId, materialId, materialTitle, onSaved],
  );

  // The chat panel's "Lưu ghi chú" appends to this unified slide note
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
        placeholder="Nhập ghi chú riêng cho toàn bộ slide bài học này..."
        className="w-full flex-1 min-h-[220px] text-xs p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-[#1E3A6E] focus:ring-2 focus:ring-[#1E3A6E]/10 bg-white leading-relaxed text-slate-800"
      />
      <InlineError message={error} />
      <div className="flex items-center justify-between text-[10px] text-slate-400 shrink-0 pt-1">
        <span>
          {status === 'saved' ? (
            <span className="text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 size={11} /> Đã lưu</span>
          ) : note ? (
            `Cập nhật ${formatDateTime(note.updated_at)}`
          ) : (
            'Chưa lưu'
          )}
        </span>
        <button
          onClick={() => save(text)}
          disabled={!dirty || status === 'saving' || !text.trim()}
          className="px-3 py-1.5 rounded-md bg-[#1E3A6E] hover:bg-[#152B52] text-white text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
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
  const [asking, setAsking] = useState(false);
  const [savedMessageId, setSavedMessageId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, asking]);

  const ask = async (override?: string) => {
    const q = (override ?? input).trim();
    if (!q || asking) return;
    setInput('');
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setAsking(true);

    try {
      const res = await ai.post<ChatAnswer>(`/courses/${courseId}/chat`, {
        question: q,
        material_id: materialId,
        page,
        allow_web_search: false,
      });
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: res.answer,
        citations: res.citations,
        generation: res.generation,
        insufficient: res.evidence_level === 'insufficient',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Trợ giảng AI tạm thời không phản hồi. Vui lòng thử lại sau ít phút.',
          failed: true,
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const saveToNote = (msg: ChatMessage) => {
    noteAppendListeners.forEach((listener) => listener(msg.text));
    setSavedMessageId(msg.id);
    setTimeout(() => setSavedMessageId((id) => (id === msg.id ? null : id)), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-[#1E3A6E] text-white shrink-0">
            <Bot size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-800 truncate">Trợ giảng AI VinUni</h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-400 truncate">Chỉ trả lời từ tài liệu đã được duyệt</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 shrink-0" title="Thu gọn trợ giảng">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Bot size={20} />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Hỏi về nội dung môn học. Mỗi câu trả lời kèm trích dẫn trang; nếu tài liệu đã duyệt không đủ thông tin, trợ giảng sẽ nói rõ.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#1E3A6E] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user' ? 'bg-[#1E3A6E] text-white rounded-tr-xs' : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                }`}
              >
                <RichText text={m.text} citations={m.citations} onCite={onCite} />
                {m.citations && m.citations.length > 0 && <CitationList citations={m.citations} onCite={onCite} />}
                {m.role === 'assistant' && canSaveToNotes && !m.failed && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-end">
                    <button
                      onClick={() => saveToNote(m)}
                      className="text-[10px] text-slate-500 hover:text-[#1E3A6E] flex items-center gap-1 cursor-pointer"
                    >
                      <BookmarkPlus size={11} />
                      {savedMessageId === m.id ? 'Đã thêm vào ghi chú!' : 'Lưu ghi chú'}
                    </button>
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={12} />
                </div>
              )}
            </div>
          ))
        )}
        {asking && (
          <div className="flex gap-2 items-center text-xs text-slate-400 italic">
            <Loader2 size={12} className="animate-spin" /> Trợ giảng đang tra cứu tài liệu…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2.5 border-t border-slate-200 bg-slate-50 shrink-0">
        {pageText && (
          <button
            onClick={() => ask(`Giải thích ngắn gọn nội dung trang ${page}: "${firstSentence(pageText)}"`)}
            className="w-full text-left text-[11px] text-slate-600 hover:text-[#1E3A6E] bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-2 mb-2 truncate block cursor-pointer transition-colors"
            title="Hỏi về trang này"
          >
            Hỏi về trang {page}: {firstSentence(pageText)}
          </button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={page ? `Hỏi Trợ giảng AI về trang ${page}…` : 'Hỏi Trợ giảng AI…'}
            className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1E3A6E]"
          />
          <button
            type="submit"
            disabled={!input.trim() || asking}
            className="p-2 bg-[#1E3A6E] hover:bg-[#152B52] disabled:opacity-40 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
