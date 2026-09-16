import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  Printer,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface SlideViewProps {
  courseCode: string;
  courseName: string;
  chapterTitle: string;
  slideName: string;
  slideTitle?: string;
  fileUrl?: string;
  onBack: () => void;
  onGoToQuiz?: () => void;
}

export const SlideView: React.FC<SlideViewProps> = ({
  courseCode,
  chapterTitle,
  slideName,
  slideTitle,
  fileUrl,
  onBack,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  // Check if topic is Math / Radical (Biến đổi căn bậc hai)
  const isMathTopic =
    chapterTitle.toLowerCase().includes('căn bậc') ||
    slideName.toLowerCase().includes('căn bậc') ||
    chapterTitle.toLowerCase().includes('biến đổi');

  const mathSlidesData = [
    {
      page: 1,
      type: 'cover',
      title: 'Chuyên đề: Biến đổi đơn giản biểu thức chứa căn bậc hai',
      subtitle: 'Đại số & Giải tích ứng dụng • Buổi 12',
      lecturer: 'Giảng viên phụ trách: Dr. Nguyễn Thanh Tùng',
      dept: 'Viện Kỹ thuật và Khoa học Máy tính (CECS) — VinUniversity',
    },
    {
      page: 2,
      type: 'content',
      title: '1. Nhắc lại kiến thức cơ bản về Căn bậc hai',
      bullets: [
        'Với số thực a ≥ 0, căn bậc hai số học của a là số x ≥ 0 sao cho x² = a. Ký hiệu: √a.',
        'Điều kiện xác định: Biểu thức √A có nghĩa khi và chỉ khi A ≥ 0.',
        'Hằng đẳng thức quan trọng: √(A²) = |A| = A (nếu A ≥ 0) hoặc -A (nếu A < 0).',
        'Lưu ý quan trọng khi rút gọn biểu thức: Luôn xét dấu của biểu thức dưới dấu giá trị tuyệt đối.',
      ],
      note: 'Chuẩn đầu ra: Học sinh / sinh viên thành thạo việc tìm tập xác định và rút gọn biểu thức vô tỉ.',
    },
    {
      page: 3,
      type: 'content',
      title: '2. Đưa thừa số ra ngoài và vào trong dấu căn',
      bullets: [
        'Phép đưa thừa số ra ngoài dấu căn: Với B ≥ 0, ta có √(A² · B) = |A| · √B.',
        'Nếu A ≥ 0 và B ≥ 0 thì √(A² · B) = A · √B.',
        'Nếu A < 0 và B ≥ 0 thì √(A² · B) = -A · √B.',
        'Phép đưa thừa số vào trong dấu căn: Với A ≥ 0 và B ≥ 0, ta có A · √B = √(A² · B). Với A < 0 và B ≥ 0, ta có A · √B = -√(A² · B).',
      ],
      highlight: '⚠️ SAI LẦM PHỔ BIẾN: Quên dấu trừ phía trước khi đưa số âm vào trong hoặc ra ngoài dấu căn.',
    },
    {
      page: 4,
      type: 'content',
      title: '3. Khử mẫu của biểu thức lấy căn & Trục căn thức ở mẫu',
      bullets: [
        'Khử mẫu biểu thức lấy căn: Với A · B ≥ 0 và B ≠ 0, ta có √(A / B) = √(A · B) / |B|.',
        'Trục căn thức ở mẫu dạng đơn: A / √B = (A · √B) / B (với B > 0).',
        'Trục căn thức ở mẫu dạng liên hợp bậc nhất: C / (√A ± B) = [C · (√A ∓ B)] / (A - B²).',
        'Trục căn thức dạng hai căn liên hợp: C / (√A ± √B) = [C · (√A ∓ √B)] / (A - B) (với A ≠ B, A, B ≥ 0).',
      ],
    },
    {
      page: 5,
      type: 'content',
      title: '4. Các bài toán rút gọn biểu thức chứa biến thường gặp',
      bullets: [
        'Bước 1: Tìm điều kiện xác định (ĐKXĐ) của các phân thức và căn thức.',
        'Bước 2: Phân tích tử và mẫu thành nhân tử để rút gọn các phân thức thành phần.',
        'Bước 3: Quy đồng mẫu thức chung của toàn bộ biểu thức.',
        'Bước 4: Thực hiện các phép tính cộng, trừ, nhân, chia và kết luận tập nghiệm/giá trị.',
      ],
      note: 'Dạng bài tập trọng tâm trong ngân hàng câu hỏi Quiz của học phần.',
    },
  ];

  const defaultSlidesData = [
    {
      page: 1,
      type: 'cover',
      title: `${courseCode}: ${chapterTitle}`,
      subtitle: slideTitle || `Tài liệu bài giảng: ${slideName}`,
      lecturer: 'Dr. Nguyễn Thanh Tùng',
      dept: 'Viện Kỹ thuật và Khoa học Máy tính (CECS) — VinUniversity',
    },
    {
      page: 2,
      type: 'content',
      title: '1. Mục tiêu bài học & Khung kiến thức trọng tâm',
      bullets: [
        `Nội dung tài liệu: ${slideName} đã được nạp thành công vào hệ thống.`,
        'Tài liệu phục vụ việc phân tích bài giảng và xây dựng ngân hàng câu hỏi kiểm tra.',
        'Sinh viên có thể sử dụng tài liệu này để tự học cùng trợ lý AI Socratic.',
        'Hệ thống AI tự động bóc tách các định nghĩa, định lý và ví dụ mẫu trong slide.',
      ],
      note: 'Tài liệu học tập chính thức lưu hành nội bộ VinUniversity CECS.',
    },
    {
      page: 3,
      type: 'content',
      title: '2. Chi tiết các phần kiến thức cốt lõi',
      bullets: [
        'Phần 1: Các khái niệm cơ bản và cơ sở lý thuyết.',
        'Phần 2: Phương pháp giải quyết bài toán và thuật toán mô phỏng.',
        'Phần 3: Đánh giá độ phức tạp thuật toán và phân tích trường hợp biên.',
        'Phần 4: Hướng dẫn thực hành Lab và bài tập củng cố.',
      ],
    },
    {
      page: 4,
      type: 'content',
      title: '3. Tóm tắt & Bài tập luyện tập',
      bullets: [
        'Giảng viên đã duyệt nội dung tài liệu và đồng bộ vào hệ thống quản lý học tập.',
        'Đề thi quiz tương ứng được sinh tự động từ tài liệu này.',
        'Sinh viên nộp bài sẽ được AI chấm điểm và chỉ ra điểm nhầm lẫn tức thì.',
      ],
    },
  ];

  const activeSlideData = isMathTopic ? mathSlidesData : defaultSlidesData;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* TOP HEADER */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Quay lại khóa học"
          >
            <ArrowLeft size={16} />
            <span>Quay lại khóa học</span>
          </button>

          <span className="text-slate-300">|</span>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-wide">{slideName}</span>
              {slideTitle && (
                <span className="text-xs text-slate-600 font-medium">
                  — {slideTitle}
                </span>
              )}
              {fileUrl && (
                <span className="text-[10.5px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-semibold">
                  Tài liệu PDF gốc từ máy
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-xl">
              {courseCode} • {chapterTitle}
            </p>
          </div>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center gap-2">
          {!fileUrl && (
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut size={15} />
              </button>
              <span className="px-2 text-[11px] font-mono font-medium text-slate-700">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          )}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-600 hover:text-[#1E3A6E] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Mở tài liệu trong tab mới"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="In slide"
          >
            <Printer size={16} />
          </button>

          <button
            onClick={() => {
              if (fileUrl) {
                const a = document.createElement('a');
                a.href = fileUrl;
                a.download = slideName;
                a.click();
              } else {
                alert(`Đang tải file bài giảng ${slideName}...`);
              }
            }}
            className="px-3 py-1.5 bg-[#1E3A6E] hover:bg-[#14274E] text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
            title="Tải file slide PDF về máy"
          >
            <Download size={14} />
            <span>Tải về</span>
          </button>
        </div>
      </header>

      {/* CONTINUOUS VERTICAL VIEWER */}
      {fileUrl ? (
        /* Native Embedded PDF Viewer for actual uploaded files */
        <div className="flex-1 w-full h-full bg-slate-200 p-2 sm:p-4 overflow-hidden">
          <iframe
            src={fileUrl}
            title={slideName}
            className="w-full h-full border-0 rounded-xl shadow-lg bg-white"
          />
        </div>
      ) : (
        /* Vertical Continuous Scroll Presentation Reader (Scrollbar all the way on the right) */
        <main className="flex-1 overflow-y-auto w-full py-8 px-4 sm:px-6">
          <div
            className="max-w-4xl mx-auto space-y-8 transition-transform origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {activeSlideData.map((slide) => (
              <div
                key={slide.page}
                className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden aspect-[16/9] p-8 sm:p-12 flex flex-col justify-between relative transition-shadow hover:shadow-lg"
              >
                {/* Slide Top Branding */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1E3A6E] flex items-center justify-center text-white font-black text-xs">
                      V
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                        VinUniversity • CECS
                      </span>
                      <span className="text-xs font-bold text-[#1E3A6E]">{courseCode}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{chapterTitle}</span>
                </div>

                {/* Slide Body */}
                {slide.type === 'cover' ? (
                  <div className="my-auto text-center space-y-5 py-6">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#1E3A6E] uppercase tracking-wider">
                      Bài giảng chính thức
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A6E] tracking-tight">
                      {slide.title}
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                      {slide.subtitle}
                    </p>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">Giảng viên:</span> {slide.lecturer}
                      </div>
                      <div>•</div>
                      <div>{slide.dept}</div>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto space-y-4 py-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A6E] border-l-4 border-[#1E3A6E] pl-3">
                      {slide.title}
                    </h2>

                    {slide.bullets && (
                      <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                        {slide.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A6E] mt-2 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {'highlight' in slide && Boolean((slide as { highlight?: string }).highlight) && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                        {(slide as { highlight?: string }).highlight}
                      </div>
                    )}

                    {slide.note && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        💡 <strong>Ghi chú:</strong> {slide.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Slide Bottom Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  <span>CS-AI3010 • VinUniversity CECS</span>
                  <span className="font-bold text-slate-600">Trang {slide.page} / {activeSlideData.length}</span>
                </div>
              </div>
            ))}

            {/* End of Slides Marker */}
            <div className="py-8 text-center text-xs text-slate-400">
              <p>— Hết nội dung tài liệu {slideName} —</p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="mt-3 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <ChevronUp size={14} />
                <span>Lên đầu trang</span>
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
