-- 010_fix_chat_rls.sql

-- 순환 참조 RLS 수정: 본인 멤버십만 조회 가능하도록
DROP POLICY IF EXISTS "member_select" ON chat_room_members;
CREATE POLICY "member_select" ON chat_room_members FOR SELECT
  USING (user_id = auth.uid());

-- 채팅방 나가기를 위한 DELETE 정책 추가
DROP POLICY IF EXISTS "member_delete_own" ON chat_room_members;
CREATE POLICY "member_delete_own" ON chat_room_members FOR DELETE
  USING (user_id = auth.uid());