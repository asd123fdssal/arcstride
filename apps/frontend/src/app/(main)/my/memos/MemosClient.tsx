'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useUrlPaging } from '@/hooks/useUrlPaging';
import type { PageResponse, MemoItem, LoadState, Visibility } from '@/lib/types';
import {
  Loader2, Trash2, Edit2, Eye, EyeOff, StickyNote,
  AlertTriangle, RefreshCw, Search, X,
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';


const TARGET_FILTERS = [
  { key: '', label: '전체' },
  { key: 'TITLE', label: '작품' },
  { key: 'UNIT', label: '유닛' },
] as const;

const VALID_TARGETS = new Set(['TITLE', 'UNIT', '']);

function MyMemosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const { page: urlPage, values, updateUrl } = useUrlPaging({
    basePath: '/my/memos',
    params: {
      targetType: {
        parse: raw => {
          const v = (raw ?? '').toUpperCase();
          return VALID_TARGETS.has(v) ? v : '';
        },
        fallbackKeys: ['target'],
      },
      q: { parse: raw => raw?.trim() ?? '' },
    },
  });
  const urlTargetType = values.targetType;
  const urlQ = values.q;

  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editSpoiler, setEditSpoiler] = useState(false);
  const [editVisibility, setEditVisibility] = useState<Visibility>('PRIVATE');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState(urlQ);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/my/memos');
  }, [user, authLoading, router]);

  useEffect(() => { setSearchInput(urlQ); }, [urlQ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput.trim(), page: 0 });
  };

  const clearSearch = () => {
    setSearchInput('');
    updateUrl({ q: '', page: 0 });
  };

  const fetchMemos = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;
    setLoadState('loading');
    try {
      const params = new URLSearchParams({ page: String(urlPage), size: '20' });
      if (urlTargetType) params.set('targetType', urlTargetType);
      if (urlQ) params.set('q', urlQ);
      const data = await api.get<PageResponse<MemoItem>>(`/me/memos/paged?${params}`, signal);
      setMemos(data.items);
      setTotalPages(data.page.totalPages);
      setTotalElements(data.page.totalElements);
      setLoadState('success');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setLoadState('error');
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, [user, urlTargetType, urlPage, urlQ, toast]);

  useEffect(() => {
    if (authLoading || !user) return;
    const ctrl = new AbortController();
    fetchMemos(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchMemos, authLoading, user]);

  const startEdit = (m: MemoItem) => {
    setEditingId(m.memoId);
    setEditText(m.memoText);
    setEditSpoiler(m.spoilerFlag ?? false);
    setEditVisibility(m.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setEditSaving(true);
    try {
      const updated = await api.patch<MemoItem>(`/me/memos/${editingId}`, {
        memoText: editText, spoilerFlag: editSpoiler, visibility: editVisibility,
      });
      setMemos(prev => prev.map(m => m.memoId === editingId ? updated : m));
      setEditingId(null);
      toast.success('메모가 수정되었습니다');
    } catch (e: any) { toast.error(e.message); } finally { setEditSaving(false); }
  };

  const handleDelete = async (memoId: number) => {
    setDeletingId(memoId);
    try {
      await api.del(`/me/memos/${memoId}`);
      fetchMemos();
      toast.success('삭제되었습니다');
    } catch (e: any) { toast.error(e.message); } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  if (authLoading) return <SkeletonList />;
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 animate-fade-in">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>로그인 페이지로 이동합니다…</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>내 메모</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          작품/유닛에 남긴 개인 메모 {loadState === 'success' && `(${totalElements.toLocaleString()}건)`}
        </p>
      </div>

      {/* Search + Target Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="메모 내용 검색..."
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
          {TARGET_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => updateUrl({ targetType: f.key, page: 0 })}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: urlTargetType === f.key ? 'var(--accent)' : 'transparent',
                color: urlTargetType === f.key ? '#fff' : 'var(--text-secondary)',
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
        <div className="text-center py-20 space-y-3">
          <AlertTriangle size={32} style={{ color: 'var(--danger)' }} className="mx-auto" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>데이터를 불러오는 데 실패했습니다</p>
          <button onClick={() => fetchMemos()} className="btn-ghost text-sm mx-auto">
            <RefreshCw size={14} /> 다시 시도
          </button>
        </div>
      ) : memos.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <StickyNote size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto opacity-40" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {urlQ ? `"${urlQ}" 검색 결과가 없습니다` : urlTargetType ? '해당 유형의 메모가 없습니다' : '작성한 메모가 없습니다'}
          </p>
          {urlQ ? (
            <button onClick={clearSearch} className="btn-ghost text-sm mx-auto">검색 초기화</button>
          ) : (
            <Link href="/titles" className="btn-primary text-sm inline-flex">카탈로그 둘러보기</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {memos.map((m, i) => (
            <div
              key={m.memoId}
              className="card-flat p-4 group animate-slide-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
            >
              {editingId === m.memoId ? (
                <div className="space-y-2">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)}
                    className="input-field !h-20 resize-none text-sm" />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editSpoiler} onChange={e => setEditSpoiler(e.target.checked)} className="accent-[var(--accent)]" />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>스포일러</span>
                      </label>
                      <button onClick={() => setEditVisibility(v => v === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE')}
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
                        {editVisibility === 'PRIVATE' ? <><EyeOff size={10} /> 나만 보기</> : <><Eye size={10} /> 공개</>}
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingId(null)} className="btn-ghost text-xs !py-1">취소</button>
                      <button onClick={handleSaveEdit} disabled={editSaving || !editText.trim()} className="btn-primary text-xs !py-1">
                        {editSaving ? <Loader2 size={12} className="animate-spin" /> : '저장'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/titles/${m.target.titleId}`}
                        className="badge text-[10px] hover:underline">
                        {m.target.type === 'TITLE' ? '작품' : '유닛'} #{m.target.id}
                      </Link>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {m.visibility === 'PRIVATE' ? <EyeOff size={9} /> : <Eye size={9} />}
                        {m.visibility === 'PRIVATE' ? '나만 보기' : '공개'}
                      </span>
                      {m.spoilerFlag && (
                        <span className="badge text-[10px]" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: 'var(--danger)' }}>스포일러</span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.memoText}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(m.updatedAt).toLocaleDateString('ko-KR')} {new Date(m.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(m)} className="btn-ghost !p-1.5" aria-label="수정">
                      <Edit2 size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button onClick={() => setDeleteTarget(m.memoId)} disabled={deletingId === m.memoId}
                      className="btn-ghost !p-1.5 disabled:opacity-50" aria-label="삭제">
                      <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              )}
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
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget !== null ? handleDelete(deleteTarget) : Promise.resolve()}
        message="이 메모를 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="danger"
      />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card-flat p-4 animate-pulse">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded" style={{ backgroundColor: 'var(--surface-3)' }} />
              <div className="h-4 w-12 rounded" style={{ backgroundColor: 'var(--surface-2)' }} />
            </div>
            <div className="h-3.5 rounded" style={{ backgroundColor: 'var(--surface-3)', width: '70%' }} />
            <div className="h-2.5 rounded" style={{ backgroundColor: 'var(--surface-2)', width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyMemosPage;
