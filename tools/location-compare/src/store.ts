// 방문자가 바꾼 후보지·목적지·선호도를 이 브라우저(localStorage)에 저장한다. 다른 사람에게는 안 보인다.
import { CANDIDATES, DEFAULT_PREFERENCE, HUBS, MAX_HUBS, NEW_HUB_TRIPS, type Candidate, type Hub, type Place, type Preference } from './data'

export type State = { candidates: Candidate[]; hubs: Hub[]; pref: Preference }

const KEY = 'locCompare.v3'
const OLD_PREF_KEY = 'locCompare.v2' // 2판은 선호도만 저장했다

export const defaults = (): State => ({ candidates: CANDIDATES.map((c) => ({ ...c })), hubs: HUBS.map((h) => ({ ...h })), pref: structuredClone(DEFAULT_PREFERENCE) })

const isPoint = (x: any) => x && typeof x.id === 'string' && typeof x.name === 'string' && Number.isFinite(x.lat) && Number.isFinite(x.lng) // eslint-disable-line @typescript-eslint/no-explicit-any

export function load(): State {
  const base = defaults()
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && Array.isArray(saved.candidates) && Array.isArray(saved.hubs) && saved.pref?.weights) {
      return {
        candidates: saved.candidates.filter(isPoint),
        hubs: saved.hubs.filter(isPoint).slice(0, MAX_HUBS),
        pref: { weights: { ...base.pref.weights, ...saved.pref.weights }, trips: { ...saved.pref.trips } },
      }
    }
    const old = JSON.parse(localStorage.getItem(OLD_PREF_KEY) || 'null')
    if (old?.weights) base.pref = { weights: { ...base.pref.weights, ...old.weights }, trips: { ...base.pref.trips, ...old.trips } }
  } catch { /* 저장소를 못 쓰거나 깨졌으면 기본값 */ }
  return base
}

export function save(state: State) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* 저장 못 해도 화면은 동작 */ }
}

const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

export function addCandidate(s: State, place: Place, name?: string, category?: string): State {
  const c: Candidate = { id: newId('c'), name: (name || place.name).trim().slice(0, 40), address: place.address, lat: place.lat, lng: place.lng, category }
  return { ...s, candidates: [...s.candidates, c] }
}

/** 목적지로 넣기. 이미 2곳이면 replaceId 자리를 바꾼다. */
export function setHub(s: State, place: Place, replaceId?: string, name?: string, category?: string): State {
  const hub: Hub = {
    id: newId('h'), name: (name || place.name).trim().slice(0, 40),
    category: category || (place.category && place.category !== '주소' ? shortCategory(place.category) : '목적지'),
    address: place.address, lat: place.lat, lng: place.lng,
  }
  const trips = { ...s.pref.trips, [hub.id]: NEW_HUB_TRIPS }
  let hubs = s.hubs
  if (replaceId) {
    hubs = hubs.map((h) => (h.id === replaceId ? hub : h))
    delete trips[replaceId]
  } else if (hubs.length < MAX_HUBS) hubs = [...hubs, hub]
  else return s
  return { ...s, hubs, pref: { ...s.pref, trips } }
}

export const removeCandidate = (s: State, id: string): State => ({ ...s, candidates: s.candidates.filter((c) => c.id !== id) })
export function removeHub(s: State, id: string): State {
  const trips = { ...s.pref.trips }
  delete trips[id]
  return { ...s, hubs: s.hubs.filter((h) => h.id !== id), pref: { ...s.pref, trips } }
}

// 네이버 분류 "교육,학술>대학교" → "대학교"
const shortCategory = (c: string) => c.split('>').pop()!.trim().slice(0, 8)

/** 후보지 이름·분류 고치기(빈 이름이면 이름은 그대로 둔다). */
export function updateCandidate(s: State, id: string, patch: { name?: string; category?: string }): State {
  const name = patch.name?.trim().slice(0, 40)
  return { ...s, candidates: s.candidates.map((c) => (c.id === id ? { ...c, ...(name ? { name } : {}), ...(patch.category !== undefined ? { category: patch.category || undefined } : {}) } : c)) }
}

/** 검색 결과의 네이버 분류로 목적지 분류를 짐작한다(등록 창의 기본값). */
export function guessHubCategory(place: Place): string {
  const t = `${place.category ?? ''} ${place.name}`
  if (/학교|대학|교육/.test(t)) return '학교'
  if (/역|터미널|정류장|교통|환승/.test(t)) return '교통센터'
  if (/병원|의원|의료/.test(t)) return '병원'
  if (/마트|백화점|쇼핑|상가|시장/.test(t)) return '상업시설'
  if (/회사|사무|오피스|산업|공단/.test(t)) return '직장'
  return '기타'
}
export function guessCandidateCategory(place: Place): string {
  const t = `${place.category ?? ''} ${place.name}`
  if (/아파트|자이|래미안|힐스테이트|푸르지오|e편한|아이파크|더샵|롯데캐슬/.test(t)) return '아파트'
  if (/오피스텔/.test(t)) return '오피스텔'
  if (/빌라|다세대|연립/.test(t)) return '빌라·다세대'
  return '기타'
}
