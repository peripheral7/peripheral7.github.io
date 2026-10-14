// 방문자가 바꾼 후보지·목적지·선호도를 이 브라우저(localStorage)에 저장한다. 다른 사람에게는 안 보인다.
import { CANDIDATES, DEFAULT_PREFERENCE, LIFESTYLES, MAX_HUBS, MAX_WEEKLY, OLD_DEFAULT_NAMES, PROFILES, applyLifestyle, defaultWeekly, profileOf, type Candidate, type Hub, type HubMode, type Place, type Preference, type Weights } from './data'

export type State = { candidates: Candidate[]; hubs: Hub[]; pref: Preference }

const KEY = 'locCompare.v3'
const OLD_PREF_KEY = 'locCompare.v2' // 2판은 선호도만 저장했다

// 사용자(위쪽 탭, data.ts PROFILES)마다 따로 저장한다. 'me' 는 예전 열쇠 그대로(locCompare.v3), 시험용은 locCompare.v3.<id>
const keyOf = (user: string) => (user === 'me' ? KEY : `${KEY}.${user}`)
const USER_KEY = 'locCompare.user'
export function loadUser(): string {
  try { const u = localStorage.getItem(USER_KEY); if (u && PROFILES.some((p) => p.id === u)) return u } catch { /* 기본 */ }
  return 'me'
}
export function saveUser(user: string) { try { localStorage.setItem(USER_KEY, user) } catch { /* 저장 못 해도 동작 */ } }

export const defaults = (user = 'me'): State => {
  const p = profileOf(user)
  const pref = structuredClone(DEFAULT_PREFERENCE)
  if (p.id !== 'me') pref.weekly = Object.fromEntries(p.hubs.map((h) => [h.id, defaultWeekly(h.category)]))
  return { candidates: p.candidates.map((c) => ({ ...c })), hubs: p.hubs.map((h) => ({ ...h })), pref }
}

const isPoint = (x: any) => x && typeof x.id === 'string' && typeof x.name === 'string' && Number.isFinite(x.lat) && Number.isFinite(x.lng) // eslint-disable-line @typescript-eslint/no-explicit-any

// 저장된 후보지 정리: 옛 분류 칸은 버리고, 금액은 숫자로, 이름을 안 바꾼 기본 후보지는 새 이름·좌표로
function migrate({ category: _c, ...c }: any): Candidate { // eslint-disable-line @typescript-eslint/no-explicit-any
  const d = CANDIDATES.find((x) => x.id === c.id)
  const renamed = d && OLD_DEFAULT_NAMES[c.id] === c.name ? { name: d.name, lat: d.lat, lng: d.lng } : {}
  return { ...c, ...renamed, deposit: money(c.deposit), rent: money(c.rent) }
}

// 라이프스타일을 골라 둔 저장값은 그 라이프스타일의 지금 비율(10-14 새 항목 비율 + 세부설정)로 다시 맞춘다.
// 라이프스타일 이전(숫자로 정한) 가중치는 그대로 두고 '직접 정한 값'으로
function loadPref(sp: any, base: Preference, weekly: Record<string, number>, hubMode: Record<string, HubMode>): Preference { // eslint-disable-line @typescript-eslint/no-explicit-any
  const lifeCustom: Record<string, Weights> = {}
  for (const [id, w] of Object.entries(sp.lifeCustom ?? {})) if (w && typeof w === 'object') lifeCustom[id] = { transit: 0, car: 0, walk: 0, bike: 0, ...(w as Weights) }
  // 10-14: 없어진 "골고루"(balanced)를 골라 둔 저장값은 기본 라이프스타일로
  const life = sp.lifestyle === 'balanced' ? base.lifestyle : typeof sp.lifestyle === 'string' ? sp.lifestyle : undefined
  const p: Preference = { weights: { ...base.weights, ...sp.weights }, weekly, hubMode, bike: !!sp.bike, lifestyle: life, lifeCustom }
  return p.lifestyle && LIFESTYLES.some((l) => l.id === p.lifestyle) ? applyLifestyle(p, p.lifestyle) : p
}

export function load(user = 'me'): State {
  const base = defaults(user)
  try {
    const saved = JSON.parse(localStorage.getItem(keyOf(user)) || 'null')
    if (saved && Array.isArray(saved.candidates) && Array.isArray(saved.hubs) && saved.pref?.weights) {
      const hubs: Hub[] = saved.hubs.filter(isPoint).slice(0, MAX_HUBS)
      // 10-14: 월 왕복 → 주 방문 횟수. 옛 저장값(trips)은 단위가 달라 옮기지 않고 분류별 기본값(학교·직장 주 5 · 본가 주 1)으로
      const weekly = saved.pref.weekly && typeof saved.pref.weekly === 'object' ? { ...saved.pref.weekly } : Object.fromEntries(hubs.map((h) => [h.id, defaultWeekly(h.category)]))
      // 10-14: "대중교통 이용" 체크(transitUse) → 목적지별 이동수단(hubMode)
      const hubMode: Record<string, HubMode> = { ...saved.pref.hubMode }
      for (const [id, on] of Object.entries(saved.pref.transitUse ?? {})) if (on && !hubMode[id]) hubMode[id] = 'transit'
      return {
        candidates: saved.candidates.filter(isPoint).map(migrate),
        hubs,
        pref: loadPref(saved.pref, base.pref, weekly, hubMode),
      }
    }
    const old = user === 'me' ? JSON.parse(localStorage.getItem(OLD_PREF_KEY) || 'null') : null
    if (old?.weights) base.pref = { ...base.pref, weights: { ...base.pref.weights, ...old.weights } }
  } catch { /* 저장소를 못 쓰거나 깨졌으면 기본값 */ }
  return base
}

export function save(state: State, user = 'me') {
  try { localStorage.setItem(keyOf(user), JSON.stringify(state)) } catch { /* 저장 못 해도 화면은 동작 */ }
}

const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

/** 보증금·월세 입력값 정리: 빈 칸·음수·숫자가 아니면 없음(undefined), 만원 단위 정수 */
export const money = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, ''))
  return String(v ?? '').trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined
}

export function addCandidate(s: State, place: Place, name?: string, deposit?: number, rent?: number, maint?: number): State {
  const c: Candidate = { id: newId('c'), name: (name || place.name).trim().slice(0, 40), address: place.address, lat: place.lat, lng: place.lng, deposit, rent, maint }
  return { ...s, candidates: [...s.candidates, c] }
}

/** 목적지로 넣기. 이미 꽉 찼으면(MAX_HUBS) replaceId 자리를 바꾼다. */
export function setHub(s: State, place: Place, replaceId?: string, name?: string, category?: string, weeklyN?: number): State {
  const hub: Hub = {
    id: newId('h'), name: (name || place.name).trim().slice(0, 40),
    category: category || (place.category && place.category !== '주소' ? shortCategory(place.category) : '목적지'),
    address: place.address, lat: place.lat, lng: place.lng,
  }
  const n = weeklyN ?? defaultWeekly(hub.category)
  const weekly = { ...s.pref.weekly, [hub.id]: Math.max(0, Math.min(MAX_WEEKLY, Math.round(n * 2) / 2)) }
  let hubs = s.hubs
  if (replaceId) {
    hubs = hubs.map((h) => (h.id === replaceId ? hub : h))
    delete weekly[replaceId]
  } else if (hubs.length < MAX_HUBS) hubs = [...hubs, hub]
  else return s
  const hubMode = { ...s.pref.hubMode }
  if (replaceId) delete hubMode[replaceId]
  return { ...s, hubs, pref: { ...s.pref, weekly, hubMode } }
}

export const removeCandidate = (s: State, id: string): State => ({ ...s, candidates: s.candidates.filter((c) => c.id !== id) })
export function removeHub(s: State, id: string): State {
  const weekly = { ...s.pref.weekly }
  delete weekly[id]
  const hubMode = { ...s.pref.hubMode }
  delete hubMode[id]
  return { ...s, hubs: s.hubs.filter((h) => h.id !== id), pref: { ...s.pref, weekly, hubMode } }
}

// 네이버 분류 "교육,학술>대학교" → "대학교"
const shortCategory = (c: string) => c.split('>').pop()!.trim().slice(0, 8)

/** 후보지 이름·보증금·월세·관리비·용도 고치기. 넘긴 칸만 바꾼다(빈 이름이면 이름은 그대로, 금액 칸을 undefined 로 넘기면 지운다). */
export function updateCandidate(s: State, id: string, patch: { name?: string; deposit?: number; rent?: number; maint?: number; use?: Candidate['use'] }): State {
  const name = patch.name?.trim().slice(0, 40)
  const money = { ...('deposit' in patch ? { deposit: patch.deposit } : {}), ...('rent' in patch ? { rent: patch.rent } : {}), ...('maint' in patch ? { maint: patch.maint } : {}), ...(patch.use ? { use: patch.use } : {}) }
  return { ...s, candidates: s.candidates.map((c) => (c.id === id ? { ...c, ...(name ? { name } : {}), ...money } : c)) }
}

/** 검색 결과의 네이버 분류로 목적지 분류를 짐작한다(등록 창의 기본값). */
export function guessHubCategory(place: Place): string {
  const t = `${place.category ?? ''} ${place.name}`
  if (/학교|대학|교육/.test(t)) return '학교'
  if (/회사|사무|오피스|산업|공단/.test(t)) return '직장'
  return '기타'
}
