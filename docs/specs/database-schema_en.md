# Arcstride Data Model Spec (v0.6)

This document summarizes the **current, agreed-upon** database/data-model specification for **Arcstride**.
It is a **concept + logical schema** spec (not DDL). Use it as the source of truth before generating ERD/DDL.

---

## 1. Product Scope

Arcstride is a media progress tracker for subculture consumers.

- **Domains (Title types)**
  - **GAME** (visual novels; route progress is character-based)
  - **VIDEO** (anime, movies, etc.; progress by episode-like units)
  - **BOOK** (light novels, manga, etc.; progress by volume-like units)

- **Core features**
  - Community-built **catalog** (users can register titles and their units)
  - **Per-user progress** tracking
  - **Per-title comments** (community)
  - **Per-user memo** (private notes)
  - **Guides/walkthroughs** (separate from memos; shareable content)
  - **Per-user reviews** with 4 category scores (graphics/story/music/etc)
  - **Per-user library/ownership**: “current state only” (not purchase history)

---

## 2. Key Decisions (Final)

### 2.1 Progress Granularity
- **Progress is tracked per Unit**.
- **Title-level progress is derived** from Unit progress (computed/aggregated).

### 2.2 Unit Definition by Domain
- **BOOK**: Unit = **Volume**
- **VIDEO**: Unit = **Episode**
- **GAME**: Unit = **Route**, tracked **per character** (character-route association is the base model)

### 2.3 Comments Scope
- Comments exist **only at Title level** (no unit-level comments).

### 2.4 Memo vs Guide
- **Memo** and **Guide** are **separate entities**.
- Both can target either **Title** or **Unit**.

### 2.5 Release Date
- Store **full date** (YYYY-MM-DD), not just year.

### 2.6 Review / Rating Scale
- Review has 4 category scores:
  - **graphics / story / music / etc**
- Score range: **0.0 ~ 10.0** with **0.5 increments**.

### 2.7 Unit Creation Policy (BOOK/VIDEO)
- Units (volumes/episodes) can be **added by any user**.

### 2.8 GAME Character Policy
- Characters can be **added by any user**.
- Prevent duplicates within the same title by **unique name policy** (see §5.2).

### 2.9 Unit Duplicate Handling
- Prevent duplicates using **unique constraints** based on a normalized unit key.

### 2.10 Unit Key Input & Sorting
- `unit_key` is **free-form text** (completely free input).
- `sort_order` is **user-entered** but **nullable** (user may leave blank).

### 2.11 Unit Key Normalization (Minimal)
- Normalization rule: **trim + lower + whitespace collapse**
  - trim: remove leading/trailing whitespace
  - lower: convert to lowercase
  - collapse spaces: multiple spaces -> single space

### 2.12 Library / Ownership Policy
- Store **current ownership/access state only** (no purchase history).

---

## 3. Conceptual Model (High-level)

- **Title** (catalog item)
  - has many **Unit**
  - has many **Alias**
  - has many **Tag** (M:N)
  - has many **Series** (M:N)
  - has many **Comment**
  - has many **Review** (but at most 1 review per user per title)

- **Unit** (progress/memo/guide target)
  - belongs to one **Title**
  - for GAME/ROUTE: may reference a **Character**

- **Character** (GAME-only)
  - belongs to one **Title**
  - used to represent route progress in GAME

- **User-specific records**
  - **UserUnitProgress** (progress per unit)
  - **UserMemo** (memo targeting title or unit)
  - **Guide** (guide targeting title or unit)
  - **UserReview** (per title, per user)
  - **UserLibraryItem** (current ownership/access state)
  - Comments are also user-authored but stored at title scope

- **Performance**
  - **TitleStats** is recommended (aggregated cache)

---

## 4. Required Tables (Logical Schema)

### 4.1 Catalog / Shared
1. `users`
2. `titles`
3. `title_aliases`
4. `tags`
5. `title_tags` (join)
6. `series`
7. `title_series` (join)
8. `units`
9. `characters` (GAME only)
10. `comments` (Title-level only)

### 4.2 User-specific
11. `user_unit_progress`
12. `user_memos`
13. `guides`
14. `user_reviews`
15. `stores`
16. `user_library_items`

### 4.3 Recommended for performance
17. `title_stats`

---

## 5. Entity Specs (Fields & Constraints)

> Field names below are **canonical suggestions**. Adjust naming to match your coding conventions.

### 5.1 `titles`
**Purpose:** shared catalog item (GAME/VIDEO/BOOK)

- PK: `title_id`
- Fields (core):
  - `type` = `GAME | VIDEO | BOOK`
  - `original_title` (required)
  - `korean_title` (optional)
  - `release_date` (optional; YYYY-MM-DD)
  - `cover_url` (optional)
  - `summary` (optional)
  - `is_explicit` (bool)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_by` (FK -> users; optional/nullable)
  - `created_at`, `updated_at`

Indexes (suggested):
- `(type, release_date)`
- `created_at`

---

### 5.2 `title_aliases`
**Purpose:** alternate names used for search (abbrev, alt spelling, etc.)

- PK: `alias_id`
- FK: `title_id` -> titles
- Fields:
  - `alias_text` (required)
  - `alias_type` (optional; e.g. `ALIAS | ABBR | ALT_LANG | OTHER`)
  - `created_at`

Constraints:
- Unique: `(title_id, alias_text)` (recommended)

---

### 5.3 `tags` / `title_tags`
**Purpose:** genre/feature tagging & filtering

- `tags`
  - PK: `tag_id`
  - Fields: `name`, `tag_type` (e.g. `GENRE | FEATURE | WARNING | OTHER`)
  - Unique: `(name, tag_type)` (recommended)

- `title_tags` join
  - PK: `(title_id, tag_id)`

---

### 5.4 `series` / `title_series`
**Purpose:** grouping titles into franchises/series

- `series`
  - PK: `series_id`
  - Fields: `name`, (optional) `description`
  - Unique: `(name)` (recommended)

- `title_series` join
  - PK: `(title_id, series_id)`
  - Optional: `series_order` (int) for ordering within series

---

### 5.5 `units`
**Purpose:** progress/memo/guide granularity. Created by any user for BOOK/VIDEO.

- PK: `unit_id`
- FK: `title_id` -> titles
- Fields (core):
  - `unit_type` = `VOLUME | EPISODE | ROUTE`
  - `unit_key` (free text, required)
  - `normalized_unit_key` (required for uniqueness)
  - `display_name` (optional)
  - `sort_order` (nullable; user-entered)
  - `release_date` (optional; YYYY-MM-DD)
  - `created_by` (FK -> users; nullable)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_at`, `updated_at`

Constraints (final):
- Unique: `(title_id, unit_type, normalized_unit_key)`

Sorting rule (recommended behavior):
1. `sort_order` ASC (non-null first)
2. then `sort_order` NULL last
3. tie-breaker: `unit_key` or `created_at`

Normalization rule (final):
- trim + lower + whitespace collapse

---

### 5.6 `characters` (GAME only)
**Purpose:** VN character registry. Added by any user. Duplicates prevented within same title.

- PK: `character_id`
- FK: `title_id` -> titles
- Fields:
  - `original_name` (optional but recommended)
  - `korean_name` (optional)
  - `normalized_original_name` (optional but recommended if original_name exists)
  - `normalized_korean_name` (optional)
  - `character_image_url` (optional)
  - `is_explicit` (bool)
  - `created_by` (FK -> users; nullable)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_at`, `updated_at`

Constraints (final intent):
- Unique: `(title_id, normalized_original_name)` (when original_name exists)
- Unique: `(title_id, normalized_korean_name)` (when korean_name exists)

Normalization for names:
- Keep minimal as well (trim + lower + whitespace collapse)

Route mapping policy:
- Base policy is character ↔ route association, but **do not auto-create a ROUTE unit** at character creation time.
- Manual creation allows future expansion to 1:N (multiple routes/endings per character).

---

### 5.7 `comments` (Title-level only)
**Purpose:** community comments per title

- PK: `comment_id`
- FK: `title_id` -> titles
- FK: `user_id` -> users
- Fields:
  - `body` (text)
  - `spoiler_flag` (bool)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `parent_id` (optional; future reply threading)
  - `created_at`, `updated_at`

Index (suggested):
- `(title_id, created_at)`

---

## 6. User-specific Tables

### 6.1 `user_unit_progress`
**Purpose:** per-user progress per unit

- PK: `progress_id` (or composite PK acceptable)
- FK: `user_id` -> users
- FK: `unit_id` -> units
- Fields:
  - `status` = `NONE | PROGRESS | DONE` (extendable later)
  - `started_at` (optional)
  - `finished_at` (optional)
  - `created_at`, `updated_at`

Constraints (final):
- Unique: `(user_id, unit_id)`

Title-level progress (derived):
- All units DONE -> Title DONE
- Any unit PROGRESS -> Title PROGRESS
- All units NONE -> Title NONE

---

### 6.2 `user_memos`
**Purpose:** private notes, separate from guides. Can target Title or Unit.

- PK: `memo_id`
- FK: `user_id` -> users
- Target fields (final):
  - `title_id` (nullable)
  - `unit_id` (nullable)
  - Exactly one must be set.

- Fields:
  - `visibility` = `PRIVATE` (default) | `PUBLIC` (optional)
  - `memo_text`
  - `spoiler_flag` (optional)
  - `created_at`, `updated_at`

Constraint (final intent):
- XOR constraint: exactly one of (`title_id`, `unit_id`) is non-null

---

### 6.3 `guides`
**Purpose:** shareable guide/walkthrough content. Separate from memos. Can target Title or Unit.

- PK: `guide_id`
- FK: `author_user_id` -> users
- Target fields (final):
  - `title_id` (nullable)
  - `unit_id` (nullable)
  - Exactly one must be set.

- Fields:
  - `title` (guide title)
  - `content`
  - `visibility` = `PUBLIC` (default) | `UNLISTED` (optional)
  - `status` = `ACTIVE | HIDDEN | DELETED`
  - `created_at`, `updated_at`

Constraint (final intent):
- XOR constraint: exactly one of (`title_id`, `unit_id`) is non-null

---

### 6.4 `user_reviews`
**Purpose:** per-user review per title with 4 category scores

- PK: `review_id`
- FK: `user_id` -> users
- FK: `title_id` -> titles
- Fields:
  - `graphics_score` (0~10, 0.5 step)
  - `story_score` (0~10, 0.5 step)
  - `music_score` (0~10, 0.5 step)
  - `etc_score` (0~10, 0.5 step)
  - `review_text` (optional)
  - `spoiler_flag` (bool)
  - `created_at`, `updated_at`

Constraints (final intent):
- Unique: `(user_id, title_id)`
- Validation:
  - Scores must be within [0, 10]
  - Scores must be in increments of 0.5

Storage note (implementation detail, not decided here):
- Store as DECIMAL(3,1) or as scaled integer (score*2)

---

### 6.5 `stores`
**Purpose:** store/platform master

- PK: `store_id`
- Fields:
  - `name`
  - `store_type` = `DIGITAL | PHYSICAL | STREAMING`
  - `url` (optional)
  - `created_at`

Unique (recommended):
- `(name, store_type)` or `(name)`

---

### 6.6 `user_library_items`
**Purpose:** current ownership/access state only (no history)

- PK: `library_item_id` (or composite PK acceptable)
- FK: `user_id` -> users
- FK: `title_id` -> titles
- FK: `store_id` -> stores
- Fields:
  - `acquisition_type` = `PURCHASE | RENT | SUBSCRIPTION | GIFT | OTHER`
  - `note` (optional)
  - `updated_at`, `created_at`

Constraints (final intent):
- Unique: `(user_id, title_id)` (current-state model)

Note:
- If you later want to allow multiple concurrent stores per title, loosen uniqueness or use `(user_id, title_id, store_id)`.

---

## 7. Performance / Aggregation

### 7.1 `title_stats` (recommended)
**Purpose:** speed up list/search sort and display.

- PK: `title_id` (FK -> titles)
- Fields:
  - `avg_graphics`, `avg_story`, `avg_music`, `avg_etc`
  - `review_count`
  - `comment_count`
  - `updated_at`

Update strategy (implementation choice):
- Update on write (review/comment create/update/delete) or periodic job

---

## 8. Open Items (Intentionally Left for Later)
- DDL / engine-specific constraints (CHECK, partial unique indexes, etc.)
- Moderation/reporting tables
- Edition/Release layer (platform/edition separation) if needed later
- Advanced search engine integration

---

## 9. Quick Reference: What’s Unique Where?

- Unit duplicates:
  - `UNIQUE(title_id, unit_type, normalized_unit_key)`

- Character duplicates:
  - `UNIQUE(title_id, normalized_original_name)` (when original exists)
  - `UNIQUE(title_id, normalized_korean_name)` (when korean exists)

- Progress:
  - `UNIQUE(user_id, unit_id)`

- Review:
  - `UNIQUE(user_id, title_id)`

- Library (current state):
  - `UNIQUE(user_id, title_id)`

- Memo / Guide target:
  - XOR: exactly one of (title_id, unit_id)

---

End of spec.
