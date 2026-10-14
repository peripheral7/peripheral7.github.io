// 지도 위 덧그림(입지 요인을 펼쳤을 때): 평화로움 소음 구분도 · 길고양이 사진 말풍선. 네이버·OSM 두 지도가 같이 쓴다.
import type { ZoneCell } from './places'
import { t } from './i18n'

// ── 평화로움 구분도 ──
// places.mjs 가 후보지 반경 50m 를 5m 칸으로(places-config.json peace.zones) 나눠 단계(1~6)를 매긴다. 칸을 위경도 네모로 바꿔 단계 색으로 칠한다(테두리 없음).
export const ZONE_STYLE: Record<number, { color: string; alpha: number; label: string }> = {
  // 도로 색은 차로 수(사용자 지정 10-14): 8차선 이상 빨강 · 6차선 주황 · 4차선(중로) 노랑. 상가는 보라
  1: { color: '#d63b2f', alpha: 0.42, label: t('8차선 이상 바로 옆', 'right by 8+ lanes') },
  2: { color: '#d63b2f', alpha: 0.18, label: t('8차선 이상 40m 안', 'within 40 m of 8+ lanes') },
  3: { color: '#ef8a2c', alpha: 0.42, label: t('6차선 바로 옆', 'right by 6 lanes') },
  4: { color: '#ef8a2c', alpha: 0.2, label: t('6차선 30m 안', 'within 30 m of 6 lanes') },
  5: { color: '#e8c21a', alpha: 0.45, label: t('4차선(중로) 바로 옆', 'right by 4 lanes') },
  6: { color: '#e8c21a', alpha: 0.22, label: t('4차선 22m 안', 'within 22 m of 4 lanes') },
  7: { color: '#8f6cc4', alpha: 0.3, label: t('상가 밀집', 'dense shops') },
  8: { color: '#8f6cc4', alpha: 0.13, label: t('상가 있음', 'some shops') },
}
/** radiusM = 칠하는 반경(점선 원), calcM = 평화로움 계산 반경(실선 원) */
export type Zones = { lat: number; lng: number; step: number; cells: ZoneCell[]; radiusM: number; calcM: number }
export type ZoneRect = { s: number; w: number; n: number; e: number; k: number }
export function zoneRects(z: Zones): ZoneRect[] {
  const dLat = z.step / 110540, dLng = z.step / (111320 * Math.cos((z.lat * Math.PI) / 180))
  return z.cells.map(([i, j, k]) => {
    const la = z.lat + j * dLat, ln = z.lng + i * dLng
    return { s: la - dLat / 2, n: la + dLat / 2, w: ln - dLng / 2, e: ln + dLng / 2, k }
  })
}

// ── 길고양이 사진 말풍선 ──
// 고양이 위치(점)에서 선을 그어 작은 사진 네모를 띄운다. 30m 안에 모인 고양이는 한 무리로 묶고, 무리 사진이 3장 이상이면
// 네모 안에서 사진이 차례로 넘어간다(슬라이드). 네모끼리 겹치지 않게, 화면 픽셀로 바꿔 8방향 중 비어 있는 쪽을 고른다.
export type CatPin = { lat: number; lng: number; name: string; photos: string[]; start: number } // start = 갤러리에서 첫 사진 순서
export type CatCallout = { lat: number; lng: number; dx: number; dy: number; photos: string[]; name: string; start: number; count: number }
export const CAT_GROUP_M = 30
export const CAT_BOX = 54 // 네모 크기(px)
const LEN = 62 // 점에서 네모 가운데까지(px)
const DIRS = [[1, -1], [-1, -1], [1, 1], [-1, 1], [0, -1.3], [1.3, 0], [0, 1.3], [-1.3, 0]] // 오른쪽 위부터

const meters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot((a.lat - b.lat) * 110540, (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180))

export function catCallouts(pins: CatPin[], zoom: number): CatCallout[] {
  // 1) 30m 안끼리 묶기(먼저 온 고양이 기준)
  const groups: { lat: number; lng: number; items: CatPin[] }[] = []
  for (const p of pins) {
    const g = groups.find((x) => meters(x, p) <= CAT_GROUP_M)
    if (g) { g.items.push(p); g.lat = g.items.reduce((a, q) => a + q.lat, 0) / g.items.length; g.lng = g.items.reduce((a, q) => a + q.lng, 0) / g.items.length }
    else groups.push({ lat: p.lat, lng: p.lng, items: [p] })
  }
  // 2) 화면 픽셀(웹 메르카토르)로 바꿔 네모 자리 고르기
  const scale = (256 * 2 ** zoom) / 360
  const px = (g: { lat: number; lng: number }) => ({ x: g.lng * scale, y: -Math.log(Math.tan(Math.PI / 4 + (g.lat * Math.PI) / 360)) * (scale * 180 / Math.PI) })
  const placed: { x: number; y: number }[] = []
  const anchors = groups.map(px)
  const half = CAT_BOX / 2 + 4
  return groups.map((g, gi) => {
    const a = anchors[gi]
    let best = DIRS[0], bestHit = Infinity
    for (const d of DIRS) {
      const c = { x: a.x + d[0] * LEN * 0.75, y: a.y + d[1] * LEN * 0.75 }
      const hit = placed.filter((b) => Math.abs(b.x - c.x) < half * 2 && Math.abs(b.y - c.y) < half * 2).length * 10
        + anchors.filter((b, bi) => bi !== gi && Math.abs(b.x - c.x) < half && Math.abs(b.y - c.y) < half).length
      if (hit < bestHit) { best = d; bestHit = hit }
      if (hit === 0) break
    }
    const dx = Math.round(best[0] * LEN * 0.75), dy = Math.round(best[1] * LEN * 0.75)
    placed.push({ x: a.x + dx, y: a.y + dy })
    const photos = g.items.flatMap((p) => p.photos)
    return { lat: g.lat, lng: g.lng, dx, dy, photos, name: g.items.map((p) => p.name).filter(Boolean).join(' · ') || t('길고양이', 'Street cat'), start: g.items[0].start, count: g.items.length }
  })
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
/** 말풍선 HTML: 점 + 선(SVG) + 사진 네모(3장 이상이면 CSS 슬라이드). 기준점(0,0) = 고양이 무리 위치. */
export function catCalloutHtml(c: CatCallout): string {
  const slide = c.photos.length >= 3
  const n = c.photos.length
  // 슬라이드: 첫 사진만 보이고(.on), startCatSlides 가 2.4초마다 다음 사진으로 넘긴다
  const imgs = c.photos.map((src, i) => `<img data-pin-nopin="true" src="${src}" alt=""${i === 0 ? ' class="on"' : ''}>`).join('')
  const L = Math.max(Math.abs(c.dx), Math.abs(c.dy)) + CAT_BOX
  return `<div class="cat-callout" data-start="${c.start}" title="${esc(c.name)} — ${t('눌러서 크게 보기', 'click to enlarge')}">`
    + `<svg class="cat-leader" width="${L * 2}" height="${L * 2}" style="left:${-L}px;top:${-L}px" aria-hidden><line x1="${L}" y1="${L}" x2="${L + c.dx}" y2="${L + c.dy}" /></svg>`
    + `<span class="cat-dot"></span>`
    + `<span class="cat-box${slide ? ' slide' : ''}" style="left:${c.dx - CAT_BOX / 2}px;top:${c.dy - CAT_BOX / 2}px">${imgs}${n > 1 ? `<b>${n}</b>` : ''}</span>`
    + `</div>`
}

/** 지도 안 슬라이드 말풍선(.cat-box.slide)의 사진을 2.4초마다 넘긴다. 돌려준 함수로 멈춘다. */
export function startCatSlides(root: HTMLElement): () => void {
  const t = window.setInterval(() => {
    root.querySelectorAll<HTMLElement>('.cat-box.slide').forEach((box) => {
      const imgs = [...box.querySelectorAll('img')]
      const i = imgs.findIndex((x) => x.classList.contains('on'))
      imgs[i]?.classList.remove('on')
      imgs[(i + 1) % imgs.length]?.classList.add('on')
    })
  }, 2400)
  return () => window.clearInterval(t)
}
