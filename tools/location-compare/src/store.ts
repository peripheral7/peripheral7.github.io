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

export function addCandidate(s: State, place: Place): State {
  return { ...s, candidates: [...s.candidates, { id: newId('c'), name: place.name, address: place.address, lat: place.lat, lng: place.lng }] }
}

/** 목적지로 넣기. 이미 2곳이면 replaceId 자리를 바꾼다. */
export function setHub(s: State, place: Place, replaceId?: string): State {
  const hub: Hub = { id: newId('h'), name: place.name, category: place.category && place.category !== '주소' ? shortCategory(place.category) : '목적지', address: place.address, lat: place.lat, lng: place.lng }
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

/** 후보지 이름 바꾸기(빈 이름이면 그대로 둔다). */
export function renameCandidate(s: State, id: string, name: string): State {
  const n = name.trim().slice(0, 40)
  if (!n) return s
  return { ...s, candidates: s.candidates.map((c) => (c.id === id ? { ...c, name: n } : c)) }
}
