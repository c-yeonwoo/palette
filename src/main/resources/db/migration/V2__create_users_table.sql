-- Users Table
CREATE TABLE users (
    id BINARY(16) NOT NULL PRIMARY KEY COMMENT 'User UUID',

    -- OAuth Info
    oauth_provider VARCHAR(20) NOT NULL COMMENT 'OAuth provider',
    oauth_id VARCHAR(255) NOT NULL COMMENT 'OAuth provider user ID',

    -- Private Info
    real_name VARCHAR(50) NOT NULL COMMENT 'Real name (private)',
    email VARCHAR(255) NULL COMMENT 'Email address',
    phone_number VARCHAR(20) NULL COMMENT 'Phone number',

    -- Public Info
    nickname VARCHAR(20) NOT NULL COMMENT 'Service nickname (public)',
    birth_date DATE NOT NULL COMMENT 'Birth date',
    gender VARCHAR(10) NOT NULL COMMENT 'Gender: MALE, FEMALE',

    -- Account Type
    account_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR' COMMENT 'REGULAR or MATCHMAKER_ONLY',

    -- Profile Status
    is_profile_completed BOOLEAN NOT NULL DEFAULT false COMMENT 'Profile completion status',

    -- Terms Agreement
    agreed_terms_service BOOLEAN NOT NULL COMMENT 'Terms of service agreement',
    agreed_terms_privacy BOOLEAN NOT NULL COMMENT 'Privacy policy agreement',
    agreed_marketing BOOLEAN NOT NULL DEFAULT false COMMENT 'Marketing consent',
    agreed_at TIMESTAMP(6) NOT NULL COMMENT 'Agreement timestamp',

    -- Metadata
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Record update timestamp',
    last_login_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Last login timestamp',
    deleted_at TIMESTAMP(6) NULL COMMENT 'Soft delete timestamp',

    -- Unique Constraints
    CONSTRAINT uk_users_oauth UNIQUE(oauth_provider, oauth_id),
    CONSTRAINT uk_users_nickname UNIQUE(nickname),

    -- Check Constraints
    CONSTRAINT ck_users_account_type CHECK (account_type IN ('REGULAR', 'MATCHMAKER_ONLY')),
    CONSTRAINT ck_users_gender CHECK (gender IN ('MALE', 'FEMALE'))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts and authentication';

-- Indexes
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_created_at ON users(created_at);
