export type MatchType = 'contest' | 'sports'
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type NotificationType =
  | 'match_request'
  | 'match_accepted'
  | 'match_rejected'
  | 'match_cancelled'
  | 'user_withdrawn'
  | 'report_flagged'
  | 'sport_application'
  | 'sport_accepted'
  | 'sport_rejected'
  | 'contest_application'
  | 'contest_accepted'
  | 'contest_rejected'

export type ContestField =
  | 'marketing' | 'video' | 'design'
  | 'literature' | 'it' | 'arts' | 'academic'

export type SportCategory = '풋살' | '농구' | '테니스' | '소운동장' | '종합운동장'

export type Facility =
  | 'futsal_a' | 'futsal_b'
  | 'basketball_a' | 'basketball_b'
  | 'tennis_a' | 'tennis_b' | 'tennis_c' | 'tennis_d' | 'tennis_e'
  | 'small_field' | 'main_field'

export interface User {
  id: string
  email: string
  nickname: string
  student_id: string
  avatar_url: string | null
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContestProfile {
  id: string
  user_id: string
  department: string
  gender: 'male' | 'female' | 'other' | null
  age: number | null
  contest_count: number
  certificates: string[] | null
  fields: ContestField[] | null
  intro: string | null
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface SportsProfile {
  id: string
  user_id: string
  gender: 'male' | 'female' | 'other' | null
  age: number | null
  sports: SportCategory[] | null
  career_years: number
  is_pro: boolean
  intro: string | null
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface Contest {
  id: string
  title: string
  organizer: string | null
  field: ContestField
  start_date: string | null
  end_date: string
  prize: string | null
  target: string | null
  url: string
  thumbnail_url: string | null
  is_active: boolean
  source: string | null
  last_crawled_at: string
  created_at: string
}

export interface SportsReservation {
  id: string
  facility: Facility
  reservation_date: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'closed'
  last_crawled_at: string
}

export interface Match {
  id: string
  type: MatchType
  requester_id: string
  receiver_id: string
  contest_id: string | null
  reservation_id: string | null
  status: MatchStatus
  message: string | null
  created_at: string
  updated_at: string
}

export interface MatchWithProfiles extends Match {
  requester: Pick<User, 'id' | 'nickname' | 'avatar_url'>
  receiver: Pick<User, 'id' | 'nickname' | 'avatar_url'>
  contest?: Pick<Contest, 'id' | 'title' | 'field'> | null
  reservation?: Pick<SportsReservation, 'id' | 'facility' | 'reservation_date' | 'start_time' | 'end_time'> | null
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  content: string
  is_read: boolean
  related_id: string | null
  link: string | null
  created_at: string
}

// 시설 카테고리 ↔ facility 값 ↔ sports_profiles 매핑
export const FACILITY_MAP: Record<string, { facilities: Facility[]; sportValue: SportCategory }> = {
  풋살장: { facilities: ['futsal_a', 'futsal_b'], sportValue: '풋살' },
  농구장: { facilities: ['basketball_a', 'basketball_b'], sportValue: '농구' },
  테니스장: { facilities: ['tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e'], sportValue: '테니스' },
  소운동장: { facilities: ['small_field'], sportValue: '소운동장' },
  종합운동장: { facilities: ['main_field'], sportValue: '종합운동장' },
}

// 공모전 분야 탭 레이블 ↔ DB field 값 매핑
export const CONTEST_FIELD_MAP: Record<string, ContestField> = {
  '마케팅·아이디어': 'marketing',
  '영상·UCC·사진': 'video',
  '디자인': 'design',
  '문학·글': 'literature',
  'IT·소프트웨어': 'it',
  '예체능·음악·미술': 'arts',
  '학술·창업·논술': 'academic',
}