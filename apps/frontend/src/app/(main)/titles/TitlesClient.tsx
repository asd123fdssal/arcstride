'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type { PageResponse, TitleListItem } from '@/lib/types';

import TitleCard from '@/components/title/TitleCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useUrlPaging } from '@/hooks/useUrlPaging';
import Pagination from '@/components/ui/Pagination';
import { Search, Plus, X, AlertTriangle, RefreshCw, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

const TYPE_FILTERS = [
  { key: '', label: '전체' },
  { key: 'GAME', label: '게임' },
  { key: 'VIDEO', label: '영상' },
  { key: 'BOOK', label: '도서' },
] as const;

const VALID_TYPES = new Set(['GAME', 'VIDEO', 'BOOK', '']);

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'createdAt,desc', label: '최신 등록순' },
  { key: 'updatedAt,desc', label: '최근 업데이트순' },
  { key: 'originalTitle,asc', label: '이름순 (A→Z)' },
  { key: 'originalTitle,desc', label: '이름순 (Z→A)' },
];

const VALID_SORTS = new Set(SORT_OPTIONS.map(s => s.key));
const DEFAULT_SORT = 'createdAt,desc';

type LoadState = 'loading' | 'success' | 'error';

function TitlesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const { page: urlPage, values, updateUrl } = useUrlPaging({
    basePath: '/titles',
    params: {
      type: {
        parse: raw => {
          const v = (raw ?? '').toUpperCase();
          return VALID_TYPES.has(v) ? v : '';
        },
      },
      q: { parse: raw => raw?.trim() ?? '' },
      sort: {
        parse: raw => (raw && VALID_SORTS.has(raw)) ? raw : DEFAULT_SORT,
        /** 기본값이면 URL에서 생략 — updateUrl에서 '' 전달 시 제거됨 */
      },
    },
  });

  const urlType = values.type;
  const urlQ = values.q;
  const urlSort = values.sort;

  const [items, setItems] = useState<TitleListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState(urlQ);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const fetchTitles = useCallback(async (signal?: AbortSignal) => {
    setLoadState('loading');
    try {
      const params = new URLSearchParams({ page: String(urlPage), size: '20', sort: urlSort });
      if (urlType) params.set('type', urlType);

      let data: PageResponse<TitleListItem>;
      if (urlQ) {
        params.set('q', urlQ);
        data = await api.get<PageResponse<TitleListItem>>(`/titles/search?${params}`, signal);
      } else {
        data = await api.get<PageResponse<TitleListItem>>(`/titles?${params}`, signal);
      }
      setItems(data.items);
      setTotalPages(data.page.totalPages);
      setTotalElements(data.page.totalElements);
      setLoadState('success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setLoadState('error');
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, [urlQ, urlType, urlPage, urlSort, toast]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchTitles(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchTitles]);

  // URL → input 동기화 (뒤로가기 등)
  useEffect(() => { setSearchInput(urlQ); }, [urlQ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput.trim(), page: 0 });
  };

  const clearSearch = () => {
    setSearchInput('');
    updateUrl({ q: '', page: 0 });
  };

  return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight"
                style={{ color: 'var(--text-primary)' }}>카탈로그</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              작품을 탐색하고 진행도를 관리하세요
            </p>
          </div>
          {user && (
              <Link href="/titles/new" className="btn-primary text-sm shrink-0">
                <Plus size={16} /> 작품 등록
              </Link>
          )}
        </div>

        {/* Search + Filter + Sort */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }} />
              <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="작품명 · 별칭으로 검색..."
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

          {/* Sort + result info */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={12} style={{ color: 'var(--text-muted)' }} />
              <select
                  value={urlSort}
                  onChange={e => updateUrl({ sort: e.target.value === DEFAULT_SORT ? '' : e.target.value, page: 0 })}
                  className="text-xs py-1 px-2 rounded border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
              >
                {SORT_OPTIONS.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            {loadState === 'success' && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {urlQ ? `"${urlQ}" 검색 결과 ` : ''}총 {totalElements.toLocaleString()}건
                </p>
            )}
          </div>
        </div>

        {/* Content */}
        {loadState === 'loading' ? (
            <SkeletonGrid />
        ) : loadState === 'error' ? (
            <ErrorState onRetry={() => fetchTitles()} />
        ) : items.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Search size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto opacity-40" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {urlQ ? `"${urlQ}" 검색 결과가 없습니다` : '등록된 작품이 없습니다'}
              </p>
              {urlQ && (
                  <button onClick={clearSearch} className="btn-ghost text-sm mx-auto">검색 초기화</button>
              )}
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((t, i) => (
                  <div key={t.titleId} className="animate-slide-up"
                       style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                    <TitleCard title={t} />
                  </div>
              ))}
            </div>
        )}

        {/* Pagination */}
        {loadState === 'success' && (
            <Pagination page={urlPage} totalPages={totalPages} onPageChange={p => updateUrl({ page: p })} />
        )}
      </div>
  );
}

function SkeletonGrid() {
  return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card-flat overflow-hidden animate-pulse">
              <div className="aspect-[3/4]" style={{ backgroundColor: 'var(--surface-2)' }} />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded" style={{ backgroundColor: 'var(--surface-3)', width: '75%' }} />
                <div className="h-2.5 rounded" style={{ backgroundColor: 'var(--surface-2)', width: '50%' }} />
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

export default TitlesPage;
