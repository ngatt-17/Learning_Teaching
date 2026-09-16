import { useState } from 'react';
import { AlertTriangle, Brain, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ai } from '../../lib/api';
import type { CompetencyReport } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

/** Strengths / weaknesses of this attempt, computed by the AI service from the graded attempt. */
export function CompetencyBox({ courseId, quizId, attemptId }: { courseId: string; quizId: string; attemptId: string }) {
  const [open, setOpen] = useState(true);
  const { data, error, loading } = useAsync(
    () => ai.post<CompetencyReport>(`/api/ai/courses/${courseId}/quizzes/${quizId}/competency`, { attempt_id: attemptId }),
    [courseId, quizId, attemptId],
  );

  const strengths = data?.competency_summary.strengths ?? [];
  const weaknesses = data?.competency_summary.weaknesses ?? [];

  return (
    <div className="bg-white border border-indigo-200 rounded-xl p-3 shadow-2xs">
      <div onClick={() => setOpen(!open)} className="flex items-center justify-between cursor-pointer select-none gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 rounded-md bg-[#1E3A6E] text-white">
            <Brain size={14} />
          </div>
          <span className="font-bold text-xs text-slate-900">Phân tích năng lực & Khuyến nghị ôn tập</span>
          {data && (
            <span
              className={`text-[10px] px-2 py-px rounded-full font-bold border ${
                weaknesses.length
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              Độ hiểu bài: {weaknesses.length ? 'Cần củng cố' : 'Nắm vững'}
            </span>
          )}
        </div>
        <span className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-semibold shrink-0">
          {open ? 'Thu gọn' : 'Xem chi tiết'} {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {open && (
        <div className="pt-2.5 mt-2 border-t border-indigo-100 text-xs">
          {loading && <p className="text-slate-500">Đang phân tích theo chủ đề…</p>}
          {error && <p className="text-rose-700">Chưa phân tích được: {error.detail}</p>}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <Check size={13} className="text-emerald-600" /> Điểm mạnh đã nắm vững
                </span>
                {strengths.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Chưa có chủ đề đạt từ 80% trở lên.</p>
                ) : (
                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 leading-relaxed">
                    {strengths.map((s) => (
                      <li key={s.topic}>
                        <strong>{s.topic}</strong> — {s.evidence}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-rose-200 space-y-1">
                <span className="font-bold text-rose-800 flex items-center gap-1">
                  <AlertTriangle size={13} className="text-rose-600" /> Lỗ hổng kiến thức cần củng cố
                </span>
                {weaknesses.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Không có chủ đề dưới 60%.</p>
                ) : (
                  <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 leading-relaxed">
                    {weaknesses.map((w) => (
                      <li key={w.topic}>
                        <strong>{w.topic}</strong> — {w.evidence} {w.recommended_action}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <p className="mt-2 text-[10px] text-slate-400">
            Chỉ dựa trên kết quả bài làm của bạn — không đọc ghi chú riêng tư.
          </p>
        </div>
      )}
    </div>
  );
}
