-- 003_triggers.sql
-- 트리거 및 DB 함수

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contest_profiles_updated_at
  BEFORE UPDATE ON contest_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sports_profiles_updated_at
  BEFORE UPDATE ON sports_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- auth.users → users 테이블 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, student_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'user_' || LEFT(NEW.id::TEXT, 8)),
    COALESCE(NEW.raw_user_meta_data->>'student_id', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 매칭 이벤트 → notifications 자동 생성 함수
CREATE OR REPLACE FUNCTION notify_match_event()
RETURNS TRIGGER AS $$
DECLARE
  v_content TEXT;
  v_type    TEXT;
  v_target  UUID;
BEGIN
  -- 신규 매칭 신청
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, content, related_id)
    VALUES (NEW.receiver_id, 'match_request', '새로운 매칭 신청이 도착했습니다.', NEW.id);

  -- 상태 변경
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN
    CASE NEW.status
      WHEN 'accepted' THEN
        -- requester에게 수락 알림
        INSERT INTO notifications (user_id, type, content, related_id)
        VALUES (NEW.requester_id, 'match_accepted', '매칭 신청이 수락되었습니다.', NEW.id);
      WHEN 'rejected' THEN
        INSERT INTO notifications (user_id, type, content, related_id)
        VALUES (NEW.requester_id, 'match_rejected', '매칭 신청이 거절되었습니다.', NEW.id);
      WHEN 'cancelled' THEN
        INSERT INTO notifications (user_id, type, content, related_id)
        VALUES (NEW.receiver_id, 'match_cancelled', '상대방이 매칭 신청을 취소했습니다.', NEW.id);
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_notify
  AFTER INSERT OR UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_match_event();

-- 신고 3회 자동 비공개 처리 함수
CREATE OR REPLACE FUNCTION handle_report_count()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reports
  WHERE reported_id = NEW.reported_id AND status = 'pending';

  IF v_count >= 3 THEN
    UPDATE contest_profiles SET is_visible = FALSE WHERE user_id = NEW.reported_id AND is_visible = TRUE;
    UPDATE sports_profiles   SET is_visible = FALSE WHERE user_id = NEW.reported_id AND is_visible = TRUE;

    -- 관리자에게 알림
    INSERT INTO notifications (user_id, type, content)
    SELECT id, 'report_flagged',
           '신고 3회 누적: 사용자 ' || NEW.reported_id || ' 계정이 자동 비공개 처리되었습니다.'
    FROM users WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_report_count
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION handle_report_count();
