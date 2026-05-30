-- 002_rls.sql
-- Row Level Security 정책

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- contest_profiles
CREATE POLICY "contest_profiles_select" ON contest_profiles FOR SELECT TO authenticated
  USING (is_visible = true OR user_id = auth.uid());
CREATE POLICY "contest_profiles_insert_own" ON contest_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "contest_profiles_update_own" ON contest_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "contest_profiles_delete_own" ON contest_profiles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- sports_profiles
CREATE POLICY "sports_profiles_select" ON sports_profiles FOR SELECT TO authenticated
  USING (is_visible = true OR user_id = auth.uid());
CREATE POLICY "sports_profiles_insert_own" ON sports_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "sports_profiles_update_own" ON sports_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "sports_profiles_delete_own" ON sports_profiles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- contests (크롤러는 service_role로 bypass)
CREATE POLICY "contests_select" ON contests FOR SELECT TO authenticated USING (true);

-- sports_reservations
CREATE POLICY "reservations_select" ON sports_reservations FOR SELECT TO authenticated USING (true);

-- matches
CREATE POLICY "matches_select" ON matches FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "matches_insert" ON matches FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "matches_update" ON matches FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

-- reports
CREATE POLICY "reports_insert" ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_select_admin" ON reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
