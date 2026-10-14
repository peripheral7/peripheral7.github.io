import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { fmt, WALK_LIMIT, BIKE_LIMIT, WALK_ZONE, slotDone, type CandidateResult, type CarSlot, type HubResult } from '../scoring'
import { BASE_DEPOSIT, baseRent, hubEmoji, weeklyText, won, type Candidate, type Hub, type ModeKey } from '../data'
import { USE_LABEL, brokerageFee, feeText, useGroup, type PropertyUse } from '../brokerage'
import { money } from '../store'
import { CATEGORIES, type CommercialIndex } from '../commercial'
import { SLOT_TEXT, liveNote } from '../live'
import { placeOf } from '../places'
import { MAN_UNIT, addr, catName, isEn, manEn, mins, pn, t } from '../i18n'

const MODE_NAME: Record<ModeKey, string> = { transit: t('대중교통', 'Transit'), car: t('차량', 'Car'), walk: t('도보', 'Walk'), bike: t('자전거', 'Bike') }

// 아래쪽: 후보지 카드를 가로로 늘어놓는다. 모든 카드가 같은 줄(행)을 공유해서(CSS subgrid)
// "대중교통" 줄을 옆으로 읽으면 후보지끼리 대기·역까지 도보·환승을, "차량" 줄은 출퇴근/낮 차이를 바로 비교할 수 있다.
// 높이는 목적지 2곳 기준으로 고정한다(목적지가 1곳이어도 같은 높이 — 옆 광고 카드도 같은 높이). 목적지가 3곳이면 카드 안을
// 세로로 스크롤하고(스크롤바는 숨김), 모든 카드가 한 스크롤 상자 안에 있어 같이 움직인다. 맨 위 후보지 줄은 붙어 있다.

// 후보지 수정: 카드 이름 옆 ✎ → 그 카드 위에 수정 창(이름·보증금·월세·관리비·용도 + 삭제). 금액은 입력 글자 그대로 들고 있다가 저장할 때 숫자로.
type Patch = { name?: string; deposit?: number; rent?: number; maint?: number; use?: PropertyUse }
type Props = { results: CandidateResult[]; com: CommercialIndex[] | null; hubs: Hub[]; active: number; bike: boolean; onSelect: (index: number) => void; onEdit: (id: string, patch: Patch) => void; onDelete: (id: string) => void }
type Editing = { id: string; name: string; deposit: string; rent: string; maint: string; use: PropertyUse }

function EditForm({ e, address, onChange, onSave, onCancel, onDelete }: { e: Editing; address: string; onChange: (e: Editing) => void; onSave: () => void; onCancel: () => void; onDelete: () => void }) {
  return (
    <div className="card-edit" onClick={(ev) => ev.stopPropagation()} onKeyDown={(ev) => { ev.stopPropagation(); if (ev.key === 'Escape') onCancel() }}>
      <form className="cand-edit" onSubmit={(ev) => { ev.preventDefault(); onSave() }}>
        <span className="tag">{t('후보지 수정', 'Edit candidate')}</span>
        <label>{t('이름', 'Name')}<input spellCheck={false} autoComplete="off" value={e.name} maxLength={40} autoFocus onChange={(ev) => onChange({ ...e, name: ev.target.value })} /></label>
        <label>{t('보증금', 'Deposit')}<span className="unit-input"><input type="number" min={0} step={100} inputMode="numeric" placeholder={t('예: 1000', 'e.g. 1000')} value={e.deposit} onChange={(ev) => onChange({ ...e, deposit: ev.target.value })} /><i>{MAN_UNIT}</i></span></label>
        <label>{t('월세', 'Monthly rent')}<span className="unit-input"><input type="number" min={0} step={1} inputMode="numeric" placeholder={t('예: 50', 'e.g. 50')} value={e.rent} onChange={(ev) => onChange({ ...e, rent: ev.target.value })} /><i>{MAN_UNIT}</i></span></label>
        <label>{t('관리비', 'Maint. fee')}<span className="unit-input"><input type="number" min={0} step={1} inputMode="numeric" placeholder={t('예: 7', 'e.g. 7')} value={e.maint} onChange={(ev) => onChange({ ...e, maint: ev.target.value })} /><i>{MAN_UNIT}</i></span></label>
        <label>{t('용도', 'Use')}<select value={e.use} onChange={(ev) => onChange({ ...e, use: ev.target.value as PropertyUse })}>{(Object.keys(USE_LABEL) as PropertyUse[]).map((u) => <option key={u} value={u}>{USE_LABEL[u]}{u === 'officetel' ? t('(85㎡ 이하·부엌·욕실)', ' (≤85㎡, kitchen, bath)') : ''}</option>)}</select></label>
        <p className="muted">{addr(address)}</p>
        <div className="edit-actions">
          <button type="button" className="danger" onClick={onDelete}>{t('삭제', 'Delete')}</button>
          <span />
          <button type="button" className="ghost" onClick={onCancel}>{t('취소', 'Cancel')}</button>
          <button type="submit" className="solid">{t('저장', 'Save')}</button>
        </div>
      </form>
    </div>
  )
}

// 점수(0~10)만큼 칸 아래쪽에 색 선을 채운다 — 숫자를 읽지 않아도 길이로 바로 비교된다.
const Line = ({ v, kind }: { v: number; kind: 'total' | 'hub' | ModeKey | 'com' }) => (
  <i className={`score-line ${kind}`} style={{ '--v': Math.max(0, Math.min(10, v)) / 10 } as React.CSSProperties} aria-hidden />
)

// 보증금/월세(만원) + 연한 글씨로 "보증금 1,000 기준 월 ○○만원" — 보증금이 달라도 월세를 한 기준으로 비교
// + 관리비 · 월 합계(월세 + 관리비) · 예상 중개수수료(법정 상한, 한쪽 몫, 부가세 별도 — brokerage.ts)
function RentCell({ c, sect }: { c: Candidate; sect?: boolean }) {
  const b = baseRent(c)
  if (b === null) return <div className={"cell rent-cell" + (sect ? " sect" : "")}><span className="muted">{t('미입력 · 수정에서 입력', 'Not set · add via ✎')}</span></div>
  const use = c.use ?? 'home'
  const f = brokerageFee(use, 'lease', c)
  return (
    <div className={"cell rent-cell" + (sect ? " sect" : "")}>
      {isEn
        ? <b>{won(c.deposit ?? 0)} / {manEn(c.rent ?? 0)}{c.maint ? <small> · maint. {manEn(c.maint)}</small> : null}</b>
        : <b>{won(c.deposit ?? 0)} / {c.rent ?? 0}<small>만원</small>{c.maint ? <small> · 관리비 {c.maint}</small> : null}</b>}
      <small className="faint">{isEn
        ? `≈ ${manEn(b)}/mo at ${won(BASE_DEPOSIT)} deposit${c.maint ? ` · total ${manEn((c.rent ?? 0) + c.maint)}/mo` : ''}`
        : `보증금 ${won(BASE_DEPOSIT)} 기준 월 ${b}만원${c.maint ? ` · 월 합계 ${(c.rent ?? 0) + c.maint}만원` : ''}`}</small>
      <small className="faint" title={`${f.formula} · ${f.basis} · ${t('부가세 별도', 'VAT excluded')}`}>{useGroup(use)} · {t('중개수수료 최대', 'broker fee up to')} {feeText(f.fee)}</small>
    </div>
  )
}

// 상권 종합: 지수 + 고른 업종 이름(필수 → 선호는 아래 작게). 개수는 안 보이고 업종 점수를 색으로만:
// 7점 이상 초록 · 4점 이상 주황 · 그 아래 무색
const comTone = (score: number) => (score >= 7 ? 'com-ok' : score >= 4 ? 'com-mid' : undefined)
function ComCell({ x, best, c }: { x: CommercialIndex | undefined; best: boolean; c: Candidate }) {
  if (x === undefined) return <div className="cell mode-cell"><div><span className="muted">{t('입지 요인 ⚙ 에서 켜면 표시', 'Turn on in Location factors ⚙')}</span></div></div>
  if (x === null) return <div className="cell mode-cell"><div><span className="muted">{t('상권', 'Shops')} {liveNote(c)}</span></div></div>
  const items = (t: 'need' | 'want') => x.parts.filter((p) => p.tier === t).map((p) => (
    <span key={p.id} className={comTone(p.score)}>{CATEGORIES.find((q) => q.id === p.id)?.label}</span>
  ))
  const join = (a: ReactNode[]) => a.flatMap((e, i) => (i ? [' · ', e] : [e]))
  const need = items('need'), want = items('want')
  return (
    <div className="cell mode-cell">
      <div><b>{join(need.length ? need : want)}</b>{need.length > 0 && want.length > 0 && <small>{t('선호', 'nice-to-have')} {join(want)}</small>}</div>
      <em className={best ? 'best' : ''}>{fmt(x.score)}<Line v={x.score} kind="com" /></em>
    </div>
  )
}

// 차량 시간대 표시: 두 기준 시각 평균이면 "실측", 하나뿐이면 "1회", 등록 때 잰 임시 값이면 "등록 시각", 없으면 "추정"
const slotTag = (s: CarSlot | null) => (!s ? t('(추정)', ' (est.)') : slotDone(s) ? '' : s.provisional ? t('(등록 시각)', ' (at sign-up)') : t('(1회)', ' (1 sample)'))
function carNote(h: HubResult): string {
  const { free, rush } = h.trip.carSource
  if (slotDone(free) && slotDone(rush)) return t('네이버 실측(기준 시각 평균)', 'Naver measured (avg. of reference times)')
  const todo = [!slotDone(rush) && `${t('출퇴근', 'rush')} ${SLOT_TEXT.rush}`, !slotDone(free) && `${t('낮', 'daytime')} ${SLOT_TEXT.free}`].filter(Boolean).join(' · ')
  return t(`실측 예정: ${todo}`, `To be measured: ${todo}`)
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

export function CompareCards({ results, com, hubs, active, bike, onSelect, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null) // 수정 중인 후보지
  const startEdit = (c: Candidate) => setEditing({ id: c.id, name: c.name, deposit: c.deposit?.toString() ?? '', rent: c.rent?.toString() ?? '', maint: c.maint?.toString() ?? '', use: c.use ?? 'home' })
  const saveEdit = () => { if (editing) onEdit(editing.id, { name: editing.name.trim() || undefined, deposit: money(editing.deposit), rent: money(editing.rent), maint: money(editing.maint), use: editing.use }); setEditing(null) }
  const deleteEdit = () => { if (editing && confirm(t('이 후보지를 삭제할까요?', 'Delete this candidate?'))) { onDelete(editing.id); setEditing(null) } }
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
      <div className="panel-head"><h2>{t('후보지별 비교', 'Compare candidates')}</h2>{hubs.length > FIXED_HUBS && <span className="tap-hint">{t('↕ 카드 안에서 스크롤', '↕ scroll inside the cards')}</span>}</div>
      <div className="cards-scroll" ref={scroll} style={fixedH ? { height: fixedH } : undefined}>
        <div className="cards-grid" style={{ gridTemplateRows: `repeat(${rows}, auto)`, gridTemplateColumns: `var(--lab-w, 112px) repeat(${results.length}, minmax(var(--card-w, 232px), 1fr))` }}>
          {/* 왼쪽 줄 이름 */}
          <div className="col labels" style={{ gridRow: `1 / span ${rows}` }}>
            <div className="cell head-cell"><span className="muted">{t('후보지', 'Candidate')}</span></div>
            {hubs.map((h) => [
              <div key={h.id + 'h'} className="cell hub-cell sect"><span className="hub-mark" aria-hidden>{hubEmoji(h.category)}</span><span>{catName(h.category)}</span></div>,
              ...modes.map((m) => <div key={h.id + m} className="cell row-label"><span className={`dot ${m}`} />{MODE_NAME[m]}</div>),
            ])}
            <div className="cell row-label rent-label sect">{t('보증금/월세', 'Deposit/rent')}</div>
            <div className="cell row-label">🏪 {t('상권 종합', 'Shops overall')}</div>
          </div>

          {results.map((r, i) => ({ r, i })).sort((a, b) => a.r.rank - b.r.rank).map(({ r, i }) => {
            const acc = placeOf(r.candidate)?.access?.roads?.[0]
            return (
            <div key={r.candidate.id} role="button" tabIndex={0} aria-pressed={i === active} className={'col card' + (i === active ? ' on' : '')} style={{ gridRow: `1 / span ${rows}` }}
              onClick={(e) => { if (!(e.target as HTMLElement).closest('.card-edit, .pen')) { onSelect(i); reveal(e.currentTarget) } }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onSelect(i); reveal(e.currentTarget) } }}>
              <div className="cell head-cell">
                <span className="rank">{r.rank}</span>
                <div className="card-name">
                  <b><span>{pn(r.candidate.name)}</span><button type="button" className="pen" title={t('후보지 수정(이름·보증금·월세·관리비·용도·삭제)', 'Edit candidate (name, deposit, rent, maint. fee, use, delete)')} aria-label={t(`${r.candidate.name} 수정`, `Edit ${pn(r.candidate.name)}`)} onClick={() => startEdit(r.candidate)}>✎</button></b>
                  <small>{addr(r.candidate.address)}</small>
                </div>
                <strong className={isBest(r.total, best((x) => x.total)) ? 'best' : ''}>{fmt(r.total)}<Line v={r.total} kind="total" /></strong>
              </div>
              {r.hubs.map((h, hi) => {
                const tr = h.trip, s = h.scores
                const diff = tr.carRush - tr.carFree
                const { free, rush } = tr.carSource
                const muted = (m: ModeKey) => (h.mode !== 'auto' && !used(h, m) ? ' muted-mode' : '')
                return [
                  <div key={h.hub.id + 'h'} className="cell hub-cell sect"><span>{pn(h.hub.name)}</span><small>{tr.km.toFixed(1)}km · {weeklyText(h.weekly)} · {t('반영', 'weight')} {Math.round(h.share * 100)}%{h.mode !== 'auto' ? t(` · ${MODE_NAME[h.mode]}로 감`, ` · by ${MODE_NAME[h.mode].toLowerCase()}`) : ''}</small><b className={isBest(h.hubScore, best((x) => x.hubs[hi].hubScore)) ? 'best' : ''}>{fmt(h.hubScore)}<Line v={h.hubScore} kind="hub" /></b></div>,
                  ...modes.map((m) => {
                    if (m === 'transit') return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        {h.transitPending && !h.transitSkipped
                          ? <div><span className="muted">{t('대중교통 경로 찾는 중', 'Finding transit route')} — {liveNote(r.candidate)}</span></div>
                          : h.transitSkipped
                          ? <div><span className="muted">{t(`도보 ${tr.walk}분 · 도보권이라 대중교통 제외`, `Walk ${tr.walk} min · walkable, so transit is skipped`)}</span></div>
                          : <><div><b>{mins(tr.transit)}{tr.transitSource === 'est' ? t('(추정)', ' (est.)') : ''}</b><small>{tr.walkBetter !== null ? t(`걷기가 더 빠름 · 버스 등 ${tr.walkBetter}분`, `walking is faster · bus etc. ${tr.walkBetter} min`) : <>{tr.routes.length ? `${[...new Set(tr.routes)].slice(0, 2).map(pn).join('→')} · ` : ''}{t(`대기 ${tr.wait}분 · 정류장까지 ${tr.access}분 · 환승 ${tr.transfers}회`, `wait ${tr.wait} min · ${tr.access} min to stop · ${tr.transfers} transfer${tr.transfers === 1 ? '' : 's'}`)}</>}</small></div>
                            <em className={isBest(s.transit, best((x) => (x.hubs[hi].transitSkipped || x.hubs[hi].transitPending ? null : x.hubs[hi].scores.transit))) ? 'best' : ''}>{fmt(s.transit)}<Line v={s.transit} kind="transit" /></em></>}
                      </div>
                    )
                    if (m === 'car') return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        <div><b>{t('출퇴근', 'Rush')} {mins(tr.carRush)}{slotTag(rush)} · {t('낮', 'day')} {mins(tr.carFree)}{slotTag(free)}</b>
                          <small>{t(`정체 ${s.carRatio.toFixed(2)}배(${diff >= 0 ? '+' : ''}${diff}분)`, `congestion ×${s.carRatio.toFixed(2)} (${diff >= 0 ? '+' : ''}${diff} min)`)} · {t('거리 대비', 'vs distance')} {fmt(s.carParts.efficiency)}{acc ? t(` · ${acc.name} 진입 ${Math.round(acc.min)}분`, ` · ${Math.round(acc.min)} min to ${pn(acc.name)}`) : ''}</small>
                          <small className="faint">{carNote(h)}</small></div>
                        <em className={isBest(s.car, best((x) => x.hubs[hi].scores.car)) ? 'best' : ''}>{fmt(s.car)}<Line v={s.car} kind="car" /></em>
                      </div>
                    )
                    if (m === 'walk') return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        {s.walk !== null
                          ? <><div><b>{mins(tr.walk)}</b><small>{tr.walk <= WALK_ZONE ? t('도보권', 'walkable') : t('걸어서', 'on foot')} · {tr.pathSource === 'osm' ? t(`길 ${tr.walkKm.toFixed(1)}km`, `path ${tr.walkKm.toFixed(1)} km`) : t('직선 추정', 'straight-line est.')}</small></div><em className={isBest(s.walk, best((x) => x.hubs[hi].scores.walk)) ? 'best' : ''}>{fmt(s.walk)}<Line v={s.walk} kind="walk" /></em></>
                          : <div><span className="muted">{t(`${WALK_LIMIT}분 초과`, `over ${WALK_LIMIT} min`)}</span></div>}
                      </div>
                    )
                    return (
                      <div key={h.hub.id + m} className={'cell mode-cell' + muted(m)}>
                        {s.bike !== null
                          ? <><div><b>{mins(tr.bike)}</b><small>{tr.pathSource === 'osm' ? t('자전거 길', 'bike path') : t('직선 추정', 'straight-line est.')}</small></div><em className={isBest(s.bike, best((x) => x.hubs[hi].scores.bike)) ? 'best' : ''}>{fmt(s.bike)}<Line v={s.bike} kind="bike" /></em></>
                          : <div><span className="muted">{t(`${BIKE_LIMIT}분 초과`, `over ${BIKE_LIMIT} min`)}</span></div>}
                      </div>
                    )
                  }),
                ]
              })}
              <RentCell c={r.candidate} sect />
              <ComCell c={r.candidate} x={com ? com[i] : undefined} best={!!com && isBest(com[i]?.score ?? null, Math.max(...com.map((c) => c?.score ?? -1)))} />
              {editing?.id === r.candidate.id && <EditForm e={editing} address={r.candidate.address} onChange={setEditing} onSave={saveEdit} onCancel={() => setEditing(null)} onDelete={deleteEdit} />}
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
