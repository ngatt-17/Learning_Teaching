import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { platform } from '../../lib/api';
import type { Course, Role } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { ErrorState, InlineError, Loading } from '../../components/StateViews';
import { btn, inputClass } from '../../components/styles';

interface Account {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => platform.get<Account[]>('/users/'), []);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [term, setTerm] = useState('Fall 2026');
  const [instructorId, setInstructorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  const createCourse = async () => {
    setFormError(null);
    try {
      const course = await platform.post<Course>('/courses/', {
        code: code.trim(),
        name: name.trim(),
        term: term.trim(),
        instructor_id: instructorId || null,
      });
      if (instructorId) await platform.post(`/courses/${course.id}/enroll`, { user_id: instructorId, role: 'instructor' });
      navigate(`/courses/${course.id}/members`);
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const accounts = (data ?? []).filter((a) => !roleFilter || a.role === roleFilter);

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto overflow-y-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Quản trị CECS</h1>
        <p className="text-sm text-slate-600 mt-0.5">Tạo khóa học và tra cứu tài khoản. Phân công thành viên ở tab Members của từng khóa học.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <h2 className="font-bold text-slate-900">Tạo khóa học</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã (VD: COMP2030)" className={inputClass} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên khóa học" className={`${inputClass} md:col-span-2`} />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Học kỳ" className={inputClass} />
          <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={`${inputClass} md:col-span-2`}>
            <option value="">— Giảng viên phụ trách (tuỳ chọn) —</option>
            {(data ?? []).filter((a) => a.role === 'instructor').map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
            ))}
          </select>
        </div>
        <InlineError message={formError} />
        <button onClick={createCourse} disabled={!code.trim() || !name.trim() || !term.trim()} className={btn.primary}>
          <Plus size={14} /> Tạo khóa học
        </button>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900">Tài khoản ({data?.length ?? 0})</h2>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')} className="text-xs border border-slate-300 rounded-md px-2 py-1">
            <option value="">Tất cả vai trò</option>
            <option value="student">Student</option>
            <option value="ta">TA</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Tên</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Vai trò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 font-semibold text-slate-900">{a.name}</td>
                    <td className="px-3 py-2 text-slate-600">{a.email}</td>
                    <td className="px-3 py-2 uppercase text-[11px] font-bold text-slate-600">{a.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-slate-400">
          Tạo tài khoản mới chưa có trong API pilot — hiện thêm qua seed/SQL (xem platform/database/schema.sql).
        </p>
      </section>
    </main>
  );
}
