// 후보지별 비교 양옆의 추천 카드(추후 광고 자리). 지금은 "예시" 항목.
// 실제 광고가 들어오면 이 목록만 바꾸면 된다(가까운 후보지는 좌표로 자동 계산). 사진은 tools/location-compare/public/rec/ (정사각형, 빌드 때 그대로 복사).
import { distanceKm } from './scoring'
import type { Candidate } from './data'
import type { Deal, PropertyUse } from './brokerage'

/** 사진 주소(배포 경로 /location-compare/ 아래) */
export const recImg = (file: string) => `${import.meta.env.BASE_URL}rec/${file}`

/** 왼쪽: 부동산 매물. 누르면 중개업자 소개 창이 화면 가운데에 열린다. 금액은 만원. */
export type Listing = {
  id: string; title: string; lat: number; lng: number
  use: PropertyUse // 주택 · 주거용 오피스텔 · 상가·기타 → 주거용/상가용, 중개수수료 요율
  deal: Deal // 지금 예시는 모두 임대차
  deposit: number; rent: number; maint?: number // 보증금 · 월세 · 관리비(월)
  desc: string // 한두 줄 설명
  points: string[] // 특장점(짧게)
  image?: string
  agent: { office: string; intro: string; phone?: string; image?: string }
}

/** 오른쪽: 카페·식당. 누르면 네이버지도 검색. 지도에도 ☕ 핀으로 표시한다. */
export type Spot = {
  id: string; name: string; kind: '카페' | '식당'; lat: number; lng: number; address: string
  keywords: string[] // 특징·장점 키워드
  query: string // 네이버지도 검색어
  image?: string
}

const AGENT = { office: '예시 공인중개사사무소', intro: '광고 준비 중인 자리입니다. 실제 중개사무소 소개와 매물 사진이 들어갑니다.' }

export const LISTINGS: Listing[] = [
  {
    id: 'l1', title: '예시 매물 · 원룸', lat: 37.2489, lng: 127.0571, use: 'other', deal: 'lease', deposit: 1000, rent: 50, maint: 7,
    desc: '창이 넓어 볕이 잘 드는 원룸. 창가에 화분과 작은 테이블을 두기 좋다.', points: ['채광 좋음', '역 가까움', '풀옵션'],
    image: recImg('listing-1.jpg'), agent: AGENT,
  },
  {
    id: 'l2', title: '예시 매물 · 분리형 원룸', lat: 37.2372, lng: 127.0756, use: 'home', deal: 'lease', deposit: 3000, rent: 45, maint: 10,
    desc: '창가 테이블 자리와 잠자리가 나뉘는 분리형. 학교까지 걸어서 다닐 수 있다.', points: ['학교 도보권', '분리형', '주차 가능'],
    agent: AGENT,
  },
  {
    id: 'l3', title: '예시 매물 · 원룸', lat: 37.2431, lng: 127.0631, use: 'home', deal: 'lease', deposit: 500, rent: 55, maint: 5,
    desc: '엘리베이터 있는 신축 원룸.', points: ['풀옵션', '엘리베이터'], agent: AGENT,
  },
  {
    id: 'l4', title: '예시 매물 · 오피스텔', lat: 37.2534, lng: 127.0778, use: 'officetel', deal: 'lease', deposit: 2000, rent: 60, maint: 12,
    desc: '역 앞 주거용 오피스텔(전용 85㎡ 이하·부엌·욕실).', points: ['역세권', '보안 우수', '신축'], agent: AGENT,
  },
  {
    id: 'l5', title: '예시 매물 · 1층 상가', lat: 37.2367, lng: 127.0771, use: 'other', deal: 'lease', deposit: 3000, rent: 150, maint: 15,
    desc: '대학가 길가 1층 소형 상가(카페·공방 자리).', points: ['1층', '대학가', '유동인구'], agent: AGENT,
  },
]

// 카페: 사용자가 찍은 사진의 실제 가게(후보지 바로 옆은 아니지만 가까운 지역). 주소·좌표는 네이버 지역 검색(2026-10-13).
export const SPOTS: Spot[] = [
  { id: 's1', name: 'AQUI', kind: '카페', lat: 37.247042, lng: 127.0416014, address: '수원시 영통구 권선로882번길 107-48 1층', keywords: ['스테인드글라스 창', '식물', '넓은 홀'], query: 'AQUI 수원 영통', image: recImg('cafe-aqui.jpg') },
  { id: 's2', name: '온커피로스터스', kind: '카페', lat: 37.2145843, lng: 127.0949101, address: '화성시 동탄구 동탄기흥로 614 124호', keywords: ['로스터리', '창가 자리', '작업하기 좋음'], query: '온커피로스터스 동탄', image: recImg('cafe-oncoffee.jpg') },
  { id: 's3', name: '슬로우제이커피공장', kind: '카페', lat: 37.2121476, lng: 127.169766, address: '용인시 처인구 이동읍 백자로 127-1', keywords: ['로스터리', '큰 창', '스탠드 조명'], query: '슬로우제이커피공장', image: recImg('cafe-slowj.jpg') },
  { id: 's4', name: '눜커피', kind: '카페', lat: 37.3327121, lng: 127.1000821, address: '용인시 수지구 문인로31번길 3-14 1층', keywords: ['에스프레소', '동네 카페'], query: '눜커피 수지', image: recImg('cafe-nuk.jpg') },
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
