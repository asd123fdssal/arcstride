'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { api, ApiError, setOnUnauthorized } from '@/lib/api';
import type { UserMe } from '@/lib/types';
import { usePathname } from 'next/navigation';

interface AuthCtx {
  user: UserMe | null;
  loading: boolean;
  loginWithGoogle: (next?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Single-flight: 동시 호출 시 같은 Promise 재사용
  const inflightRef = useRef<Promise<UserMe | null> | null>(null);

  const fetchMe = useCallback(async (): Promise<void> => {
    if (inflightRef.current) {
      const result = await inflightRef.current;
      setUser(result);
      return;
    }

    const promise = api.get<UserMe>('/auth/me')
        .then(me => { setUser(me); return me; })
        .catch(() => { setUser(null); return null; })
        .finally(() => { inflightRef.current = null; });

    inflightRef.current = promise;
    await promise;
  }, []);

  useEffect(() => {
    // 앱 초기화: 인증 확인 + CSRF 쿠키 발급 보장
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  // 401 전역 핸들러: 세션 만료 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      // 현재 경로를 next로 전달하여 로그인 후 복귀
      // /login 경로에서는 next 중첩 방지
      const currentPath = window.location.pathname;
      if (currentPath === '/login') return; // 이미 로그인 페이지면 리다이렉트 안 함
      const loginUrl = currentPath && currentPath !== '/'
          ? `/login?next=${encodeURIComponent(currentPath)}`
          : '/login';
      window.location.href = loginUrl;
    });
    return () => setOnUnauthorized(null);
  }, []);

  const loginWithGoogle = (next?: string) => {
    // 우선순위: 명시 인자 > URL의 next 파라미터 > 현재 pathname
    const target = next
        ?? new URLSearchParams(window.location.search).get('next')
        ?? (pathname !== '/' && pathname !== '/login' && pathname !== '/signup' ? pathname : null);
    const qs = target ? `?next=${encodeURIComponent(target)}` : '';
    window.location.href = `/oauth2/authorization/google${qs}`;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
    window.location.href = '/';
  };

  return (
      <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser: fetchMe }}>
        {children}
      </AuthContext.Provider>
  );
}
