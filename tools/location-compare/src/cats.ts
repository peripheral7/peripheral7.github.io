// 길고양이 지수: 후보지 반경 300m 안에서 마주칠 수 있는 길고양이가 많을수록 높아지는 지수(0~10점).
// 고양이는 방문자가 "현장에서" 사진과 함께 등록한다. 서버가 아직 없어서 등록 내용은 이 브라우저에만 저장되고,
// 다른 사람과 합치는 업로드는 꺼져 있다(UPLOAD_ENABLED). 계산 방식은 README "길고양이 지수"와 GuidePanel 에 같은 내용으로 적는다.
import { distanceKm } from './scoring'
import { t } from './i18n'

export const CAT_RADIUS_M = 300 // 후보지에서 이 거리 안의 고양이만 센다
export const PHOTO_VALID_DAYS = 60 // 사진 유효 기간(약 2달)
export const FIELD_RADIUS_M = 100 // 현장 등록: 내 위치와 고양이를 본 곳이 이 거리 안이어야 한다(위치는 내 현재 위치로 고정)
export const UPLOAD_ENABLED = false // 서버가 생기면 켠다(사진·정보를 서버에 올려 다른 사용자와 합침)
export const PHOTO_MAX_SIDE = 1280 // 사진 긴 변이 이보다 크면 줄인다
export const PHOTO_QUALITY = 0.82
const DAY = 86_400_000

export const TIME_SLOTS = ['새벽', '아침', '낮', '저녁', '밤'] as const

export type CatPhoto = { user: string; at: number; data: string } // data = 줄인 JPEG data URL
export type Cat = {
  id: string; lat: number; lng: number
  name: string // 모르면 빈 글자
  times: string[] // 출몰 시간대(TIME_SLOTS 중)
  traits: string // 특징(털색·성격 등)
  photos: CatPhoto[] // 사용자 한 명당 한 장
}
export type CatState = { cats: Cat[]; user: string; on: boolean } // on = 길고양이 지수를 목록에 넣었는가

const KEY = 'locCompare.cats.v1'
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function loadCats(): CatState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && Array.isArray(s.cats)) return { cats: s.cats, user: typeof s.user === 'string' && s.user ? s.user : newId(), on: !!s.on }
  } catch { /* 저장소를 못 쓰거나 깨졌으면 비어 있는 상태 */ }
  return { cats: [], user: newId(), on: false }
}

/** 저장. 사진이 많아 용량이 넘치면 false. */
export function saveCats(s: CatState): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true } catch { return false }
}

export const validPhoto = (p: CatPhoto, now = Date.now()) => now - p.at < PHOTO_VALID_DAYS * DAY
export const daysLeft = (p: CatPhoto, now = Date.now()) => Math.max(0, Math.ceil((p.at + PHOTO_VALID_DAYS * DAY - now) / DAY))
export const livePhotos = (c: Cat, now = Date.now()) => c.photos.filter((p) => validPhoto(p, now))

/** 사진이 한 장도 유효하지 않은 고양이는 없는 것으로 본다. */
export const liveCats = (cats: Cat[], now = Date.now()) => cats.filter((c) => livePhotos(c, now).length > 0)

export const metersBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => distanceKm(a, b) * 1000

/** 이 사용자가 이 고양이 사진을 이미 올렸는가(고양이 하나당 한 사람 한 장) */
export const hasMyPhoto = (c: Cat, user: string, now = Date.now()) => livePhotos(c, now).some((p) => p.user === user)

// ── 지수 계산 ─────────────────────────────────────────────────────────
// 반경 300m 안 고양이 수 n(사진이 유효한 고양이만), 참여자 수 u(그 고양이들에 유효한 사진을 올린 서로 다른 사용자):
//   n = 0            → 0점
//   n = 1            → 4점
//   n = 2·3·4        → 4 → 8점 (한 마리당 4/3점)
//   n ≥ 4 에서        → 8점 + 다양한 참여 가산(참여자 2명부터 1명당 0.5점, 최대 +2) → 최대 10점
export const CAT_BASE = 4
export const CAT_FOUR = 8
export const CAT_MAX = 10
export const CAT_USER_STEP = 0.5

export type CatIndex = { score: number; n: number; users: number; cats: Cat[]; photos: number; nextHint: string }

export function catScore(n: number, users: number): number {
  if (n <= 0) return 0
  const base = CAT_BASE + ((Math.min(n, 4) - 1) * (CAT_FOUR - CAT_BASE)) / 3
  if (n < 4) return base
  return Math.min(CAT_MAX, CAT_FOUR + Math.max(0, users - 1) * CAT_USER_STEP)
}

export function catIndex(at: { lat: number; lng: number }, cats: Cat[], now = Date.now()): CatIndex {
  const near = liveCats(cats, now).filter((c) => metersBetween(at, c) <= CAT_RADIUS_M)
  const users = new Set(near.flatMap((c) => livePhotos(c, now).map((p) => p.user))).size
  const photos = near.reduce((a, c) => a + livePhotos(c, now).length, 0)
  const n = near.length
  const nextHint = n === 0 ? t('고양이 1마리 → 4점', '1 cat → 4 pts') : n < 4 ? t(`${n + 1}마리 → ${fmt1(catScore(n + 1, users))}점`, `${n + 1} cats → ${fmt1(catScore(n + 1, users))} pts`) : users < 5 ? t('다양한 사용자 참여 → 최대 10점', 'more contributors → up to 10 pts') : ''
  return { score: catScore(n, users), n, users, cats: near, photos, nextHint }
}
const fmt1 = (x: number) => (Math.round(x * 10) / 10).toString()

// ── 사진 줄이기 ───────────────────────────────────────────────────────
// 긴 변이 PHOTO_MAX_SIDE 를 넘으면 그 크기로 줄여 JPEG(품질 0.82)로 다시 저장한다. 작은 사진은 크기를 그대로 두고 JPEG 로만 바꾼다.
// 휴대폰 사진의 회전 정보(EXIF)는 createImageBitmap 이 반영해 준다. 이 과정에서 위치 정보(EXIF GPS)는 지워진다.
export async function shrinkPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
  const k = Math.min(1, PHOTO_MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k))
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const ctx = cv.getContext('2d')
  if (!ctx) throw new Error(t('이 브라우저에서는 사진을 줄일 수 없습니다.', 'This browser cannot resize photos.'))
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return cv.toDataURL('image/jpeg', PHOTO_QUALITY)
}

// ── 등록 ──────────────────────────────────────────────────────────────
export type CatInput = { name: string; times: string[]; traits: string }

/** 새 고양이를 현재 위치에 등록(사진 한 장 포함). */
export function addCat(s: CatState, at: { lat: number; lng: number }, input: CatInput, data: string, now = Date.now()): CatState {
  const cat: Cat = { id: newId(), lat: at.lat, lng: at.lng, name: input.name.trim().slice(0, 20), times: input.times, traits: input.traits.trim().slice(0, 80), photos: [{ user: s.user, at: now, data }] }
  return { ...s, cats: [...s.cats, cat] }
}

/** 이미 등록된 고양이에 내 사진을 더한다(내 사진이 유효하게 있으면 거부). 출몰 시간대는 합친다. */
export function addPhotoToCat(s: CatState, id: string, input: CatInput, data: string, now = Date.now()): CatState | null {
  const cat = s.cats.find((c) => c.id === id)
  if (!cat || hasMyPhoto(cat, s.user, now)) return null
  const next: Cat = {
    ...cat,
    times: [...new Set([...cat.times, ...input.times])],
    traits: cat.traits || input.traits.trim().slice(0, 80),
    photos: [...cat.photos.filter((p) => validPhoto(p, now)), { user: s.user, at: now, data }],
  }
  return { ...s, cats: s.cats.map((c) => (c.id === id ? next : c)) }
}

export const removeMyPhoto = (s: CatState, id: string): CatState => ({
  ...s, cats: s.cats.map((c) => (c.id === id ? { ...c, photos: c.photos.filter((p) => p.user !== s.user) } : c)).filter((c) => c.photos.length > 0),
})

/** 만료된 사진을 저장소에서도 치운다(앱을 열 때 한 번). */
export function pruneCats(s: CatState, now = Date.now()): CatState {
  const cats = s.cats.map((c) => ({ ...c, photos: c.photos.filter((p) => validPhoto(p, now)) })).filter((c) => c.photos.length > 0)
  return cats.length === s.cats.length && cats.every((c, i) => c.photos.length === s.cats[i].photos.length) ? s : { ...s, cats }
}
