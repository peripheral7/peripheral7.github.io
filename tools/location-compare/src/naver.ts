// 네이버 지도·검색 연결. 키는 빌드할 때 tools/location-compare/.env.local 에서 읽는다(git 에 안 올라감, README 10절).
//
// - VITE_NAVER_MAP_KEY_ID   네이버 클라우드 Maps 의 Client ID. 지도 JS 는 브라우저에서 이 값으로 인증하므로 "공개될 수밖에 없는 값"이고,
//                           네이버 콘솔에 등록한 웹 서비스 URL(peripheral7.github.io, localhost)에서만 동작한다. Secret 은 절대 넣지 않는다.
// - VITE_PLACE_SEARCH_URL   장소 검색 중계(Cloudflare Worker, workers/place-search) 주소. Secret 은 Worker 에만 있다.
// - VITE_TURNSTILE_SITEKEY  (선택) Cloudflare Turnstile 사람 확인 — Worker 가 TURNSTILE_SECRET 을 가지면 필수.
// 셋 다 비어 있으면: 지도는 OSM 밝은 지도, 검색은 꺼진다.
import type { Place } from './data'

export const MAP_KEY_ID = (import.meta.env.VITE_NAVER_MAP_KEY_ID as string | undefined) || ''
export const SEARCH_URL = (import.meta.env.VITE_PLACE_SEARCH_URL as string | undefined) || ''
export const TURNSTILE_SITEKEY = (import.meta.env.VITE_TURNSTILE_SITEKEY as string | undefined) || ''

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { naver?: any; turnstile?: any; navermap_authFailure?: () => void } }

const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  const s = document.createElement('script')
  s.src = src
  s.async = true
  s.onload = () => resolve()
  s.onerror = () => { s.remove(); reject(new Error('load ' + src)) }
  document.head.appendChild(s)
})

let mapsLoading: Promise<any> | null = null
let authFailed = false
const authListeners = new Set<() => void>()
/** 인증 실패(등록 안 된 주소·잘못된 키)는 스크립트를 불러온 "뒤에" 알려 온다 → 지도가 OSM 으로 바꿀 수 있게 알린다. */
export function onNaverAuthFailure(cb: () => void): () => void {
  if (authFailed) cb()
  authListeners.add(cb)
  return () => authListeners.delete(cb)
}
/** 네이버 지도 JS(지오코더 포함)를 한 번만 불러온다. 키가 없거나 인증이 실패하면 거절. */
export function loadNaverMaps(): Promise<any> {
  if (!MAP_KEY_ID || authFailed) return Promise.reject(new Error('no key'))
  return (mapsLoading ??= new Promise((resolve, reject) => {
    window.navermap_authFailure = () => { authFailed = true; reject(new Error('naver auth failure')); authListeners.forEach((f) => f()) }
    loadScript(`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(MAP_KEY_ID)}&submodules=geocoder`)
      .then(() => (window.naver?.maps ? resolve(window.naver) : reject(new Error('naver maps missing'))), reject)
  }))
}

/** 주소 검색(네이버 지도 JS 의 지오코더 — 브라우저에서 Client ID 로 동작, Secret 불필요). */
async function geocode(query: string): Promise<Place[]> {
  const naver = await loadNaverMaps()
  return new Promise((resolve) => {
    naver.maps.Service.geocode({ query }, (status: number, response: any) => {
      if (status !== naver.maps.Service.Status.OK) return resolve([])
      const list = response?.v2?.addresses ?? []
      resolve(list.slice(0, 5).map((a: any) => {
        const building = (a.addressElements ?? []).find((e: any) => e.types?.includes('BUILDING_NAME'))?.longName
        const road = a.roadAddress || a.jibunAddress
        const address = building && road.endsWith(building) ? road.slice(0, -building.length).trim() : road
        return { name: building || address, address, lat: Number(a.y), lng: Number(a.x), category: '주소' }
      }))
    })
  })
}

// ── Turnstile(선택): 검색할 때마다 새 토큰을 받는다(토큰은 한 번만 쓸 수 있음) ──
let turnstileBox: HTMLDivElement | null = null
let turnstileId: string | null = null
async function turnstileToken(): Promise<string> {
  if (!TURNSTILE_SITEKEY) return ''
  if (!window.turnstile) await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')
  if (!turnstileBox) {
    turnstileBox = document.createElement('div')
    turnstileBox.className = 'turnstile-box'
    document.body.appendChild(turnstileBox)
  }
  return new Promise((resolve, reject) => {
    if (turnstileId) window.turnstile.remove(turnstileId)
    turnstileId = window.turnstile.render(turnstileBox, {
      sitekey: TURNSTILE_SITEKEY, size: 'flexible', appearance: 'interaction-only',
      callback: (token: string) => resolve(token), 'error-callback': () => reject(new Error('turnstile')),
    })
  })
}

/** 장소 검색(아파트·학교 이름 등) — Worker 가 네이버 지역 검색을 대신 부른다. */
async function searchPlaces(query: string): Promise<Place[]> {
  const token = await turnstileToken()
  const res = await fetch(`${SEARCH_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(query)}`, {
    headers: token ? { 'X-Turnstile-Token': token } : {},
  })
  if (res.status === 429) throw new Error('잠시 뒤 다시 검색해 주세요(검색 횟수 제한).')
  if (res.status === 503) throw new Error('오늘 검색 한도를 다 썼습니다. 내일 다시 이용해 주세요.')
  if (!res.ok) throw new Error('검색에 실패했습니다.')
  const body = await res.json()
  return (body.items ?? []) as Place[]
}

export const searchAvailable = () => Boolean(SEARCH_URL || (MAP_KEY_ID && !authFailed))
/** 장소 이름(아파트·학교) 검색까지 되는지 — 아니면 주소 검색만 된다 */
export const placeSearchAvailable = () => Boolean(SEARCH_URL)

// ── 띄어쓰기 너그럽게 ────────────────────────────────────────────────
// 네이버 검색·지오코더는 띄어쓰기에 민감하다("영통로200번길124-16", "망포역 래미안"↔"망포역래미안").
// 1) 검색 전에 공백을 하나로 줄이고, 2) 결과가 없을 때만 띄어쓰기를 고친 검색어로 한 번 더 찾는다
//    (장소 검색은 Worker 사용량 제한이 있어서 처음부터 여러 번 부르지 않는다).

/** 앞뒤 공백 제거 + 연속 공백을 하나로 */
export const normalizeQuery = (q: string) => q.replace(/\s+/g, ' ').trim()

const PROVINCE = /^((?:서울|부산|대구|인천|광주|대전|울산)(?:특별시|광역시)?|세종(?:특별자치시)?|경기도?|강원(?:특별자치)?도?|충청[남북]도|충[남북]|전라[남북]도|전[남북]|전북특별자치도|경상[남북]도|경[남북]|제주(?:특별자치)?도?)(?=[가-힣])/
/** 주소처럼 보이나: 시도 이름으로 시작하거나, "○○로/길/번길/동" 뒤에 숫자가 붙어 있다 — 장소 이름은 건드리지 않으려고 */
const looksLikeAddress = (q: string) => PROVINCE.test(q.replace(/\s+/g, '')) || /[가-힣](?:로|길|동|리)\s?\d/.test(q)

/** 붙여 쓴 주소에 띄어쓰기 넣기: 시도·시·군·구 사이, "○○로/길" 뒤 건물번호, "○○번길" 뒤 번호, "○○동/리/가" 뒤 지번. 주소처럼 안 보이면 그대로. */
export function spaceAddress(q: string): string {
  if (!looksLikeAddress(q)) return q
  return normalizeQuery(q
    .replace(PROVINCE, '$1 ') // 경기도수원시 → 경기도 수원시
    .replace(/([가-힣]{1,4}시)(?=[가-힣]{1,4}[구군](?![가-힣]))/g, '$1 ') // 수원시영통구 → 수원시 영통구
    .replace(/([가-힣]{1,4}[시군구])(?=[가-힣]{1,8}(?:로|길|동|읍|면|리)(?:\d|\s|$))/g, '$1 ') // 영통구신원로 → 영통구 신원로
    .replace(/(\d+번길)(?=\d)/g, '$1 ') // 신원로136번길16 → 신원로136번길 16
    .replace(/([가-힣](?:로|길))(?=\d+(?:-\d+)?(?![\d-]*번길))/g, '$1 ') // 덕영대로1732 → 덕영대로 1732(번길 앞 숫자는 그대로)
    .replace(/([가-힣](?:동|리|가))(?=\d+(?:-\d+)?(?:\s|$))/g, '$1 ')) // 영통동123-4 → 영통동 123-4
}

/** 결과가 없을 때 한 번 더 찾아볼 검색어(원래와 다를 때만, 없으면 null).
 *  주소처럼 보이면 띄어쓰기를 넣은 주소. 장소 이름이면: 띄어 썼으면 붙여서, 붙여 썼으면 "○○역"·"○○대학교" 뒤를 띄워서. */
export function retryQuery(q: string): string | null {
  if (looksLikeAddress(q)) {
    const spaced = spaceAddress(q)
    return spaced !== q ? spaced : null
  }
  const other = /\s/.test(q) ? q.replace(/\s+/g, '') : normalizeQuery(q.replace(/([가-힣]{1,6}(?:역|대학교))(?=[가-힣]{2,})/g, '$1 '))
  return other !== q && other.length >= 2 ? other : null
}

/** 검색창 하나로: 장소(Worker) + 주소(지오코더) 결과를 합친다. 같은 좌표는 하나만. 아무것도 없으면 띄어쓰기를 고쳐 한 번 더. */
export async function search(raw: string): Promise<{ places: Place[]; errors: string[] }> {
  const query = normalizeQuery(raw)
  const first = await searchOnce(query)
  const again = first.places.length ? null : retryQuery(query)
  return again ? searchOnce(again) : first
}

async function searchOnce(query: string): Promise<{ places: Place[]; errors: string[] }> {
  const jobs: Promise<Place[]>[] = []
  if (SEARCH_URL) jobs.push(searchPlaces(query))
  if (MAP_KEY_ID && !authFailed) jobs.push(geocode(query))
  const settled = await Promise.allSettled(jobs)
  const places: Place[] = []
  const errors: string[] = []
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      for (const p of s.value) {
        if (Number.isFinite(p.lat) && Number.isFinite(p.lng) && !places.some((q) => Math.abs(q.lat - p.lat) < 1e-5 && Math.abs(q.lng - p.lng) < 1e-5)) places.push(p)
      }
    } else errors.push(s.reason?.message || '검색 실패')
  }
  return { places, errors }
}

// ── 좌표 → 주소(지도 우클릭 등록) ─────────────────────────────────────
// 1) 네이버 지도 JS 역지오코더 — 도로명 주소·건물 이름까지. NCP 앱에서 "Reverse Geocoding" 을 켜야 동작(2026-10-13 지금은 꺼져 있어 403).
// 2) 안 되면 OpenStreetMap Nominatim(키 없음, 브라우저에서 바로) — 동·구 정도만 나와 "부근"으로 표시(rough).
//    브이월드 주소 API 는 정확하지만 키가 브라우저에 드러나고, Cloudflare Worker 에서 부르면 브이월드가 막는다(520).
// 3) 둘 다 안 되면 null(위경도로 표시). 같은 좌표(약 1m)는 한 번만 묻는다.
export type RevAddr = { address: string; building?: string; rough?: boolean }
const revCache = new Map<string, Promise<RevAddr | null>>()
export function reverseGeocode(lat: number, lng: number): Promise<RevAddr | null> {
  const k = `${lat.toFixed(5)},${lng.toFixed(5)}`
  let p = revCache.get(k)
  if (!p) {
    p = naverReverse(lat, lng).then((a) => a ?? osmReverse(lat, lng))
    revCache.set(k, p)
  }
  return p
}
async function osmReverse(lat: number, lng: number): Promise<RevAddr | null> {
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000)
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=ko&zoom=18&addressdetails=1`, { signal: ctl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const a = (await r.json()).address ?? {}
    const parts = [a.province, a.city, a.borough, a.quarter || a.suburb || a.neighbourhood || a.village, a.road, a.house_number].filter(Boolean)
    return parts.length >= 2 ? { address: `${parts.join(' ')}${a.house_number ? '' : ' 부근'}`, rough: !a.house_number } : null
  } catch { return null }
}
async function naverReverse(lat: number, lng: number): Promise<RevAddr | null> {
  try {
    const naver = await loadNaverMaps()
    return await new Promise((resolve) => {
      const t = setTimeout(() => resolve(null), 2500)
      naver.maps.Service.reverseGeocode({ coords: new naver.maps.LatLng(lat, lng), orders: 'roadaddr,addr' }, (status: number, response: any) => {
        clearTimeout(t)
        if (status !== naver.maps.Service.Status.OK) return resolve(null)
        const v2 = response?.v2
        const road = v2?.results?.find((r: any) => r.name === 'roadaddr')
        const building = road?.land?.addition0?.value || undefined
        const address = v2?.address?.roadAddress || v2?.address?.jibunAddress || ''
        resolve(address ? { address, building } : null)
      })
    })
  } catch { return null }
}
