-- ============================================================================
-- Schema Migrations — prod 누적 변경분 idempotent SQL
-- ============================================================================
-- schema-mysql.sql (초기 부트스트랩) 위에 적재되는 누락 테이블·컬럼 보충.
-- 모두 CREATE TABLE IF NOT EXISTS / 컬럼은 PROCEDURE 패턴으로 idempotent.
--
-- 실행 순서: schema-mysql.sql 다음에 자동 적재 (application-prod.properties 의
-- schema-locations 에 함께 등록). continue-on-error=true 이므로 일부 실패해도
-- 부팅은 진행되지만, 가능한 한 안전 가드 적용.
--
-- 적용 시점: 모든 누락 테이블이 새로 만들어진다. 기존 데이터에 영향 없음.
-- ============================================================================

-- ── 1. 출금 요청 (ADR 0022) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BINARY(16) NOT NULL,
    matchmaker_user_id BINARY(16) NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'HOLD',
    requested_at DATETIME(6) NOT NULL,
    available_at DATETIME(6) NOT NULL,
    processed_at DATETIME(6),
    note TEXT,
    PRIMARY KEY (id),
    INDEX idx_wd_matchmaker (matchmaker_user_id, requested_at),
    INDEX idx_wd_status_available (status, available_at)
) ENGINE=InnoDB;

-- ── 2. 단일 잔액 (ADR 0042/0044/0045) ──────────────────────────────
CREATE TABLE IF NOT EXISTS user_ticket_balances (
    user_id VARCHAR(255) NOT NULL,
    paid_points INT NOT NULL DEFAULT 0,
    bonus_points INT NOT NULL DEFAULT 0,
    bonus_expires_at DATETIME(6),
    views_trial_until DATETIME(6),
    views_used_today INT NOT NULL DEFAULT 0,
    views_today_reset_date DATE,
    half_price_package_until DATETIME(6),
    half_price_package_used BOOLEAN NOT NULL DEFAULT FALSE,
    free_intro_remaining INT NOT NULL DEFAULT 0,
    free_intro_expires_at DATETIME(6),
    palette_pick_trial_until DATETIME(6),
    palette_pick_first_used BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB;

-- ── 3. 유저 신고 (ADR 0023) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reports (
    id BINARY(16) NOT NULL,
    reporter_user_id BINARY(16) NOT NULL,
    reported_user_id BINARY(16) NOT NULL,
    reason VARCHAR(32) NOT NULL,
    detail TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_rep_reporter (reporter_user_id),
    INDEX idx_rep_reported (reported_user_id),
    INDEX idx_rep_status (status, created_at)
) ENGINE=InnoDB;

-- ── 4. 유저간 차단 (ADR 0023) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
    id BINARY(16) NOT NULL,
    blocker_user_id BINARY(16) NOT NULL,
    blocked_user_id BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_block_pair (blocker_user_id, blocked_user_id),
    INDEX idx_block_blocked (blocked_user_id)
) ENGINE=InnoDB;

-- ── 5. 팁 거래 (ADR 0044 — 90/10 분배) ─────────────────────────────
CREATE TABLE IF NOT EXISTS tip_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    amount_points INT NOT NULL,
    matchmaker_credited INT NOT NULL DEFAULT 0,
    platform_fee INT NOT NULL DEFAULT 0,
    reason VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_tip_from (from_user_id, created_at),
    INDEX idx_tip_to (to_user_id, created_at)
) ENGINE=InnoDB;

-- ── 6. 운영자 수동 충전 (감사 로그) ────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_billing_grants (
    id BINARY(16) NOT NULL,
    recipient_user_id VARCHAR(255) NOT NULL,
    granter_admin_user_id VARCHAR(255) NOT NULL,
    amount_points INT NOT NULL,
    grant_type VARCHAR(16) NOT NULL,
    valid_days INT,
    reason VARCHAR(200) NOT NULL,
    granted_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_grant_recipient (recipient_user_id, granted_at),
    INDEX idx_grant_admin (granter_admin_user_id, granted_at)
) ENGINE=InnoDB;

-- ── 7. AI 추천 구독 패스 (ADR 0025/0044) ──────────────────────────
CREATE TABLE IF NOT EXISTS ai_pass_subscriptions (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    started_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_pass_user (user_id),
    INDEX idx_ai_pass_expires (expires_at)
) ENGINE=InnoDB;

-- ── 8. LLM audit log (ADR 0047 §A) ────────────────────────────────
CREATE TABLE IF NOT EXISTS llm_usage_logs (
    id BINARY(16) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    model VARCHAR(32) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_won INT NOT NULL DEFAULT 0,
    outcome VARCHAR(16) NOT NULL,
    latency_ms BIGINT NOT NULL DEFAULT 0,
    error VARCHAR(200),
    input_hash VARCHAR(64),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_llm_usage_user (user_id),
    INDEX idx_llm_usage_created (created_at),
    INDEX idx_llm_usage_outcome (outcome)
) ENGINE=InnoDB;

-- ── 9. LLM 프로필 생성 캐시 (ADR 0047 §A) ────────────────────────
CREATE TABLE IF NOT EXISTS profile_generation_cache (
    input_hash VARCHAR(64) NOT NULL,
    response_json TEXT NOT NULL,
    model VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    hit_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (input_hash)
) ENGINE=InnoDB;

-- ── 10. 팔레트픽 벡터 임베딩 (ADR 0047 §B.1) ──────────────────────
CREATE TABLE IF NOT EXISTS profile_embeddings (
    user_id BINARY(16) NOT NULL,
    intro_embedding LONGBLOB NOT NULL,
    ideal_embedding LONGBLOB NOT NULL,
    model VARCHAR(32) NOT NULL,
    intro_hash VARCHAR(64) NOT NULL,
    ideal_hash VARCHAR(64) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB;

-- ── 11. 팔레트픽 LLM 매칭 분석 캐시 (ADR 0047 §B.3) ───────────────
CREATE TABLE IF NOT EXISTS palettepick_compatibility_analyses (
    id BINARY(16) NOT NULL,
    viewer_user_id BINARY(16) NOT NULL,
    candidate_user_id BINARY(16) NOT NULL,
    inputs_hash VARCHAR(64) NOT NULL,
    score_deterministic INT NOT NULL DEFAULT 0,
    summary_json TEXT NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_compat_pair (viewer_user_id, candidate_user_id),
    INDEX idx_compat_viewer (viewer_user_id),
    INDEX idx_compat_updated (updated_at)
) ENGINE=InnoDB;

-- ── 12. 주선자 누지 (ADR 0020) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS matchmaker_nudges (
    id BINARY(16) NOT NULL,
    matchmaker_user_id BINARY(16) NOT NULL,
    from_user_id BINARY(16) NOT NULL,
    to_user_id BINARY(16) NOT NULL,
    message TEXT,
    points_spent INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    proposed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_nudge_matchmaker (matchmaker_user_id, proposed_at)
) ENGINE=InnoDB;

-- ── 13. 만남 후 사적 피드백 (ADR 0050) ────────────────────────────
CREATE TABLE IF NOT EXISTS post_match_feedbacks (
    id BINARY(16) NOT NULL,
    request_id BINARY(16) NOT NULL,
    matchmaker_user_id BINARY(16) NOT NULL,
    author_user_id BINARY(16) NOT NULL,
    counterpart_user_id BINARY(16) NOT NULL,
    met_status VARCHAR(16) NOT NULL,
    sentiment VARCHAR(16) NOT NULL,
    message TEXT,
    want_to_meet_again BIT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_pmf_request_author (request_id, author_user_id),
    INDEX idx_pmf_matchmaker (matchmaker_user_id, created_at),
    INDEX idx_pmf_counterpart (counterpart_user_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 컬럼 추가 — MySQL ALTER COLUMN 은 IF NOT EXISTS 미지원.
-- 이미 존재 시 ALTER 가 실패하지만 spring.sql.init.continue-on-error=true 라
-- 부팅은 계속 진행. 첫 적용 후 두 번째 부팅부터는 ALTER 가 에러 로그를 1줄씩 남김.
-- (운영 안정성 > 로그 깔끔함 트레이드오프 — 베타 단계)
-- ============================================================================

-- users — ADR 0006 (role) · ADR 0008 (status) — 초기 schema-mysql.sql 후 추가된 컬럼.
-- prod 는 CREATE TABLE IF NOT EXISTS 로 인해 기존 users 테이블 재정의되지 않아 한 번도 ALTER 안 됨.
-- → admin seed 시 SELECT role 폭발 (#34 deploy 후 발견).
ALTER TABLE users ADD COLUMN role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN status ENUM('ACTIVE','SUSPENDED','DORMANT') NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN status_reason VARCHAR(500);
ALTER TABLE users ADD COLUMN status_updated_at DATETIME(6);
ALTER TABLE users ADD COLUMN status_updated_by BINARY(16);

-- daily_recommendations — ADR 0011 (운영자 override) + ADR 0047 §B.4 (variant)
-- override_reason 은 schema-mysql.sql 에 있으나 overridden_by/at 는 초기 버전 prod 에 누락 가능.
ALTER TABLE daily_recommendations ADD COLUMN overridden_by BINARY(16);
ALTER TABLE daily_recommendations ADD COLUMN overridden_at DATETIME(6);
ALTER TABLE daily_recommendations ADD COLUMN variant VARCHAR(32);

-- payment_transactions 추가 컬럼 (provider / provider_receipt_id / status / refunded_at)
ALTER TABLE payment_transactions ADD COLUMN provider VARCHAR(16) NOT NULL DEFAULT 'MOCK';
ALTER TABLE payment_transactions ADD COLUMN provider_receipt_id VARCHAR(200);
ALTER TABLE payment_transactions ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE payment_transactions ADD COLUMN refunded_at DATETIME(6);

-- profiles — ADR 0026/0035/0037 (color 분석 영속화) + DA-001 (이상형 범위) + DA-002 (position)
-- prod profiles 테이블이 초기 schema-mysql.sql 후 ALTER 안 됨 → 사진 추가/프로필 조회 시
-- SELECT color_ideal_type_insight 폭발 (#38 deploy 후 발견).
ALTER TABLE profiles ADD COLUMN color_reasoning TEXT;
ALTER TABLE profiles ADD COLUMN color_personality_summary TEXT;
ALTER TABLE profiles ADD COLUMN color_ideal_type_insight TEXT;
ALTER TABLE profiles ADD COLUMN color_strengths TEXT;
ALTER TABLE profiles ADD COLUMN details_visible_to_friends BIT;
ALTER TABLE profiles ADD COLUMN ideal_age_min INT;
ALTER TABLE profiles ADD COLUMN ideal_age_max INT;
ALTER TABLE profiles ADD COLUMN ideal_height_min INT;
ALTER TABLE profiles ADD COLUMN ideal_height_max INT;
ALTER TABLE profiles ADD COLUMN position VARCHAR(80);

-- profile_photos / profile_videos — s3_key (S3 스토리지 키). 엔티티는 NOT NULL 이나
-- 기존 row 보호 위해 DB 레벨은 nullable 로 추가 (신규 insert 는 항상 값 제공).
ALTER TABLE profile_photos ADD COLUMN s3_key VARCHAR(500);
ALTER TABLE profile_videos ADD COLUMN s3_key VARCHAR(500);

-- matchmaking_requests — ADR 0012 운영자 매칭 풀 (강제 변경 + 메모)
ALTER TABLE matchmaking_requests ADD COLUMN admin_note TEXT;
ALTER TABLE matchmaking_requests ADD COLUMN admin_last_updated_at DATETIME(6);
ALTER TABLE matchmaking_requests ADD COLUMN admin_last_updated_by BINARY(16);
