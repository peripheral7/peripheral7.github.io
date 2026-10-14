// 화면 언어(한국어 · 영어 — 외국인 유학생용). 머리 줄 KO/EN 단추로 바꾼다.
// - 언어는 페이지를 열 때 한 번 정한다: 주소 ?lang=en|ko → 이 브라우저 저장값(locCompare.lang) → 한국어.
//   바꾸면 저장하고 페이지를 다시 연다(reload) — 모듈 상수(LIFESTYLES·MODE_INFO 등)와 지도 마커 글자까지 한 번에 바뀌게.
// - 화면 글자는 `t('한국어', 'English')` 로 두 언어를 나란히 적는다(새 글자를 넣을 때 영어도 반드시 함께 — DEV-GUIDE.md).
// - 저장되는 값(후보지·목적지 이름, 목적지 분류, 길고양이 시간대 등)은 한국어 그대로 두고, 보일 때만 바꾼다:
//   고유명사 = pn(), 주소 = addr(), 목적지 분류 = catName() (romanize.ts — 사전에 없으면 국어의 로마자 표기법으로).
import { romanAddress, romanName, CATEGORY_EN } from './romanize.ts'

export type Lang = 'ko' | 'en'
const KEY = 'locCompare.lang'

function detect(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (q === 'en' || q === 'ko') { try { localStorage.setItem(KEY, q) } catch { /* 주소 값만으로도 동작 */ } return q }
    const s = localStorage.getItem(KEY)
    if (s === 'en' || s === 'ko') return s
  } catch { /* 저장소를 못 쓰면 기본 */ }
  return 'ko'
}

export const LANG: Lang = detect()
export const isEn = LANG === 'en'
// Node 에서 이 파일을 읽는 스크립트(scripts/*.mjs → data.ts → i18n.ts)도 있어 document 가 없을 수 있다. 그래서 import 도 './romanize.ts' 처럼 확장자를 붙인다.
if (typeof document !== 'undefined') {
  document.documentElement.lang = LANG
  if (LANG === 'en') document.title = 'WhereTo? — compare places to live'
}

/** 화면 글자: 한국어와 영어를 나란히 적고 지금 언어 것을 쓴다 */
export const t = (ko: string, en: string) => (isEn ? en : ko)

/** 언어 바꾸기 — 저장하고 다시 연다. 저장이 안 되는 브라우저는 주소(?lang=)로 넘긴다. */
export function setLang(l: Lang) {
  if (l === LANG) return
  const url = new URL(location.href)
  let saved = false
  try { localStorage.setItem(KEY, l); saved = localStorage.getItem(KEY) === l } catch { /* 주소로 */ }
  if (saved) url.searchParams.delete('lang')
  else url.searchParams.set('lang', l)
  location.replace(url.toString())
}

/** 고유명사(후보지·목적지·매장·공원·도서관·정류장 이름) — 영어 화면에서만 사전/로마자로 */
export const pn = (s: string) => (isEn && s ? romanName(s) : s)
/** 주소 — 영어 화면에서는 "16 Sinwon-ro 136beon-gil, Yeongtong-gu, Suwon-si, Gyeonggi-do" 순서로 */
export const addr = (s: string) => (isEn && s ? romanAddress(s) : s)
/** 목적지 분류(학교·본가·직장·기타 …, 사용자가 직접 넣은 분류는 로마자) */
export const catName = (c: string) => (isEn && c ? CATEGORY_EN[c] ?? romanName(c) : c)

/** n분 → "12분" · "12 min" */
export const mins = (n: number | string) => (isEn ? `${n} min` : `${n}분`)
/** 순위 → "1위" · "#1" */
export const rankText = (n: number) => (isEn ? `#${n}` : `${n}위`)
/** 원(₩) 금액 → "93,000원" · "₩93,000" */
export const krw = (v: number) => (isEn ? `₩${v.toLocaleString('en-US')}` : `${v.toLocaleString('ko-KR')}원`)
/** 만원 단위 금액 → 영어 화면은 "₩10M" · "₩500K"(1만원 = ₩10K) */
export function manEn(v: number): string {
  const won = v * 10000
  const trim = (x: number) => String(Math.round(x * 100) / 100)
  return won >= 1_000_000 ? `₩${trim(won / 1_000_000)}M` : `₩${trim(won / 1000)}K`
}
/** 입력 칸 단위(만원) */
export const MAN_UNIT = t('만원', '×₩10K')
