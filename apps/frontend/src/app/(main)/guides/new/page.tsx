import { Suspense } from 'react';
import NewGuideClient from './NewGuideClient';

export default function NewGuidePage() {
  return (
    <Suspense fallback={<GuideSkeleton />}>
      <NewGuideClient />
    </Suspense>
  );
}

function GuideSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="h-8 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: 'var(--surface-1)' }}>
        <div className="h-6 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-3)' }} />
        <div className="h-10 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
        <div className="h-10 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
        <div className="h-48 rounded animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
      </div>
    </div>
  );
}
