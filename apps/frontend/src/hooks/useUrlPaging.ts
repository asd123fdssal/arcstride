'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ParamDef {
  /** URL에서 값을 읽고 정규화하는 함수 */
  parse: (raw: string | null) => string;
  /** 이 파라미터의 fallback 이름들 (과거 링크 호환). 예: ['target'] */
  fallbackKeys?: string[];
}

interface UrlPagingOptions {
  /** 기본 경로 (e.g. '/my/library') */
  basePath: string;
  /** 추가 파라미터 정의 */
  params?: Record<string, ParamDef>;
}

interface UrlPagingResult {
  /** 현재 페이지 (0-based) */
  page: number;
  /** 파싱된 추가 파라미터 값 */
  values: Record<string, string>;
  /** URL 업데이트. page와 추가 파라미터를 부분 변경 */
  updateUrl: (updates: Record<string, string | number | undefined>) => void;
}

/**
 * URL 기반 페이지네이션 + 필터 동기화 훅.
 *
 * @example
 * const { page, values, updateUrl } = useUrlPaging({
 *   basePath: '/my/memos',
 *   params: {
 *     targetType: {
 *       parse: raw => ['TITLE','UNIT',''].includes(raw?.toUpperCase() ?? '') ? (raw?.toUpperCase() ?? '') : '',
 *       fallbackKeys: ['target'],
 *     },
 *   },
 * });
 * // values.targetType === 'TITLE' | 'UNIT' | ''
 * // updateUrl({ targetType: 'TITLE', page: 0 })
 */
export function useUrlPaging({ basePath, params = {} }: UrlPagingOptions): UrlPagingResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse page
  const rawPage = parseInt(searchParams.get('page') ?? '0', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 0 ? rawPage : 0;

  // Parse extra params (with fallback support)
  const values = useMemo(() => {
    const v: Record<string, string> = {};
    for (const [key, config] of Object.entries(params)) {
      let raw = searchParams.get(key);
      if (raw === null && config.fallbackKeys) {
        for (const fk of config.fallbackKeys) {
          raw = searchParams.get(fk);
          if (raw !== null) break;
        }
      }
      v[key] = config.parse(raw);
    }
    return v;
    // searchParams changes on navigation; params is stable per render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateUrl = useCallback((updates: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();

    const nextPage = updates.page !== undefined ? Number(updates.page) : page;
    if (nextPage > 0) sp.set('page', String(nextPage));

    for (const key of Object.keys(params)) {
      const val = updates[key] !== undefined ? String(updates[key]) : values[key];
      if (val) sp.set(key, val);
    }

    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, basePath, page, values]);

  return { page, values, updateUrl };
}

