-- 004_improvements.sql
-- sport_sessions, contest_recruitments, contest_applications 추가

CREATE TABLE IF NOT EXISTS sport_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport         TEXT NOT NULL CHECK (sport IN ('풋살','농구','테니스','소운동장','종합운동장')),
  facility      TEXT,
  session_date  DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  description   TEXT CHECK (char_length(description) <= 300),
  max_players   INT DEFAULT 2 CHECK (max_players BETWEEN 2 AND 50),
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contest_recruitments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contest_id      UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 100),
  description     TEXT CHECK (char_length(description) <= 500),
  required_fields TEXT[],
  max_members     INT DEFAULT 4 CHECK (max_members BETWEEN 2 AND 10),
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contest_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id  UUID NOT NULL REFERENCES contest_recruitments(id) ON DELETE CASCADE,
  applicant_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intro           TEXT NOT NULL CHECK (char_length(intro) <= 500),
  background      TEXT CHECK (char_length(background) <= 1000),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (recruitment_id, applicant_id)
);

ALTER TABLE sport_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_recruitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sport_sessions_select" ON sport_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sport_sessions_insert" ON sport_sessions FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "sport_sessions_update_own" ON sport_sessions FOR UPDATE TO authenticated USING (organizer_id = auth.uid());

CREATE POLICY "contest_recruitments_select" ON contest_recruitments FOR SELECT TO authenticated USING (true);
CREATE POLICY "contest_recruitments_insert" ON contest_recruitments FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "contest_recruitments_update_own" ON contest_recruitments FOR UPDATE TO authenticated USING (organizer_id = auth.uid());

CREATE POLICY "contest_applications_select" ON contest_applications FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid() OR
    EXISTS (SELECT 1 FROM contest_recruitments WHERE id = recruitment_id AND organizer_id = auth.uid())
  );
CREATE POLICY "contest_applications_insert" ON contest_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "contest_applications_update_own" ON contest_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM contest_recruitments WHERE id = recruitment_id AND organizer_id = auth.uid()));
