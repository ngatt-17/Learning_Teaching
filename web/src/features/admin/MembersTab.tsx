import { useMemo, useState } from 'react';
import { UserMinus, UserPlus } from 'lucide-react';
import { platform } from '../../lib/api';
import type { Member, Role } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDateTime } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { ErrorState, InlineError, Loading } from '../../components/StateViews';
import { ConfirmDialog } from '../../components/Dialog';
import { btn, inputClass } from '../../components/styles';

interface Account {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function MembersTab() {
  const course = useCourse();
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        platform.get<Member[]>(`/courses/${course.id}/members`),
        platform.get<Account[]>('/users/'),
      ]),
    [course.id],
  );
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [actionError, setActionError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  const [members, accounts] = data ?? [[], []];
  const available = useMemo(
    () => accounts.filter((a) => !members.some((m) => m.id === a.id)),
    [accounts, members],
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const enroll = async () => {
    setActionError(null);
    try {
      await platform.post(`/courses/${course.id}/enroll`, { user_id: userId, role });
      setUserId('');
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const remove = async (member: Member) => {
    setRemoving(null);
    setActionError(null);
    try {
      await platform.del(`/courses/${course.id}/enroll/${member.id}`);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">Phân công thành viên</h2>
        <p className="text-xs text-slate-500 mt-0.5">Quyền truy cập khóa học được kiểm tra trên máy chủ theo danh sách này.</p>
      </div>

      <div className="flex flex-wrap items-end gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60">
        <label className="flex-1 min-w-56">
          <span className="text-xs font-semibold text-slate-700">Tài khoản</span>
          <select value={userId} onChange={(e) => {
            setUserId(e.target.value);
            const account = accounts.find((a) => a.id === e.target.value);
            if (account) setRole(account.role);
          }} className={`${inputClass} mt-1`}>
            <option value="">— Chọn tài khoản —</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-semibold text-slate-700">Vai trò trong lớp</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${inputClass} mt-1`}>
            <option value="student">Student</option>
            <option value="ta">TA</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button onClick={enroll} disabled={!userId} className={btn.primary}><UserPlus size={14} /> Phân công</button>
      </div>
      <InlineError message={actionError} />

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">Thành viên</th>
              <th className="text-left px-3 py-2">Vai trò</th>
              <th className="text-left px-3 py-2">Phân công lúc</th>
              <th className="text-right px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2"><p className="font-semibold text-slate-900">{m.name}</p><p className="text-[11px] text-slate-500">{m.email}</p></td>
                <td className="px-3 py-2 uppercase text-[11px] font-bold text-slate-600">{m.role}</td>
                <td className="px-3 py-2 text-slate-500">{formatDateTime(m.enrolled_at)}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setRemoving(m)} className={`${btn.ghost} text-rose-700`}><UserMinus size={13} /> Gỡ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {removing && (
        <ConfirmDialog
          title="Gỡ khỏi khóa học?"
          message={`${removing.name} sẽ mất quyền truy cập khóa học ngay lập tức. Ghi chú riêng của họ không bị xóa và vẫn chỉ họ đọc được.`}
          confirmLabel="Gỡ"
          danger
          onCancel={() => setRemoving(null)}
          onConfirm={() => remove(removing)}
        />
      )}
    </div>
  );
}
