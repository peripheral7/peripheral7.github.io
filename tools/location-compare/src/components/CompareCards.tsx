import { useState } from 'react'
import { fmt, WALK_LIMIT, WALK_ZONE, type CandidateResult } from '../scoring'
import { BASE_DEPOSIT, baseRent, hubEmoji, won, type Candidate, type Hub } from '../data'
import { brokerageFee, feeText, useGroup } from '../brokerage'
import { CATEGORIES, type CommercialIndex } from '../commercial'

// 아래쪽: 후보지 카드를 가로로 늘어놓는다. 모든 카드가 같은 줄(행)을 공유해서(CSS subgrid)
// "대중교통" 줄을 옆으로 읽으면 후보지끼리 대기·역까지 도보·환승을, "차량" 줄은 출퇴근/낮 차이를 바로 비교할 수 있다.

type Props = { results: CandidateResult[]; com: CommercialIndex[] | null; hubs: Hub[]; active: number; onSelect: (index: number) => void; onRename: (id: string, name: string) => void }

// 점수(0~10)만큼 칸 아래쪽에 색 선을 채운다 — 숫자를 읽지 않아도 길이로 바로 비교된다.
const Line = ({ v, kind }: { v: number; kind: 'total' | 'hub' | 'transit' | 'car' | 'walk' | 'com' }) => (
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
function ComCell({ x, best }: { x: CommercialIndex | undefined; best: boolean }) {
  if (x === undefined) return <div className="cell mode-cell"><div><span className="muted">입지 요인 ⚙ 에서 켜면 표시</span></div></div>
  if (x === null) return <div className="cell mode-cell"><div><span className="muted">상권 자료 없음(검색으로 넣은 후보지)</span></div></div>
  const txt = (t: 'need' | 'want') => x.parts.filter((p) => p.tier === t).map((p) => `${CATEGORIES.find((c) => c.id === p.id)?.label} ${p.count}`).join(' · ')
  return (
    <div className="cell mode-cell">
      <div><b>{txt('need') || txt('want')}</b>{txt('need') && txt('want') && <small>선호 {txt('want')}</small>}</div>
      <em className={best ? 'best' : ''}>{fmt(x.score)}<Line v={x.score} kind="com" /></em>
    </div>
  )
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

export function CompareCards({ results, com, hubs, active, onSelect, onRename }: Props) {
  const [naming, setNaming] = useState<{ id: string; name: string } | null>(null) // 카드에서 이름 바꾸는 중
  const finish = (save: boolean) => { if (save && naming) onRename(naming.id, naming.name); setNaming(null) }
  const rows = 2 + hubs.length * 4 + 1 // 후보지 · 보증금/월세 · 목적지마다 4줄 · 상권 종합
  const best = (pick: (r: CandidateResult) => number | null) => Math.max(...results.map((r) => pick(r) ?? -1))
  const isBest = (v: number | null, b: number) => v !== null && Math.abs(v - b) < 1e-9 && results.length > 1

  return (
    <div className="panel compare">
      <div className="panel-head"><h2>후보지별 비교</h2></div>
      <div className="cards-scroll">
        <div className="cards-grid" style={{ gridTemplateRows: `repeat(${rows}, auto)`, gridTemplateColumns: `112px repeat(${results.length}, minmax(232px, 1fr))` }}>
          {/* 왼쪽 줄 이름 */}
          <div className="col labels" style={{ gridRow: `1 / span ${rows}` }}>
            <div className="cell head-cell"><span className="muted">후보지</span></div>
            {hubs.map((h) => [
              <div key={h.id + 'h'} className="cell hub-cell sect"><span className="hub-mark" aria-hidden>{hubEmoji(h.category)}</span><span>{h.category}</span></div>,
              <div key={h.id + 't'} className="cell row-label"><span className="dot transit" />대중교통</div>,
              <div key={h.id + 'c'} className="cell row-label"><span className="dot car" />차량</div>,
              <div key={h.id + 'w'} className="cell row-label"><span className="dot walk" />도보</div>,
            ])}
            <div className="cell row-label rent-label sect">보증금/월세</div>
            <div className="cell row-label">🏪 상권 종합</div>
          </div>

          {results.map((r, i) => ({ r, i })).sort((a, b) => a.r.rank - b.r.rank).map(({ r, i }) => (
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
                const measured = free && rush ? ' · 네이버 실측' : free ? ' · 낮 실측·출퇴근 추정' : rush ? ' · 출퇴근 실측·낮 추정' : ' · 거리 추정'
                return [
                  <div key={h.hub.id + 'h'} className="cell hub-cell sect"><span>{h.hub.name}</span><small>{t.km.toFixed(1)}km · 반영 {Math.round(h.share * 100)}%</small><b className={isBest(h.hubScore, best((x) => x.hubs[hi].hubScore)) ? 'best' : ''}>{fmt(h.hubScore)}<Line v={h.hubScore} kind="hub" /></b></div>,
                  <div key={h.hub.id + 't'} className="cell mode-cell">
                    {h.transitSkipped
                      ? <div><span className="muted">도보 {t.walk}분 · 걸어가니 대중교통 제외</span></div>
                      : <><div><b>{t.transit}분</b><small>대기 {t.wait}분 · 정류장까지 도보 {t.access}분 · 환승 {t.transfers}회</small></div>
                        <em className={isBest(s.transit, best((x) => (x.hubs[hi].transitSkipped ? null : x.hubs[hi].scores.transit))) ? 'best' : ''}>{fmt(s.transit)}<Line v={s.transit} kind="transit" /></em></>}
                  </div>,
                  <div key={h.hub.id + 'c'} className={'cell mode-cell' + (h.carMuted ? ' muted-mode' : '')}>
                    <div><b>출퇴근 {t.carRush}분 · 낮 {t.carFree}분</b><small>차이 +{diff}분 ({s.carRatio.toFixed(2)}배){measured}{h.carMuted ? ' · 대중교통 이용' : ''}</small></div>
                    <em className={isBest(s.car, best((x) => x.hubs[hi].scores.car)) ? 'best' : ''}>{fmt(s.car)}<Line v={s.car} kind="car" /></em>
                  </div>,
                  <div key={h.hub.id + 'w'} className="cell mode-cell">
                    {s.walk !== null
                      ? <><div><b>{t.walk}분</b><small>{t.walk <= WALK_ZONE ? '도보권' : '걸어서'}</small></div><em className={isBest(s.walk, best((x) => x.hubs[hi].scores.walk)) ? 'best' : ''}>{fmt(s.walk)}<Line v={s.walk} kind="walk" /></em></>
                      : <div><span className="muted">{WALK_LIMIT}분 초과</span></div>}
                  </div>,
                ]
              })}
              <RentCell c={r.candidate} sect />
              <ComCell x={com ? com[i] : undefined} best={!!com && isBest(com[i]?.score ?? null, Math.max(...com.map((c) => c?.score ?? -1)))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
