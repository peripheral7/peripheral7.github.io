// 처음 열었을 때의 후보지·목적지·선호도(기본값). 방문자가 검색으로 바꾼 목록은 그 브라우저에만 저장되고(store.ts),
// "처음 목록으로"를 누르면 여기로 돌아온다.

/** 후보지. 보증금·월세는 만원 단위(모르면 비워 둔다). */
export type Candidate = { id: string; name: string; address: string; lat: number; lng: number; deposit?: number; rent?: number }
/** 목적지 분류 목록(검색해서 넣을 때 고른다) */
export const HUB_CATEGORIES = ['학교', '본가', '직장', '기타'] // 등록 창의 고르기 목록(그 밖은 직접 입력)
export const MAX_TRIPS = 80 // 목적지 월 왕복 횟수 상한
/** 목적지 분류 이모지(번호 대신 지도·목록·카드에 쓴다) */
const HUB_EMOJI: Record<string, string> = { 학교: '🏫', 본가: '🏠', 직장: '🏢', 교통센터: '🚉', 상업시설: '🛍️', 병원: '🏥' }
export const hubEmoji = (category: string) => HUB_EMOJI[category] ?? '📍'
export type Place = { name: string; address: string; lat: number; lng: number; category?: string } // 검색 결과 한 건
export type Hub = { id: string; name: string; category: string; address: string; lat: number; lng: number }

/** 후보지(임시 입력). 좌표는 네이버 Geocoding 으로 도로명 주소를 찾은 값(2026-10-13),
 *  이름은 가까운 역·상권 + 도로 이름(망포역 북쪽 360m · 망포역 남동쪽 580m · 영통역 동쪽 610m · 경희대 국제캠퍼스 남서쪽 700m). */
export const CANDIDATES: Candidate[] = [
  { id: 'c1', name: '망포역 신원로', address: '경기도 수원시 영통구 신원로136번길 16', lat: 37.24858, lng: 127.05555 },
  { id: 'c2', name: '망포역 영통로', address: '경기도 수원시 영통구 영통로200번길 124-16', lat: 37.24314, lng: 127.06314 },
  { id: 'c3', name: '영통역 청명남로', address: '경기도 수원시 영통구 청명남로50번길 21-5', lat: 37.25342, lng: 127.07778 },
  { id: 'c4', name: '경희대 서천동로', address: '경기도 용인시 기흥구 서천동로43번길 5-5', lat: 37.23672, lng: 127.07713 },
]
/** 예전 기본 이름(이름을 안 바꾼 저장 목록은 새 이름·좌표로 옮긴다 — store.ts) */
export const OLD_DEFAULT_NAMES: Record<string, string> = { c1: '망포역 인근 후보 1', c2: '망포역 인근 후보 2', c3: '망포역 인근 후보 3', c4: '서천동 후보' }

/** 주요 목적지(거점). 최대 3곳 — 꽉 찬 뒤 검색으로 더하면 월 왕복이 가장 적은 곳과 바꾼다. */
export const MAX_HUBS = 3
const HUB_LIST: Hub[] = [
  { id: 'h1', name: '경희대학교 국제캠퍼스', category: '학교', address: '경기도 용인시 기흥구 덕영대로 1732', lat: 37.2421, lng: 127.0804 },
  { id: 'h2', name: '성남 분당 본가', category: '본가', address: '경기도 성남시 분당구 성남대로', lat: 37.385, lng: 127.123 },
]
export const HUBS: Hub[] = HUB_LIST.slice(0, MAX_HUBS)
export const NEW_HUB_TRIPS = 8 // 검색으로 새로 넣은 목적지의 월 왕복 횟수 기본값

export type Weights = { transit: number; car: number; walk: number }
/** transitUse[목적지 id] = true 면 그 목적지는 주 이동수단과 상관없이 항상 대중교통을 탄다(도보권이어도 대중교통을 셈, 차량은 참고로만 보임) */
export type Preference = { weights: Weights; trips: Record<string, number>; transitUse?: Record<string, boolean> }

/** 교통 선호도 기본값: 수단별 가중치(합이 100이 아니어도 비율로 쓴다)와 거점별 월 왕복 횟수. */
export const DEFAULT_PREFERENCE: Preference = {
  weights: { transit: 50, car: 30, walk: 20 },
  trips: { h1: 60, h2: 2 }, // 원본 앱에 저장돼 있던 값(학교 월 60회 · 본가 2회)
}

/** 가중치를 합 100 기준 비율(정수)로. 합이 100을 넘거나 모자라도 비율만 본다(반올림 차이는 큰 나머지 순으로 맞춤). 합 0 이면 똑같이. */
export function weightShares(w: Weights): Weights {
  const keys: (keyof Weights)[] = ['transit', 'car', 'walk']
  const sum = keys.reduce((a, k) => a + Math.max(0, w[k]), 0)
  const raw = keys.map((k) => (sum > 0 ? (Math.max(0, w[k]) * 100) / sum : 100 / 3))
  const out = raw.map(Math.floor)
  const order = raw.map((x, i) => ({ r: x - Math.floor(x), i })).sort((a, b) => b.r - a.r)
  for (let k = 0; k < 100 - out.reduce((a, b) => a + b, 0); k++) out[order[k].i]++
  return { transit: out[0], car: out[1], walk: out[2] }
}

/** 월세 비교: 보증금이 다른 매물을 "보증금 1,000만원일 때의 월세"로 맞춘다.
 *  환산 월세 = 월세 + (보증금 − 1,000) × 전월세 전환율 ÷ 12. 전환율 연 6%면 보증금 1,000만원 차이 = 월 5만원. */
export const BASE_DEPOSIT = 1000 // 만원
export const CONVERSION_RATE = 0.06 // 연
export function baseRent(c: Pick<Candidate, 'deposit' | 'rent'>): number | null {
  if (c.rent === undefined && c.deposit === undefined) return null
  return Math.max(0, Math.round((c.rent ?? 0) + ((c.deposit ?? 0) - BASE_DEPOSIT) * CONVERSION_RATE / 12))
}
/** 1,000 → "1,000", 15000 → "1억 5,000" (만원 단위) */
export function won(v: number): string {
  const eok = Math.floor(v / 10000), man = v % 10000
  return eok ? `${eok}억${man ? ' ' + man.toLocaleString('ko-KR') : ''}` : man.toLocaleString('ko-KR')
}
