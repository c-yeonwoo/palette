-- Create matchmaking_requests table for 2-stage matchmaking approval flow
CREATE TABLE matchmaking_requests (
    id BINARY(16) PRIMARY KEY,
    requester_id BINARY(16) NOT NULL,
    target_user_id BINARY(16) NOT NULL,
    matchmaker_id BINARY(16) NOT NULL,

    -- Requester's message to matchmaker
    requester_message TEXT,

    -- Matchmaker decision
    matchmaker_decided_at TIMESTAMP,
    matchmaker_message TEXT,
    matchmaker_approved BOOLEAN,

    -- Target user decision
    target_decided_at TIMESTAMP,
    target_message TEXT,
    target_accepted BOOLEAN,

    -- Status tracking
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    -- Indexes for efficient querying
    INDEX idx_matchmaker_id (matchmaker_id),
    INDEX idx_target_user_id (target_user_id),
    INDEX idx_requester_id (requester_id),
    INDEX idx_matchmaker_status (matchmaker_id, status),
    INDEX idx_target_status (target_user_id, status),
    INDEX idx_requester_status (requester_id, status),
    INDEX idx_status (status)
);

-- Comments for documentation
ALTER TABLE matchmaking_requests COMMENT = '주선 요청 테이블 - 2단계 승인 플로우 (주선자 승인 → 피주선자 수락/거절)';
