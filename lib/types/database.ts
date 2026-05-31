export type MatchType = 'contest' | 'sports'
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type NotificationType =
  | 'match_request' | 'match_accepted' | 'match_rejected'
  | 'match_cancelled' | 'user_withdrawn' | 'report_flagged'

export type ContestField =
  | 'marketing' | 'video' | 'design'
  | 'literature' | 'it' | 'arts' | 'academic'

export type SportCategory = '풋살' | '농구' | '테니스' | '소운동장' | '종합운동장'

export type Facility =
  | 'futsal_a' | 'futsal_b'
  | 'basketball_a' | 'basketball_b'
  | 'tennis_a' | 'tennis_b' | 'tennis_c' | 'tennis_d' | 'tennis_e'
  | 'small_field' | 'main_field'

export type Gender = 'male' | 'female' | 'other'

export const CBNU_DEPARTMENTS = [
  '국어국문학과','영어영문학과','철학과','사학과','중어중문학과','독어독문학과','러시아언어문화학과',
  '사회학과','심리학과','행정학과','정치외교학과','경제학과',
  '수학과','통계학과','물리학과','화학과','생물학과','지구환경과학과',
  '기계공학부','화학공학과','전기공학부','토목공학부','환경공학과','건축공학과','도시공학과','건축학과','산업공학과',
  '전자공학부','정보통신공학부','컴퓨터공학과','제어로봇공학과','전파공학과','반도체공학과',
  '경영학부','국제경영학과','경영정보학과','회계학과',
  '농업생물학과','식물자원학과','원예과학과','환경생태공학부','식품공학과','농업경제학과','바이오시스템공학과',
  '의학과','약학과',
  '교육학과','윤리교육과','국어교육과','영어교육과','역사교육과','지리교육과','수학교육과','과학교육과','체육교육과','교육공학과',
  '아동복지학과','소비자학과','의류학과','식품영양학과',
  '수의학과','음악학과','미술학과',
] as const

export type CbnuDepartment = typeof CBNU_DEPARTMENTS[number]

export interface User {
  id: string
  email: string
  nickname: string
  student_id: string
  department: string | null
  gender: Gender | null
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
  gender: Gender | null
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
  department: string | null
  gender: Gender | null
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

export interface SportSession {
  id: string
  organizer_id: string
  sport: SportCategory
  facility: string | null
  session_date: string
  start_time: string
  end_time: string
  description: string | null
  max_players: number
  status: 'open' | 'closed' | 'cancelled'
  created_at: string
}

export interface ContestRecruitment {
  id: string
  organizer_id: string
  contest_id: string
  title: string
  description: string | null
  required_fields: ContestField[] | null
  max_members: number
  status: 'open' | 'closed'
  created_at: string
  updated_at: string
}

export interface ContestApplication {
  id: string
  recruitment_id: string
  applicant_id: string
  intro: string
  background: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
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
  created_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export const FACILITY_MAP: Record<string, { facilities: Facility[]; sportValue: SportCategory }> = {
  풋살장: { facilities: ['futsal_a', 'futsal_b'], sportValue: '풋살' },
  농구장: { facilities: ['basketball_a', 'basketball_b'], sportValue: '농구' },
  테니스장: { facilities: ['tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e'], sportValue: '테니스' },
  소운동장: { facilities: ['small_field'], sportValue: '소운동장' },
  종합운동장: { facilities: ['main_field'], sportValue: '종합운동장' },
}

export const FACILITY_LABELS: Record<Facility, string> = {
  futsal_a: '풋살장 A', futsal_b: '풋살장 B',
  basketball_a: '농구장 A', basketball_b: '농구장 B',
  tennis_a: '테니스장 A', tennis_b: '테니스장 B', tennis_c: '테니스장 C',
  tennis_d: '테니스장 D', tennis_e: '테니스장 E',
  small_field: '소운동장', main_field: '종합운동장',
}

export const CONTEST_FIELD_LABELS: Record<ContestField, string> = {
  marketing: '마케팅/아이디어',
  video: '영상/UCC/사진',
  design: '디자인',
  literature: '문학/글',
  it: 'IT/소프트웨어',
  arts: '예체능/음악/미술',
  academic: '학술/창업/논술',
}

export const CONTEST_FIELD_MAP: Record<string, ContestField> = {
  '마케팅·아이디어': 'marketing',
  '영상·UCC·사진': 'video',
  '디자인': 'design',
  '문학·글': 'literature',
  'IT·소프트웨어': 'it',
  '예체능·음악·미술': 'arts',
  '학술·창업·논술': 'academic',
}
