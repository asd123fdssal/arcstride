# Arcstride ERD 문서 (v0.6 기반)

본 문서는 Arcstride의 **논리 ERD(테이블/관계/키/제약/인덱스)**를 텍스트로 정리한 것입니다.  
MySQL 8.x + InnoDB + utf8mb4 기준으로 작성되었습니다.

- 데이터 모델 스펙: `arcstride-data-model-v0.6-ko.md`
- 본 ERD는 DDL 초안(`V1__init.sql`)과 1:1 대응하도록 구성

---

## 1. 테이블 목록

### 카탈로그/공용

- `users`
- `titles`
- `title_aliases`
- `tags`
- `title_tags`
- `series`
- `title_series`
- `units`
- `characters`
- `comments`

### 유저별

- `user_unit_progress`
- `user_memos`
- `guides`
- `user_reviews`
- `stores`
- `user_library_items`

### 집계(권장)

- `title_stats`

---

## 2. 관계 요약

- `titles.created_by` → `users.user_id`
- `title_aliases.title_id` → `titles.title_id`
- `title_tags.title_id` → `titles.title_id`
- `title_tags.tag_id` → `tags.tag_id`
- `title_series.title_id` → `titles.title_id`
- `title_series.series_id` → `series.series_id`
- `units.title_id` → `titles.title_id`
- `units.created_by` → `users.user_id`
- `units.character_id` → `characters.character_id` *(ROUTE일 때 사용)*
- `characters.title_id` → `titles.title_id`
- `characters.created_by` → `users.user_id`
- `comments.title_id` → `titles.title_id`
- `comments.user_id` → `users.user_id`
- `comments.parent_id` → `comments.comment_id` *(확장용)*
- `user_unit_progress.user_id` → `users.user_id`
- `user_unit_progress.unit_id` → `units.unit_id`
- `user_memos.user_id` → `users.user_id`
- `user_memos.title_id` → `titles.title_id` *(XOR 타겟)*
- `user_memos.unit_id` → `units.unit_id` *(XOR 타겟)*
- `guides.author_user_id` → `users.user_id`
- `guides.title_id` → `titles.title_id` *(XOR 타겟)*
- `guides.unit_id` → `units.unit_id` *(XOR 타겟)*
- `user_reviews.user_id` → `users.user_id`
- `user_reviews.title_id` → `titles.title_id`
- `user_library_items.user_id` → `users.user_id`
- `user_library_items.title_id` → `titles.title_id`
- `user_library_items.store_id` → `stores.store_id`
- `title_stats.title_id` → `titles.title_id`

---

## 3. 키/제약/인덱스(핵심만)

### 3.1 users

- PK: `user_id`
- UK: `username`, `email`
- Index: `created_at`

### 3.2 titles

- PK: `title_id`
- FK: `created_by`
- Index: `(type, release_date)`, `created_at`, `created_by`

### 3.3 title_aliases

- PK: `alias_id`
- FK: `title_id`
- UK: `(title_id, alias_text)`
- Index: `alias_text` (검색)

### 3.4 tags / title_tags

- tags PK: `tag_id`
- tags UK: `(name, tag_type)`
- title_tags PK: `(title_id, tag_id)`
- Index: `(tag_id, title_id)`

### 3.5 series / title_series

- series PK: `series_id`
- series UK: `name`
- title_series PK: `(title_id, series_id)`
- Index: `(series_id, series_order)`

### 3.6 units

- PK: `unit_id`
- FK: `title_id`, `created_by`, `character_id(선택)`
- UK: `(title_id, unit_type, normalized_unit_key)`  *(중복 방지 핵심)*
- Index: `(title_id, unit_type, sort_order)`, `created_at`, `character_id`

### 3.7 characters

- PK: `character_id`
- FK: `title_id`, `created_by`
- UK: `(title_id, normalized_original_name)`  *(nullable 아님 권장)*
- UK: `(title_id, normalized_korean_name)`  *(NULL 허용; NULL 다중 허용되는 MySQL 특성 활용)*
- Index: `(title_id, created_at)`

### 3.8 comments

- PK: `comment_id`
- FK: `title_id`, `user_id`, `parent_id(선택)`
- Index: `(title_id, created_at)`, `(user_id, created_at)`

### 3.9 user_unit_progress

- PK: `progress_id`
- FK: `user_id`, `unit_id`
- UK: `(user_id, unit_id)`
- Index: `(user_id, status, updated_at)`, `(unit_id)`

### 3.10 user_memos / guides (XOR 타겟)

- 각 테이블에 `title_id`, `unit_id` 동시 보유
- 정책: **둘 중 하나만 채움(XOR)**
- DDL에서 `CHECK`로 표현(실제 강제는 DB 버전/설정에 따라 트리거/앱 검증 병행 권장)

### 3.11 user_reviews

- PK: `review_id`
- FK: `user_id`, `title_id`
- UK: `(user_id, title_id)`
- 점수: 0~10, 0.5 단위를 위해 **2배 스케일 정수(0~20)** 저장
- Index: `(title_id, created_at)`

### 3.12 stores / user_library_items

- stores PK: `store_id`, UK: `name`
- user_library_items PK: `library_item_id`
- user_library_items UK: `(user_id, title_id)` *(현재 소장 상태만)*
- Index: `(user_id, updated_at)`, `(store_id)`

### 3.13 title_stats

- PK/FK: `title_id`
- Index: `updated_at`

---

## 4. 점수 저장 방식(결정 반영)

- UI/스펙: 0.0~10.0, 0.5 단위
- DB 저장(권장): **2배 스케일 정수**
  - 0.0 → 0
  - 0.5 → 1
  - ...
  - 10.0 → 20
- 컬럼 예: `graphics_score_x2` (SMALLINT 0~20)

장점:

- 0.5 단위 강제 쉬움 (정수 범위 체크만으로 충분)
- 합산/평균 계산이 명확

---

문서 끝.
