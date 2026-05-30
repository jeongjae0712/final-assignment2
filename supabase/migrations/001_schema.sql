-- 001_schema.sql
-- 충북대학교 공모전 & 스포츠 매칭 플랫폼 전체 스키마

-- users
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  nickname     TEXT UNIQUE NOT NULL
                 CHECK (char_length(nickname) BETWEEN 2 AND 10),
  student_id   TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- contest_profiles
CREATE TABLE contest_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department      TEXT NOT NULL,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  contest_count   INT DEFAULT 0,
  certificates    TEXT[],
  fields          TEXT[]
                    CONSTRAINT check_fields_values CHECK (
                      fields <@ ARRAY['marketing','video','design',
                                      'literature','it','arts','academic']
                    ),
  intro           TEXT CHECK (char_length(intro) <= 300),
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- sports_profiles
CREATE TABLE sports_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
  age             INT CHECK (age BETWEEN 18 AND 40),
  sports          TEXT[]
                    CONSTRAINT check_sports_values CHECK (
                      sports <@ ARRAY['풋살', '농구', '테니스', '소운동장', '종합운동장']
                    ),
  career_years    INT DEFAULT 0,
  is_pro          BOOLEAN DEFAULT FALSE,
  intro           TEXT CHECK (char_length(intro) <= 300),
  is_visible      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- contests (크롤링 데이터)
CREATE TABLE contests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  organizer       TEXT,
  field           TEXT NOT NULL CHECK (field IN (
                    'marketing', 'video', 'design',
                    'literature', 'it', 'arts', 'academic'
                  )),
  start_date      DATE,
  end_date        DATE NOT NULL,
  prize           TEXT,
  target          TEXT,
  url             TEXT UNIQUE NOT NULL,
  thumbnail_url   TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  source          TEXT,
  last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- sports_reservations (크롤링 데이터)
CREATE TABLE sports_reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility         TEXT NOT NULL CHECK (facility IN (
                     'futsal_a', 'futsal_b',
                     'basketball_a', 'basketball_b',
                     'tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e',
                     'small_field', 'main_field'
                   )),
  reservation_date DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           TEXT DEFAULT 'available'
                     CHECK (status IN ('available', 'reserved', 'closed')),
  last_crawled_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (facility, reservation_date, start_time)
);

-- matches
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL CHECK (type IN ('contest', 'sports')),
  requester_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  contest_id      UUID REFERENCES contests(id) ON DELETE SET NULL,
  reservation_id  UUID REFERENCES sports_reservations(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message         TEXT CHECK (char_length(message) <= 200),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_match_type_fk CHECK (
    (type = 'contest' AND contest_id IS NOT NULL) OR
    (type = 'sports' AND reservation_id IS NOT NULL)
  ),
  CONSTRAINT check_no_self_match CHECK (requester_id <> receiver_id)
);

CREATE UNIQUE INDEX idx_matches_no_dup_pending
  ON matches(requester_id, receiver_id, type)
  WHERE status = 'pending';

-- reports
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reason          TEXT NOT NULL,
  detail          TEXT,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_no_self_report CHECK (reporter_id <> reported_id)
);

-- notifications
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'match_request', 'match_accepted', 'match_rejected',
                    'match_cancelled', 'user_withdrawn', 'report_flagged'
                  )),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  related_id      UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
