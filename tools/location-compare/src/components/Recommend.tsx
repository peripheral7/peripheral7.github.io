import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { won, type Candidate } from '../data'
import { brokerageFee, feeText, useGroup, USE_LABEL } from '../brokerage'
import { LISTINGS, SPOTS, meters, naverMapUrl, nearest, type Listing } from '../recommend'
import { addr, isEn, manEn, pn, t } from '../i18n'

// 후보지별 비교 양옆의 추천 카드(추후 광고). 이미지는 정사각형 빈 칸으로 둔다.
// 왼쪽 매물을 누르면 중개업자 소개 창이 화면 정가운데에 지도의 3/4 크기로 열리고(배경은 20% 어둡게), 배경을 누르거나 Esc 로 닫는다.
// 오른쪽 카페·식당을 누르면 네이버지도 검색이 새 탭으로 열린다.

const Thumb = ({ src, alt }: { src?: string; alt: string }) => (
  <span className="rec-img" aria-hidden={!src}>{src && <img data-pin-nopin="true" src={src} alt={alt} loading="lazy" />}</span>
)

const Near = ({ p, candidates }: { p: { lat: number; lng: number }; candidates: Candidate[] }) => {
  const n = nearest(p, candidates)
  return n ? <small className="rec-near">📍 {pn(n.name)} {meters(n.m)}</small> : null
}

// 보증금/월세 · 관리비 한 줄(만원)
const money = (x: Listing) => (isEn ? `${won(x.deposit)} / ${manEn(x.rent)}` : `${won(x.deposit)} / ${x.rent}`)
const Fee = ({ x }: { x: Listing }) => {
  const f = brokerageFee(x.use, x.deal, x)
  return <small className="rec-fee" title={`${f.formula} · ${f.basis} · ${t('부가세 별도', 'VAT excluded')}`}>{t('중개수수료 최대', 'Broker fee up to')} {feeText(f.fee)}</small>
}

export function ListingCards({ candidates }: { candidates: Candidate[] }) {
  const [open, setOpen] = useState<Listing | null>(null)
  return (
    <aside className="side-card side-left panel" aria-label={t('추천 매물', 'Featured listings')}>
      <div className="panel-head"><h2>{t('추천 매물', 'Featured listings')}</h2><span className="soon">{t('광고', 'Ad')}</span></div>
      {LISTINGS.map((x) => (
        <button type="button" key={x.id} className="rec-item" onClick={() => setOpen(x)}>
          <Thumb src={x.image} alt={x.title} />
          <span className="rec-text">
            <b>{x.title} <em className={`rec-use ${x.use === 'other' ? 'shop' : ''}`}>{useGroup(x.use)}</em></b>
            <span className="rec-price">{money(x)}{isEn ? null : <small>만원</small>}{x.maint ? <small>{t(` · 관리비 ${x.maint}`, ` · maint. ${manEn(x.maint)}`)}</small> : null}</span>
            <Fee x={x} />
            <Near p={x} candidates={candidates} />
            <span className="rec-tags">{x.points.map((t) => <i key={t}>{t}</i>)}</span>
          </span>
        </button>
      ))}
      {open && <AgentDialog x={open} candidates={candidates} onClose={() => setOpen(null)} />}
    </aside>
  )
}

/** flash = 지도에서 누른 카페(그 카드 배경을 잠깐 강조하고, 화면 밖이면 부드럽게 그 카드까지 — 휴대폰에서 주로) */
export function SpotCards({ candidates, flash }: { candidates: Candidate[]; flash?: { id: string; n: number } | null }) {
  const [lit, setLit] = useState<string | null>(null)
  useEffect(() => {
    if (!flash) return
    setLit(null)
    const el = document.querySelector<HTMLElement>(`[data-spot="${flash.id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const a = requestAnimationFrame(() => setLit(flash.id)) // 같은 카드를 다시 눌러도 다시 켜지게 한 박자 뒤
    const t = setTimeout(() => setLit(null), 1600)
    return () => { cancelAnimationFrame(a); clearTimeout(t) }
  }, [flash])
  return (
    <aside className="side-card panel" aria-label={t('근처 카페·식당', 'Nearby cafés & restaurants')}>
      <div className="panel-head"><h2>{t('근처 카페·식당', 'Nearby cafés & restaurants')}</h2><span className="soon">{t('광고', 'Ad')}</span></div>
      {SPOTS.map((x) => (
        <a key={x.id} data-spot={x.id} className={'rec-item' + (lit === x.id ? ' flash' : '')} href={naverMapUrl(x.query)} target="_blank" rel="noopener noreferrer">
          <Thumb src={x.image} alt={x.name} />
          <span className="rec-text">
            <b>{pn(x.name)}</b>
            <small className="rec-kind">{x.kind === '카페' ? t('카페', 'Café') : t('식당', 'Restaurant')} · {addr(x.address)}</small>
            <Near p={x} candidates={candidates} />
            <span className="rec-tags">{x.keywords.map((t) => <i key={t}>{t}</i>)}</span>
          </span>
        </a>
      ))}
    </aside>
  )
}

/** 화면(보이는 창) 정가운데에, 지도 크기의 3/4 로(창보다 크면 창에 맞춤). 페이지 어디서 눌러도 같은 자리.
 *  body 에 바로 붙여서(portal) 부모의 배치·스크롤에 영향받지 않는다. 창이 열려 있어도 뒤 페이지는 스크롤된다(창은 제자리).
 *  창 안은 스크롤(스크롤바 숨김), 창 안에서 끝까지 굴려도 뒤 페이지로 넘어가지 않는다(overscroll-behavior: contain). */
function AgentDialog({ x, candidates, onClose }: { x: Listing; candidates: Candidate[]; onClose: () => void }) {
  const [size, setSize] = useState<React.CSSProperties>({})
  useEffect(() => {
    const fit = () => {
      const m = document.querySelector('.map-area')?.getBoundingClientRect()
      if (!m) return setSize({})
      setSize({ width: Math.min(window.innerWidth * 0.92, Math.max(340, m.width * 0.75)), height: Math.min(window.innerHeight * 0.9, Math.max(320, m.height * 0.75)) })
    }
    fit()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', fit)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit) }
  }, [onClose])
  return createPortal(
    <div className="rec-overlay" onClick={onClose}>
      <section className="rec-dialog" style={size} role="dialog" aria-modal="true" aria-label={t(`${x.agent.office} 소개`, `About ${x.agent.office}`)} onClick={(e) => e.stopPropagation()}>
        <div className="rec-dialog-head">
          <div><small>{t('부동산 소개', 'Real estate agency')}</small><h2>{x.agent.office}</h2></div>
          <button className="close" aria-label={t('닫기', 'Close')} onClick={onClose}>×</button>
        </div>
        <div className="rec-dialog-body">
          <Thumb src={x.image} alt={x.title} />
          <div className="rec-text">
            <b>{x.title} <em className={`rec-use ${x.use === 'other' ? 'shop' : ''}`}>{useGroup(x.use)}</em></b>
            <p className="rec-desc">{x.desc}</p>
            <Near p={x} candidates={candidates} />
            <span className="rec-tags">{x.points.map((t) => <i key={t}>{t}</i>)}</span>
            <FeeTable x={x} />
            <p>{x.agent.intro}</p>
            {x.agent.phone && <a className="solid rec-call" href={`tel:${x.agent.phone}`}>{t('전화', 'Call')} {x.agent.phone}</a>}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}

/** 소개 창의 금액표: 용도 · 보증금/월세 · 관리비 · 월 부담 · 예상 중개수수료(상한, 한쪽 몫) */
function FeeTable({ x }: { x: Listing }) {
  const f = brokerageFee(x.use, x.deal, x)
  return (
    <dl className="rec-money">
      <dt>{t('용도', 'Use')}</dt><dd>{USE_LABEL[x.use]} ({useGroup(x.use)})</dd>
      <dt>{t('보증금 / 월세', 'Deposit / rent')}</dt><dd>{money(x)}{t('만원', '')}</dd>
      <dt>{t('관리비', 'Maint. fee')}</dt><dd>{x.maint ? t(`월 ${x.maint}만원`, `${manEn(x.maint)}/month`) : t('없음·미입력', 'none / not given')}</dd>
      <dt>{t('월 부담', 'Monthly total')}</dt><dd>{t(`월세 + 관리비 = ${x.rent + (x.maint ?? 0)}만원`, `rent + maint. = ${manEn(x.rent + (x.maint ?? 0))}`)}</dd>
      <dt>{t('예상 중개수수료', 'Est. broker fee')}</dt><dd><b>{t('최대', 'up to')} {feeText(f.fee)}</b> <small>({t('부가세 별도', 'VAT excluded')} {feeText(f.vat)})</small><small className="rec-formula">{f.formula} · {f.basis}</small></dd>
    </dl>
  )
}
