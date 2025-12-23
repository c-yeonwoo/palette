-- Profile Photos Table
CREATE TABLE profile_photos (
    id BINARY(16) NOT NULL PRIMARY KEY COMMENT 'Photo UUID',
    profile_id BINARY(16) NOT NULL COMMENT 'Profile UUID reference',
    s3_key TEXT NOT NULL COMMENT 'S3 object key',
    url TEXT NOT NULL COMMENT 'Photo URL',
    display_order INT NOT NULL COMMENT 'Display order',
    is_primary BOOLEAN NOT NULL DEFAULT false COMMENT 'Primary photo flag',

    -- Trust Analysis
    trust_factor VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN' COMMENT 'Trust factor classification',
    trust_score INT NOT NULL DEFAULT 10 COMMENT 'Trust score (0-50)',

    -- AI Analysis
    has_face BOOLEAN NULL COMMENT 'Has face detected',
    has_full_body BOOLEAN NULL COMMENT 'Has full body',
    has_clear_face BOOLEAN NULL COMMENT 'Has clear face',
    quality_score INT NULL COMMENT 'Quality score (0-100)',
    is_selfie BOOLEAN NULL COMMENT 'Is selfie',
    is_taken_by_others BOOLEAN NULL COMMENT 'Is taken by others',
    is_over_processed BOOLEAN NULL COMMENT 'Is over processed',
    ai_analysis JSON NULL COMMENT 'AI analysis raw data',

    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Upload timestamp',

    -- Foreign Keys
    CONSTRAINT fk_profile_photos_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,

    -- Unique Constraints
    CONSTRAINT uk_profile_photos_order UNIQUE(profile_id, display_order),

    -- Check Constraints
    CONSTRAINT ck_profile_photos_trust_factor CHECK (trust_factor IN ('SELFIE', 'TAKEN_BY_OTHERS', 'UNCLEAR', 'UNKNOWN')),
    CONSTRAINT ck_profile_photos_trust_score CHECK (trust_score >= 0 AND trust_score <= 50),
    CONSTRAINT ck_profile_photos_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Profile photos';

-- Indexes
CREATE INDEX idx_profile_photos_profile_id ON profile_photos(profile_id);
CREATE INDEX idx_profile_photos_primary ON profile_photos(profile_id, is_primary);
CREATE INDEX idx_profile_photos_created_at ON profile_photos(created_at);
