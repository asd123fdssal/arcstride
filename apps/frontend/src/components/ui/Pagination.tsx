'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="btn-ghost !p-2 disabled:opacity-30"
        aria-label="이전 페이지"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
        {page + 1} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="btn-ghost !p-2 disabled:opacity-30"
        aria-label="다음 페이지"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
