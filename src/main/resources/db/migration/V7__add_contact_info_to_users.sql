-- Add contact information columns to users table
ALTER TABLE users
ADD COLUMN kakao_talk_id VARCHAR(100),
ADD COLUMN preferred_contact_method VARCHAR(20);

-- Comments for documentation
ALTER TABLE users MODIFY COLUMN kakao_talk_id VARCHAR(100) COMMENT '카카오톡 ID (선택사항)';
ALTER TABLE users MODIFY COLUMN preferred_contact_method VARCHAR(20) COMMENT '선호하는 연락 수단 (KAKAOTALK, PHONE)';

-- Note: phone_number remains nullable for backward compatibility with existing users
-- New users should provide phone_number as required during profile creation
