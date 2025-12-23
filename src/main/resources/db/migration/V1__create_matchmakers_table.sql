-- Matchmakers Table
CREATE TABLE matchmakers (
    id BINARY(16) NOT NULL PRIMARY KEY COMMENT 'Matchmaker UUID',
    user_id BINARY(16) NOT NULL COMMENT 'User UUID reference',

    -- Stats fields
    total_match_requests INT NOT NULL DEFAULT 0 COMMENT 'Total match requests received',
    approved_requests INT NOT NULL DEFAULT 0 COMMENT 'Number of approved requests',
    rejected_requests INT NOT NULL DEFAULT 0 COMMENT 'Number of rejected requests',
    successful_matches INT NOT NULL DEFAULT 0 COMMENT 'Number of successful matches',
    failed_matches INT NOT NULL DEFAULT 0 COMMENT 'Number of failed matches',

    -- Level fields
    level INT NOT NULL DEFAULT 1 COMMENT 'Matchmaker level (1-5)',
    commission_rate DOUBLE NOT NULL DEFAULT 0.30 COMMENT 'Commission rate (0.30 ~ 0.50)',

    -- Earnings fields
    total_points INT NOT NULL DEFAULT 0 COMMENT 'Total earned points',
    withdrawn_points INT NOT NULL DEFAULT 0 COMMENT 'Total withdrawn points',
    pending_points INT NOT NULL DEFAULT 0 COMMENT 'Points pending for withdrawal',

    -- Photo fields
    profile_photo_url VARCHAR(500) NULL COMMENT 'Profile photo URL',
    profile_photo_uploaded_at TIMESTAMP(6) NULL COMMENT 'Photo upload timestamp',

    -- Metadata fields
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Record update timestamp',

    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_level (level),
    INDEX idx_successful_matches (successful_matches),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Matchmaker information and statistics';
