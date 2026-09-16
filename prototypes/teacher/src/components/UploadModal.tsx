import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  X,
  FileUp,
} from 'lucide-react';

export interface UploadedSlideData {
  id: string;
  fileName: string;
  title: string;
  pageCount: number;
  fileSize: string;
  uploadDate: string;
  ragStatus: 'Indexed' | 'Processing' | 'Ready';
  ragMessage: string;
  fileUrl?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingChapters: { id: string; title: string }[];
  onUploadSuccess: (result: {
    mode: 'existing' | 'new';
    chapterId?: string;
    newChapterTitle?: string;
    uploadedSlides: UploadedSlideData[];
    autoPublish: boolean;
  }) => void;
}

interface FileDraft {
  id: string;
  fileName: string;
  title: string;
  fileSize: string;
  pageCount: number;
  isCustomFile?: boolean;
  fileUrl?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  existingChapters,
  onUploadSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('new');
  const [selectedChapterId, setSelectedChapterId] = useState(existingChapters[0]?.id || 'ch1');
  const [newChapterTitle, setNewChapterTitle] = useState('Chương 3: Tìm kiếm heuristic & Giải thuật A*');
  const [autoPublish, setAutoPublish] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Files currently queued for upload
  const [filesToUpload, setFilesToUpload] = useState<FileDraft[]>([
    {
      id: 'f1',
      fileName: 'AI(3)_Part1_Heuristics.pdf',
      title: 'Bài giảng lý thuyết Heuristic & Giải thuật A*',
      fileSize: '4.2 MB',
      pageCount: 32,
    },
  ]);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processStepText, setProcessStepText] = useState('Đang tải lên các tệp tài liệu từ máy...');

  if (!isOpen) return null;

  // Helper: clean filename to human readable title
  const cleanTitleFromFileName = (name: string): string => {
    const withoutExt = name.replace(/\.(pdf|ppt|pptx)$/i, '');
    return withoutExt
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Helper: format bytes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '1.2 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Handle native file selection from local device
  const handleLocalFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newDrafts: FileDraft[] = Array.from(fileList).map((file, idx) => {
      const estimatedPages = Math.max(10, Math.min(60, Math.round((file.size / (1024 * 100)) + 5)));
      let fileUrl: string | undefined;
      try {
        fileUrl = URL.createObjectURL(file);
      } catch (err) {
        console.error('Error creating object URL:', err);
      }
      return {
        id: `local_${Date.now()}_${idx}`,
        fileName: file.name,
        title: cleanTitleFromFileName(file.name),
        fileSize: formatFileSize(file.size),
        pageCount: estimatedPages,
        isCustomFile: true,
        fileUrl,
      };
    });

    setFilesToUpload((prev) => [...prev, ...newDrafts]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleLocalFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLocalFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    if (filesToUpload.length <= 1) {
      alert('Vui lòng giữ lại ít nhất 1 tài liệu để tải lên.');
      return;
    }
    setFilesToUpload(filesToUpload.filter((f) => f.id !== id));
  };

  const handleUpdateFileTitle = (id: string, title: string) => {
    setFilesToUpload(
      filesToUpload.map((f) => (f.id === id ? { ...f, title } : f))
    );
  };

  const handleStartUpload = () => {
    if (filesToUpload.length === 0) {
      alert('Vui lòng chọn ít nhất 1 tài liệu bài giảng từ máy.');
      return;
    }

    for (const f of filesToUpload) {
      if (!f.title.trim()) {
        alert(`Vui lòng nhập tên tiêu đề (Title) cho tài liệu "${f.fileName}".`);
        return;
      }
    }

    if (targetMode === 'new' && !newChapterTitle.trim()) {
      alert('Vui lòng nhập Tên chương / Bài học mới.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setProcessStepText(`Đang truyền dữ liệu ${filesToUpload.length} tệp từ máy cá nhân...`);

    setTimeout(() => {
      setUploadProgress(55);
      setProcessStepText('Đang phân tích cấu trúc PDF, hình ảnh và bóc tách văn bản...');
    }, 700);

    setTimeout(() => {
      setUploadProgress(85);
      setProcessStepText('Đang tạo vector embeddings và nạp vào cơ sở tri thức RAG cho AI Socratic Tutor...');
    }, 1400);

    setTimeout(() => {
      setUploadProgress(100);
      setProcessStepText('Tải lên và xử lý bài giảng hoàn tất!');

      setTimeout(() => {
        const uploadedSlides: UploadedSlideData[] = filesToUpload.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          title: f.title,
          pageCount: f.pageCount,
          fileSize: f.fileSize,
          uploadDate: 'Vừa xong',
          ragStatus: 'Ready',
          ragMessage: `${f.pageCount} trang • ${f.fileSize} • Đã phân tích RAG và lập chỉ mục trang`,
          fileUrl: f.fileUrl,
        }));

        onUploadSuccess({
          mode: targetMode,
          chapterId: targetMode === 'existing' ? selectedChapterId : undefined,
          newChapterTitle: targetMode === 'new' ? newChapterTitle : undefined,
          uploadedSlides,
          autoPublish,
        });
        setIsUploading(false);
        setUploadProgress(0);
        onClose();
      }, 500);
    }, 2100);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* HIDDEN NATIVE FILE INPUT */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.ppt,.pptx"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#1E3A6E] text-white rounded-lg">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tải lên bài giảng từ máy cá nhân
              </h3>
              <p className="text-[11px] text-slate-500">
                Cho phép chọn file PDF/PPTX trực tiếp từ máy, gắn tiêu đề tương ứng và gán vào chương học.
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* UPLOAD BODY OR PROGRESS */}
        {isUploading ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center text-[#1E3A6E] animate-pulse">
              <Sparkles size={32} className="animate-spin text-[#1E3A6E]" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-base">{processStepText}</h4>
              <p className="text-xs text-slate-500">
                Hệ thống VinUni CECS AI Hub đang xử lý {filesToUpload.length} tài liệu bài giảng...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="h-3 bg-gradient-to-r from-[#1E3A6E] to-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-[#1E3A6E]">{uploadProgress}%</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
            {/* DESTINATION CHAPTER SELECTION */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 text-xs">
                1. Chọn nơi lưu tài liệu
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setTargetMode('new')}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    targetMode === 'new'
                      ? 'border-[#1E3A6E] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === 'new'}
                    onChange={() => setTargetMode('new')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Tạo Chương / Module mới</span>
                    <span className="text-[11px] text-slate-500">
                      Tạo một chương mới hoàn toàn và thêm các slide này vào.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setTargetMode('existing')}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    targetMode === 'existing'
                      ? 'border-[#1E3A6E] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === 'existing'}
                    onChange={() => setTargetMode('existing')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Thêm vào Chương đã có</span>
                    <span className="text-[11px] text-slate-500">
                      Bổ sung thêm slide vào chương học hiện hữu (1 chương nhiều slide).
                    </span>
                  </div>
                </label>
              </div>

              {targetMode === 'new' ? (
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tên tiêu đề chương mới:
                  </label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="VD: Chương 3: Tìm kiếm heuristic và A*"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-[#1E3A6E] focus:outline-none"
                  />
                </div>
              ) : (
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Chọn chương cần bổ sung slide:
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-[#1E3A6E] focus:outline-none bg-white cursor-pointer"
                  >
                    {existingChapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* INTERACTIVE FILE DROPZONE FOR LOCAL MACHINE UPLOAD */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[#1E3A6E] bg-blue-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-[#1E3A6E] bg-slate-50/60 hover:bg-blue-50/20'
              }`}
            >
              <FileUp size={30} className="mx-auto text-[#1E3A6E] mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Nhấn vào đây để chọn tệp từ máy cá nhân của bạn (hoặc kéo thả vào đây)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hỗ trợ định dạng: <strong>.PDF, .PPT, .PPTX</strong> (Có thể chọn nhiều tệp cùng lúc)
              </p>
            </div>

            {/* LIST OF FILES TO UPLOAD WITH CORRESPONDING TITLES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-slate-800 text-xs">
                    2. Danh sách slide đã chọn ({filesToUpload.length} tài liệu)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Vui lòng kiểm tra hoặc chỉnh sửa Tên tiêu đề hiển thị tương ứng cho từng slide.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-blue-50 text-[#1E3A6E] hover:bg-blue-100 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-blue-200 text-xs"
                >
                  <Plus size={13} />
                  <span>Chọn thêm file từ máy</span>
                </button>
              </div>

              <div className="space-y-3">
                {filesToUpload.map((file) => (
                  <div
                    key={file.id}
                    className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 text-[#C8232C] rounded-md">
                          <FileText size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">
                            {file.fileName}
                          </span>
                          <span className="text-[10.5px] text-slate-400 block">
                            {file.pageCount} trang • {file.fileSize}
                            {file.isCustomFile && (
                              <span className="ml-2 text-emerald-600 font-medium">• Từ máy cá nhân</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Xóa tài liệu này khỏi danh sách"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Corresponding Title Input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tên tiêu đề hiển thị tương ứng:
                      </label>
                      <input
                        type="text"
                        value={file.title}
                        onChange={(e) => handleUpdateFileTitle(file.id, e.target.value)}
                        placeholder="VD: Bài giảng lý thuyết A*..."
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 focus:border-[#1E3A6E] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SETTINGS: AUTO PUBLISH */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="rounded text-[#1E3A6E]"
                />
                <span>Xuất bản ngay cho sinh viên sau khi tải lên thành công</span>
              </label>
            </div>
          </div>
        )}

        {/* FOOTER */}
        {!isUploading && (
          <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleStartUpload}
              className="px-4 py-2 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload size={15} />
              <span>Tải lên {filesToUpload.length} tệp & Bắt đầu RAG</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
