-- 사용자 활동 상태 (ACTIVE / SUSPENDED / DORMANT)
-- ADR: docs/DECISIONS/0008-user-status-and-admin-actions.md
-- 탈퇴(DELETED) 는 기존 users.deleted_at 으로 별개 표현.

ALTER TABLE users
    ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' AFTER role,
    ADD COLUMN status_reason VARCHAR(500) NULL AFTER status,
    ADD COLUMN status_updated_at DATETIME(6) NULL AFTER status_reason,
    ADD COLUMN status_updated_by BINARY(16) NULL AFTER status_updated_at;

-- 인덱스: 운영자 화면에서 status 필터 자주 사용
CREATE INDEX idx_users_status ON users(status);
