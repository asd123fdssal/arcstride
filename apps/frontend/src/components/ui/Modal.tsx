'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-xl p-5 animate-slide-up"
        style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
