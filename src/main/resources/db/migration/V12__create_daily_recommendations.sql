-- 일자별 AI 시그널 추천 영속화 (stateful 추천 시스템)
-- ADR: docs/DECISIONS/0009-stateful-recommendation.md

CREATE TABLE daily_recommendations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    viewer_user_id BINARY(16) NOT NULL,
    target_user_id BINARY(16) NOT NULL,
    recommended_date DATE NOT NULL,
    position INT NOT NULL,                  -- 1 = free, 2 = paid unlock
    source VARCHAR(16) NOT NULL DEFAULT 'AUTO',  -- AUTO / ADMIN_PIN / ADMIN_REPLACE
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_drec_viewer_date_position (viewer_user_id, recommended_date, position),
    INDEX idx_drec_viewer_date (viewer_user_id, recommended_date),
    INDEX idx_drec_viewer_target (viewer_user_id, target_user_id),
    INDEX idx_drec_date (recommended_date)
) ENGINE=InnoDB;
