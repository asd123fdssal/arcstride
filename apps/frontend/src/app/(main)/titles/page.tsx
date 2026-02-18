import { Suspense } from 'react';
import TitlesClient from './TitlesClient';

export default function TitlesPage() {
  return (
    <Suspense fallback={<TitlesSkeleton />}>
      <TitlesClient />
    </Suspense>
  );
}

function TitlesSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-4 w-56 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      </div>
      <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-[3/4]" style={{ backgroundColor: 'var(--surface-2)' }} />
            <div className="p-3 space-y-2">
              <div className="h-3 rounded" style={{ backgroundColor: 'var(--surface-3)', width: '75%' }} />
              <div className="h-2.5 rounded" style={{ backgroundColor: 'var(--surface-2)', width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
