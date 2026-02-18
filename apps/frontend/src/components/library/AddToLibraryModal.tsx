'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import type { StoreItem, AcquisitionType, ItemsResponse, LibraryItemResponse } from '@/lib/types';
import { Loader2, Check } from 'lucide-react';

const ACQ_OPTIONS: { value: AcquisitionType; label: string }[] = [
  { value: 'PURCHASE', label: '구매' },
  { value: 'SUBSCRIPTION', label: '구독' },
  { value: 'GIFT', label: '선물' },
];

interface Props {
  titleId: number;
  titleName: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function AddToLibraryModal({ titleId, titleName, open, onClose, onSaved }: Props) {
  const toast = useToast();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [acquisitionType, setAcquisitionType] = useState<AcquisitionType>('PURCHASE');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<LibraryItemResponse | null>(null);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoadingStores(true);
    const ctrl = new AbortController();

    (async () => {
      try {
        const [storesRes, lib] = await Promise.all([
          api.get<ItemsResponse<StoreItem>>('/stores', ctrl.signal),
          api.get<LibraryItemResponse>(`/me/library/titles/${titleId}`, ctrl.signal).catch(() => null),
        ]);
        setStores(storesRes.items);
        if (lib) {
          setExisting(lib);
          setStoreId(lib.storeId);
          setAcquisitionType(lib.acquisitionType);
          setNote(lib.note ?? '');
        } else {
          setExisting(null);
          setAcquisitionType('PURCHASE');
          setNote('');
          if (storesRes.items.length > 0) setStoreId(storesRes.items[0].storeId);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // 스토어 로드 실패 시 빈 목록으로 표시
      } finally {
        if (!ctrl.signal.aborted) setLoadingStores(false);
      }
    })();

    return () => ctrl.abort();
  }, [open, titleId]);

  const handleSubmit = async () => {
    if (!storeId) { toast.error('스토어를 선택해주세요'); return; }
    setSaving(true);
    try {
      await api.put(`/me/library/titles/${titleId}`, {
        storeId,
        acquisitionType,
        note: note.trim() || null,
      });
      toast.success(existing ? '소장 정보가 수정되었습니다' : '라이브러리에 추가되었습니다');
      onSaved?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? '소장 정보 수정' : '라이브러리에 추가'}>
      {loadingStores ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{titleName}</p>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>스토어</label>
            <select
              value={storeId ?? ''}
              onChange={e => setStoreId(Number(e.target.value))}
              className="input-field text-sm"
            >
              <option value="" disabled>스토어 선택</option>
              {stores.map(s => (
                <option key={s.storeId} value={s.storeId}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>획득 유형</label>
            <div className="flex gap-2">
              {ACQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAcquisitionType(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                  style={{
                    backgroundColor: acquisitionType === opt.value ? 'var(--accent)' : 'var(--surface-2)',
                    color: acquisitionType === opt.value ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {acquisitionType === opt.value && <Check size={12} />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>메모 (선택)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="예: 한정판, DLC 포함"
              className="input-field text-sm"
              maxLength={200}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost text-sm flex-1">취소</button>
            <button
              onClick={handleSubmit}
              disabled={saving || !storeId}
              className="btn-primary text-sm flex-1 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {existing ? '수정' : '추가'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
