import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { fmt, WALK_LIMIT, BIKE_LIMIT, WALK_ZONE, slotDone, type CandidateResult, type CarSlot, type HubResult } from '../scoring'
import { BASE_DEPOSIT, baseRent, hubEmoji, weeklyText, won, type Candidate, type Hub, type ModeKey } from '../data'
import { brokerageFee, feeText, useGroup } from '../brokerage'
import { CATEGORIES, type CommercialIndex } from '../commercial'
import { SLOT_TEXT, liveNote } from '../live'
import { placeOf } from '../places'

// 아래쪽: 후보지 카드를 가로로 늘어놓는다. 모든 카드가 같은 줄(행)을 공유해서(CSS subgrid)
// "대중교통" 줄을 옆으로 읽으면 후보지끼리 대기·역까지 도보·환승을, "차량" 줄은 출퇴근/낮 차이를 바로 비교할 수 있다.
// 높이는 목적지 2곳 기준으로 고정한다(목적지가 1곳이어도 같은 높이 — 옆 광고 카드도 같은 높이). 목적지가 3곳이면 카드 안을
// 세로로 스크롤하고(스크롤바는 숨김), 모든 카드가 한 스크롤 상자 안에 있어 같이 움직인다. 맨 위 후보지 줄은 붙어 있다.

type Props = { results: CandidateResult[]; com: CommercialIndex[] | null; hubs: Hub[]; active: number; bike: boolean; onSelect: (index: number) => void; onRename: (id: string, name: string) => void }

// 점수(0~10)만큼 칸 아래쪽에 색 선을 채운다 — 숫자를 읽지 않아도 길이로 바로 비교된다.
const Line = ({ v, kind }: { v: number; kind: 'total' | 'hub' | ModeKey | 'com' }) => (
  <i className={`score-line ${kind}`} style={{ '--v': Math.max(0, Math.min(10, v)) / 10 } as React.CSSProperties} aria-hidden />
)

// 보증금/월세(만원) + 연한 글씨로 "보증금 1,000 기준 월 ○○만원" — 보증금이 달라도 월세를 한 기준으로 비교
// + 관리비 · 월 합계(월세 + 관리비) · 예상 중개수수료(법정 상한, 한쪽 몫, 부가세 별도 — brokerage.ts)
function RentCell({ c, sect }: { c: Candidate; sect?: boolean }) {
  const b = baseRent(c)
  if (b === null) return <div className={"cell rent-cell" + (sect ? " sect" : "")}><span className="muted">미입력 · 수정에서 입력</span></div>
  const use = c.use ?? 'home'
  const f = brokerageFee(use, 'lease', c)
  return (
    <div className={"cell rent-cell" + (sect ? " sect" : "")}>
      <b>{won(c.deposit ?? 0)} / {c.rent ?? 0}<small>만원</small>{c.maint ? <small> · 관리비 {c.maint}</small> : null}</b>
      <small className="faint">보증금 {won(BASE_DEPOSIT)} 기준 월 {b}만원{c.maint ? ` · 월 합계 ${(c.rent ?? 0) + c.maint}만원` : ''}</small>
      <small className="faint" title={`${f.formula} · ${f.basis} · 부가세 별도`}>{useGroup(use)} · 중개수수료 최대 {feeText(f.fee)}</small>
    </div>
  )
}

// 상권 종합: 지수 + 필수 업종의 도보 5분 안 개수(선호는 연하게)
function ComCell({ x, best, c }: { x: CommercialIndex | undefined; best: boolean; c: Candidate }) {
  if (x === undefined) return <div className="cell mode-cell"><div><span className="muted">입지 요인 ⚙ 에서 켜면 표시</span></div></div>
  if (x === null) return <div className="cell mode-cell"><div><span className="muted">상권 {liveNote(c)}</span></div></div>
  // 고른 업종(필수 → 선호)을 이름·개수로 보이고, 업종 점수가 5점 이상이면 초록색
  const items = (t: 'need' | 'want') => x.parts.filter((p) => p.tier === t).map((p) => (
    <span key={p.id} className={p.score >= 5 ? 'com-ok' : undefined}>{CATEGORIES.find((c) => c.id === p.id)?.label} {p.count}</span>
  ))
  const join = (a: ReactNode[]) => a.flatMap((e, i) => (i ? [' · ', e] : [e]))
  const need = items('need'), want = items('want')
  return (
    <div className="cell mode-cell">
      <div><b>{join(need.length ? need : want)}</b>{need.length > 0 && want.length > 0 && <small>선호 {join(want)}</small>}</div>
      <em className={best ? 'best' : ''}>{fmt(x.score)}<Line v={x.score} kind="com" /></em>
    </div>
  )
}

// 차량 시간대 표시: 두 기준 시각 평균이면 "실측", 하나뿐이면 "1회", 등록 때 잰 임시 값이면 "등록 시각", 없으면 "추정"
const slotTag = (s: CarSlot | null) => (!s ? '(추정)' : slotDone(s) ? '' : s.provisional ? '(등록 시각)' : '(1회)')
function carNote(h: HubResult): string {
  const { free, rush } = h.trip.carSource
  if (slotDone(free) && slotDone(rush)) return '네이버 실측(기준 시각 평균)'
  const todo = [!slotDone(rush) && `출퇴근 ${SLOT_TEXT.rush}`, !slotDone(free) && `낮 ${SLOT_TEXT.free}`].filter(Boolean).join(' · ')
  return `실측 예정: ${todo}`
}

// 카드가 일부라도 가려져 있으면, 카드 전체가 보이도록 가로 스크롤을 가장 가까운 끝까지만 움직인다
function reveal(card: HTMLElement) {
  const box = card.closest<HTMLElement>('.cards-scroll')
  if (!box) return
  const c = card.getBoundingClientRect(), b = box.getBoundingClientRect()
  const lw = box.querySelector('.labels')?.getBoundingClientRect().width ?? 0 // 왼쪽 고정 열에 가려지는 폭
  const left = b.left + lw + 10
  const dx = c.left < left ? c.left - left : c.right > b.right ? c.right - b.right : 0
  if (dx) box.scrollBy({ left: dx, behavior: 'smooth' })
}

export const FIXED_HUBS = 2 // 카드 높이 기준 목적지 수

export function CompareCards({ results, com, hubs, active, bike, onSelect, onRename }: Props) {
  const [naming, setNaming] = useState<{ id: string; name: string } | null>(null) // 카드에서 이름 바꾸는 중
  const finish = (save: boolean) => { if (save && naming) onRename(naming.id, naming.name); setNaming(null) }
  const modes: ModeKey[] = bike ? ['transit', 'car', 'walk', 'bike'] : ['transit', 'car', 'walk']
  const per = 1 + modes.length // 목적지마다 줄 수(목적지 줄 + 수단 줄)
  const rows = 1 + hubs.length * per + 2 // 후보지 · 목적지마다 · 보증금/월세 · 상권 종합
  const best = (pick: (r: CandidateResult) => number | null) => Math.max(...results.map((r) => pick(r) ?? -1))
  const isBest = (v: number | null, b: number) => v !== null && Math.abs(v - b) < 1e-9 && results.length > 1
  const used = (h: HubResult, m: ModeKey) => h.used.includes(m)

  // 높이 고정: 왼쪽 줄 이름 열의 칸 높이(= 줄 높이)로 "후보지 줄 + 목적지 2곳 + 보증금 + 상권" 높이를 재서 스크롤 상자 높이로
  const scroll = useRef<HTMLDivElement>(null)
  const [fixedH, setFixedH] = useState<number | null>(null)
  useLayoutEffect(() => {
    const box = scroll.current, labels = box?.querySelector('.labels')
    if (!box || !labels) return
    const measure = () => {
      const cells = [...labels.children] as HTMLElement[]
      const h = (i: number) => cells[i]?.offsetHeight ?? 0
      const block = hubs.length ? cells.slice(1, 1 + per).reduce((a, el) => a + el.offsetHeight, 0) : per * 46
      let sum = h(0) + h(cells.length - 2) + h(cells.length - 1)
      for (let k = 0; k < FIXED_HUBS; k++) sum += k < hubs.length ? cells.slice(1 + k * per, 1 + (k + 1) * per).reduce((a, el) => a + el.offsetHeight, 0) : block
      setFixedH(Math.ceil(sum) + 6)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(labels)
    return () => ro.disconnect()
  }, [hubs.length, per, results.length])

  return (
    <div className="panel compare">
      <div className="panel-head"><h2>후보지별 비교</h2>{hubs.length > FIXED_HUBS && <span className="tap-hint">↕ 카드 안에서 스크롤</span>}</div>
      <div className="cards-scroll" ref={scroll} style={fixedH ? { height: fixedH } : undefined}>
        <div className="cards-grid" style={{ gridTemplateRows: `repeat(${rows}, auto)`, gridTemplateColumns: `112px repeat(${results.length}, minmax(232px, 1fr))` }}>
          {/* 왼쪽 줄 이름 */}
          <div className="col labels" style={{ gridRow: `1 / span ${rows}` }}>
            <div className="cell head-cell"><span className="muted">후보지</span></div>
            {hubs.map((h) => [
              <div key={h.id + 'h'} className="cell hub-cell sect"><span className="hub-mark" aria-hidden>{hubEmoji(h.category)}</span><span>{h.category}</span></div>,
              ...modes.map((m) => <div key={h.id + m} className="cell row-label"><span className={`dot ${m}`} />{{ transit: '대중교통', car: '차량', walk: '도보', bike: '자전거' }[m]}</div>),
            ])}
            <div className="cell row-label rent-label sect">보증금/월세</div>
            <div className="cell row-label">🏪 상권 종합</div>
          </div>

          {results.map((r, i) => ({ r, i })).sort((a, b) => a.r.rank - b.r.rank).map(({ r, i }) => {
            const acc = placeOf(r.candidate)?.access?.roads?.[0]
            return (
            <div key={r.candidate.id} role="button" tabIndex={0} aria-pressed={i === active} className={'col card' + (i === active ? ' on' : '')} style={{ gridRow: `1 / span ${rows}` }}
              onClick={(e) => { if (!(e.target as HTMLElement).closest('.name-edit, .pen')) { onSelect(i); reveal(e.currentTarget) } }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onSelect(i); reveal(e.currentTarget) } }}>
              <div className="cell head-cell">
                <span className="rank">{r.rank}</span>
                {naming?.id === r.candidate.id ? (
                  <form className="card-name name-edit" onSubmit={(e) => { e.preventDefault(); finish(true) }}>
                    <input spellCheck={false} autoComplete="off" value={naming.name} maxLength={40} autoFocus aria-label="후보지 이름" onChange={(e) => setNaming({ ...naming, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Escape') finish(false) }} onBlur={() => finish(true)} />
                    <small>Enter 저장 · Esc 취소</small>
                  </form>
                ) : (
                  <div className="card-name">
                    <b><span>{r.candidate.name}</span><button type="button" className="pen" title="이름 수정" aria-label={`${r.candidate.name} 이름 수정`} onClick={() => setNaming({ id: r.candidate.id, name: r.candidate.name })}>✎</button></b>
                    <small>{r.candidate.address}</small>
                  </div>
                )}
                <strong className={isBest(r.total, best((x) => x.total)) ? 'best' : ''}>{fmt(r.total)}<Line v={r.total} kind="total" /></strong>
              </div>
              {r.hubs.map((h, hi) => {
                const t = h.trip, s = h.scores
                const diff = t.carRush - t.carFree
                const { free, rush } = t.carSource
                const muted = (m: ModeKey) => (h.mode !== 'auto' && !used(h, m) ? ' muted-mode' : '')
                return [
                  <div key={h.hub.id + 'h'} className="cell hub-cell sect"><span>{h.hub.name}</span><small>{t.km.toFixed(1)}km · {weeklyText(h.weekly)} · 반영 {Math.round(h.share * 100)}%{h.mode !== 'auto' ? ` · ${{ transit: '대중교통', car: '차량', walk: '도보', bike: '자전거' }[h.mode]}로 감` : ''}</small><b className={isBest(h.hubScore, best((x) => x.hubs[hi].hubScore)) ? 'best' : ''}>{fmt(h.hubScore)}<Line v={h.hubScore} kind="hub" /></b></div>,
                  ...modes.map((m) => {
                    if (m === 'transit') return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        {h.transitPending && !h.transitSkipped
                          ? <div><span className="muted">대중교통 경로 찾는 중 — {liveNote(r.candidate)}</span></div>
                          : h.transitSkipped
                          ? <div><span className="muted">도보 {t.walk}분 · 도보권이라 대중교통 제외</span></div>
                          : <><div><b>{t.transit}분{t.transitSource === 'est' ? '(추정)' : ''}</b><small>{t.routes.length ? `${[...new Set(t.routes)].slice(0, 2).join('→')} · ` : ''}대기 {t.wait}분 · 정류장까지 {t.access}분 · 환승 {t.transfers}회</small></div>
                            <em className={isBest(s.transit, best((x) => (x.hubs[hi].transitSkipped || x.hubs[hi].transitPending ? null : x.hubs[hi].scores.transit))) ? 'best' : ''}>{fmt(s.transit)}<Line v={s.transit} kind="transit" /></em></>}
                      </div>
                    )
                    if (m === 'car') return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        <div><b>출퇴근 {t.carRush}분{slotTag(rush)} · 낮 {t.carFree}분{slotTag(free)}</b>
                          <small>정체 {s.carRatio.toFixed(2)}배({diff >= 0 ? '+' : ''}{diff}분) · 거리 대비 {fmt(s.carParts.efficiency)}{acc ? ` · ${acc.name} 진입 ${Math.round(acc.min)}분` : ''}</small>
                          <small className="faint">{carNote(h)}</small></div>
                        <em className={isBest(s.car, best((x) => x.hubs[hi].scores.car)) ? 'best' : ''}>{fmt(s.car)}<Line v={s.car} kind="car" /></em>
                      </div>
                    )
                    if (m === 'walk') return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        {s.walk !== null
                          ? <><div><b>{t.walk}분</b><small>{t.walk <= WALK_ZONE ? '도보권' : '걸어서'} · {t.pathSource === 'osm' ? `길 ${t.walkKm.toFixed(1)}km` : '직선 추정'}</small></div><em className={isBest(s.walk, best((x) => x.hubs[hi].scores.walk)) ? 'best' : ''}>{fmt(s.walk)}<Line v={s.walk} kind="walk" /></em></>
                          : <div><span className="muted">{WALK_LIMIT}분 초과</span></div>}
                      </div>
                    )
                    return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        {s.bike !== null
                          ? <><div><b>{t.bike}분</b><small>{t.pathSource === 'osm' ? '자전거 길' : '직선 추정'}</small></div><em className={isBest(s.bike, best((x) => x.hubs[hi].scores.bike)) ? 'best' : ''}>{fmt(s.bike)}<Line v={s.bike} kind="bike" /></em></>
                          : <div><span className="muted">{BIKE_LIMIT}분 초과</span></div>}
                      </div>
                    )
                  }),
                ]
              })}
              <RentCell c={r.candidate} sect />
              <ComCell c={r.candidate} x={com ? com[i] : undefined} best={!!com && isBest(com[i]?.score ?? null, Math.max(...com.map((c) => c?.score ?? -1)))} />
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
