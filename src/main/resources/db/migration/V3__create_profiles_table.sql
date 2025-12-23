-- Profiles Table
CREATE TABLE profiles (
    id BINARY(16) NOT NULL PRIMARY KEY COMMENT 'Profile UUID',
    user_id BINARY(16) NOT NULL COMMENT 'User UUID reference',

    -- Basic Info
    height INT NULL COMMENT 'Height in cm',
    body_type VARCHAR(20) NULL COMMENT 'Body type',

    -- Career
    career_category VARCHAR(50) NULL COMMENT 'Career category',
    career_company VARCHAR(100) NULL COMMENT 'Company name',
    career_position VARCHAR(50) NULL COMMENT 'Position/title',

    -- Education
    education_level VARCHAR(20) NULL COMMENT 'Education level',
    education_school VARCHAR(100) NULL COMMENT 'School name',
    education_major VARCHAR(50) NULL COMMENT 'Major/field',

    -- Location
    location_sido VARCHAR(20) NULL COMMENT 'Current location (sido)',
    location_sigungu VARCHAR(30) NULL COMMENT 'Current location (sigungu)',
    hometown_sido VARCHAR(20) NULL COMMENT 'Hometown (sido)',
    hometown_sigungu VARCHAR(30) NULL COMMENT 'Hometown (sigungu)',

    -- Introduction
    introduction TEXT NULL COMMENT 'Self introduction',
    interests JSON NULL COMMENT 'List of interests',

    -- Lifestyle
    smoking VARCHAR(20) NULL COMMENT 'Smoking frequency',
    drinking VARCHAR(20) NULL COMMENT 'Drinking frequency',
    religion VARCHAR(20) NULL COMMENT 'Religion',

    -- Ideal Type
    ideal_age_min INT NULL COMMENT 'Minimum ideal age',
    ideal_age_max INT NULL COMMENT 'Maximum ideal age',
    ideal_height_min INT NULL COMMENT 'Minimum ideal height',
    ideal_height_max INT NULL COMMENT 'Maximum ideal height',
    ideal_body_types JSON NULL COMMENT 'Ideal body types',
    ideal_personalities JSON NULL COMMENT 'Ideal personalities',
    ideal_date_style VARCHAR(50) NULL COMMENT 'Ideal date style',
    ideal_purpose VARCHAR(50) NULL COMMENT 'Dating purpose',
    ideal_deal_breakers TEXT NULL COMMENT 'Deal breakers',

    -- Color Type
    color_type VARCHAR(50) NULL COMMENT 'Color personality type',
    color_name VARCHAR(50) NULL COMMENT 'Color name',
    color_hex VARCHAR(7) NULL COMMENT 'Color hex code',
    color_description TEXT NULL COMMENT 'Color description',

    -- Metrics
    completion_rate INT NOT NULL DEFAULT 0 COMMENT 'Profile completion percentage',
    trust_score INT NOT NULL DEFAULT 0 COMMENT 'Trust score',
    view_count INT NOT NULL DEFAULT 0 COMMENT 'Profile view count',

    -- Settings
    is_accepting_matches BOOLEAN NOT NULL DEFAULT true COMMENT 'Accepting match requests',
    hidden_at TIMESTAMP(6) NULL COMMENT 'Profile hidden timestamp',

    -- Metadata
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Record update timestamp',
    last_accessed_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Last access timestamp',
    deleted_at TIMESTAMP(6) NULL COMMENT 'Soft delete timestamp',

    -- Foreign Keys
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Unique Constraints
    CONSTRAINT uk_profiles_user_id UNIQUE(user_id),

    -- Check Constraints
    CONSTRAINT ck_profiles_height CHECK (height IS NULL OR (height >= 140 AND height <= 220)),
    CONSTRAINT ck_profiles_body_type CHECK (body_type IS NULL OR body_type IN ('SLIM', 'AVERAGE', 'ATHLETIC', 'MUSCULAR', 'CURVY')),
    CONSTRAINT ck_profiles_career_category CHECK (career_category IS NULL OR career_category IN ('IT_DEVELOPMENT', 'FINANCE', 'EDUCATION', 'MEDICAL', 'MEDIA', 'SERVICE', 'MANUFACTURING', 'PUBLIC_OFFICIAL', 'PROFESSIONAL', 'OTHER')),
    CONSTRAINT ck_profiles_education_level CHECK (education_level IS NULL OR education_level IN ('HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE')),
    CONSTRAINT ck_profiles_smoking CHECK (smoking IS NULL OR smoking IN ('NEVER', 'SOMETIMES', 'OFTEN')),
    CONSTRAINT ck_profiles_drinking CHECK (drinking IS NULL OR drinking IN ('NEVER', 'SOMETIMES', 'OFTEN')),
    CONSTRAINT ck_profiles_religion CHECK (religion IS NULL OR religion IN ('NONE', 'CHRISTIANITY', 'CATHOLICISM', 'BUDDHISM', 'OTHER')),
    CONSTRAINT ck_profiles_ideal_age CHECK (
        (ideal_age_min IS NULL AND ideal_age_max IS NULL)
        OR
        (ideal_age_min >= 19 AND ideal_age_max <= 65 AND ideal_age_min <= ideal_age_max)
    ),
    CONSTRAINT ck_profiles_ideal_height CHECK (
        (ideal_height_min IS NULL AND ideal_height_max IS NULL)
        OR
        (ideal_height_min >= 140 AND ideal_height_max <= 220 AND ideal_height_min <= ideal_height_max)
    ),
    CONSTRAINT ck_profiles_date_style CHECK (ideal_date_style IS NULL OR ideal_date_style IN ('ACTIVE', 'INDOOR', 'CULTURAL', 'BALANCED')),
    CONSTRAINT ck_profiles_purpose CHECK (ideal_purpose IS NULL OR ideal_purpose IN ('SERIOUS_DATING', 'MARRIAGE_PREMISE', 'FRIENDS_FIRST')),
    CONSTRAINT ck_profiles_color_type CHECK (color_type IS NULL OR color_type IN ('WARM_ORANGE', 'CALM_BLUE', 'VIBRANT_RED', 'SOFT_PINK', 'FRESH_GREEN', 'ELEGANT_PURPLE', 'BRIGHT_YELLOW', 'SOPHISTICATED_GRAY'))

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dating profiles';

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_accepting_matches ON profiles(is_accepting_matches);
CREATE INDEX idx_profiles_location ON profiles(location_sido, location_sigungu);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
