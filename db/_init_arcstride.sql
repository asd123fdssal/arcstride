-- Arcstride MySQL DDL (v0.6 기반)
-- 파일명 예시: db/migration/V1__init.sql (Flyway)
-- MySQL 8.x / InnoDB / utf8mb4 기준

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- 1) users
-- =========================================================
CREATE TABLE users (
  user_id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture_url TEXT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email),
  KEY ix_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 2) titles
-- =========================================================
CREATE TABLE titles (
  title_id BIGINT NOT NULL AUTO_INCREMENT,
  type VARCHAR(10) NOT NULL, -- GAME|VIDEO|BOOK
  original_title VARCHAR(255) NOT NULL,
  korean_title VARCHAR(255) NULL,
  release_date DATE NULL,
  cover_url TEXT NULL,
  summary TEXT NULL,
  is_explicit TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|HIDDEN|DELETED
  created_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (title_id),
  KEY ix_titles_type_release (type, release_date),
  KEY ix_titles_created_at (created_at),
  KEY ix_titles_created_by (created_by),
  CONSTRAINT fk_titles_created_by FOREIGN KEY (created_by)
    REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 3) title_aliases
-- =========================================================
CREATE TABLE title_aliases (
  alias_id BIGINT NOT NULL AUTO_INCREMENT,
  title_id BIGINT NOT NULL,
  alias_text VARCHAR(255) NOT NULL,
  alias_type VARCHAR(20) NOT NULL DEFAULT 'ALIAS',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (alias_id),
  UNIQUE KEY uk_title_aliases_title_alias (title_id, alias_text),
  KEY ix_title_aliases_alias_text (alias_text),
  CONSTRAINT fk_title_aliases_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 4) tags + title_tags
-- =========================================================
CREATE TABLE tags (
  tag_id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  tag_type VARCHAR(20) NOT NULL DEFAULT 'GENRE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tag_id),
  UNIQUE KEY uk_tags_name_type (name, tag_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE title_tags (
  title_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (title_id, tag_id),
  KEY ix_title_tags_tag_title (tag_id, title_id),
  CONSTRAINT fk_title_tags_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_title_tags_tag FOREIGN KEY (tag_id)
    REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 5) series + title_series
-- =========================================================
CREATE TABLE series (
  series_id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (series_id),
  UNIQUE KEY uk_series_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE title_series (
  title_id BIGINT NOT NULL,
  series_id BIGINT NOT NULL,
  series_order INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (title_id, series_id),
  KEY ix_title_series_series_order (series_id, series_order),
  CONSTRAINT fk_title_series_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_title_series_series FOREIGN KEY (series_id)
    REFERENCES series(series_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 6) characters (GAME 전용)
-- =========================================================
CREATE TABLE characters (
  character_id BIGINT NOT NULL AUTO_INCREMENT,
  title_id BIGINT NOT NULL,
  original_name VARCHAR(255) NULL,
  korean_name VARCHAR(255) NULL,

  -- 최소 정규화( trim + lower + 공백축약 )는 애플리케이션에서 계산해 저장 권장
  normalized_original_name VARCHAR(255) NULL,
  normalized_korean_name VARCHAR(255) NULL,

  character_image_url TEXT NULL,
  is_explicit TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (character_id),

  -- 동일 타이틀 내 중복 방지
  UNIQUE KEY uk_char_title_norm_orig (title_id, normalized_original_name),
  UNIQUE KEY uk_char_title_norm_kor (title_id, normalized_korean_name),

  KEY ix_characters_title_created (title_id, created_at),
  KEY ix_characters_created_by (created_by),

  CONSTRAINT fk_characters_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_characters_created_by FOREIGN KEY (created_by)
    REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 7) units
-- =========================================================
CREATE TABLE units (
  unit_id BIGINT NOT NULL AUTO_INCREMENT,
  title_id BIGINT NOT NULL,
  unit_type VARCHAR(10) NOT NULL, -- VOLUME|EPISODE|ROUTE

  unit_key VARCHAR(255) NOT NULL, -- 자유 입력
  normalized_unit_key VARCHAR(255) NOT NULL, -- trim+lower+공백축약 (앱에서 계산)

  display_name VARCHAR(255) NULL,
  sort_order INT NULL,
  release_date DATE NULL,

  -- ROUTE일 때 캐릭터 연결(선택)
  character_id BIGINT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (unit_id),

  -- 유니크(중복 방지 핵심)
  UNIQUE KEY uk_units_title_type_normkey (title_id, unit_type, normalized_unit_key),

  KEY ix_units_title_type_sort (title_id, unit_type, sort_order),
  KEY ix_units_created_at (created_at),
  KEY ix_units_character_id (character_id),
  KEY ix_units_created_by (created_by),

  CONSTRAINT fk_units_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_units_created_by FOREIGN KEY (created_by)
    REFERENCES users(user_id),
  CONSTRAINT fk_units_character FOREIGN KEY (character_id)
    REFERENCES characters(character_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 8) comments (Title 전용)
-- =========================================================
CREATE TABLE comments (
  comment_id BIGINT NOT NULL AUTO_INCREMENT,
  title_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  parent_id BIGINT NULL,

  body TEXT NOT NULL,
  spoiler_flag TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (comment_id),

  KEY ix_comments_title_created (title_id, created_at),
  KEY ix_comments_user_created (user_id, created_at),
  KEY ix_comments_parent (parent_id),

  CONSTRAINT fk_comments_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
    REFERENCES comments(comment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 9) user_unit_progress
-- =========================================================
CREATE TABLE user_unit_progress (
  progress_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  unit_id BIGINT NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'NONE', -- NONE|PROGRESS|DONE (+확장)
  started_at DATETIME NULL,
  finished_at DATETIME NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (progress_id),
  UNIQUE KEY uk_progress_user_unit (user_id, unit_id),

  KEY ix_progress_user_status_updated (user_id, status, updated_at),
  KEY ix_progress_unit (unit_id),

  CONSTRAINT fk_progress_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_unit FOREIGN KEY (unit_id)
    REFERENCES units(unit_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 10) user_memos (XOR 타겟: title_id or unit_id)
-- =========================================================
CREATE TABLE user_memos (
  memo_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title_id BIGINT NULL,
  unit_id BIGINT NULL,

  visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE', -- PRIVATE|PUBLIC
  memo_text TEXT NOT NULL,
  spoiler_flag TINYINT(1) NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (memo_id),

  KEY ix_memos_user (user_id),
  KEY ix_memos_title (title_id),
  KEY ix_memos_unit (unit_id),

  CONSTRAINT fk_memos_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_memos_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_memos_unit FOREIGN KEY (unit_id)
    REFERENCES units(unit_id) ON DELETE CASCADE,

  -- MySQL 8.x에서 CHECK는 동작하지만, 환경에 따라 앱 검증 병행 권장
  CONSTRAINT chk_memos_xor CHECK (
    (title_id IS NULL AND unit_id IS NOT NULL) OR
    (title_id IS NOT NULL AND unit_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 11) guides (XOR 타겟: title_id or unit_id)
-- =========================================================
CREATE TABLE guides (
  guide_id BIGINT NOT NULL AUTO_INCREMENT,
  author_user_id BIGINT NOT NULL,
  title_id BIGINT NULL,
  unit_id BIGINT NULL,

  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,

  visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC', -- PUBLIC|UNLISTED
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|HIDDEN|DELETED

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (guide_id),

  KEY ix_guides_author_created (author_user_id, created_at),
  KEY ix_guides_title (title_id),
  KEY ix_guides_unit (unit_id),

  CONSTRAINT fk_guides_author FOREIGN KEY (author_user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_guides_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_guides_unit FOREIGN KEY (unit_id)
    REFERENCES units(unit_id) ON DELETE CASCADE,

  CONSTRAINT chk_guides_xor CHECK (
    (title_id IS NULL AND unit_id IS NOT NULL) OR
    (title_id IS NOT NULL AND unit_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 12) user_reviews (점수: 0~10, 0.5 단위 -> x2 정수 0~20)
-- =========================================================
CREATE TABLE user_reviews (
  review_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title_id BIGINT NOT NULL,

  graphics_score_x2 SMALLINT NOT NULL,
  story_score_x2 SMALLINT NOT NULL,
  music_score_x2 SMALLINT NOT NULL,
  etc_score_x2 SMALLINT NOT NULL,

  review_text TEXT NULL,
  spoiler_flag TINYINT(1) NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (review_id),
  UNIQUE KEY uk_reviews_user_title (user_id, title_id),

  KEY ix_reviews_title_created (title_id, created_at),

  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,

  CONSTRAINT chk_reviews_graphics CHECK (graphics_score_x2 BETWEEN 0 AND 20),
  CONSTRAINT chk_reviews_story CHECK (story_score_x2 BETWEEN 0 AND 20),
  CONSTRAINT chk_reviews_music CHECK (music_score_x2 BETWEEN 0 AND 20),
  CONSTRAINT chk_reviews_etc CHECK (etc_score_x2 BETWEEN 0 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 13) stores
-- =========================================================
CREATE TABLE stores (
  store_id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  store_type VARCHAR(20) NOT NULL DEFAULT 'DIGITAL', -- DIGITAL|PHYSICAL|STREAMING
  url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id),
  UNIQUE KEY uk_stores_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 14) user_library_items (현재 소장 상태만)
-- =========================================================
CREATE TABLE user_library_items (
  library_item_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,

  acquisition_type VARCHAR(20) NOT NULL DEFAULT 'PURCHASE', -- PURCHASE|RENT|SUBSCRIPTION|GIFT|OTHER
  note TEXT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (library_item_id),
  UNIQUE KEY uk_library_user_title (user_id, title_id),

  KEY ix_library_user_updated (user_id, updated_at),
  KEY ix_library_store (store_id),

  CONSTRAINT fk_library_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_library_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE,
  CONSTRAINT fk_library_store FOREIGN KEY (store_id)
    REFERENCES stores(store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 15) title_stats (집계 캐시)
-- =========================================================
CREATE TABLE title_stats (
  title_id BIGINT NOT NULL,

  avg_graphics_x2 DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  avg_story_x2 DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  avg_music_x2 DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  avg_etc_x2 DECIMAL(6,3) NOT NULL DEFAULT 0.000,

  review_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (title_id),
  KEY ix_title_stats_updated (updated_at),

  CONSTRAINT fk_title_stats_title FOREIGN KEY (title_id)
    REFERENCES titles(title_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
