import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getToken, platform, setToken, setUnauthorizedHandler } from './api';
import type { User } from './types';

interface OtpResponse {
  message: string;
  delivered: boolean;
  email_provider: string;
  dev_otp?: string;
  dev_hint?: string;
  expires_in_minutes: number;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  requestOtp: (email: string) => Promise<OtpResponse>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore the session from a stored token; an expired token logs out via the 401 handler.
  useEffect(() => {
    if (!getToken()) return;
    platform
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const requestOtp = useCallback(
    (email: string) => platform.post<OtpResponse>('/auth/request-otp', { email: email.trim().toLowerCase() }),
    [],
  );

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const result = await platform.post<{ access_token: string; user: User }>('/auth/verify-otp', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, requestOtp, verifyOtp, logout }),
    [user, loading, requestOtp, verifyOtp, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('No signed-in user');
  return user;
}
