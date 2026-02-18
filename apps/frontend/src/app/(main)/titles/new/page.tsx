'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTitlePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    type: 'GAME',
    originalTitle: '',
    koreanTitle: '',
    releaseDate: '',
    coverUrl: '',
    summary: '',
    isExplicit: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/titles/new');
    }
  }, [authLoading, user, router]);

  if (authLoading) return null;      // 또는 스켈레톤
  if (!user) return null;            // redirect 진행 중

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data: any = await api.post('/titles', {
        ...form,
        releaseDate: form.releaseDate || null,
        coverUrl: form.coverUrl || null,
        summary: form.summary || null,
      });
      router.push(`/titles/${data.titleId}`);
    } catch (err: any) {
      setError(err.message || '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Link href="/titles" className="btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> 카탈로그
      </Link>

      <form onSubmit={handleSubmit} className="card-flat p-6 space-y-4">
        <h1 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>작품 등록</h1>

        {error && (
          <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255,107,107,0.1)', color: 'var(--danger)' }}>{error}</div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>타입</label>
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-2)' }}>
            {['GAME', 'VIDEO', 'BOOK'].map(t => (
              <button key={t} type="button" onClick={() => update('type', t)}
                className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: form.type === t ? 'var(--accent)' : 'transparent',
                  color: form.type === t ? '#fff' : 'var(--text-secondary)',
                }}>
                {{ GAME: '게임', VIDEO: '영상', BOOK: '도서' }[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>원제 *</label>
          <input type="text" value={form.originalTitle} onChange={e => update('originalTitle', e.target.value)}
            className="input-field" required />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>한국어 제목</label>
          <input type="text" value={form.koreanTitle} onChange={e => update('koreanTitle', e.target.value)}
            className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>발매일</label>
            <input type="date" value={form.releaseDate} onChange={e => update('releaseDate', e.target.value)}
              className="input-field" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
              <input type="checkbox" checked={form.isExplicit} onChange={e => update('isExplicit', e.target.checked)}
                className="accent-[var(--accent)]" />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>성인 콘텐츠</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>커버 이미지 URL</label>
          <input type="url" value={form.coverUrl} onChange={e => update('coverUrl', e.target.value)}
            className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>요약</label>
          <textarea value={form.summary} onChange={e => update('summary', e.target.value)}
            className="input-field !h-24 resize-none" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={16} className="animate-spin" /> : '등록하기'}
        </button>
      </form>
    </div>
  );
}
