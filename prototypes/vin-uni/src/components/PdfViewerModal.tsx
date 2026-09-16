import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Presentation, HelpCircle, Sparkles, ChevronLeft, BookOpen,
  PanelLeftClose, PanelLeftOpen, X, Plus, ArrowUp, History,
  CheckCircle2, Bot, User, Copy, Lightbulb, Crop, Check,
  MessageSquare, BookmarkPlus
} from 'lucide-react';
import { ViewerToolbar, type ToolType, type ViewModeType } from './ViewerToolbar';

export interface ViewerItem {
  id: string;
  type: 'file' | 'quiz';
  title: string;
  subtitle?: string;
  category?: 'slide' | 'document' | 'quiz';
}

export interface ViewerModule {
  id: string;
  title: string;
  items: ViewerItem[];
}

type ContentSubTab = 'slides' | 'documents' | 'quizzes';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface PdfViewerModalProps {
  initialItem: ViewerItem;
  initialModule: ViewerModule;
  allModules: ViewerModule[];
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  initialItem, initialModule, allModules: _allModules, onClose,
}) => {
  const [activeItem, setActiveItem] = useState<ViewerItem>(initialItem);
  const [activeModule] = useState<ViewerModule>(initialModule);
  const [activeSubTab, setActiveSubTab] = useState<ContentSubTab>(
    initialItem.category === 'quiz' ? 'quizzes' : initialItem.category === 'document' ? 'documents' : 'slides'
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewModeType>('single');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedColor, setSelectedColor] = useState('#C8232C');
  const [strokeWidth, setStrokeWidth] = useState(3);
  
  // Left Panel (Notes) & Right Panel (AI Chat) default closed
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Panel Resizing State
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(380);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Notes per slide
  const [slideNotes, setSlideNotes] = useState<Record<number, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  // AI Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const totalPages = 12;

  // Resizing mouse move handlers
  const startResizingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLeft(true);
  };

  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mainContentRef.current) return;
      const rect = mainContentRef.current.getBoundingClientRect();
      const sidebarWidth = isSidebarOpen ? 256 : 0;

      if (isResizingLeft) {
        const newWidth = e.clientX - rect.left - sidebarWidth;
        if (newWidth >= 200 && newWidth <= 600) {
          setLeftWidth(newWidth);
        }
      }

      if (isResizingRight) {
        const newWidth = rect.right - e.clientX;
        if (newWidth >= 260 && newWidth <= 700) {
          setRightWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, isSidebarOpen]);

  // Auto scroll chat to bottom when messages update
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking]);

  const moduleSlides = activeModule.items.filter((i) => i.category === 'slide');
  const moduleDocs = activeModule.items.filter((i) => i.category === 'document');
  const moduleQuizzes = activeModule.items.filter((i) => i.category === 'quiz');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const handleSendMessage = (customPrompt?: string) => {
    const textToSend = customPrompt || chatInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');
    setIsThinking(true);

    setTimeout(() => {
      let responseText = '';
      const promptLower = textToSend.toLowerCase();

      if (promptLower.includes('tóm tắt')) {
        responseText = `📌 **Tóm tắt nội dung Slide ${currentPage} - ${activeItem.title}**:\n\n` +
          `1. **Khái niệm trọng tâm**: Định nghĩa cấu trúc cơ bản và luồng xử lý chính được trình bày ở trang ${currentPage}.\n` +
          `2. **Điểm cốt lõi**: Các công thức ma trận biến đổi và thuật toán đồ họa quan trọng.\n` +
          `3. **Ứng dụng**: Áp dụng trực tiếp vào pipeline rendering đồ họa 3D thời gian thực.`;
      } else if (promptLower.includes('trắc nghiệm') || promptLower.includes('câu hỏi') || promptLower.includes('ôn tập')) {
        responseText = `🎯 **3 Câu hỏi trắc nghiệm tự kiểm tra Slide ${currentPage}**:\n\n` +
          `**Câu 1:** Thành phần nào giữ vai trò quyết định trong việc tính toán màu sắc điểm ảnh?\n` +
          `  A. Vertex Shader   B. Fragment/Pixel Shader   C. Rasterizer   D. Texture Unit\n` +
          `  👉 *Gợi ý đáp án: B*\n\n` +
          `**Câu 2:** Ý nghĩa chính của công thức ở trang này là gì?\n` +
          `  👉 *Tối ưu hóa số lượng phép tính ma trận khi chuyển đổi không gian.*`;
      } else if (promptLower.includes('giải thích')) {
        responseText = `💡 **Giải thích dễ hiểu Slide ${currentPage}**:\n\n` +
          `Trang slide này minh họa cách máy tính chuyển các điểm trong không gian 3 chiều thành hình ảnh phẳng 2D trên màn hình.\n` +
          `• **Bắt đầu**: Xác định vị trí điểm trong không gian thế giới (World Space).\n` +
          `• **Kết quả**: Chiếu điểm lên mặt phẳng camera (Clip Space).\n` +
          `Mẹo: Hãy chú ý các đường nét đứt biểu diễn tia chiếu từ camera!`;
      } else {
        responseText = `Dựa vào slide bài giảng **"${activeItem.title}"** (Trang ${currentPage}):\n\n` +
          `Về thắc mắc *"${textToSend}"*, đây là nội dung quan trọng. Bạn có thể chèn câu trả lời này vào phần **Ghi chú bài học** bằng nút bên dưới để tiện ôn tập khi thi nhé!`;
      }

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiReply]);
      setIsThinking(false);
    }, 700);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertToNotes = (text: string) => {
    const currentText = slideNotes[currentPage] || '';
    const cleanText = text.replace(/\*\*/g, '').replace(/👉/g, '->');
    const newText = currentText ? `${currentText}\n\n[AI Gợi ý]:\n${cleanText}` : `[AI Gợi ý]:\n${cleanText}`;
    handleNoteChange(newText);
    if (!isNotesOpen) setIsNotesOpen(true);
  };

  const handleNoteChange = (text: string) => {
    setSlideNotes((prev) => ({
      ...prev,
      [currentPage]: text,
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleInsertTemplate = (tag: string) => {
    const currentText = slideNotes[currentPage] || '';
    const newText = currentText ? `${currentText}\n${tag} ` : `${tag} `;
    handleNoteChange(newText);
  };

  const subTabs = [
    { id: 'slides' as ContentSubTab, label: 'Slides', icon: <Presentation size={15} />, visible: moduleSlides.length > 0, items: moduleSlides },
    { id: 'documents' as ContentSubTab, label: 'Tài liệu', icon: <FileText size={15} />, visible: moduleDocs.length > 0, items: moduleDocs },
    { id: 'quizzes' as ContentSubTab, label: 'Quizz', icon: <HelpCircle size={15} />, visible: moduleQuizzes.length > 0, items: moduleQuizzes },
  ];

  const visibleSubTabs = subTabs.filter((t) => t.visible);
  const currentSubTab = visibleSubTabs.find((t) => t.id === activeSubTab) || visibleSubTabs[0];
  const currentItems = currentSubTab?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-xs">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-sm z-40">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold" title="Quay lại">
            <ChevronLeft size={18} /><span>Quay lại</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{activeItem.title}</h1>
            <p className="text-[11px] text-slate-500">{activeModule.title}</p>
          </div>
        </div>
      </div>

      {/* RESIZE MASK OVERLAY DURING DRAG */}
      {(isResizingLeft || isResizingRight) && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      {/* MAIN BODY AREA */}
      <div ref={mainContentRef} className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* LEFT SIDEBAR (Toggleable Course Content) */}
        {isSidebarOpen && (
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden transition-all z-30">
            {/* Sidebar Header with Title & Collapse Button */}
            <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-[#1E3A6E] font-bold text-xs">
                <BookOpen size={16} />
                <span>Nội dung bài học</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                title="Đóng sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            </div>

            {visibleSubTabs.length > 0 && (
              <div className="flex border-b border-slate-200 bg-slate-100/60 p-1 gap-1 shrink-0">
                {visibleSubTabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeSubTab === tab.id ? 'bg-[#1E3A6E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'}`}>
                    {tab.icon}<span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {currentItems.map((item) => (
                <button key={item.id} onClick={() => setActiveItem(item)} className={`w-full text-left p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-start gap-2.5 ${activeItem.id === item.id ? 'bg-blue-50 border border-blue-200 text-[#1E3A6E] font-semibold' : 'text-slate-700 hover:bg-slate-50 border border-transparent'}`}>
                  {item.category === 'quiz' ? <HelpCircle size={15} className="text-purple-600 shrink-0 mt-0.5" /> : item.category === 'document' ? <FileText size={15} className="text-emerald-600 shrink-0 mt-0.5" /> : <Presentation size={15} className="text-[#1E3A6E] shrink-0 mt-0.5" />}
                  <div>
                    <p className="line-clamp-2 leading-snug">{item.title}</p>
                    {item.subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</p>}
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* LEFT PANEL: GHI CHÚ BÀI HỌC (Resizable) */}
        {isNotesOpen && (
          <div
            style={{ width: `${leftWidth}px` }}
            className="bg-white border-r border-slate-200 flex flex-col shrink-0 relative shadow-sm z-20"
          >
            {/* Left Resizer Drag Handle */}
            <div
              onMouseDown={startResizingLeft}
              className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize hover:bg-amber-500/20 active:bg-amber-500/40 transition-colors z-40 group flex items-center justify-center -mr-1.5"
              title="Kéo để chỉnh kích thước ghi chú"
            >
              <div className="w-1 h-8 bg-slate-300 group-hover:bg-amber-500 rounded-full transition-colors" />
            </div>

            {/* Notes Panel Header */}
            <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Ghi chú bài học
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">Trang {currentPage} / {totalPages}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isSaved && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium animate-in fade-in">
                    <CheckCircle2 size={11} /> Đã lưu
                  </span>
                )}
                <button
                  onClick={() => setIsNotesOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors hover:bg-slate-100"
                  title="Thu gọn ghi chú"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Helper Tags */}
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => handleInsertTemplate('⭐️ [Quan trọng]:')}
                className="text-[10px] bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 px-2 py-1 rounded-md font-medium shrink-0 cursor-pointer"
              >
                ⭐ Quan trọng
              </button>
              <button
                onClick={() => handleInsertTemplate('❓ [Cần hỏi]:')}
                className="text-[10px] bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60 px-2 py-1 rounded-md font-medium shrink-0 cursor-pointer"
              >
                ❓ Cần hỏi
              </button>
              <button
                onClick={() => handleInsertTemplate('💡 [Ý chính]:')}
                className="text-[10px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-1 rounded-md font-medium shrink-0 cursor-pointer"
              >
                💡 Ý chính
              </button>
            </div>

            {/* Student Notebook Textarea */}
            <div className="flex-1 p-3 flex flex-col overflow-y-auto bg-gradient-to-b from-amber-50/15 via-white to-amber-50/10">
              <textarea
                value={slideNotes[currentPage] || ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={`Nhập ghi chú học tập cho Trang ${currentPage}...`}
                className="w-full flex-1 min-h-[200px] text-xs p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:border-[#1E3A6E] focus:ring-2 focus:ring-[#1E3A6E]/10 bg-white/90 leading-relaxed text-slate-800 shadow-inner font-sans"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                <span>{(slideNotes[currentPage] || '').length} ký tự</span>
                <span>Tự động lưu vào tài khoản</span>
              </div>
            </div>

            {/* Saved Slide Notes List Navigator */}
            <div className="border-t border-slate-100 p-2.5 bg-slate-50/50 max-h-36 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                Các trang đã ghi chú
              </div>
              <div className="space-y-1">
                {Object.entries(slideNotes).filter(([_, content]) => content.trim().length > 0).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic px-1">Chưa có ghi chú ở slide nào.</p>
                ) : (
                  Object.entries(slideNotes)
                    .filter(([_, content]) => content.trim().length > 0)
                    .map(([pageStr, content]) => {
                      const pNum = Number(pageStr);
                      return (
                        <button
                          key={pNum}
                          onClick={() => setCurrentPage(pNum)}
                          className={`w-full text-left p-1.5 rounded-lg text-[11px] border transition-all cursor-pointer flex items-center justify-between ${
                            pNum === currentPage
                              ? 'bg-amber-100/80 border-amber-300 text-amber-900 font-semibold'
                              : 'bg-white border-slate-200/70 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className="truncate flex-1">Slide {pNum}: {content}</span>
                        </button>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT VIEWPORT (Full-bleed slide canvas with floating overlay toolbar & controls) */}
        <div className="flex-1 flex min-w-0 bg-slate-900/10 overflow-hidden relative">
          {/* FLOATING SIDEBAR TOGGLE BUTTON (Far Left Overlay) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-3 left-3 z-30 p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-[#1E3A6E] hover:bg-blue-50 cursor-pointer transition-all flex items-center justify-center"
              title="Mở Nội dung bài học"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}

          {/* FLOATING CENTERED TOOLBAR OVERLAY */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-4rem)] overflow-visible">
            <ViewerToolbar
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              viewMode={viewMode}
              setViewMode={setViewMode}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              setIsNotesOpen={setIsNotesOpen}
              isNotesOpen={isNotesOpen}
              setIsAiChatOpen={setIsAiChatOpen}
              onRequestClearAll={() => {}}
            />
          </div>

          {/* CANVAS / PDF DISPLAY AREA */}
          <div className="flex-1 relative w-full h-full overflow-hidden bg-slate-100">
            <iframe
              key={`${activeItem.id}-${currentPage}`}
              src={`/DHMT_01.pdf#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
              className="absolute inset-0 w-full h-full border-none block bg-slate-100"
              title={activeItem.title}
              style={{ zoom: `${zoomLevel}%` }}
            />

          </div>

        {/* RIGHT PANEL: TRỢ GIẢNG AI (STUDENT-FRIENDLY & HIGHLY PROFESSIONAL) */}
        {isAiChatOpen && (
          <div
            style={{ width: `${rightWidth}px` }}
            className="bg-white border-l border-slate-200 flex flex-col shrink-0 relative shadow-lg z-20"
          >
            {/* Right Resizer Drag Handle */}
            <div
              onMouseDown={startResizingRight}
              className="absolute top-0 left-0 bottom-0 w-3 cursor-col-resize hover:bg-purple-500/20 active:bg-purple-500/40 transition-colors z-40 group flex items-center justify-center -ml-1.5"
              title="Kéo để chỉnh kích thước trợ giảng AI"
            >
              <div className="w-1 h-8 bg-slate-300 group-hover:bg-purple-500 rounded-full transition-colors" />
            </div>

            {/* AI Assistant Professional Header (VinUni Red & Navy Theme) */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#1E3A6E] via-[#1E3A6E] to-[#C8232C] text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1E3A6E] rounded-full" title="Trực tuyến" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs tracking-wide text-white">Trợ giảng AI VinUni</h3>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] px-1.5 py-0.2 rounded-full font-semibold">24/7</span>
                  </div>
                  <p className="text-[10px] text-slate-200/90">Hỗ trợ học tập bám sát bài giảng</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {chatMessages.length > 0 && (
                  <button
                    onClick={() => setChatMessages([])}
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
                    title="Hội thoại mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => alert("Tính năng xem lại Lịch sử chat")}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
                  title="Lịch sử chat"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAiChatOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
                  title="Đóng trợ giảng AI"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context bar indicating active slide */}
            <div className="bg-rose-50/70 px-3.5 py-2 border-b border-rose-100 flex items-center justify-between text-[11px] shrink-0">
              <span className="text-[#1E3A6E] font-medium truncate flex items-center gap-1.5">
                <BookOpen size={13} className="text-[#C8232C] shrink-0" />
                <span>Nội dung Slide {currentPage}: <strong className="font-semibold text-slate-800">{activeItem.title}</strong></span>
              </span>
              <span className="bg-white border border-rose-200 text-[#C8232C] text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 shadow-2xs">
                Trang {currentPage}
              </span>
            </div>

            {/* AI Assistant Body Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto py-6 px-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C8232C] to-[#1E3A6E] text-white flex items-center justify-center shadow-lg mb-3">
                    <Bot size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    {getGreeting()}, Tùng! 👋
                  </h4>
                  <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed mb-5">
                    Mình là Trợ giảng AI. Mình có thể giải thích slide, giải đáp bài tập hoặc tạo câu hỏi trắc nghiệm ôn tập cho bạn.
                  </p>

                  {/* Suggestion Prompts Cards for Students */}
                  <div className="w-full space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left pl-1">
                      Gợi ý câu hỏi cho Slide {currentPage}:
                    </p>

                    <button
                      onClick={() => handleSendMessage(`Tóm tắt nội dung chính của Slide ${currentPage}`)}
                      className="w-full p-2.5 bg-white hover:bg-rose-50/70 border border-slate-200/90 hover:border-rose-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 text-[#C8232C] shrink-0 group-hover:scale-105 transition-transform">
                        <Lightbulb size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#C8232C]">Tóm tắt ý chính Slide {currentPage}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Nắm bắt 3 nội dung quan trọng nhất trang này</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSendMessage(`Giải thích chi tiết khái niệm và công thức ở Slide ${currentPage}`)}
                      className="w-full p-2.5 bg-white hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100 text-[#1E3A6E] shrink-0 group-hover:scale-105 transition-transform">
                        <MessageSquare size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#1E3A6E]">Giải thích đơn giản dễ hiểu</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Phân tích thuật ngữ và sơ đồ minh họa</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSendMessage(`Tạo 3 câu hỏi trắc nghiệm ôn tập nhanh cho Slide ${currentPage}`)}
                      className="w-full p-2.5 bg-white hover:bg-rose-50/70 border border-slate-200/90 hover:border-rose-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs flex items-start gap-2.5"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 text-[#C8232C] shrink-0 group-hover:scale-105 transition-transform">
                        <HelpCircle size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-[#C8232C]">Tạo 3 câu hỏi ôn thi nhanh</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tự kiểm tra mức độ hiểu bài ngay lập tức</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} ${msg.role === 'assistant' ? 'mt-2' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-xs ${
                        msg.role === 'user' ? 'bg-[#1E3A6E]' : 'bg-[#C8232C]'
                      }`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={15} />}
                      </div>

                      {/* Message Box */}
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-[#1E3A6E] text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                      }`}>
                        <div className="whitespace-pre-wrap font-sans">
                          {msg.text}
                        </div>

                        {/* Action buttons for AI assistant replies */}
                        {msg.role === 'assistant' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{msg.timestamp}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleInsertToNotes(msg.text)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-[#C8232C] border border-rose-200 transition-colors font-medium cursor-pointer"
                                title="Chèn thông tin này vào Ghi chú bài học"
                              >
                                <BookmarkPlus size={11} />
                                <span>Lưu ghi chú</span>
                              </button>
                              <button
                                onClick={() => handleCopyMessage(msg.id, msg.text)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer transition-colors"
                                title="Sao chép câu trả lời"
                              >
                                {copiedId === msg.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        {msg.role === 'user' && (
                          <div className="text-[9px] mt-1 text-right text-white/70">
                            {msg.timestamp}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Thinking indicator */}
                  {isThinking && (
                    <div className="flex items-center gap-2 text-[#C8232C] bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl w-fit text-xs animate-pulse">
                      <Sparkles size={14} className="animate-spin text-[#C8232C]" />
                      <span>Trợ giảng AI VinUni đang suy nghĩ...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>

            {/* Prompt Shortcut Tools Bar */}
            <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0">
              <button
                onClick={() => {
                  setActiveTool('ai_crop');
                  handleSendMessage(`Khoanh vùng hỏi AI trên Slide ${currentPage}`);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 text-[#1E3A6E] border border-blue-200 rounded-md shrink-0 font-medium cursor-pointer transition-colors shadow-2xs"
              >
                <Crop size={12} className="text-[#1E3A6E]" />
                <span>Khoanh vùng slide</span>
              </button>
              <button
                onClick={() => handleSendMessage(`Tóm tắt ngắn gọn Slide ${currentPage}`)}
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-rose-50 text-[#C8232C] border border-rose-200 rounded-md shrink-0 font-medium cursor-pointer transition-colors shadow-2xs"
              >
                <Lightbulb size={12} className="text-[#C8232C]" />
                <span>Tóm tắt slide</span>
              </button>
              <button
                onClick={() => handleSendMessage(`Tạo 3 câu hỏi ôn tập Slide ${currentPage}`)}
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-rose-50 text-[#C8232C] border border-rose-200 rounded-md shrink-0 font-medium cursor-pointer transition-colors shadow-2xs"
              >
                <HelpCircle size={12} className="text-[#C8232C]" />
                <span>Hỏi trắc nghiệm</span>
              </button>
            </div>

            {/* AI Input Area */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-[#C8232C] focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100 transition-all p-1.5 pl-3.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Hỏi Trợ giảng AI về Slide ${currentPage}...`}
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent border-none outline-none pr-10"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim()}
                  className={`absolute right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    chatInput.trim() ? 'bg-gradient-to-tr from-[#C8232C] to-[#1E3A6E] text-white shadow-sm hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Gửi câu hỏi"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2 font-normal">
                Trợ giảng AI hỗ trợ giải đáp 24/7 bám sát giáo trình VinUni.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
