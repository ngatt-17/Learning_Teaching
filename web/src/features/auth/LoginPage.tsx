import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { VinUniLogo } from '../../components/VinUniLogo';
import { InlineError } from '../../components/StateViews';
import { btn, inputClass } from '../../components/styles';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/useAsync';

// Seeded accounts from platform/database/schema.sql — shown in development builds only.
const DEMO_ACCOUNTS = [
  { email: 'student_a@vinuni.edu.vn', label: 'Student A' },
  { email: 'student_b@vinuni.edu.vn', label: 'Student B' },
  { email: 'instructor@vinuni.edu.vn', label: 'Instructor A' },
  { email: 'admin@vinuni.edu.vn', label: 'CECS Admin' },
];

export function LoginPage() {
  const { user, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devHint, setDevHint] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== '/login' ? from : '/courses'} replace />;
  }

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim().toLowerCase().endsWith('@vinuni.edu.vn')) {
      setError('Vui lòng dùng email @vinuni.edu.vn đã được CECS cấp quyền.');
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(email);
      setNotice(`Mã xác thực đã được gửi tới ${email.trim().toLowerCase()} (hiệu lực ${res.expires_in_minutes} phút).`);
      setDevHint(res.dev_otp ? `Môi trường phát triển: mã là ${res.dev_otp}. ${res.dev_hint ?? ''}` : null);
      setStep('code');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(email, code);
      navigate('/courses', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#1E3A6E] rounded-t-xl px-6 py-5 flex items-center gap-3">
          <VinUniLogo size={40} />
          <div>
            <p className="text-[10px] font-black tracking-wider text-amber-300 uppercase">VinUniversity • CECS</p>
            <h1 className="text-white font-extrabold text-lg leading-tight">AI Learning Hub</h1>
          </div>
        </div>
        <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl p-6 shadow-xs space-y-4">
          {step === 'email' ? (
            <form onSubmit={submitEmail} className="space-y-3">
              <div>
                <h2 className="font-bold text-slate-900">Đăng nhập</h2>
                <p className="text-xs text-slate-500 mt-0.5">Nhập email VinUni để nhận mã xác thực một lần.</p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Email</span>
                <div className="relative mt-1">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten.ho@vinuni.edu.vn"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </label>
              <InlineError message={error} />
              <button type="submit" disabled={busy} className={`${btn.primary} w-full py-2.5`}>
                {busy ? 'Đang gửi…' : 'Gửi mã xác thực'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-3">
              <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null); }} className={btn.ghost}>
                <ArrowLeft size={14} /> Đổi email
              </button>
              <p className="text-xs text-slate-600">{notice}</p>
              {devHint && (
                <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{devHint}</p>
              )}
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Mã xác thực (6 số)</span>
                <div className="relative mt-1">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} pl-9 tracking-[0.3em] font-mono`}
                  />
                </div>
              </label>
              <InlineError message={error} />
              <button type="submit" disabled={busy || code.length !== 6} className={`${btn.primary} w-full py-2.5`}>
                {busy ? 'Đang xác thực…' : 'Đăng nhập'}
              </button>
            </form>
          )}

          {import.meta.env.DEV && step === 'email' && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tài khoản demo (dev)</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.email} type="button" onClick={() => setEmail(a.email)} className="px-2 py-1 text-[11px] rounded-md border border-slate-200 bg-slate-50 hover:bg-[#EDF2FA] text-[#1E3A6E] cursor-pointer">
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-3">© 2026 CECS AI Learning Hub — VinUniversity</p>
      </div>
    </div>
  );
}
