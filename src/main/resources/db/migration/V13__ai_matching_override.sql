-- AI 매칭 운영자 override
-- ADR: docs/DECISIONS/0011-ai-matching-override.md
--
-- 1) daily_recommendations 에 override 메타 컬럼 (REPLACE 시 사유/운영자 기록)
-- 2) admin_blocked_targets — viewer 의 추천에서 특정 target 영구/한시 차단

ALTER TABLE daily_recommendations
    ADD COLUMN override_reason VARCHAR(500) NULL AFTER created_at,
    ADD COLUMN overridden_by BINARY(16) NULL AFTER override_reason,
    ADD COLUMN overridden_at DATETIME(6) NULL AFTER overridden_by;

CREATE TABLE admin_blocked_targets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    viewer_user_id BINARY(16) NOT NULL,
    target_user_id BINARY(16) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_by BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATE NULL,                       -- null = 영구
    PRIMARY KEY (id),
    UNIQUE KEY uk_abt_viewer_target (viewer_user_id, target_user_id),
    INDEX idx_abt_viewer (viewer_user_id)
) ENGINE=InnoDB;
