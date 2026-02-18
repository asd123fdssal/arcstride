'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';


function NewGuidePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // URL에서 titleId 자동 전달 (/guides/new?titleId=123)
  const prefilledTitleId = searchParams.get('titleId') ?? '';

  const [form, setForm] = useState({
    targetType: 'TITLE',
    targetId: prefilledTitleId,
    title: '',
    content: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/guides/new');
  }, [user, authLoading, router]);

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>;
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 animate-fade-in">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>로그인 페이지로 이동합니다…</p>
    </div>
  );

  const canSubmit = form.targetId && form.title.trim() && form.content.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res: any = await api.post('/guides', {
        target: { type: form.targetType, id: Number(form.targetId) },
        title: form.title,
        content: form.content,
        visibility: form.visibility,
      });
      toast.success('공략이 작성되었습니다');
      router.push(`/guides/${res.guideId}`);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('작성 실패');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/guides" className="btn-ghost text-sm inline-flex"><ArrowLeft size={16} /> 목록으로</Link>

      <form onSubmit={handleSubmit} className="card-flat p-6 space-y-4">
        <h1 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>공략 작성</h1>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>대상 타입</label>
            <select value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))} className="input-field">
              <option value="TITLE">작품 (Title)</option>
              <option value="UNIT">유닛 (Unit)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>대상 ID</label>
            <input type="number" value={form.targetId}
              onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))}
              className="input-field" placeholder="ID 입력" required
              readOnly={!!prefilledTitleId}
              style={prefilledTitleId ? { backgroundColor: 'var(--surface-2)' } : undefined}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>공략 제목 *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" required />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>내용 *</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input-field !h-48 resize-y" required />
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setForm(f => ({ ...f, visibility: f.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }))}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
            {form.visibility === 'PRIVATE' ? <><EyeOff size={10} /> 나만 보기</> : <><Eye size={10} /> 공개</>}
          </button>

          <button type="submit" disabled={loading || !canSubmit} className="btn-primary disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : '공략 작성 완료'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewGuidePage;
