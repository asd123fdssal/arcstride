'use client';

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
}

export function ScoreBar({ label, value, max = 10 }: ScoreBarProps) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--surface-3)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #a78bfa)' }} />
      </div>
      <span className="w-8 text-right font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{value.toFixed(1)}</span>
    </div>
  );
}

export function ScoreCompact({ value }: { value: number }) {
  const color = value >= 8 ? 'var(--success)' : value >= 5 ? 'var(--warning)' : 'var(--danger)';
  return (
    <span className="font-mono font-bold text-sm" style={{ color }}>{value.toFixed(1)}</span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    GAME: 'rgba(116,143,252,0.15)',
    VIDEO: 'rgba(81,207,102,0.15)',
    BOOK: 'rgba(252,196,25,0.15)',
  };
  const textColors: Record<string, string> = {
    GAME: '#748ffc',
    VIDEO: '#51cf66',
    BOOK: '#fcc419',
  };
  const labels: Record<string, string> = { GAME: '게임', VIDEO: '영상', BOOK: '도서' };

  return (
    <span className="badge text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: colors[type], color: textColors[type] }}>
      {labels[type] || type}
    </span>
  );
}
