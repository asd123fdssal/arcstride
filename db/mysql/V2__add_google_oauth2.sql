-- Arcstride: Google OAuth2 마이그레이션
-- 기존 users 테이블에 google_sub 컬럼 추가

-- 1. google_sub 컬럼 추가
ALTER TABLE users
  ADD COLUMN google_sub VARCHAR(255) NULL AFTER password_hash;

-- 2. unique 인덱스 추가
ALTER TABLE users
  ADD UNIQUE KEY uk_users_google_sub (google_sub);

-- 3. password_hash를 nullable로 변경 (OAuth2 전용 사용자는 비밀번호 없음)
ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) NULL;
