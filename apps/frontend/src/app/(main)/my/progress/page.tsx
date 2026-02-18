'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { PageResponse, TitleListItem, TitleProgressSummary } from '@/lib/types';
import { TypeBadge } from '@/components/ui/Score';
import { Loader2, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [titles, setTitles] = useState<(TitleListItem & { progress?: TitleProgressSummary })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    (async () => {
      try {
        // Fetch all titles, then progress for each
        const data = await api.get<PageResponse<TitleListItem>>('/titles?page=0&size=100');
        const withProgress = await Promise.all(
          data.items.map(async (t) => {
            try {
              const prog = await api.get<TitleProgressSummary>(`/me/progress/titles/${t.titleId}`);
              return { ...t, progress: prog };
            } catch {
              return t;
            }
          })
        );
        // Only show titles with some progress
        setTitles(withProgress.filter((t: any) => t.progress && (t.progress.unitSummary.done > 0 || t.progress.unitSummary.progress > 0)));
      } catch {} finally { setLoading(false); }
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>내 진행도</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>진행 중이거나 완료한 작품들</p>
      </div>

      {titles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>진행도가 기록된 작품이 없습니다</p>
          <Link href="/titles" className="btn-primary text-sm mt-4 inline-flex">카탈로그 둘러보기</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {titles.map(t => {
            const p = (t as any).progress as TitleProgressSummary;
            const total = p.unitSummary.total || 1;
            const donePct = (p.unitSummary.done / total) * 100;
            const progPct = (p.unitSummary.progress / total) * 100;
            return (
              <Link key={t.titleId} href={`/titles/${t.titleId}`} className="card-flat flex items-center gap-4 p-4 group hover:border-[var(--border-hover)] transition-colors">
                {/* Mini cover */}
                <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: 'var(--surface-2)' }}>
                  {t.coverUrl ? (
                    <img src={t.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold opacity-20">{t.originalTitle.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <TypeBadge type={t.type} />
                    <span className="badge-accent badge text-[10px]">{p.derivedStatus}</span>
                  </div>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.koreanTitle || t.originalTitle}</p>
                  {/* Progress bar */}
                  <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-3)' }}>
                    <div style={{ width: `${donePct}%`, backgroundColor: 'var(--success)', transition: 'width 0.5s' }} />
                    <div style={{ width: `${progPct}%`, backgroundColor: 'var(--warning)', transition: 'width 0.5s' }} />
                  </div>
                  <div className="flex gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-0.5"><Check size={10} style={{ color: 'var(--success)' }} /> {p.unitSummary.done}</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} style={{ color: 'var(--warning)' }} /> {p.unitSummary.progress}</span>
                    <span>{p.unitSummary.total}개 유닛</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
