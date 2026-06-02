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
  | 'sport_confirmed'
  | 'contest_application'
  | 'contest_accepted'
  | 'contest_rejected'
  | 'contest_confirmed'

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

export interface ContestRecruitment {
  id: string
  organizer_id: string
  contest_id: string
  title: string
  description: string | null
  required_fields: string[] | null
  max_members: number
  status: 'open' | 'closed'
  team_chat_id?: string | null
  created_at: string
  updated_at: string
  user_applied?: boolean
  organizer?: { id: string; nickname: string; department: string | null }
}

export interface ContestApplication {
  id: string
  recruitment_id: string
  applicant_id: string
  intro: string
  background: string | null
  status: 'pending' | 'accepted' | 'rejected'
  chat_room_id: string | null
  created_at: string
  applicant?: { id: string; nickname: string; department: string | null }
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

// 공모전 분야 탭 레이블 ↔ DB field 값 매핑 (한국어 → ContestField)
export const CONTEST_FIELD_MAP: Record<string, ContestField> = {
  '마케팅·아이디어': 'marketing',
  '영상·UCC·사진': 'video',
  '디자인': 'design',
  '문학·글': 'literature',
  'IT·소프트웨어': 'it',
  '예체능·음악·미술': 'arts',
  '학술·창업·논술': 'academic',
}

// 공모전 분야 (ContestField → 한국어)
export const CONTEST_FIELD_LABELS: Record<ContestField, string> = {
  marketing: '마케팅·아이디어',
  video: '영상·UCC·사진',
  design: '디자인',
  literature: '문학·글',
  it: 'IT·소프트웨어',
  arts: '예체능·음악·미술',
  academic: '학술·창업·논술',
}

// 충북대학교 학과 목록
export const CBNU_DEPARTMENTS: string[] = [
  // 인문대학
  '국어국문학과', '영어영문학과', '독일언어문화학과', '프랑스언어문화학과', '중어중문학과', '러시아언어문화학과',
  '철학과', '사학과', '고고미술사학과',
  // 사회과학대학
  '행정학과', '정치외교학과', '경제학과', '사회학과', '심리학과',
  // 경영대학
  '경영학부', '국제경영학과', '경영정보학과',
  // 자연과학대학
  '수학과', '정보통계학과', '물리학과', '화학과', '생물학과', '미생물학과', '생화학과', '천문우주학과', '지구환경과학과',
  // 공과대학
  '토목공학부', '기계공학부', '화학공학과', '신소재공학과', '건축공학과', '안전공학과', '환경공학과', '공업화학과', '도시공학과', '건축학과', '테크노산업공학과',
  // 전자정보대학
  '전기공학부', '전자공학부', '정보통신공학부', '컴퓨터공학과', '소프트웨어학과', '지능로봇공학과',
  // 농업생명환경대학
  '식물자원학과', '축산학과', '산림학과', '지역건설공학과', '환경생명화학과', '특용식물학과', '원예과학과', '바이오시스템공학과', '식물의학과', '식품생명공학과', '목재종이과학과', '농업경제학과',
  // 사범대학
  '교육학과', '국어교육과', '영어교육과', '역사지리교육과', '사회교육과', '윤리교육과', '과학교육과', '수학교육과', '체육교육과',
  // 생활과학대학
  '식품영양학과', '아동복지학과', '의류학과', '주거환경학과', '소비자학과',
  // 수의과대학
  '수의학과',
  // 약학대학
  '약학과', '응용약학과',
  // 의과대학
  '의학과', '의생명융합학과', '의용생체공학과',
  // 간호대학
  '간호학과',
  // 예술학과군
  '조형예술학과', '디자인학과',
  // 자율전공
  '자율전공학부', '기타',
]