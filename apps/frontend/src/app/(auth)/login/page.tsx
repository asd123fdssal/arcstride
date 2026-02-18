import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="h-10 w-10 rounded-full mx-auto animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-7 w-40 mx-auto rounded animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      </div>
    </div>
  );
}
