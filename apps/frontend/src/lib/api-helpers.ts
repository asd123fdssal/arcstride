/**
 * OpenAPI generated 타입에서 편의 타입을 추출하는 헬퍼.
 *
 * === 전환 가이드 ===
 *
 * Step 1: 백엔드 실행 후 타입 생성
 *   $ cd apps/frontend
 *   $ npm run generate-types
 *   → src/lib/api-types.ts 생성됨
 *
 * Step 2: 아래 주석 해제
 *
 * Step 3: 사용처에서 import 변경
 *   // Before (수동 types.ts)
 *   import type { LibraryListItem } from '@/lib/types';
 *
 *   // After (generated)
 *   import type { LibraryListItem } from '@/lib/api-helpers';
 *
 * Step 4: types.ts에서 해당 타입 제거 (UI 전용 타입만 남김)
 *
 * === 첫 적용 타겟: GET /me/library ===
 *
 * my/library/page.tsx에서:
 *   import type { LibraryListItem, StoreItem } from '@/lib/api-helpers';
 *   → types.ts의 LibraryListItem, StoreItem 삭제
 *
 * titles/[id]/page.tsx의 AddToLibraryModal에서:
 *   import type { StoreItem, LibraryItemResponse } from '@/lib/api-helpers';
 */

// ─── api-types.ts가 생성된 후 아래를 활성화 ───
// import type { components } from './api-types';
//
// // ── Library (첫 적용 타겟) ──
// export type LibraryListItem = components['schemas']['LibraryDtos.LibraryListItem'];
// export type LibraryItemResponse = components['schemas']['LibraryDtos.LibraryItemResponse'];
// export type UpsertRequest = components['schemas']['LibraryDtos.UpsertRequest'];
// export type StoreItem = components['schemas']['LibraryDtos.StoreItem'];
//
// // ── Title ──
// export type TitleListItem = components['schemas']['TitleDtos.ListItem'];
// export type TitleDetail = components['schemas']['TitleDtos.DetailResponse'];
// export type TitleStats = components['schemas']['TitleDtos.StatsDto'];
//
// // ── Unit ──
// export type UnitItem = components['schemas']['UnitDtos.ListItem'];
//
// // ── Character ──
// export type CharacterItem = components['schemas']['CharacterDtos.ListItem'];
//
// // ── Progress ──
// export type UnitProgressResponse = components['schemas']['ProgressDtos.UnitProgressResponse'];
// export type TitleProgressSummary = components['schemas']['ProgressDtos.TitleSummaryResponse'];
//
// // ── Review ──
// export type ReviewItem = components['schemas']['ReviewDtos.PublicReviewItem'];
// export type MyReviewResponse = components['schemas']['ReviewDtos.MyReviewResponse'];
//
// // ── Comment ──
// export type CommentItem = components['schemas']['CommentDtos.CommentItem'];
//
// // ── Memo ──
// export type MemoItem = components['schemas']['MemoDtos.MemoItem'];
//
// // ── Guide ──
// export type GuideListItem = components['schemas']['GuideDtos.GuideListItem'];
// export type GuideDetail = components['schemas']['GuideDtos.GuideDetailResponse'];
//
// // ── Common ──
// export type PageMeta = components['schemas']['PageResponse.PageMeta'];
// export type ErrorBody = components['schemas']['ErrorResponse'];
