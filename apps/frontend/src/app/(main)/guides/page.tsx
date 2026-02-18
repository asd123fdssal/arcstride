'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PageResponse, GuideListItem } from '@/lib/types';
import { Loader2, BookOpen, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default function GuidesPage() {
  const [guides, setGuides] = useState<GuideListItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PageResponse<GuideListItem>>(`/guides?page=${page}&size=20`)
      .then(data => {
        setGuides(data.items);
        setTotalPages(data.page.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>공략 가이드</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>커뮤니티가 작성한 공략</p>
        </div>
        <Link href="/guides/new" className="btn-primary text-sm"><Plus size={16} /> 공략 작성</Link>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>등록된 공략이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map(g => (
            <Link key={g.guideId} href={`/guides/${g.guideId}`} className="card-flat block p-4 hover:border-[var(--border-hover)] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--surface-3)' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{g.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>by {g.author.username}</span>
                    <span className="badge text-[10px]">{g.target.type} #{g.target.id}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{g.createdAt?.slice(0, 10)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost !p-2 disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-ghost !p-2 disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
