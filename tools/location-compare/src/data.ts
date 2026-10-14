import type { PropertyUse } from './brokerage'

// 처음 열었을 때의 후보지·목적지·선호도(기본값). 방문자가 검색으로 바꾼 목록은 그 브라우저에만 저장되고(store.ts),
// "처음 목록으로"를 누르면 여기로 돌아온다.

/** 후보지. 보증금·월세·관리비(월)는 만원 단위(모르면 비워 둔다). use = 용도(주택·주거용 오피스텔·상가·기타, 없으면 주택) — 예상 중개수수료 요율(brokerage.ts) */
export type Candidate = { id: string; name: string; address: string; lat: number; lng: number; deposit?: number; rent?: number; maint?: number; use?: PropertyUse }
/** 목적지 분류 목록(검색해서 넣을 때 고른다) */
export const HUB_CATEGORIES = ['학교', '본가', '직장', '기타'] // 등록 창의 고르기 목록(그 밖은 직접 입력)
export const MAX_WEEKLY = 14 // 목적지 주 방문(왕복) 횟수 상한 — 0.5 단위(격주 = 0.5)
export const WEEKS_PER_MONTH = 4 // 월 4회 = 주 1회로 환산(사용자 지정)
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

/** 사용자(위쪽 탭에서 바꾼다). 'me' = 위 기본 후보지·목적지, 나머지 = 시험용(10-14): 대학교 하나 + 그 근처 자취 상권 4곳.
 *  자취 상권 고른 법: 상가정보(data/stores.sqlite)에서 학교 2km 안을 100m 격자로 훑어 반경 250m 음식점 수가 많은 곳(서로 500m 이상) 중
 *  원룸촌으로 알려진 곳을 골랐고, 좌표는 그 자리 건물의 도로명 주소를 네이버 Geocoding 한 값. 시험용 후보지는 미리 계산한 자료를
 *  src/profiles-live.json(scripts/bake-profiles.mjs)으로 실어 검색으로 넣은 후보지와 같은 길(live.ts)로 계산한다. */
export type Profile = { id: string; label: string; emoji: string; note: string; candidates: Candidate[]; hubs: Hub[] }
const school = (id: string, name: string, address: string, lat: number, lng: number): Hub => ({ id, name, category: '학교', address, lat, lng })
export const PROFILES: Profile[] = [
  { id: 'me', label: '나', emoji: '🙂', note: '경희대 국제캠퍼스 · 분당 본가', candidates: CANDIDATES, hubs: HUBS },
  {
    id: 'skku', label: '성균관대', emoji: '🧪', note: '시험용 · 자연과학캠퍼스(수원 율전동)',
    hubs: [school('hk', '성균관대학교 자연과학캠퍼스', '경기도 수원시 장안구 서부로 2066', 37.29336, 126.97465)],
    candidates: [
      { id: 'k1', name: '성균관대역 서부로', address: '경기도 수원시 장안구 서부로 2119', lat: 37.29787, lng: 126.9708 },
      { id: 'k2', name: '율전동 서부로2181번길', address: '경기도 수원시 장안구 서부로2181번길 16', lat: 37.30307, lng: 126.97208 },
      { id: 'k3', name: '정자동 덕영대로', address: '경기도 수원시 장안구 덕영대로511번길 29-2', lat: 37.29916, lng: 126.98027 },
      { id: 'k4', name: '구운동 일월천로', address: '경기도 수원시 권선구 일월천로4번길 2', lat: 37.28258, lng: 126.97255 },
    ],
  },
  {
    id: 'ajou', label: '아주대', emoji: '🧪', note: '시험용 · 수원 원천동',
    hubs: [school('ha', '아주대학교', '경기도 수원시 영통구 월드컵로 206', 37.28338, 127.04607)],
    candidates: [
      { id: 'a1', name: '아주대 정문 아주로', address: '경기도 수원시 팔달구 아주로 25', lat: 37.27708, lng: 127.04369 },
      { id: 'a2', name: '광교중앙역 센트럴타운로', address: '경기도 수원시 영통구 센트럴타운로 107', lat: 37.29203, lng: 127.04834 },
      { id: 'a3', name: '매탄동 매영로', address: '경기도 수원시 영통구 매영로 9', lat: 37.27179, lng: 127.04459 },
      { id: 'a4', name: '우만동 월드컵로', address: '경기도 수원시 팔달구 월드컵로311번길 34-7', lat: 37.28522, lng: 127.03271 },
    ],
  },
  {
    id: 'kgu', label: '경기대', emoji: '🧪', note: '시험용 · 수원캠퍼스(연무동·광교)',
    hubs: [school('hg', '경기대학교 수원캠퍼스', '경기도 수원시 영통구 광교산로 154-42', 37.30056, 127.03474)],
    candidates: [
      { id: 'g1', name: '경기대 정문 광교산로', address: '경기도 수원시 장안구 광교산로140번길 3', lat: 37.29998, lng: 127.0305 },
      { id: 'g2', name: '연무동 연무로', address: '경기도 수원시 장안구 연무로 28', lat: 37.29436, lng: 127.0283 },
      { id: 'g3', name: '경기대 후문 대학로', address: '경기도 수원시 영통구 대학로 40', lat: 37.29963, lng: 127.04402 },
      { id: 'g4', name: '광교중앙역 센트럴타운로', address: '경기도 수원시 영통구 센트럴타운로 85', lat: 37.29082, lng: 127.05059 },
    ],
  },
  {
    id: 'yonsei', label: '연세대', emoji: '🧪', note: '시험용 · 신촌캠퍼스',
    hubs: [school('hy', '연세대학교 신촌캠퍼스', '서울특별시 서대문구 연세로 50', 37.56711, 126.93903)],
    candidates: [
      { id: 'y1', name: '신촌역 연세로', address: '서울특별시 서대문구 연세로9길 7', lat: 37.55846, lng: 126.93646 },
      { id: 'y2', name: '연희동 연희맛로', address: '서울특별시 서대문구 연희맛로 22', lat: 37.56694, lng: 126.93017 },
      { id: 'y3', name: '연대 동문 성산로', address: '서울특별시 서대문구 성산로 547', lat: 37.56515, lng: 126.94551 },
      { id: 'y4', name: '연남동 동교로', address: '서울특별시 마포구 동교로34길 20', lat: 37.56078, lng: 126.92535 },
    ],
  },
]
export const profileOf = (id: string) => PROFILES.find((p) => p.id === id) ?? PROFILES[0]
/** 목적지 분류별 주 방문 횟수 기본값: 학교·직장 주 5회(출퇴근), 본가 월 4회 = 주 1회, 그 밖 주 2회 */
export const defaultWeekly = (category: string) => (category === '학교' || category === '직장' ? 5 : category === '본가' ? 1 : 2)

export type ModeKey = 'transit' | 'car' | 'walk' | 'bike'
export type Weights = Record<ModeKey, number>
/** 목적지별 이동수단: auto = 수단 가중치로 섞음, 그 밖 = 그 수단만으로 목적지 점수(다른 수단은 카드에 회색으로 참고만) */
export type HubMode = 'auto' | ModeKey
/** weekly = 목적지별 주 방문(왕복) 횟수, hubMode = 목적지별 이동수단, bike = 자전거를 독립 이동수단으로 씀(가중치 bike)
 *  + 상권·공공시설(도서관) 반경 2배(상권 500→1,000m, 도서관 거리 기준표 2배) */
export type Preference = { weights: Weights; weekly: Record<string, number>; hubMode?: Record<string, HubMode>; bike?: boolean; lifestyle?: string; lifeCustom?: Record<string, Weights> }

/** 라이프스타일(10-14): 교통평점 카드 ⚙ 에서 수단 가중치 숫자 대신 고른다. 고르면 가중치·자전거 사용이 정해진다.
 *  비율은 설정 창 "세부설정"에서 라이프스타일마다 바꿀 수 있다(pref.lifeCustom[id], 기본값 단추로 되돌림). */
export type Lifestyle = { id: string; emoji: string; label: string; note: string; weights: Weights; bike: boolean }
export const LIFESTYLES: Lifestyle[] = [
  { id: 'transit', emoji: '🚇', label: '대중교통 출퇴근', note: '차 없이 버스·지하철로 다님', weights: { transit: 95, car: 5, walk: 0, bike: 0 }, bike: false },
  { id: 'car', emoji: '🚗', label: '자차 출퇴근', note: '주로 내 차로 다님', weights: { transit: 5, car: 90, walk: 5, bike: 0 }, bike: false },
  { id: 'walk', emoji: '🚶', label: '걸어서 동네 생활', note: '가까운 곳은 걸어감, 먼 곳만 대중교통', weights: { transit: 20, car: 0, walk: 80, bike: 0 }, bike: false },
  { id: 'bike', emoji: '🚲', label: '자전거 생활', note: '자전거로 다니고 비 오면 대중교통', weights: { transit: 10, car: 0, walk: 10, bike: 80 }, bike: true },
]
export const lifestyleOf = (p: Pick<Preference, 'lifestyle'>) => LIFESTYLES.find((l) => l.id === p.lifestyle) ?? null
/** 라이프스타일의 지금 비율 = 세부설정에서 바꾼 값, 없으면 기본 */
export const lifestyleWeights = (p: Pick<Preference, 'lifeCustom'>, l: Lifestyle): Weights => ({ ...l.weights, ...p.lifeCustom?.[l.id] })
export const applyLifestyle = (p: Preference, id: string): Preference => {
  const l = LIFESTYLES.find((x) => x.id === id) ?? LIFESTYLES[0]
  return { ...p, lifestyle: l.id, weights: lifestyleWeights(p, l), bike: l.bike }
}
/** 세부설정: 지금 고른 라이프스타일의 비율을 바꾼다(라이프스타일이 없으면 가중치만) */
export const setLifestyleWeights = (p: Preference, w: Weights): Preference => {
  const l = lifestyleOf(p)
  return l ? { ...p, weights: w, lifeCustom: { ...p.lifeCustom, [l.id]: w } } : { ...p, weights: w }
}

/** 교통 선호도 기본값: 수단별 가중치(합이 100이 아니어도 비율로 쓴다)와 목적지별 주 방문 횟수(학교 주 5회 · 본가 월 4회 = 주 1회). */
export const DEFAULT_PREFERENCE: Preference = {
  weights: { transit: 95, car: 5, walk: 0, bike: 0 }, // = 라이프스타일 "대중교통 출퇴근"(첫 항목, 10-14 골고루 삭제)
  weekly: { h1: 5, h2: 1 },
  lifestyle: 'transit',
}
export const MODE_KEYS: ModeKey[] = ['transit', 'car', 'walk', 'bike']
/** 지금 쓰는 수단(자전거는 켰을 때만) */
export const activeModes = (p: Pick<Preference, 'bike'>): ModeKey[] => (p.bike ? MODE_KEYS : ['transit', 'car', 'walk'])
/** "주 5회" · "주 1회(월 4회)" · "격주(주 0.5회)" */
export function weeklyText(n: number): string {
  if (n === 0) return '안 감'
  const w = Number.isInteger(n) ? String(n) : n.toFixed(1)
  return n < 1 ? `월 ${Math.round(n * WEEKS_PER_MONTH * 10) / 10}회` : `주 ${w}회`
}

/** 가중치를 합 100 기준 비율(정수)로. 합이 100을 넘거나 모자라도 비율만 본다(반올림 차이는 큰 나머지 순으로 맞춤). 합 0 이면 똑같이.
 *  keys = 지금 쓰는 수단(자전거를 끄면 자전거는 0) */
export function weightShares(w: Weights, keys: ModeKey[] = ['transit', 'car', 'walk']): Weights {
  const sum = keys.reduce((a, k) => a + Math.max(0, w[k] ?? 0), 0)
  const raw = keys.map((k) => (sum > 0 ? (Math.max(0, w[k] ?? 0) * 100) / sum : 100 / keys.length))
  const out = raw.map(Math.floor)
  const order = raw.map((x, i) => ({ r: x - Math.floor(x), i })).sort((a, b) => b.r - a.r)
  for (let k = 0; k < 100 - out.reduce((a, b) => a + b, 0); k++) out[order[k].i]++
  const res: Weights = { transit: 0, car: 0, walk: 0, bike: 0 }
  keys.forEach((k, i) => { res[k] = out[i] })
  return res
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
