-- 012_confirm_match.sql
-- sport_sessions / contest_recruitments에 team_chat_id 추가
-- 수락 후 개설자가 직접 매치/팀을 확정하면 팀채팅이 생성되는 구조

ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS team_chat_id UUID REFERENCES chat_rooms(id);
ALTER TABLE contest_recruitments ADD COLUMN IF NOT EXISTS team_chat_id UUID REFERENCES chat_rooms(id);

-- 신규 알림 타입 추가 (sport_confirmed, contest_confirmed)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'match_request','match_accepted','match_rejected',
    'match_cancelled','user_withdrawn','report_flagged',
    'sport_application','sport_accepted','sport_rejected','sport_confirmed',
    'contest_application','contest_accepted','contest_rejected','contest_confirmed'
  ));