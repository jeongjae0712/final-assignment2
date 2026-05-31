-- 009_notification_types.sql: 알림 타입 확장 + link 컬럼

-- 기존 type CHECK 제약 제거 후 새 타입 포함해서 재추가
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'match_request','match_accepted','match_rejected',
    'match_cancelled','user_withdrawn','report_flagged',
    'sport_application','sport_accepted','sport_rejected',
    'contest_application','contest_accepted','contest_rejected'
  ));

-- 클릭 시 이동할 URL 저장용 컬럼
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;