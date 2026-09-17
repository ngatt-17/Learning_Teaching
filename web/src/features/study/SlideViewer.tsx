import { useEffect, useRef, useState } from 'react';
import { openMaterialFile, platform } from '../../lib/api';
import type { Material, MaterialPage } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { ErrorState, Loading } from '../../components/StateViews';
import { MaterialStatusBadge } from '../../components/Badges';

export interface PagesPayload {
  material: Material;
  pages: MaterialPage[];
}

/**
 * Full vertical slide reader.
 * Renders the original slide PDF or all pages stacked vertically so the user just scrolls down.
 */
export function SlideViewer({
  courseId,
  materialId,
  page,
  onPageChange,
  onLoaded,
}: {
  courseId: string;
  materialId: string;
  page: number | null;
  onPageChange: (page: number) => void;
  onLoaded?: (payload: PagesPayload) => void;
}) {
  const { data, error, loading, reload } = useAsync(
    () => platform.get<PagesPayload>(`/courses/${courseId}/materials/${materialId}/pages`),
    [courseId, materialId],
  );

  const hasFile = Boolean(data?.material.has_file);
  const {
    data: fileUrl,
    loading: fileLoading,
    error: fileErrorObj,
  } = useAsync(
    async () => {
      if (!hasFile) return null;
      return openMaterialFile(courseId, materialId);
    },
    [courseId, materialId, hasFile],
  );

  const fileError = fileErrorObj ? errorMessage(fileErrorObj) : null;
  const [userViewMode, setUserViewMode] = useState<'original' | 'pages' | null>(null);
  const viewMode = userViewMode ?? (hasFile && !fileError ? 'original' : 'pages');
  const setViewMode = (mode: 'original' | 'pages') => setUserViewMode(mode);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
      onLoaded?.(data);
    }
  }, [data, onLoaded]);

  const pages = data?.pages ?? [];

  // Scroll to requested page when in pages mode
  useEffect(() => {
    if (page && viewMode === 'pages') {
      const el = document.getElementById(`slide-page-${page}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [page, viewMode]);

  if (loading) return <Loading label="Đang mở tài liệu…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const material = data!.material;

  const scrollToPage = (pageNum: number) => {
    onPageChange(pageNum);
    const el = document.getElementById(`slide-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
      {/* Top Header Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A6E] bg-blue-100 px-2 py-0.5 rounded">
            Bài giảng
          </span>
          <span className="text-sm font-bold text-slate-800 truncate">{material.title}</span>
          {material.status !== 'approved' && <MaterialStatusBadge status={material.status} />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle between original PDF and vertical extracted pages */}
          {material.has_file && fileUrl && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'original'
                    ? 'bg-white text-[#1E3A6E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slide gốc
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pages')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'pages'
                    ? 'bg-white text-[#1E3A6E] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Các trang dọc ({pages.length})
              </button>
            </div>
          )}

          {/* Jump to page dropdown */}
          {pages.length > 0 && (
            <select
              value={page ?? pages[0]?.page_number ?? ''}
              onChange={(e) => scrollToPage(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-700 cursor-pointer"
              aria-label="Chọn trang slide"
            >
              {pages.map((p) => (
                <option key={p.page_number} value={p.page_number}>
                  Trang {p.page_number} / {pages.length}
                </option>
              ))}
            </select>
          )}

          {/* Open in new tab */}
          {fileUrl && (
            <button
              type="button"
              onClick={openNewTab}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              Mở tab mới
            </button>
          )}
        </div>
      </div>

      {fileError && <p className="px-4 py-1 text-xs text-rose-700 bg-rose-50 border-b border-rose-100">{fileError}</p>}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {fileLoading && (
          <div className="p-8 text-center text-xs text-slate-500">
            Đang tải slide gốc...
          </div>
        )}

        {/* View Mode: Original PDF inside full iframe */}
        {viewMode === 'original' && fileUrl && (
          <iframe
            src={fileUrl}
            title={material.title}
            className="w-full h-full border-0 bg-slate-100"
          />
        )}

        {/* View Mode: Vertical stack of all slide pages */}
        {(viewMode === 'pages' || !fileUrl) && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6"
          >
            {pages.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-12">Tài liệu chưa có trang nội dung.</p>
            ) : (
              pages.map((p) => (
                <article
                  key={p.page_number}
                  id={`slide-page-${p.page_number}`}
                  className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-xs p-8 sm:p-10 flex flex-col transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2.5">
                    <span className="truncate text-slate-600">{material.title}</span>
                    <span className="shrink-0 text-[#C8232C] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Trang {p.page_number} / {pages.length}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-10 bg-[#C8232C] rounded" />
                  <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {p.content || (
                      <span className="italic text-slate-400">
                        (Trang này không có văn bản văn bản trích xuất được)
                      </span>
                    )}
                  </p>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
