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

/** 검색창 하나로: 장소(Worker) + 주소(지오코더) 결과를 합친다. 같은 좌표는 하나만. */
export async function search(query: string): Promise<{ places: Place[]; errors: string[] }> {
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
