'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function SignupPage() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/titles');
  }, [user, router]);

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}>
          <Gamepad2 size={28} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl tracking-tight"
          style={{ color: 'var(--text-primary)' }}>Arcstride</h1>
      </div>

      <div className="card-flat p-6 space-y-5">
        <h2 className="font-display font-semibold text-lg text-center"
          style={{ color: 'var(--text-primary)' }}>회원가입</h2>

        <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
          Google 계정으로 간편하게 시작하세요.<br />
          최초 로그인 시 자동으로 계정이 생성됩니다.
        </p>

        <button
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 border"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          Google로 시작하기
        </button>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium" style={{ color: 'var(--accent)' }}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
