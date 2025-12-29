-- Make MBTI nullable in profiles table
ALTER TABLE profiles MODIFY COLUMN mbti VARCHAR(4) NULL;
