-- Profile Videos Table
CREATE TABLE profile_videos (
    id BINARY(16) NOT NULL PRIMARY KEY COMMENT 'Video UUID',
    profile_id BINARY(16) NOT NULL COMMENT 'Profile UUID reference',
    s3_key TEXT NOT NULL COMMENT 'S3 object key',
    url TEXT NOT NULL COMMENT 'Video URL',
    thumbnail_url TEXT NOT NULL COMMENT 'Thumbnail URL',
    duration_seconds INT NOT NULL COMMENT 'Duration in seconds',

    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Upload timestamp',

    -- Foreign Keys
    CONSTRAINT fk_profile_videos_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,

    -- Unique Constraints
    CONSTRAINT uk_profile_videos_profile UNIQUE(profile_id),

    -- Check Constraints
    CONSTRAINT ck_profile_videos_duration CHECK (duration_seconds >= 5 AND duration_seconds <= 30)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Profile videos';

-- Indexes
CREATE INDEX idx_profile_videos_profile_id ON profile_videos(profile_id);
CREATE INDEX idx_profile_videos_created_at ON profile_videos(created_at);
