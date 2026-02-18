'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import type { GuideDetail } from '@/lib/types';
import { Loader2, ArrowLeft, Edit2, Trash2, BookOpen, Save, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    api.get<GuideDetail>(`/guides/${id}`, ctrl.signal)
      .then(setGuide)
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id]);

  const startEdit = () => {
    if (!guide) return;
    setEditTitle(guide.title);
    setEditContent(guide.content);
    setEditVisibility(guide.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      const updated = await api.patch<GuideDetail>(`/guides/${id}`, {
        title: editTitle,
        content: editContent,
        visibility: editVisibility,
      });
      setGuide(updated);
      setEditing(false);
      toast.success('공략이 수정되었습니다');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('공략을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    setDeleting(true);
    try {
      await api.del(`/guides/${id}`);
      toast.success('삭제되었습니다');
      router.push('/guides');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} /></div>;
  }

  if (error || !guide) {
    return (
      <div className="text-center py-20 space-y-3 animate-fade-in">
        <AlertTriangle size={32} style={{ color: 'var(--danger)' }} className="mx-auto" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>공략을 찾을 수 없습니다</p>
        <Link href="/guides" className="btn-ghost text-sm inline-flex"><ArrowLeft size={14} /> 목록으로</Link>
      </div>
    );
  }

  const isAuthor = user && user.userId === guide.author.userId;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/guides" className="btn-ghost text-sm inline-flex">
        <ArrowLeft size={16} /> 목록으로
      </Link>

      <article className="card-flat p-6 space-y-4">
        {editing ? (
          /* ── Edit mode ── */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>제목</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>내용</label>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="input-field !h-48 resize-y text-sm" />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => setEditVisibility(v => v === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)' }}>
                {editVisibility === 'PRIVATE' ? <><EyeOff size={10} /> 나만 보기</> : <><Eye size={10} /> 공개</>}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm"><X size={14} /> 취소</button>
                <button onClick={handleSave} disabled={saving || !editTitle.trim() || !editContent.trim()} className="btn-primary text-sm disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> 저장</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                  <Link href={`/titles/${guide.target.id}`} className="badge text-[10px] hover:underline">
                    {guide.target.type} #{guide.target.id}
                  </Link>
                  {guide.visibility === 'PRIVATE' && (
                    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <EyeOff size={9} /> 비공개
                    </span>
                  )}
                </div>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{guide.title}</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  by {guide.author.username} · {new Date(guide.createdAt).toLocaleDateString('ko-KR')}
                  {guide.updatedAt !== guide.createdAt && ` · 수정 ${new Date(guide.updatedAt).toLocaleDateString('ko-KR')}`}
                </p>
              </div>
              {isAuthor && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={startEdit} className="btn-ghost !p-2" aria-label="수정">
                    <Edit2 size={16} style={{ color: 'var(--text-muted)' }} />
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="btn-ghost !p-2 disabled:opacity-50" aria-label="삭제">
                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} style={{ color: 'var(--danger)' }} />}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
                {guide.content.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
