'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  User, Mail, Calendar, LogOut, Sun, Moon, Download,
  Trash2, Loader2, Shield, ExternalLink,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/settings');
  }, [user, authLoading, router]);

  const handleExportData = async () => {
    setExporting(true);
    try {
      // 전체 사용자 데이터를 병렬로 가져옴
      const [memos, library, progress] = await Promise.all([
        api.get<any>('/me/memos').catch(() => ({ items: [] })),
        api.get<any>('/me/library?page=0&size=1000').catch(() => ({ items: [] })),
        api.get<any>('/me/progress/titles?page=0&size=1000').catch(() => ({ items: [] })),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          username: user?.username,
          email: user?.email,
          createdAt: user?.createdAt,
        },
        memos: memos.items ?? [],
        library: library.items ?? [],
        progress: progress.items ?? [],
      };

      // JSON 다운로드
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arcstride-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('데이터가 다운로드되었습니다');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('내보내기에 실패했습니다');
    } finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    // TODO: 백엔드 DELETE /api/auth/me 구현 후 연결
    toast.error('계정 삭제는 아직 준비 중입니다. 문의해주세요.');
  };

  if (authLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 animate-fade-in">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>로그인 페이지로 이동합니다…</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
          설정
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          프로필 정보와 앱 설정을 관리합니다
        </p>
      </div>

      {/* ── Profile Section ── */}
      <section className="card-flat p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          프로필
        </h2>

        <div className="flex items-center gap-4">
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={user.username}
              className="w-16 h-16 rounded-full border-2"
              style={{ borderColor: 'var(--border)' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--surface-2)' }}>
              <User size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
          <div className="space-y-1.5">
            <p className="font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
              {user.username}
            </p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Mail size={12} />
              {user.email}
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={12} />
              {new Date(user.createdAt).toLocaleDateString('ko-KR')} 가입
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
          <Shield size={12} style={{ color: 'var(--accent)' }} />
          Google 계정으로 연결됨
        </div>
      </section>

      {/* ── Appearance Section ── */}
      <section className="card-flat p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          화면 설정
        </h2>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>테마</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              앱의 외관을 변경합니다
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? (
              <><Moon size={16} /> 다크 모드</>
            ) : (
              <><Sun size={16} /> 라이트 모드</>
            )}
          </button>
        </div>
      </section>

      {/* ── Data Section ── */}
      <section className="card-flat p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          데이터 관리
        </h2>

        {/* Export */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>데이터 내보내기</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              메모, 라이브러리, 진행도를 JSON으로 다운로드합니다
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="btn-ghost text-sm disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} /> 내보내기</>}
          </button>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--border)' }} />

        {/* Delete Account */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>계정 삭제</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost text-sm"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      </section>

      {/* ── Session Section ── */}
      <section className="card-flat p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          세션
        </h2>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>로그아웃</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              현재 세션을 종료합니다
            </p>
          </div>
          <button onClick={logout} className="btn-ghost text-sm">
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </section>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="계정을 삭제하시겠습니까?"
        message="계정을 삭제하면 모든 데이터(메모, 라이브러리, 리뷰, 공략 등)가 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다."
        confirmLabel="계정 삭제"
        variant="danger"
      />
    </div>
  );
}
