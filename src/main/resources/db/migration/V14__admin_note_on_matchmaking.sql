-- 운영자 매칭 관리 (분쟁 대응, 강제 변경, audit)
-- ADR: docs/DECISIONS/0012-admin-matching-pool.md
--
-- 1) 운영자 메모 + 마지막 변경 시각·운영자
-- 2) status 에 'CANCELLED_BY_ADMIN' 도 사용 가능 (varchar 라 그대로 저장)

ALTER TABLE matchmaking_requests
    ADD COLUMN admin_note TEXT NULL,
    ADD COLUMN admin_last_updated_at DATETIME(6) NULL,
    ADD COLUMN admin_last_updated_by BINARY(16) NULL;
