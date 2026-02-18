'use client';

import { Suspense, type ComponentType } from 'react';

/**
 * Next.js 15에서 useSearchParams()를 사용하는 페이지 컴포넌트를
 * Suspense boundary로 자동 래핑하는 HOC.
 *
 * SSR/빌드 시 prerender 에러를 방지합니다.
 *
 * @example
 * // page.tsx
 * function MyPage() { ... useUrlPaging() ... }
 * export default withSearchParams(MyPage);
 */
export function withSearchParams<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
) {
  function Wrapped(props: P) {
    return (
      <Suspense fallback={fallback ?? <SearchParamsFallback />}>
        <Component {...props} />
      </Suspense>
    );
  }
  Wrapped.displayName = `withSearchParams(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}

/** 기본 fallback: 페이지 로딩 스켈레톤 */
function SearchParamsFallback() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-4 w-60 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      </div>
      <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
        ))}
      </div>
    </div>
  );
}
