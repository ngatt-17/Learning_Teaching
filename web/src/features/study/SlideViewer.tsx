import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react';
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
 * Page-by-page reader for a material. Text comes from the Platform's extracted pages (the
 * same text the AI cites), so a citation "Trang 14" always opens the page it was taken from.
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

  useEffect(() => {
    if (data) onLoaded?.(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const [fileError, setFileError] = useState<string | null>(null);

  const pages = data?.pages ?? [];
  const index = Math.max(0, pages.findIndex((p) => p.page_number === page));
  const current = pages[index];

  useEffect(() => {
    if (current && current.page_number !== page) onPageChange(current.page_number);
  }, [current, page, onPageChange]);

  if (loading) return <Loading label="Đang mở tài liệu…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const material = data!.material;

  const openFile = async () => {
    setFileError(null);
    try {
      window.open(await openMaterialFile(courseId, materialId), '_blank', 'noopener');
    } catch (err) {
      setFileError(errorMessage(err));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          <FileText size={16} className="text-[#1E3A6E] shrink-0" />
          <span className="text-sm font-bold text-slate-800 truncate">{material.title}</span>
          {material.status !== 'approved' && <MaterialStatusBadge status={material.status} />}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {material.has_file && (
            <button onClick={openFile} className="px-2 py-1 rounded-md text-xs font-semibold text-[#1E3A6E] hover:bg-[#EDF2FA] flex items-center gap-1 cursor-pointer">
              <ExternalLink size={13} /> File gốc
            </button>
          )}
          <button
            disabled={index <= 0}
            onClick={() => onPageChange(pages[index - 1].page_number)}
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft size={15} />
          </button>
          <select
            value={current?.page_number ?? ''}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
            aria-label="Chọn trang"
          >
            {pages.map((p) => (
              <option key={p.page_number} value={p.page_number}>
                Trang {p.page_number}
              </option>
            ))}
          </select>
          <button
            disabled={index >= pages.length - 1}
            onClick={() => onPageChange(pages[index + 1].page_number)}
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      {fileError && <p className="px-4 py-1 text-xs text-rose-700 bg-rose-50">{fileError}</p>}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8">
        {current ? (
          <article className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm aspect-[16/10] min-h-[320px] p-8 sm:p-10 flex flex-col">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="truncate">{material.title}</span>
              <span className="shrink-0 text-[#C8232C]">Trang {current.page_number}</span>
            </div>
            <div className="mt-2 h-1 w-12 bg-[#C8232C] rounded" />
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">
              {current.content || <span className="italic text-slate-400">(Trang không có văn bản trích xuất được)</span>}
            </p>
          </article>
        ) : (
          <p className="text-center text-sm text-slate-500">Tài liệu chưa có trang nội dung.</p>
        )}
      </div>
    </div>
  );
}
