-- 007_fix_trigger.sql
-- handle_new_user 트리거를 EXCEPTION 핸들러로 감싸
-- 닉네임/이메일 중복 등 어떤 제약 위반이 발생해도 auth user 생성은 성공하게 처리

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
  ON CONFLICT (id) DO UPDATE
    SET email      = EXCLUDED.email,
        nickname   = EXCLUDED.nickname,
        student_id = EXCLUDED.student_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 삽입 실패해도 auth user 생성은 계속 진행
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;