import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil, Highlighter, Eraser, Type, Image as ImageIcon, Sparkles,
  StickyNote, RotateCcw, Trash2, Plus, Minus,
  Maximize2, Minimize2, BookOpen, LayoutGrid, ScrollText, Check, ChevronLeft, ChevronRight,
  ChevronDown, Edit3, MousePointer, ChevronUp, Sliders
} from 'lucide-react';

export type ToolType = 'select' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'image' | 'ai_crop';
export type ViewModeType = 'single' | 'two' | 'scroll';

export interface ViewerToolbarProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  viewMode: ViewModeType;
  setViewMode: (mode: ViewModeType) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isFullscreen: boolean;
  setIsFullscreen: (full: boolean) => void;
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  setIsNotesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNotesOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  onRequestClearAll: () => void;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = (props) => {
  const {
    currentPage, totalPages, setCurrentPage, viewMode, setViewMode,
    zoomLevel, setZoomLevel, isFullscreen, setIsFullscreen,
    activeTool, setActiveTool, selectedColor, setSelectedColor,
    strokeWidth, setStrokeWidth,
    setIsNotesOpen, isNotesOpen, setIsAiChatOpen, onRequestClearAll,
  } = props;

  const [isDrawToolsOpen, setIsDrawToolsOpen] = useState(false);
  const [isViewModeOpen, setIsViewModeOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const drawToolsRef = useRef<HTMLDivElement>(null);
  const viewModeRef = useRef<HTMLDivElement>(null);
  const clearConfirmRef = useRef<HTMLDivElement>(null);

  const colors = ['#C8232C', '#1E3A6E', '#059669', '#D97706', '#2563EB', '#7C3AED', '#000000', '#FFFFFF'];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawToolsRef.current && !drawToolsRef.current.contains(e.target as Node)) setIsDrawToolsOpen(false);
      if (viewModeRef.current && !viewModeRef.current.contains(e.target as Node)) setIsViewModeOpen(false);
      if (clearConfirmRef.current && !clearConfirmRef.current.contains(e.target as Node)) setShowClearConfirm(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const drawingToolsList: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select Pointer', icon: <MousePointer size={16} /> },
    { id: 'pen', label: 'Pen Tool', icon: <Pencil size={16} /> },
    { id: 'highlighter', label: 'Highlighter', icon: <Highlighter size={16} /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser size={16} /> },
    { id: 'text', label: 'Add Text', icon: <Type size={16} /> },
    { id: 'image', label: 'Add Image', icon: <ImageIcon size={16} /> },
  ];

  const viewModesList: { id: ViewModeType; label: string; icon: React.ReactNode }[] = [
    { id: 'single', label: 'Single Page', icon: <BookOpen size={16} /> },
    { id: 'two', label: 'Two Page', icon: <LayoutGrid size={16} /> },
    { id: 'scroll', label: 'Vertical Scroll', icon: <ScrollText size={16} /> },
  ];

  const currentViewModeLabel = viewModesList.find((v) => v.id === viewMode)?.label || 'Single Page';
  

  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-white/95 backdrop-blur-md hover:bg-[#1E3A6E] hover:text-white text-slate-700 px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/80 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          title="Hiện thanh công cụ"
        >
          <Sliders size={14} className="text-[#C8232C]" />
          <span>Hiện thanh công cụ</span>
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl px-3 py-1 flex items-center justify-between text-xs z-30 select-none whitespace-nowrap min-w-max">
      {/* CLUSTER 1: Navigation, View Mode, Zoom & Fullscreen */}
      <div className="flex items-center gap-2 pr-3 mr-2 border-r border-slate-200">
        {/* Page Nav */}
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-0.5 border border-slate-200">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 text-slate-600 hover:text-[#1E3A6E] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors" title="Previous Page">
            <ChevronLeft size={16} />
          </button>
          <span className="px-1 text-xs font-semibold text-slate-700 min-w-[48px] text-center font-mono">
            {currentPage} / {totalPages}
          </span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 text-slate-600 hover:text-[#1E3A6E] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors" title="Next Page">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* View Mode Popover Dropdown */}
        <div className="relative" ref={viewModeRef}>
          <button onClick={() => setIsViewModeOpen(!isViewModeOpen)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors" title="View Mode">
            {viewModesList.find((v) => v.id === viewMode)?.icon}
            <span className="text-xs">{currentViewModeLabel}</span>
            <ChevronDown size={14} />
          </button>
          {isViewModeOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xl z-50 w-48 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">View Mode</div>
              {viewModesList.map((vm) => (
                <button key={vm.id} onClick={() => { setViewMode(vm.id); setIsViewModeOpen(false); }} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${viewMode === vm.id ? 'bg-[#1E3A6E] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <div className="flex items-center gap-2">{vm.icon}<span>{vm.label}</span></div>
                  {viewMode === vm.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls: ONLY + and - without percentage text */}
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
          <button onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} className="p-1 text-slate-600 hover:text-[#1E3A6E] hover:bg-white rounded cursor-pointer transition-colors font-bold" title={`Zoom Out (${zoomLevel}%)`}>
            <Minus size={15} />
          </button>
          <button onClick={() => setZoomLevel((z) => Math.min(200, z + 10))} className="p-1 text-slate-600 hover:text-[#1E3A6E] hover:bg-white rounded cursor-pointer transition-colors font-bold" title={`Zoom In (${zoomLevel}%)`}>
            <Plus size={15} />
          </button>
        </div>

        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#1E3A6E] cursor-pointer transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* CLUSTER 2: Drawing Tools Popover */}
      <div className="flex items-center gap-2 pr-3 mr-2 border-r border-slate-200 relative" ref={drawToolsRef}>
        <button onClick={() => setIsDrawToolsOpen(!isDrawToolsOpen)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${isDrawToolsOpen || activeTool !== 'select' ? 'bg-[#1E3A6E] text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`} title="Drawing Tools">
          <Edit3 size={16} />
          <span className="font-semibold text-xs">Draw Tools</span>
          <div className="w-3.5 h-3.5 rounded-full border border-white ml-0.5 shadow-xs" style={{ backgroundColor: selectedColor }} />
          <ChevronDown size={14} />
        </button>
        {isDrawToolsOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-50 w-64 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tools</div>
              <div className="grid grid-cols-2 gap-1.5">
                {drawingToolsList.map((t) => (
                  <button key={t.id} onClick={() => { setActiveTool(t.id); }} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${activeTool === t.id ? 'bg-[#1E3A6E] text-white font-semibold' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                    {t.icon}<span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color Palette</div>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <button key={c} onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full cursor-pointer transition-all flex items-center justify-center ${selectedColor === c ? 'ring-2 ring-offset-1 ring-[#1E3A6E] scale-110' : 'hover:scale-110'} ${c === '#FFFFFF' ? 'border border-slate-300' : ''}`} style={{ backgroundColor: c }}>
                    {selectedColor === c && <Check size={12} className={c === '#FFFFFF' || c === '#D97706' ? 'text-slate-800' : 'text-white'} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Stroke Width</span>
                <span className="text-[#1E3A6E] font-bold text-xs">{strokeWidth}px</span>
              </div>
              <input type="range" min="1" max="20" value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#C8232C]" />
            </div>
          </div>
        )}
      </div>

      {/* CLUSTER 3: AI & Notes (Icons ONLY) */}
      <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-slate-200">
        <button
          onClick={() => { setActiveTool('ai_crop'); setIsAiChatOpen(true); }}
          className={`p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeTool === 'ai_crop' ? 'bg-[#1E3A6E] text-white shadow-sm' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60'}`}
          title="AI Crop Ask"
        >
          <Sparkles size={16} className="text-amber-500 shrink-0" />
        </button>

        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isNotesOpen ? 'bg-[#1E3A6E] text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          title="Notes"
        >
          <StickyNote size={16} className="text-amber-600 shrink-0" />
        </button>
      </div>

      {/* CLUSTER 4: History & Actions */}
      <div className="flex items-center gap-1.5">
        <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#1E3A6E] cursor-pointer transition-colors" title="Undo">
          <RotateCcw size={16} />
        </button>

        <div className="ml-1 pl-1 border-l border-slate-200 relative" ref={clearConfirmRef}>
          <button onClick={() => setShowClearConfirm(true)} className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#C8232C] cursor-pointer transition-colors" title="Xóa tất cả">
            <Trash2 size={16} />
          </button>
          {showClearConfirm && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-rose-200 rounded-xl p-3 shadow-xl z-50 w-56">
              <p className="text-xs text-slate-700 mb-3 font-medium">Xóa tất cả hình vẽ trên trang này?</p>
              <div className="flex gap-2">
                <button onClick={() => { onRequestClearAll(); setShowClearConfirm(false); }} className="flex-1 px-3 py-1.5 bg-[#C8232C] hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                  Xóa tất cả
                </button>
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hide Toolbar Toggle Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors ml-1 border-l border-slate-200 pl-2"
          title="Ẩn thanh công cụ"
        >
          <ChevronUp size={16} />
        </button>
      </div>
    </div>
  );
};
