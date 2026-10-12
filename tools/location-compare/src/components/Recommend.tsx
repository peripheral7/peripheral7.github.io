import { useEffect, useState } from 'react'
import type { Candidate } from '../data'
import { LISTINGS, SPOTS, meters, naverMapUrl, nearest, type Listing } from '../recommend'

// 후보지별 비교 양옆의 추천 카드(추후 광고). 이미지는 정사각형 빈 칸으로 둔다.
// 왼쪽 매물을 누르면 중개업자 소개 창이 지도 가운데에 지도 절반 크기로 열리고(배경은 20% 어둡게), 배경을 누르거나 Esc 로 닫는다.
// 오른쪽 카페·식당을 누르면 네이버지도 검색이 새 탭으로 열린다.

const Thumb = ({ src, alt }: { src?: string; alt: string }) => (
  <span className="rec-img" aria-hidden={!src}>{src && <img src={src} alt={alt} loading="lazy" />}</span>
)

const Near = ({ p, candidates }: { p: { lat: number; lng: number }; candidates: Candidate[] }) => {
  const n = nearest(p, candidates)
  return n ? <small className="rec-near">📍 {n.name} {meters(n.m)}</small> : null
}

export function ListingCards({ candidates }: { candidates: Candidate[] }) {
  const [open, setOpen] = useState<Listing | null>(null)
  return (
    <aside className="side-card side-left panel" aria-label="추천 매물">
      <div className="panel-head"><h2>추천 매물</h2><span className="soon">광고</span></div>
      {LISTINGS.map((x) => (
        <button type="button" key={x.id} className="rec-item" onClick={() => setOpen(x)}>
          <Thumb src={x.image} alt={x.title} />
          <span className="rec-text">
            <b>{x.title}</b>
            <span className="rec-price">{x.price}<small>만원</small></span>
            <Near p={x} candidates={candidates} />
            <span className="rec-tags">{x.points.map((t) => <i key={t}>{t}</i>)}</span>
          </span>
        </button>
      ))}
      {open && <AgentDialog x={open} candidates={candidates} onClose={() => setOpen(null)} />}
    </aside>
  )
}

export function SpotCards({ candidates }: { candidates: Candidate[] }) {
  return (
    <aside className="side-card side-right panel" aria-label="근처 카페·식당">
      <div className="panel-head"><h2>근처 카페·식당</h2><span className="soon">광고</span></div>
      {SPOTS.map((x) => (
        <a key={x.id} className="rec-item" href={naverMapUrl(x.query)} target="_blank" rel="noopener noreferrer">
          <Thumb src={x.image} alt={x.name} />
          <span className="rec-text">
            <b>{x.name}</b>
            <small className="rec-kind">{x.kind}</small>
            <Near p={x} candidates={candidates} />
            <span className="rec-tags">{x.keywords.map((t) => <i key={t}>{t}</i>)}</span>
          </span>
        </a>
      ))}
    </aside>
  )
}

/** 지도 가운데에, 지도 절반 크기로(좁은 화면은 화면 가운데 거의 꽉) */
function AgentDialog({ x, candidates, onClose }: { x: Listing; candidates: Candidate[]; onClose: () => void }) {
  const [box, setBox] = useState<React.CSSProperties>({})
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const m = document.querySelector('.map-area')?.getBoundingClientRect()
    if (m && window.innerWidth > 900) setBox({ left: m.left + m.width / 2, top: m.top + m.height / 2, width: Math.max(360, m.width / 2), height: Math.max(320, m.height / 2) })
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="rec-overlay" onClick={onClose}>
      <section className="rec-dialog" style={box} role="dialog" aria-modal="true" aria-label={`${x.agent.office} 소개`} onClick={(e) => e.stopPropagation()}>
        <div className="rec-dialog-head">
          <div><small>부동산 소개</small><h2>{x.agent.office}</h2></div>
          <button className="close" aria-label="닫기" onClick={onClose}>×</button>
        </div>
        <div className="rec-dialog-body">
          <Thumb src={x.image} alt={x.title} />
          <div className="rec-text">
            <b>{x.title}</b>
            <span className="rec-price">{x.price}<small>만원</small></span>
            <Near p={x} candidates={candidates} />
            <span className="rec-tags">{x.points.map((t) => <i key={t}>{t}</i>)}</span>
            <p>{x.agent.intro}</p>
            {x.agent.phone && <a className="solid rec-call" href={`tel:${x.agent.phone}`}>전화 {x.agent.phone}</a>}
          </div>
        </div>
      </section>
    </div>
  )
}
