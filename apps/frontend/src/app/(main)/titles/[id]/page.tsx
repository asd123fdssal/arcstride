'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import type {
  TitleDetail, UnitItem, ItemsResponse, UnitStatusItem, CharacterItem,
  TitleProgressSummary, PageResponse, ReviewItem, CommentItem,
  MemoItem, GuideListItem, StoreItem,
} from '@/lib/types';
import { ScoreBar, TypeBadge } from '@/components/ui/Score';
import {
  Star, MessageSquare, Loader2, Check, Clock, Minus, Send, Trash2,
  Plus, Users, BookOpen, StickyNote, Library, Tag, Edit2, Eye, EyeOff,
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import AddToLibraryModal from '@/components/library/AddToLibraryModal';

type Tab = 'units' | 'characters' | 'reviews' | 'comments' | 'memos' | 'guides';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Check }> = {
  DONE: { label: '완료', color: 'var(--success)', icon: Check },
  PROGRESS: { label: '진행중', color: 'var(--warning)', icon: Clock },
  NONE: { label: '미진행', color: 'var(--text-muted)', icon: Minus },
};

export default function TitleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const titleId = Number(id);
  const { user } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState<TitleDetail | null>(null);
  const [tab, setTab] = useState<Tab>('units');
  const [loading, setLoading] = useState(true);

  // Modals
  const [aliasModal, setAliasModal] = useState(false);
  const [libraryModal, setLibraryModal] = useState(false);

  const fetchTitle = useCallback(async () => {
    const data = await api.get<TitleDetail>(`/titles/${titleId}`);
    setTitle(data);
  }, [titleId]);

  useEffect(() => {
    fetchTitle().finally(() => setLoading(false));
  }, [fetchTitle]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>;
  if (!title) return <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>작품을 찾을 수 없습니다</div>;

  const avgAll = title.stats.reviewCount > 0
    ? (title.stats.avgGraphics + title.stats.avgStory + title.stats.avgMusic + title.stats.avgEtc) / 4 : 0;

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'units', label: '유닛', show: true },
    { key: 'characters', label: '캐릭터', show: title.type === 'GAME' },
    { key: 'reviews', label: '리뷰', show: true },
    { key: 'comments', label: '댓글', show: true },
    { key: 'memos', label: '메모', show: !!user },
    { key: 'guides', label: '공략', show: true },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-48 shrink-0 mx-auto md:mx-0">
          <div className="aspect-[3/4] rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
            {title.coverUrl ? (
              <img src={title.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl font-display font-bold opacity-10">{title.originalTitle.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={title.type} />
            {title.isExplicit && <span className="badge" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: 'var(--danger)' }}>19+</span>}
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title.koreanTitle || title.originalTitle}
          </h1>
          {title.koreanTitle && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title.originalTitle}</p>}
          {title.releaseDate && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>발매일: {title.releaseDate}</p>}

          {/* Aliases */}
          <div className="flex flex-wrap items-center gap-1.5">
            {title.aliases.map(a => <span key={a} className="badge text-[10px]">{a}</span>)}
            {user && (
              <button onClick={() => setAliasModal(true)} className="badge text-[10px] cursor-pointer hover:opacity-80" style={{ backgroundColor: 'rgba(116,143,252,0.1)', color: 'var(--accent)' }}>
                <Tag size={9} className="mr-0.5" /> 별칭 추가
              </button>
            )}
          </div>

          {title.summary && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{title.summary}</p>}

          {/* Action buttons */}
          {user && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => setLibraryModal(true)} className="btn-ghost text-xs !py-1.5">
                <Library size={14} /> 라이브러리 추가
              </button>
            </div>
          )}

          {/* Scores */}
          {title.stats.reviewCount > 0 && (
            <div className="card-flat p-4 space-y-2 mt-3 max-w-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>평균 평점</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="score-fill" fill="currentColor" />
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{avgAll.toFixed(1)}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({title.stats.reviewCount}명)</span>
                </div>
              </div>
              <ScoreBar label="그래픽" value={title.stats.avgGraphics} />
              <ScoreBar label="스토리" value={title.stats.avgStory} />
              <ScoreBar label="음악" value={title.stats.avgMusic} />
              <ScoreBar label="기타" value={title.stats.avgEtc} />
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {tabs.filter(t => t.show).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            style={{ borderColor: tab === t.key ? 'var(--accent)' : 'transparent', color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'units' && <UnitsTab titleId={titleId} titleType={title.type} />}
      {tab === 'characters' && <CharactersTab titleId={titleId} />}
      {tab === 'reviews' && <ReviewsTab titleId={titleId} />}
      {tab === 'comments' && <CommentsTab titleId={titleId} />}
      {tab === 'memos' && <MemosTab titleId={titleId} />}
      {tab === 'guides' && <GuidesTab titleId={titleId} />}

      {/* ── Alias Modal ── */}
      <AliasModal open={aliasModal} onClose={() => setAliasModal(false)} titleId={titleId} onAdded={() => { setAliasModal(false); fetchTitle(); }} />

      {/* ── Library Modal ── */}
      <AddToLibraryModal
        open={libraryModal}
        onClose={() => setLibraryModal(false)}
        titleId={titleId}
        titleName={title?.koreanTitle || title?.originalTitle || ''}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// Units Tab with Add Unit
// ═══════════════════════════════════════════
function UnitsTab({ titleId, titleType }: { titleId: number; titleType: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [progress, setProgress] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<TitleProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ unitKey: '', displayName: '', sortOrder: '' });
  const [adding, setAdding] = useState(false);

  const unitType = titleType === 'GAME' ? 'ROUTE' : titleType === 'VIDEO' ? 'EPISODE' : 'VOLUME';

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      const unitData = await api.get<ItemsResponse<UnitItem>>(`/titles/${titleId}/units`, signal);
      setUnits(unitData.items);
      if (user) {
        const [progData, sumData] = await Promise.all([
          api.get<ItemsResponse<UnitStatusItem>>(`/me/progress/titles/${titleId}/units`, signal),
          api.get<TitleProgressSummary>(`/me/progress/titles/${titleId}`, signal),
        ]);
        const map: Record<number, string> = {};
        progData.items.forEach(p => { map[p.unitId] = p.status; });
        setProgress(map);
        setSummary(sumData);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, [titleId, user]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  const cycleStatus = async (unitId: number) => {
    const current = progress[unitId] || 'NONE';
    const next = current === 'NONE' ? 'PROGRESS' : current === 'PROGRESS' ? 'DONE' : 'NONE';
    await api.put(`/me/progress/units/${unitId}`, { status: next });
    setProgress(prev => ({ ...prev, [unitId]: next }));
    const sumData = await api.get<TitleProgressSummary>(`/me/progress/titles/${titleId}`);
    setSummary(sumData);
  };

  const handleAddUnit = async () => {
    if (!addForm.unitKey.trim()) return;
    setAdding(true);
    try {
      await api.post(`/titles/${titleId}/units`, {
        unitType,
        unitKey: addForm.unitKey,
        displayName: addForm.displayName || null,
        sortOrder: addForm.sortOrder ? Number(addForm.sortOrder) : null,
      });
      setAddForm({ unitKey: '', displayName: '', sortOrder: '' });
      setShowAdd(false);
      toast.success('유닛이 추가되었습니다');
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || '추가 실패');
    } finally { setAdding(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Progress summary */}
      {user && summary && summary.unitSummary.total > 0 && (
        <div className="card-flat p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>진행도</span>
            <span className="badge-accent badge text-[10px]">{summary.derivedStatus}</span>
          </div>
          <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>전체 <b style={{ color: 'var(--text-primary)' }}>{summary.unitSummary.total}</b></span>
            <span>완료 <b style={{ color: 'var(--success)' }}>{summary.unitSummary.done}</b></span>
            <span>진행중 <b style={{ color: 'var(--warning)' }}>{summary.unitSummary.progress}</b></span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: 'var(--surface-3)' }}>
            <div style={{ width: `${(summary.unitSummary.done / summary.unitSummary.total) * 100}%`, backgroundColor: 'var(--success)' }} />
            <div style={{ width: `${(summary.unitSummary.progress / summary.unitSummary.total) * 100}%`, backgroundColor: 'var(--warning)' }} />
          </div>
        </div>
      )}

      {/* Add Unit */}
      {user && (
        <div>
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs">
              <Plus size={14} /> {unitType} 추가
            </button>
          ) : (
            <div className="card-flat p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Unit Key *" value={addForm.unitKey} onChange={e => setAddForm(f => ({ ...f, unitKey: e.target.value }))} className="input-field text-xs" />
                <input placeholder="표시명" value={addForm.displayName} onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))} className="input-field text-xs" />
                <input placeholder="정렬순서" type="number" value={addForm.sortOrder} onChange={e => setAddForm(f => ({ ...f, sortOrder: e.target.value }))} className="input-field text-xs" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddUnit} disabled={adding} className="btn-primary text-xs !py-1.5">
                  {adding ? <Loader2 size={12} className="animate-spin" /> : '추가'}
                </button>
                <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs !py-1.5">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unit list */}
      {units.length === 0 ? (
        <Empty text="등록된 유닛이 없습니다" />
      ) : (
        <div className="space-y-1.5">
          {units.map(u => {
            const st = progress[u.unitId] || 'NONE';
            const info = STATUS_LABELS[st] || STATUS_LABELS.NONE;
            const Icon = info.icon;
            return (
              <div key={u.unitId} className="card-flat flex items-center gap-3 px-4 py-3">
                {user && (
                  <button onClick={() => cycleStatus(u.unitId)}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{ borderColor: info.color, backgroundColor: st !== 'NONE' ? info.color : 'transparent' }}
                    title={`${info.label} (클릭하여 변경)`}>
                    {st !== 'NONE' && <Icon size={14} className="text-white" />}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.displayName || u.unitKey}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.unitType} · {u.unitKey}{u.sortOrder != null && ` · #${u.sortOrder}`}</p>
                </div>
                {user && <span className="text-[10px] font-medium shrink-0" style={{ color: info.color }}>{info.label}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Characters Tab (GAME only)
// ═══════════════════════════════════════════
function CharactersTab({ titleId }: { titleId: number }) {
  const { user } = useAuth();
  const toast = useToast();
  const [chars, setChars] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ originalName: '', koreanName: '', characterImageUrl: '', isExplicit: false });
  const [adding, setAdding] = useState(false);

  const fetchChars = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.get<ItemsResponse<CharacterItem>>(`/titles/${titleId}/characters`, signal);
      setChars(data.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, [titleId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchChars(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchChars]);

  const handleAdd = async () => {
    if (!form.originalName.trim() && !form.koreanName.trim()) return;
    setAdding(true);
    try {
      await api.post(`/titles/${titleId}/characters`, {
        originalName: form.originalName || null,
        koreanName: form.koreanName || null,
        characterImageUrl: form.characterImageUrl || null,
        isExplicit: form.isExplicit,
      });
      setForm({ originalName: '', koreanName: '', characterImageUrl: '', isExplicit: false });
      setShowAdd(false);
      toast.success('캐릭터가 추가되었습니다');
      await fetchChars();
    } catch (e: any) {
      toast.error(e.message || '추가 실패');
    } finally { setAdding(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-slide-up">
      {user && (
        <div>
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs"><Plus size={14} /> 캐릭터 추가</button>
          ) : (
            <div className="card-flat p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="원어 이름" value={form.originalName} onChange={e => setForm(f => ({ ...f, originalName: e.target.value }))} className="input-field text-xs" />
                <input placeholder="한국어 이름" value={form.koreanName} onChange={e => setForm(f => ({ ...f, koreanName: e.target.value }))} className="input-field text-xs" />
              </div>
              <input placeholder="이미지 URL" value={form.characterImageUrl} onChange={e => setForm(f => ({ ...f, characterImageUrl: e.target.value }))} className="input-field text-xs" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isExplicit} onChange={e => setForm(f => ({ ...f, isExplicit: e.target.checked }))} className="accent-[var(--accent)]" />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>성인 캐릭터</span>
              </label>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={adding} className="btn-primary text-xs !py-1.5">
                  {adding ? <Loader2 size={12} className="animate-spin" /> : '추가'}
                </button>
                <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs !py-1.5">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      {chars.length === 0 ? (
        <Empty text="등록된 캐릭터가 없습니다" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {chars.map(c => (
            <div key={c.characterId} className="card-flat p-3 text-center space-y-2">
              <div className="w-16 h-16 rounded-full mx-auto overflow-hidden" style={{ backgroundColor: 'var(--surface-3)' }}>
                {c.characterImageUrl ? (
                  <img src={c.characterImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={20} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.koreanName || c.originalName}</p>
              {c.koreanName && c.originalName && (
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{c.originalName}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Reviews Tab
// ═══════════════════════════════════════════
function ReviewsTab({ titleId }: { titleId: number }) {
  const { user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ graphics: 7, story: 7, music: 7, etc: 7, reviewText: '', spoilerFlag: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.get<PageResponse<ReviewItem>>(`/titles/${titleId}/reviews?page=0&size=50`, signal);
      setReviews(data.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, [titleId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchReviews(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchReviews]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/titles/${titleId}/my-review`, form);
      setShowForm(false);
      toast.success('리뷰가 저장되었습니다');
      fetchReviews();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

  const handleDeleteMine = async () => {
    try {
      await api.del(`/titles/${titleId}/my-review`);
      toast.success('리뷰가 삭제되었습니다');
      fetchReviews();
    } catch {}
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-slide-up">
      {user && (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="btn-primary text-xs"><Star size={14} /> 리뷰 작성</button>
          ) : (
            <div className="card-flat p-4 space-y-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>내 리뷰</h3>
              {(['graphics', 'story', 'music', 'etc'] as const).map(key => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs w-14" style={{ color: 'var(--text-muted)' }}>{{ graphics: '그래픽', story: '스토리', music: '음악', etc: '기타' }[key]}</span>
                  <input type="range" min="0" max="10" step="0.5" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))} className="flex-1 accent-[var(--accent)]" />
                  <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text-secondary)' }}>{form[key].toFixed(1)}</span>
                </div>
              ))}
              <textarea value={form.reviewText} onChange={e => setForm(f => ({ ...f, reviewText: e.target.value }))} placeholder="한줄평 (선택)" className="input-field !h-20 resize-none" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.spoilerFlag} onChange={e => setForm(f => ({ ...f, spoilerFlag: e.target.checked }))} className="accent-[var(--accent)]" />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>스포일러 포함</span>
              </label>
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-xs !py-1.5">{submitting ? <Loader2 size={12} className="animate-spin" /> : '저장'}</button>
                <button onClick={() => setShowForm(false)} className="btn-ghost text-xs !py-1.5">취소</button>
              </div>
            </div>
          )}
        </div>
      )}

      {reviews.length === 0 ? <Empty text="리뷰가 없습니다" /> : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="card-flat p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.user.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.createdAt?.slice(0, 10)}</span>
                  {user && user.userId === r.user.userId && (
                    <button onClick={handleDeleteMine} className="btn-ghost !p-1"><Trash2 size={12} style={{ color: 'var(--danger)' }} /></button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[{ l: '그래픽', v: r.graphics }, { l: '스토리', v: r.story }, { l: '음악', v: r.music }, { l: '기타', v: r.etc }].map(s => (
                  <div key={s.l} className="text-center">
                    <div className="font-mono font-bold text-sm" style={{ color: 'var(--accent)' }}>{s.v.toFixed(1)}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {r.reviewText && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {r.spoilerFlag && <span className="badge mr-1 text-[10px]" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: 'var(--danger)' }}>스포</span>}
                  {r.reviewText}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Comments Tab
// ═══════════════════════════════════════════
function CommentsTab({ titleId }: { titleId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.get<PageResponse<CommentItem>>(`/titles/${titleId}/comments?page=0&size=100`, signal);
      setComments(data.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, [titleId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchComments(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchComments]);

  const post = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/titles/${titleId}/comments`, { body, spoilerFlag: false });
      setBody('');
      fetchComments();
    } catch {} finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-slide-up">
      {user && (
        <div className="flex gap-2">
          <input value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && post()} placeholder="댓글을 입력하세요..." className="input-field flex-1" />
          <button onClick={post} disabled={submitting || !body.trim()} className="btn-primary !px-3">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      )}
      {comments.length === 0 ? <Empty text="댓글이 없습니다" /> : (
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.commentId} className="card-flat px-4 py-3 flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--surface-3)', color: 'var(--accent)' }}>
                {c.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.user.username}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{c.createdAt?.slice(0, 10)}</span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.body}</p>
              </div>
              {user && user.userId === c.user.userId && (
                <button onClick={() => { api.del(`/comments/${c.commentId}`).then(() => fetchComments()); }} className="btn-ghost !p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Memos Tab (authenticated only, inline create + edit)
// ═══════════════════════════════════════════
function MemosTab({ titleId }: { titleId: number }) {
  const toast = useToast();
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editSpoiler, setEditSpoiler] = useState(false);
  const [editVisibility, setEditVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [editSaving, setEditSaving] = useState(false);

  const fetchMemos = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.get<ItemsResponse<MemoItem>>(`/me/memos?targetType=TITLE&targetId=${titleId}`, signal);
      setMemos(data.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, [titleId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMemos(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchMemos]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/me/memos', {
        target: { type: 'TITLE', id: titleId },
        memoText: text,
        spoilerFlag: spoiler,
        visibility,
      });
      setText(''); setSpoiler(false);
      toast.success('메모가 추가되었습니다');
      fetchMemos();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  };

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
        memoText: editText,
        spoilerFlag: editSpoiler,
        visibility: editVisibility,
      });
      setMemos(prev => prev.map(m => m.memoId === editingId ? updated : m));
      setEditingId(null);
      toast.success('메모가 수정되었습니다');
    } catch (e: any) { toast.error(e.message); } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    try {
      await api.del(`/me/memos/${id}`);
      setMemos(prev => prev.filter(m => m.memoId !== id));
      toast.success('삭제되었습니다');
    } catch (e: any) { toast.error(e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Add memo inline */}
      <div className="card-flat p-4 space-y-2">
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="이 작품에 대한 메모를 남겨보세요..." className="input-field !h-16 resize-none text-sm" />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} className="accent-[var(--accent)]" />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>스포일러</span>
            </label>
            <button onClick={() => setVisibility(v => v === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE')}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
              {visibility === 'PRIVATE' ? <><EyeOff size={10} /> 나만 보기</> : <><Eye size={10} /> 공개</>}
            </button>
          </div>
          <button onClick={handleAdd} disabled={submitting || !text.trim()} className="btn-primary text-xs !py-1.5">
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <><StickyNote size={12} /> 메모 추가</>}
          </button>
        </div>
      </div>

      {memos.length === 0 ? <Empty text="이 작품에 대한 메모가 없습니다" /> : (
        <div className="space-y-2">
          {memos.map(m => (
            <div key={m.memoId} className="card-flat px-4 py-3 group">
              {editingId === m.memoId ? (
                <div className="space-y-2">
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} className="input-field !h-16 resize-none text-sm" />
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
                <div className="flex items-start gap-3">
                  <StickyNote size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {m.spoilerFlag && <span className="badge text-[10px]" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: 'var(--danger)' }}>스포일러</span>}
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {m.visibility === 'PRIVATE' ? <EyeOff size={9} /> : <Eye size={9} />}
                        {m.visibility === 'PRIVATE' ? '나만 보기' : '공개'}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.memoText}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(m.updatedAt).toLocaleDateString('ko-KR')} {new Date(m.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(m)} className="btn-ghost !p-1.5" aria-label="수정">
                      <Edit2 size={13} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button onClick={() => handleDelete(m.memoId)} className="btn-ghost !p-1.5" aria-label="삭제">
                      <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Guides Tab
// ═══════════════════════════════════════════
function GuidesTab({ titleId }: { titleId: number }) {
  const { user } = useAuth();
  const toast = useToast();
  const [guides, setGuides] = useState<GuideListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE' });
  const [adding, setAdding] = useState(false);

  const fetchGuides = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await api.get<PageResponse<GuideListItem>>(`/guides?targetType=TITLE&targetId=${titleId}&page=0&size=50`, signal);
      setGuides(data.items);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setLoading(false); }
  }, [titleId]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchGuides(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchGuides]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setAdding(true);
    try {
      await api.post('/guides', {
        target: { type: 'TITLE', id: titleId },
        title: form.title,
        content: form.content,
        visibility: form.visibility,
      });
      setForm({ title: '', content: '', visibility: 'PUBLIC' });
      setShowAdd(false);
      toast.success('공략이 작성되었습니다');
      fetchGuides();
    } catch (e: any) { toast.error(e.message); } finally { setAdding(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 animate-slide-up">
      {user && (
        <div>
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs"><Plus size={14} /> 공략 작성</button>
          ) : (
            <div className="card-flat p-4 space-y-3">
              <input placeholder="공략 제목 *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field text-sm" />
              <textarea placeholder="공략 내용 *" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input-field !h-32 resize-none text-sm" />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button onClick={() => setForm(f => ({ ...f, visibility: f.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }))}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
                  {form.visibility === 'PRIVATE' ? <><EyeOff size={10} /> 나만 보기</> : <><Eye size={10} /> 공개</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs !py-1.5">취소</button>
                  <button onClick={handleAdd} disabled={adding} className="btn-primary text-xs !py-1.5">{adding ? <Loader2 size={12} className="animate-spin" /> : '작성 완료'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {guides.length === 0 ? <Empty text="이 작품에 대한 공략이 없습니다" /> : (
        <div className="space-y-2">
          {guides.map(g => (
            <Link key={g.guideId} href={`/guides/${g.guideId}`} className="card-flat block px-4 py-3 hover:border-[var(--border-hover)] transition-colors">
              <div className="flex items-center gap-2">
                <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{g.title}</span>
                {g.visibility === 'PRIVATE' && (
                  <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <EyeOff size={9} /> 비공개
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                by {g.author.username} · {new Date(g.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Alias Modal
// ═══════════════════════════════════════════
function AliasModal({ open, onClose, titleId, onAdded }: { open: boolean; onClose: () => void; titleId: number; onAdded: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post(`/titles/${titleId}/aliases`, { aliasText: text, aliasType: 'ALT' });
      setText('');
      toast.success('별칭이 추가되었습니다');
      onAdded();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="별칭 추가">
      <div className="space-y-3">
        <input placeholder="별칭 입력 (예: 약칭, 영문명 등)" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} className="input-field" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm">취소</button>
          <button onClick={handleAdd} disabled={loading || !text.trim()} className="btn-primary text-sm">
            {loading ? <Loader2 size={14} className="animate-spin" /> : '추가'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════
function LoadingSpinner() {
  return <div className="py-8 text-center"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: 'var(--text-muted)' }} /></div>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>{text}</p>;
}
