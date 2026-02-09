# Arcstride 데이터 모델 명세 (v0.6)

이 문서는 Arcstride의 **현재 합의된** 데이터 모델/DB 구조 명세를 정리한 것입니다.  
**개념 + 논리 스키마** 수준의 스펙이며, DDL(테이블 생성 SQL)은 포함하지 않습니다.  
ERD/DDL을 만들기 전 “단일 기준 문서(Source of Truth)”로 사용하세요.

---

## 1. 서비스 범위

Arcstride는 서브컬쳐 소비자용 미디어 진행도 관리 서비스입니다.

- **도메인(작품 타입)**
  - **GAME**: 미연시(비주얼노벨). 진행 단위는 기본적으로 **캐릭터 루트**
  - **VIDEO**: 애니/영화 등. 진행 단위는 **화(에피소드)**
  - **BOOK**: 라이트노벨/만화 등. 진행 단위는 **권(볼륨)**

- **핵심 기능**
  - 커뮤니티 기반 **작품 카탈로그**(유저가 작품/유닛 등록)
  - **유저별 진행도**(완료/진행중/미진행) 관리
  - **작품(Title) 댓글**(커뮤니티)
  - **개인 메모**(User Memo)
  - **공략/가이드**(Guide; 메모와 별도 엔티티)
  - **유저 리뷰/평점**(그래픽/스토리/음악/기타 4항목)
  - **유저별 소장/구독/구매처** 기록(“현재 상태만”, 구매 이력 저장 안 함)

---

## 2. 핵심 결정 사항(최종)

### 2.1 진행도 단위

- 진행도는 **Unit 단위**로 기록한다.
- Title 진행도는 **Unit 진행도를 집계(derived)**하여 표시한다.

### 2.2 타입별 Unit 정의

- **BOOK**: Unit = **권(Volume)**
- **VIDEO**: Unit = **화(Episode)**
- **GAME**: Unit = **루트(Route)**, 기본 운영은 **캐릭터 기반**

### 2.3 댓글 범위

- 댓글은 **Title에만** 존재한다. (Unit 댓글 없음)

### 2.4 메모 vs 공략

- **메모(UserMemo)** 와 **공략(Guide)** 는 **서로 다른 엔티티**다.
- 둘 다 타겟을 **Title 또는 Unit**으로 가질 수 있다.

### 2.5 발매일

- `YYYY-MM-DD` 형태로 **일자까지 저장**한다.

### 2.6 리뷰/평점 스케일

- 항목: **graphics / story / music / etc**
- 점수 범위: **0.0 ~ 10.0**, **0.5 단위**

### 2.7 BOOK/VIDEO 유닛 생성 정책

- 권/화(Unit)는 **모든 유저가 추가 등록 가능**.

### 2.8 GAME 캐릭터 정책

- 캐릭터는 **모든 유저가 등록 가능**.
- 동일 Title 내 캐릭터 이름 중복은 **유니크 정책으로 차단**(§5.6).

### 2.9 Unit 중복 처리

- Unit은 **정규화된 unit_key** 기반 유니크 제약으로 중복을 막는다.

### 2.10 unit_key 입력 및 정렬

- `unit_key`는 **완전 자유 입력 텍스트**.
- `sort_order`는 유저 입력이지만 **NULL 허용(비워도 됨)**.

### 2.11 unit_key 정규화(최소 규칙)

- **trim + lower + 공백축약**
  - 앞/뒤 공백 제거
  - 소문자화
  - 연속 공백을 1개의 공백으로 축약

### 2.12 라이브러리(소장/구독) 정책

- 구매 이력은 저장하지 않고, **“현재 소장 상태만”** 저장한다.

---

## 3. 개념 모델(상위 구조)

- **Title(작품)**
  - Unit 다수 보유
  - Alias 다수 보유
  - Tag 다대다(M:N)
  - Series 다대다(M:N)
  - Comment 다수 보유
  - Review 다수 보유(단, 유저당 타이틀 1개)

- **Unit(세부 단위)**
  - 하나의 Title에 소속
  - GAME/ROUTE는 Character를 참조할 수 있음(기본 1:1 운영, 확장 가능)

- **Character(GAME 전용)**
  - 하나의 Title에 소속
  - 캐릭터=루트 기반 진행을 지원하되, **캐릭터 생성 시 ROUTE Unit 자동 생성은 하지 않는다**
    - 추후 1:N 확장 가능성을 고려하여 Unit은 수동 생성

- **유저별 데이터**
  - UserUnitProgress, UserMemo, Guide, UserReview, UserLibraryItem
  - 댓글(Comment)은 Title 범위지만 작성자는 user_id로 연결

- **성능**
  - TitleStats(집계 캐시) 권장

---

## 4. 필수 테이블(논리 스키마)

### 4.1 카탈로그/공용

1. `users`
2. `titles`
3. `title_aliases`
4. `tags`
5. `title_tags` (조인)
6. `series`
7. `title_series` (조인)
8. `units`
9. `characters` (GAME 전용)
10. `comments` (Title 전용)

### 4.2 유저별

11. `user_unit_progress`
12. `user_memos`
13. `guides`
14. `user_reviews`
15. `stores`
16. `user_library_items`

### 4.3 성능/집계(권장)

17. `title_stats`

---

## 5. 엔티티 명세(필드/제약)

> 아래 필드명은 “권장 표준”입니다. 실제 구현 컨벤션에 맞게 조정해도 됩니다.

### 5.1 `titles`

**목적:** GAME/VIDEO/BOOK 공용 작품 엔티티

- PK: `title_id`
- 핵심 필드:
  - `type` = `GAME | VIDEO | BOOK`
  - `original_title` (필수)
  - `korean_title` (선택)
  - `release_date` (선택; YYYY-MM-DD)
  - `cover_url` (선택)
  - `summary` (선택)
  - `is_explicit` (bool)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_by` (FK -> users; 선택)
  - `created_at`, `updated_at`
- 인덱스(권장):
  - `(type, release_date)`
  - `created_at`

---

### 5.2 `title_aliases`

**목적:** 검색 품질 향상을 위한 별칭(약칭/표기 변형 등)

- PK: `alias_id`
- FK: `title_id` -> titles
- 필드:
  - `alias_text` (필수)
  - `alias_type` (선택; `ALIAS | ABBR | ALT_LANG | OTHER`)
  - `created_at`
- 제약(권장):
  - UNIQUE `(title_id, alias_text)`

---

### 5.3 `tags` / `title_tags`

**목적:** 장르/속성 태그 및 필터링

- `tags`
  - PK: `tag_id`
  - 필드: `name`, `tag_type`(예: `GENRE | FEATURE | WARNING | OTHER`)
  - UNIQUE(권장): `(name, tag_type)`
- `title_tags`
  - PK: `(title_id, tag_id)`

---

### 5.4 `series` / `title_series`

**목적:** 시리즈(프랜차이즈) 묶음

- `series`
  - PK: `series_id`
  - 필드: `name`, (선택) `description`
  - UNIQUE(권장): `(name)`
- `title_series`
  - PK: `(title_id, series_id)`
  - (선택) `series_order`(시리즈 내 순서)

---

### 5.5 `units`

**목적:** 진행도/메모/공략의 기준 단위. BOOK/VIDEO는 유저가 생성 가능.

- PK: `unit_id`
- FK: `title_id` -> titles
- 필드(핵심):
  - `unit_type` = `VOLUME | EPISODE | ROUTE`
  - `unit_key` (완전 자유 텍스트; 필수)
  - `normalized_unit_key` (유니크/검색용; 필수)
  - `display_name` (선택)
  - `sort_order` (선택; NULL 허용, 유저 입력)
  - `release_date` (선택; YYYY-MM-DD)
  - `created_by` (FK -> users; 선택)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_at`, `updated_at`
  - (선택) `character_id` (ROUTE일 때 참조 가능)

- 유니크(최종):
  - UNIQUE `(title_id, unit_type, normalized_unit_key)`

- 정렬 규칙(권장 동작):
  1) `sort_order`가 있는 항목 우선, 오름차순
  2) `sort_order`가 NULL인 항목은 뒤로
  3) 그 안에서 `unit_key` 또는 `created_at`로 타이브레이크

- `normalized_unit_key` 생성 규칙(최종):
  - trim + lower + 공백축약

---

### 5.6 `characters` (GAME 전용)

**목적:** 미연시 캐릭터 정보. 모든 유저 등록 가능. 중복 방지 필수.

- PK: `character_id`
- FK: `title_id` -> titles
- 필드:
  - `original_name` (선택이지만 권장)
  - `korean_name` (선택)
  - `normalized_original_name` (original_name이 있으면 권장)
  - `normalized_korean_name` (선택)
  - `character_image_url` (선택)
  - `is_explicit` (bool)
  - `created_by` (FK -> users; 선택)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_at`, `updated_at`

- 중복 방지(최종 의도):
  - UNIQUE `(title_id, normalized_original_name)` (original_name이 있을 때)
  - UNIQUE `(title_id, normalized_korean_name)` (korean_name이 있을 때)

- 이름 정규화(권장):
  - trim + lower + 공백축약

- ROUTE Unit 자동 생성 정책(최종):
  - 캐릭터 생성 시 ROUTE Unit을 자동 생성하지 않는다.
  - Unit은 수동 생성(향후 1:N 확장 여지)

---

### 5.7 `comments` (Title 전용)

**목적:** 작품 단위 커뮤니티 댓글

- PK: `comment_id`
- FK: `title_id` -> titles
- FK: `user_id` -> users
- 필드:
  - `body`
  - `spoiler_flag` (bool)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `parent_id` (선택; 대댓글 확장 여지)
  - `created_at`, `updated_at`
- 인덱스(권장):
  - `(title_id, created_at)`

---

## 6. 유저별 테이블

### 6.1 `user_unit_progress`

**목적:** 유저별 유닛 진행도

- PK: `progress_id` (또는 복합키 가능)
- FK: `user_id` -> users
- FK: `unit_id` -> units
- 필드:
  - `status` = `NONE | PROGRESS | DONE` (확장 가능)
  - `started_at`(선택), `finished_at`(선택)
  - `created_at`, `updated_at`
- 유니크(최종):
  - UNIQUE `(user_id, unit_id)`

Title 진행도 집계(derived):

- 모든 Unit DONE → Title DONE
- 하나라도 PROGRESS → Title PROGRESS
- 전부 NONE → Title NONE

---

### 6.2 `user_memos`

**목적:** 개인 메모. 공략과 분리. Title 또는 Unit 타겟.

- PK: `memo_id`
- FK: `user_id` -> users
- 타겟 필드(최종):
  - `title_id` (NULL 가능)
  - `unit_id` (NULL 가능)
  - **둘 중 하나만 설정**(XOR)
- 필드:
  - `visibility` = `PRIVATE`(기본) | `PUBLIC`(선택)
  - `memo_text`
  - `spoiler_flag`(선택)
  - `created_at`, `updated_at`
- 제약(최종 의도):
  - XOR: 정확히 하나만 non-null (`title_id`, `unit_id`)

---

### 6.3 `guides`

**목적:** 공개/공유 공략. Title 또는 Unit 타겟. 메모와 분리.

- PK: `guide_id`
- FK: `author_user_id` -> users
- 타겟 필드(최종):
  - `title_id` (NULL 가능)
  - `unit_id` (NULL 가능)
  - **둘 중 하나만 설정**(XOR)
- 필드:
  - `title`(공략 제목)
  - `content`
  - `visibility` = `PUBLIC`(기본) | `UNLISTED`(선택)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_at`, `updated_at`
- 제약(최종 의도):
  - XOR: 정확히 하나만 non-null (`title_id`, `unit_id`)

---

### 6.4 `user_reviews`

**목적:** 작품별 유저 리뷰/평점(4항목)

- PK: `review_id`
- FK: `user_id` -> users
- FK: `title_id` -> titles
- 필드:
  - `graphics_score`, `story_score`, `music_score`, `etc_score`
  - `review_text`(선택)
  - `spoiler_flag`(bool)
  - `created_at`, `updated_at`
- 유니크(최종 의도):
  - UNIQUE `(user_id, title_id)`
- 유효성(정책):
  - 점수는 [0, 10]
  - 0.5 단위

저장 방식(구현 단계 결정):

- DECIMAL(3,1) 또는 점수*2의 정수

---

### 6.5 `stores`

**목적:** 구매처/플랫폼 마스터

- PK: `store_id`
- 필드:
  - `name`
  - `store_type` = `DIGITAL | PHYSICAL | STREAMING`
  - `url`(선택)
  - `created_at`
- UNIQUE(권장):
  - `(name)` 또는 `(name, store_type)`

---

### 6.6 `user_library_items`

**목적:** 유저별 “현재 소장 상태”만 저장(이력 없음)

- PK: `library_item_id` (또는 복합키 가능)
- FK: `user_id` -> users
- FK: `title_id` -> titles
- FK: `store_id` -> stores
- 필드:
  - `acquisition_type` = `PURCHASE | RENT | SUBSCRIPTION | GIFT | OTHER`
  - `note`(선택)
  - `created_at`, `updated_at`
- 유니크(최종 의도):
  - UNIQUE `(user_id, title_id)` (현재 상태 모델)

---

## 7. 성능/집계

### 7.1 `title_stats` (권장)

**목적:** 목록/검색 화면에서 집계값(평균/카운트) 표시를 빠르게.

- PK: `title_id` (FK -> titles)
- 필드:
  - `avg_graphics`, `avg_story`, `avg_music`, `avg_etc`
  - `review_count`
  - `comment_count`
  - `updated_at`

업데이트 방식(구현 선택):

- 리뷰/댓글 생성/수정/삭제 시 갱신 또는 주기적 배치

---

## 8. 의도적으로 남겨둔 항목(추후)

- DDL 수준의 CHECK/부분 유니크 등 DB별 제약 구현 방식
- 신고/차단/모더레이션 테이블
- 판본/에디션(Edition/Release) 계층 도입
- 외부 데이터 연동/검색 엔진 도입

---

## 9. 유니크 제약 요약(Quick Reference)

- Units: `UNIQUE(title_id, unit_type, normalized_unit_key)`
- Characters:
  - `UNIQUE(title_id, normalized_original_name)` (original_name 있을 때)
  - `UNIQUE(title_id, normalized_korean_name)` (korean_name 있을 때)
- Progress: `UNIQUE(user_id, unit_id)`
- Reviews: `UNIQUE(user_id, title_id)`
- Library(현재 상태): `UNIQUE(user_id, title_id)`
- Memo/Guide 타겟: XOR(정확히 하나만: title_id vs unit_id)

---

문서 끝.
