'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { TitleListItem } from '@/lib/types';
import { TypeBadge, ScoreCompact } from '@/components/ui/Score';
import { MessageSquare, Star } from 'lucide-react';

export default function TitleCard({ title: t }: { title: TitleListItem }) {
  const avgAll = t.stats.reviewCount > 0
    ? ((t.stats.avgGraphics + t.stats.avgStory + t.stats.avgMusic + t.stats.avgEtc) / 4)
    : 0;

  return (
    <Link href={`/titles/${t.titleId}`} className="card group block overflow-hidden">
      {/* Cover */}
      <div className="aspect-[3/4] relative overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
        {t.coverUrl ? (
          <Image
            src={t.coverUrl}
            alt={t.originalTitle}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display font-bold text-3xl opacity-10" style={{ color: 'var(--text-muted)' }}>
              {t.originalTitle.charAt(0)}
            </span>
          </div>
        )}

        {/* Type badge overlay */}
        <div className="absolute top-2 left-2 z-10">
          <TypeBadge type={t.type} />
        </div>

        {/* Score overlay */}
        {t.stats.reviewCount > 0 && (
          <div className="absolute bottom-2 right-2 z-10 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Star size={12} className="score-fill" fill="currentColor" />
            <ScoreCompact value={avgAll} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {t.koreanTitle || t.originalTitle}
        </h3>
        {t.koreanTitle && (
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{t.originalTitle}</p>
        )}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {t.releaseDate && <span>{t.releaseDate}</span>}
          {t.stats.reviewCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Star size={10} /> {t.stats.reviewCount}
            </span>
          )}
          {t.stats.commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare size={10} /> {t.stats.commentCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
