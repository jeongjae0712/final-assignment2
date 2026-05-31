-- 008_sport_applications.sql
-- 스포츠 세션 신청 시스템

CREATE TABLE IF NOT EXISTS sport_session_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sport_sessions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message      TEXT CHECK (char_length(message) <= 300),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  chat_room_id UUID REFERENCES chat_rooms(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, applicant_id)
);

ALTER TABLE sport_session_applications ENABLE ROW LEVEL SECURITY;

-- 신청자 본인 또는 세션 개설자가 조회 가능
CREATE POLICY "sport_app_select" ON sport_session_applications FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM sport_sessions WHERE id = session_id AND organizer_id = auth.uid())
  );

-- 본인만 신청 가능
CREATE POLICY "sport_app_insert" ON sport_session_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());

-- 세션 개설자만 상태 변경 가능
CREATE POLICY "sport_app_update" ON sport_session_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM sport_sessions WHERE id = session_id AND organizer_id = auth.uid()));