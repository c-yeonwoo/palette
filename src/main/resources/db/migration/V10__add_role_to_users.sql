-- 사용자 역할 (USER / ADMIN) — /admin 페이지 접근 권한
-- ADR: docs/DECISIONS/0006-admin-role-and-auth.md
--
-- 기존 row 는 모두 USER (default) 로 backfill.
-- ADMIN 계정은 별도 INSERT 또는 DevDataSeeder 가 등록.

ALTER TABLE users
    ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'USER'
        AFTER account_type;
