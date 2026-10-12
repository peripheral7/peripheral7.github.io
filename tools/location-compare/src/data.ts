// 처음 열었을 때의 후보지·목적지·선호도(기본값). 방문자가 검색으로 바꾼 목록은 그 브라우저에만 저장되고(store.ts),
// "처음 목록으로"를 누르면 여기로 돌아온다.

export type Candidate = { id: string; name: string; address: string; lat: number; lng: number; category?: string }
/** 분류 목록(검색해서 넣을 때·후보지를 수정할 때 고른다) */
export const CANDIDATE_CATEGORIES = ['아파트', '오피스텔', '빌라·다세대', '단독주택', '원룸·기숙사', '기타']
export const HUB_CATEGORIES = ['학교', '본가', '직장', '교통센터', '상업시설', '병원', '기타']
export type Place = { name: string; address: string; lat: number; lng: number; category?: string } // 검색 결과 한 건
export type Hub = { id: string; name: string; category: string; address: string; lat: number; lng: number }

/** 후보지(임시 입력). 좌표는 도로명 주소의 대략 위치. */
export const CANDIDATES: Candidate[] = [
  { id: 'c1', name: '망포역 인근 후보 1', address: '경기도 수원시 영통구 신원로136번길 16', lat: 37.2524, lng: 127.0736 },
  { id: 'c2', name: '망포역 인근 후보 2', address: '경기도 수원시 영통구 영통로200번길 124-16', lat: 37.2488, lng: 127.0648 },
  { id: 'c3', name: '망포역 인근 후보 3', address: '경기도 수원시 영통구 청명남로50번길 21-5', lat: 37.2591, lng: 127.0615 },
  { id: 'c4', name: '서천동 후보', address: '경기도 용인시 기흥구 서천동로43번길 5-5', lat: 37.2383, lng: 127.0772 },
]

/** 주요 목적지(거점). 최대 2곳 — 검색으로 더하려면 기존 한 곳과 바꾼다. */
export const MAX_HUBS = 2
const HUB_LIST: Hub[] = [
  { id: 'h1', name: '경희대학교 국제캠퍼스', category: '학교', address: '경기도 용인시 기흥구 덕영대로 1732', lat: 37.2421, lng: 127.0804 },
  { id: 'h2', name: '성남 분당 본가', category: '본가', address: '경기도 성남시 분당구 성남대로', lat: 37.385, lng: 127.123 },
]
export const HUBS: Hub[] = HUB_LIST.slice(0, MAX_HUBS)
export const NEW_HUB_TRIPS = 8 // 검색으로 새로 넣은 목적지의 월 왕복 횟수 기본값

export type Weights = { transit: number; car: number; walk: number }
export type Preference = { weights: Weights; trips: Record<string, number> }

/** 교통 선호도 기본값: 수단별 가중치(합이 100이 아니어도 비율로 쓴다)와 거점별 월 왕복 횟수. */
export const DEFAULT_PREFERENCE: Preference = {
  weights: { transit: 50, car: 30, walk: 20 },
  trips: { h1: 60, h2: 2 }, // 원본 앱에 저장돼 있던 값(학교 월 60회 · 본가 2회)
}
