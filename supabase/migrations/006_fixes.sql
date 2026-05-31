-- 006_fixes.sql
-- sport_sessions에 title 컬럼 추가
ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS title TEXT CHECK (char_length(title) <= 50);