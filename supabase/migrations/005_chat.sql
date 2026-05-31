-- 005_chat.sql: 채팅 시스템

-- 채팅방 (DM / 스포츠팀 / 공모전팀)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('dm','sports_team','contest_team')),
  name TEXT,
  ref_id UUID,            -- sports_team: match.id, contest_team: application.id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅방 멤버
CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 채팅 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매칭에 채팅방 ID 연결
ALTER TABLE matches ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES chat_rooms(id);
ALTER TABLE contest_applications ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES chat_rooms(id);

-- RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "room_member_select" ON chat_rooms FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid()));

CREATE POLICY "room_insert_auth" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "member_select" ON chat_room_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_room_members m WHERE m.room_id = chat_room_members.room_id AND m.user_id = auth.uid()));

CREATE POLICY "member_insert_auth" ON chat_room_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "member_update_own" ON chat_room_members FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "msg_member_select" ON chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()));

CREATE POLICY "msg_member_insert" ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid()));

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;