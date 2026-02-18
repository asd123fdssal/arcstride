'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gamepad2, Loader2 } from 'lucide-react';


const ERROR_MESSAGES: Record<string, string> = {
  login_failed: '로그인에 실패했습니다. 다시 시도해주세요.',
  session_expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
  access_denied: '접근 권한이 없습니다. 로그인 후 다시 시도해주세요.',
};

function LoginPage() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const next = searchParams.get('next');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (user) router.replace(next ?? '/titles');
  }, [user, router, next]);

  const handleLogin = () => {
    setRedirecting(true);
    loginWithGoogle(next ?? undefined);
  };

  const errorMsg = error ? (ERROR_MESSAGES[error] ?? '오류가 발생했습니다. 다시 시도해주세요.') : null;

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}>
          <Gamepad2 size={28} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl tracking-tight"
          style={{ color: 'var(--text-primary)' }}>Arcstride</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          서브컬쳐 미디어 진행도 관리
        </p>
      </div>

      <div className="card-flat p-6 space-y-5">
        <h2 className="font-display font-semibold text-lg text-center"
          style={{ color: 'var(--text-primary)' }}>로그인</h2>

        {errorMsg && (
          <div className="px-3 py-2 rounded-lg text-sm text-center"
            style={{ backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--danger)' }}>
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={redirecting}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 border disabled:opacity-60"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {redirecting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {redirecting ? 'Google로 이동 중...' : 'Google로 계속하기'}
        </button>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          로그인 시 서비스 이용약관에 동의합니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default LoginPage;
