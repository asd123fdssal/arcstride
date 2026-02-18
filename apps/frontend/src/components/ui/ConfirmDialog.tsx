'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

/**
 * 확인/취소 다이얼로그.
 * confirm() 대체용. Modal 기반이라 UX가 더 자연스러움.
 *
 * 사용법:
 *   <ConfirmDialog
 *     open={showDelete}
 *     onClose={() => setShowDelete(false)}
 *     onConfirm={handleDelete}
 *     message="정말 삭제하시겠습니까?"
 *     variant="danger"
 *   />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // 에러는 onConfirm 내부에서 처리
    } finally {
      setLoading(false);
    }
  };

  const confirmColor = variant === 'danger'
    ? { backgroundColor: 'var(--danger)', color: '#fff' }
    : undefined;

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title}>
      <div className="space-y-4">
        <div className="flex gap-3">
          {variant === 'danger' && (
            <AlertTriangle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
          )}
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary text-sm disabled:opacity-50"
            style={confirmColor}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
