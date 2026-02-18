import { Suspense } from 'react';
import MemosClient from './MemosClient';

export default function MyMemosPage() {
  return (
    <Suspense fallback={<MemosSkeleton />}>
      <MemosClient />
    </Suspense>
  );
}

function MemosSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-4 w-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      </div>
      <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
        ))}
      </div>
    </div>
  );
}
