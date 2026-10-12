// 후보지별 비교 양옆의 추천 카드(추후 광고 자리). 지금은 자리를 보여 주는 "예시" 항목만 있고 이미지는 비워 둔다.
// 실제 광고가 들어오면 이 목록만 바꾸면 된다(가까운 후보지는 좌표로 자동 계산).
import { distanceKm } from './scoring'
import type { Candidate } from './data'

/** 왼쪽: 부동산 매물. 누르면 중개업자 소개 창이 지도 가운데에 열린다. */
export type Listing = {
  id: string; title: string; price: string; lat: number; lng: number
  points: string[] // 특장점(짧게)
  image?: string // 정사각형 이미지 주소(없으면 빈 칸)
  agent: { office: string; intro: string; phone?: string; image?: string }
}

/** 오른쪽: 근처 카페·식당. 누르면 네이버지도 검색으로 간다. */
export type Spot = {
  id: string; name: string; kind: '카페' | '식당'; lat: number; lng: number
  keywords: string[] // 특징·장점 키워드
  query: string // 네이버지도 검색어
  image?: string
}

export const LISTINGS: Listing[] = [
  {
    id: 'l1', title: '예시 매물 · 원룸', price: '1,000 / 50', lat: 37.2489, lng: 127.0571,
    points: ['역 가까움', '신축', '풀옵션'],
    agent: { office: '예시 공인중개사사무소', intro: '광고 준비 중인 자리입니다. 실제 중개사무소 소개와 매물 사진이 들어갑니다.' },
  },
  {
    id: 'l2', title: '예시 매물 · 투룸', price: '3,000 / 45', lat: 37.2372, lng: 127.0756,
    points: ['학교 도보권', '주차 가능'],
    agent: { office: '예시 부동산', intro: '광고 준비 중인 자리입니다. 실제 중개사무소 소개와 매물 사진이 들어갑니다.' },
  },
]

export const SPOTS: Spot[] = [
  { id: 's1', name: '망포역 카페 (예시)', kind: '카페', lat: 37.2455, lng: 127.0575, keywords: ['조용함', '콘센트', '늦게까지'], query: '망포역 카페' },
  { id: 's2', name: '영통역 식당 (예시)', kind: '식당', lat: 37.2519, lng: 127.0713, keywords: ['혼밥', '가성비'], query: '영통역 맛집' },
]

/** 가장 가까운 후보지와 거리(m) */
export function nearest(p: { lat: number; lng: number }, candidates: Candidate[]): { name: string; m: number } | null {
  let best: { name: string; m: number } | null = null
  for (const c of candidates) {
    const m = distanceKm(p, c) * 1000
    if (!best || m < best.m) best = { name: c.name, m }
  }
  return best
}

export const meters = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m / 10) * 10}m`)
export const naverMapUrl = (query: string) => `https://map.naver.com/p/search/${encodeURIComponent(query)}`
