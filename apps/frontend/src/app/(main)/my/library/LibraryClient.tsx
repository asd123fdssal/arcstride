'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useUrlPaging } from '@/hooks/useUrlPaging';
import type { PageResponse, LibraryListItem, LoadState } from '@/lib/types';
import { TypeBadge } from '@/components/ui/Score';
import { Trash2, Plus, AlertTriangle, RefreshCw, Package, ShoppingBag, Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';


const TYPE_FILTERS = [
  { key: '', label: '전체' },
  { key: 'GAME', label: '게임' },
  { key: 'VIDEO', label: '영상' },
  { key: 'BOOK', label: '도서' },
] as const;

const VALID_TYPES = new Set(['GAME', 'VIDEO', 'BOOK', '']);

const ACQ_LABELS: Record<string, { label: string; icon: typeof Package }> = {
  PURCHASE: { label: '구매', icon: ShoppingBag },
  SUBSCRIPTION: { label: '구독', icon: Package },
  GIFT: { label: '선물', icon: Package },
};

function MyLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const { page: urlPage, values, updateUrl } = useUrlPaging({
    basePath: '/my/library',
    params: {
      type: {
        parse: raw => {
          const v = (raw ?? '').toUpperCase();
          return VALID_TYPES.has(v) ? v : '';
        },
      },
      q: { parse: raw => raw?.trim() ?? '' },
    },
  });
  const urlType = values.type;
  const urlQ = values.q;

  const [items, setItems] = useState<LibraryListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ titleId: number; name: string } | null>(null);
  const [searchInput, setSearchInput] = useState(urlQ);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/my/library');
  }, [user, authLoading, router]);

  // 인증 체크: 로딩 중이면 skeleton, 미인증이면 리다이렉트 안내
  if (authLoading) return <SkeletonList />;
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 animate-fade-in">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>로그인 페이지로 이동합니다…</p>
    </div>
  );

  const fetchLibrary = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;
    setLoadState('loading');
    try {
      const params = new URLSearchParams({ page: String(urlPage), size: '20' });
      if (urlType) params.set('type', urlType);
      if (urlQ) params.set('q', urlQ);
      const data = await api.get<PageResponse<LibraryListItem>>(`/me/library?${params}`, signal);
      setItems(data.items);
      setTotalPages(data.page.totalPages);
      setTotalElements(data.page.totalElements);
      setLoadState('success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setLoadState('error');
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, [user, urlType, urlPage, urlQ, toast]);

  useEffect(() => {
    if (authLoading || !user) return;
    const ctrl = new AbortController();
    fetchLibrary(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchLibrary, authLoading, user]);

  // URL → input 동기화
  useEffect(() => { setSearchInput(urlQ); }, [urlQ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput.trim(), page: 0 });
  };

  const clearSearch = () => {
    setSearchInput('');
    updateUrl({ q: '', page: 0 });
  };

  const handleDelete = async (titleId: number) => {
    setDeletingId(titleId);
    try {
      await api.del(`/me/library/titles/${titleId}`);
      setItems(prev => prev.filter(i => i.titleId !== titleId));
      toast.success('삭제되었습니다');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight"
            style={{ color: 'var(--text-primary)' }}>내 라이브러리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            소장하고 있는 작품들 {loadState === 'success' && `(${totalElements.toLocaleString()}건)`}
          </p>
        </div>
        <Link href="/titles" className="btn-primary text-sm shrink-0">
          <Plus size={16} /> 작품 추가
        </Link>
      </div>

      {/* Search + Type Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="작품명으로 검색..."
            className="input-field !pl-10 !pr-8"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--surface-2)] transition-colors"
              aria-label="검색 초기화">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </form>
        <div className="flex gap-1 p-1 rounded-lg shrink-0" style={{ backgroundColor: 'var(--surface-2)' }}>
          {TYPE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => updateUrl({ type: f.key, page: 0 })}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: urlType === f.key ? 'var(--accent)' : 'transparent',
                color: urlType === f.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loadState === 'loading' ? (
        <SkeletonList />
      ) : loadState === 'error' ? (
        <ErrorState onRetry={() => fetchLibrary()} />
      ) : items.length === 0 ? (
        <EmptyState hasFilter={!!urlType} query={urlQ} onClearSearch={urlQ ? clearSearch : undefined} />
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.titleId}
              className="card-flat flex items-center gap-4 px-4 py-3 group animate-slide-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <TypeBadge type={item.titleType} />
                  <AcqBadge type={item.acquisitionType} />
                </div>
                <Link
                  href={`/titles/${item.titleId}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.titleOriginal}
                </Link>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {item.storeName}
                  {item.note && <span className="ml-1.5">· {item.note}</span>}
                </p>
              </div>
              <time className="text-[10px] shrink-0 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
              </time>
              <button
                onClick={() => setDeleteTarget({ titleId: item.titleId, name: item.titleOriginal })}
                disabled={deletingId === item.titleId}
                className="btn-ghost !p-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
                aria-label={`${item.titleOriginal} 삭제`}
              >
                <Trash2 size={14} style={{ color: 'var(--danger)' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {loadState === 'success' && (
        <Pagination page={urlPage} totalPages={totalPages} onPageChange={p => updateUrl({ page: p })} />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget ? handleDelete(deleteTarget.titleId) : Promise.resolve()}
        message={`"${deleteTarget?.name}"을(를) 라이브러리에서 삭제하시겠습니까?`}
        confirmLabel="삭제"
        variant="danger"
      />
    </div>
  );
}

function AcqBadge({ type }: { type: string }) {
  const info = ACQ_LABELS[type] ?? { label: type, icon: Package };
  return (
    <span className="badge text-[10px] flex items-center gap-0.5"
      style={{ backgroundColor: 'rgba(116,143,252,0.1)', color: 'var(--accent)' }}>
      <info.icon size={9} />
      {info.label}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card-flat flex items-center gap-4 px-4 py-3 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-12 rounded" style={{ backgroundColor: 'var(--surface-3)' }} />
              <div className="h-4 w-10 rounded" style={{ backgroundColor: 'var(--surface-2)' }} />
            </div>
            <div className="h-3.5 rounded" style={{ backgroundColor: 'var(--surface-3)', width: '60%' }} />
            <div className="h-2.5 rounded" style={{ backgroundColor: 'var(--surface-2)', width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-20 space-y-3">
      <AlertTriangle size={32} style={{ color: 'var(--danger)' }} className="mx-auto" />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        데이터를 불러오는 데 실패했습니다
      </p>
      <button onClick={onRetry} className="btn-ghost text-sm mx-auto">
        <RefreshCw size={14} /> 다시 시도
      </button>
    </div>
  );
}

function EmptyState({ hasFilter, query, onClearSearch }: { hasFilter: boolean; query?: string; onClearSearch?: () => void }) {
  return (
    <div className="text-center py-20 space-y-3">
      <Package size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto opacity-40" />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {query ? `"${query}" 검색 결과가 없습니다` : hasFilter ? '해당 유형의 소장 작품이 없습니다' : '라이브러리가 비어 있습니다'}
      </p>
      {onClearSearch ? (
        <button onClick={onClearSearch} className="btn-ghost text-sm mx-auto">검색 초기화</button>
      ) : (
        <Link href="/titles" className="btn-primary text-sm inline-flex">카탈로그 둘러보기</Link>
      )}
    </div>
  );
}

export default MyLibraryPage;
