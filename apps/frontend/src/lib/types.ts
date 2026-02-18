/**
 * Arcstride 프론트엔드 타입 정의.
 *
 * API DTO 타입: api-types.ts (OpenAPI 자동 생성)에서 import
 *   → npm run generate-types 로 재생성
 *
 * 이 파일(types.ts)의 역할:
 *   1. api-types.ts가 아직 생성되지 않은 경우의 폴백 타입
 *   2. 프론트 전용 UI/뷰 모델 타입 (API에 없는 것들)
 *   3. api-types.ts 타입의 편의 re-export
 *
 * 전환 로드맵:
 *   Phase 1 (현재): 수동 타입 유지, api-types.ts 생성 시작
 *   Phase 2: 주요 DTO를 api-types.ts에서 import로 교체
 *   Phase 3: types.ts는 UI 전용 타입만 남김
 */

// ── Common (API 공통) ──
export interface PageMeta {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface PageResponse<T> {
  page: PageMeta;
  items: T[];
}
export interface ItemsResponse<T> {
  items: T[];
}
export interface ErrorBody {
  code: string;
  message: string;
  details?: { field: string; reason: string }[];
}

// ── Auth ──
export interface UserMe {
  userId: number;
  username: string;
  email: string;
  profilePictureUrl: string | null;
  createdAt: string;
}

// ── Enums (백엔드 Enums.java 미러) ──
export type TitleType = 'GAME' | 'VIDEO' | 'BOOK';
export type UnitType = 'VOLUME' | 'EPISODE' | 'ROUTE';
export type ProgressStatus = 'NONE' | 'PROGRESS' | 'DONE';
export type Visibility = 'PUBLIC' | 'PRIVATE';
export type AcquisitionType = 'PURCHASE' | 'SUBSCRIPTION' | 'GIFT';
export type TargetType = 'TITLE' | 'UNIT';

// ── Title ──
export interface TitleStats {
  avgGraphics: number;
  avgStory: number;
  avgMusic: number;
  avgEtc: number;
  reviewCount: number;
  commentCount: number;
}
export interface TitleListItem {
  titleId: number;
  type: TitleType;
  originalTitle: string;
  koreanTitle: string | null;
  releaseDate: string | null;
  coverUrl: string | null;
  isExplicit: boolean;
  stats: TitleStats;
}
export interface TitleDetail extends TitleListItem {
  summary: string | null;
  aliases: string[];
  createdAt: string;
}

// ── Unit ──
export interface UnitItem {
  unitId: number;
  unitType: UnitType;
  unitKey: string;
  displayName: string | null;
  sortOrder: number | null;
  releaseDate: string | null;
  characterId: number | null;
  createdAt: string;
}

// ── Character ──
export interface CharacterItem {
  characterId: number;
  originalName: string | null;
  koreanName: string | null;
  characterImageUrl: string | null;
  isExplicit: boolean;
}

// ── Progress ──
export interface UnitProgressResponse {
  unitId: number;
  status: ProgressStatus;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
}
export interface TitleProgressSummary {
  titleId: number;
  derivedStatus: ProgressStatus;
  unitSummary: Record<string, number>;
}
export interface UnitStatusItem {
  unitId: number;
  status: ProgressStatus;
}

// ── Review ──
export interface ReviewItem {
  user: { userId: number; username: string };
  graphics: number;
  story: number;
  music: number;
  etc: number;
  reviewText: string | null;
  spoilerFlag: boolean;
  createdAt: string;
}
export interface MyReviewResponse {
  titleId: number;
  userId: number;
  graphics: number;
  story: number;
  music: number;
  etc: number;
  reviewText: string | null;
  spoilerFlag: boolean;
  updatedAt: string;
}

// ── Comment ──
export interface CommentItem {
  commentId: number;
  user: { userId: number; username: string };
  body: string;
  spoilerFlag: boolean;
  parentId: number | null;
  createdAt: string;
}

// ── Memo ──
export interface MemoItem {
  memoId: number;
  target: { type: TargetType; id: number; titleId: number };
  memoText: string;
  spoilerFlag: boolean;
  visibility: Visibility;
  updatedAt: string;
}

// ── Guide ──
export interface GuideListItem {
  guideId: number;
  author: { userId: number; username: string };
  target: { type: TargetType; id: number };
  title: string;
  visibility: Visibility;
  createdAt: string;
}
export interface GuideDetail extends GuideListItem {
  content: string;
  updatedAt: string;
}

// ── Library ──
export interface LibraryItemResponse {
  titleId: number;
  storeId: number;
  acquisitionType: AcquisitionType;
  note: string | null;
  updatedAt: string;
}
export interface LibraryListItem {
  titleId: number;
  titleOriginal: string;
  titleType: TitleType;
  storeId: number;
  storeName: string;
  acquisitionType: AcquisitionType;
  note: string | null;
  updatedAt: string;
}
export interface StoreItem {
  storeId: number;
  name: string;
  storeType: string;
  url: string | null;
}

// ── UI 전용 타입 (API에 없는 프론트 전용) ──
export type LoadState = 'loading' | 'success' | 'error';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}
