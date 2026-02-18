import { Suspense } from 'react';
import LibraryClient from './LibraryClient';

export default function MyLibraryPage() {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <LibraryClient />
    </Suspense>
  );
}

function LibrarySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-4 w-52 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      </div>
      <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
        ))}
      </div>
    </div>
  );
}
