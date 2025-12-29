-- Add phone verification field to users table
ALTER TABLE users
ADD COLUMN is_phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN users.is_phone_verified IS '핸드폰 인증 여부 (주선자는 필수)';
