'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, LogOut, User, Gamepad2, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const NAV_ITEMS = [
  { href: '/titles', label: '카탈로그', auth: false },
  { href: '/my/progress', label: '내 진행도', auth: true },
  { href: '/my/library', label: '내 라이브러리', auth: true },
  { href: '/my/memos', label: '내 메모', auth: true },
  { href: '/guides', label: '공략', auth: false },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuPanelRef = useRef<HTMLElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // ESC 닫기 + 포커스 복귀
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        toggleBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  // Body scroll lock (다른 모달과 충돌 방지: data attribute 카운터)
  useEffect(() => {
    if (!menuOpen) return;
    const body = document.body;
    const count = parseInt(body.dataset.scrollLock ?? '0', 10);
    if (count === 0) body.style.overflow = 'hidden';
    body.dataset.scrollLock = String(count + 1);
    return () => {
      const next = parseInt(body.dataset.scrollLock ?? '1', 10) - 1;
      body.dataset.scrollLock = String(Math.max(0, next));
      if (next <= 0) {
        body.style.overflow = '';
        delete body.dataset.scrollLock;
      }
    };
  }, [menuOpen]);

  // 포커스 트랩 (Tab이 메뉴 밖으로 나가지 않도록)
  useEffect(() => {
    if (!menuOpen || !menuPanelRef.current) return;
    const panel = menuPanelRef.current;
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', onKeydown);

    // 메뉴 열릴 때 첫 번째 링크에 자동 포커스 (키보드 사용자 UX)
    const firstLink = panel.querySelector<HTMLElement>('a[href], button:not([disabled])');
    firstLink?.focus();

    return () => panel.removeEventListener('keydown', onKeydown);
  }, [menuOpen]);

  // 경로 변경 시 메뉴 닫기
  useEffect(() => { closeMenu(); }, [pathname, closeMenu]);

  const visibleItems = NAV_ITEMS.filter(item => !item.auth || user);

  return (
    <>
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: 'color-mix(in srgb, var(--surface-1) 85%, transparent)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/titles" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), #a78bfa)' }}>
              <Gamepad2 size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight"
              style={{ color: 'var(--text-primary)' }}>
              Arcstride
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
            {visibleItems.map(item => (
              <NavLink key={item.href} href={item.href} active={pathname.startsWith(item.href)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost !p-2 rounded-lg" aria-label="테마 전환">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/settings" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-3)] transition-colors"
                  style={{ backgroundColor: 'var(--surface-2)' }}>
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={14} style={{ color: 'var(--accent)' }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user.username}
                  </span>
                </Link>
                <button onClick={logout} className="btn-ghost !p-2 rounded-lg" aria-label="로그아웃">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary text-sm !py-1.5 hidden md:inline-flex">
                로그인
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              ref={toggleBtnRef}
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden btn-ghost !p-2"
              aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu: overlay + panel (header 밖에서 렌더링) */}
      {menuOpen && (
        <>
          {/* Overlay - 클릭 시 닫기 */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <nav
            ref={menuPanelRef}
            id="mobile-menu"
            role="navigation"
            aria-label="모바일 메뉴"
            className="fixed top-14 left-0 right-0 z-50 md:hidden border-b animate-slide-up"
            style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border)' }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {visibleItems.map(item => (
                <MobileLink
                  key={item.href}
                  href={item.href}
                  active={pathname.startsWith(item.href)}
                  onClick={closeMenu}
                >
                  {item.label}
                </MobileLink>
              ))}
              <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
              {user ? (
                <>
                  <MobileLink href="/settings" active={pathname === '/settings'} onClick={closeMenu}>
                    설정
                  </MobileLink>
                  <button
                    onClick={() => { logout(); closeMenu(); }}
                    className="text-left px-3 py-2 rounded-lg text-sm"
                    style={{ color: 'var(--danger)' }}
                  >
                    로그아웃 ({user.username})
                  </button>
                </>
              ) : (
                <MobileLink href="/login" active={false} onClick={closeMenu}>로그인</MobileLink>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="btn-ghost text-sm !py-1.5 !px-3"
      style={{
        color: active ? 'var(--accent)' : undefined,
        backgroundColor: active ? 'rgba(116, 143, 252, 0.08)' : undefined,
      }}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, active, children, onClick }: {
  href: string; active: boolean; children: React.ReactNode; onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        color: active ? 'var(--accent)' : 'var(--text-primary)',
        backgroundColor: active ? 'rgba(116, 143, 252, 0.08)' : undefined,
      }}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
