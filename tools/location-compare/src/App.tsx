import { useCallback, useEffect, useMemo, useState } from 'react'
import { CANDIDATE_CATEGORIES, MAX_HUBS, type Place } from './data'
import { evaluate, fmt, hubInsights } from './scoring'
import { addCandidate, defaults, load, removeCandidate, removeHub, save, setHub, updateCandidate, type State } from './store'
import { MapView } from './components/MapView'
import { SearchBox } from './components/SearchBox'
import { ModeScorePanel, FactorsPanel } from './components/Panels'
import { CompareCards } from './components/CompareCards'
import { SettingsPopover } from './components/SettingsPopover'
import { GuidePanel } from './components/GuidePanel'

export default function App() {
  const [state, setState] = useState<State>(load)
  const [active, setActive] = useState(0)
  const [focusKey, setFocusKey] = useState(0) // 목록이 바뀌면 지도를 다시 맞춘다
  const [pop, setPop] = useState<'none' | 'trips' | 'weights'>('none')
  const [guide, setGuide] = useState(false)
  const [hubPick, setHubPick] = useState<string | null>(null) // 지도 장단점 기준 목적지
  const [editing, setEditing] = useState<{ id: string; name: string; category: string } | null>(null) // 수정 중인 후보지
  const { candidates, hubs, pref } = state
  const results = useMemo(() => (candidates.length ? evaluate(candidates, hubs, pref) : []), [candidates, hubs, pref])
  const cur = results[Math.min(active, results.length - 1)]
  const hubId = hubs.some((h) => h.id === hubPick) ? hubPick : hubs[0]?.id ?? null
  const hubIndex = hubs.findIndex((h) => h.id === hubId)
  const insights = useMemo(() => (hubIndex >= 0 ? hubInsights(results, hubIndex) : results.map(() => ({ pros: [], cons: [] }))), [results, hubIndex])

  useEffect(() => { save(state) }, [state])
  useEffect(() => { if (active > candidates.length - 1) setActive(Math.max(0, candidates.length - 1)) }, [candidates.length, active])

  const select = useCallback((i: number) => setActive(i), [])
  const update = (next: State, nextActive?: number) => { setState(next); if (nextActive !== undefined) setActive(nextActive); setFocusKey((k) => k + 1) }
  const onCandidate = (p: Place, name: string, category: string) => update(addCandidate(state, p, name, category), candidates.length)
  const onHub = (p: Place, replaceId: string | undefined, name: string, category: string) => update(setHub(state, p, replaceId, name, category))
  const toggle = (k: 'trips' | 'weights') => setPop((p) => (p === k ? 'none' : k))
  // 카드를 누르면(또는 Enter·Space) 설정 창이 열리게 하는 속성
  const tap = (k: 'trips' | 'weights', label: string) => ({
    role: 'button', tabIndex: 0, 'aria-expanded': pop === k, 'aria-label': label, 'data-pop-trigger': k,
    onClick: (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('.no-pop')) toggle(k) },
    onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); toggle(k) } },
  })
  const w = pref.weights
  const saveEdit = () => { if (editing) setState(updateCandidate(state, editing.id, { name: editing.name, category: editing.category })); setEditing(null) }
  const deleteEdit = () => { if (editing && confirm('이 후보지를 삭제할까요?')) { update(removeCandidate(state, editing.id)); setEditing(null) } }
  const close = () => setPop('none')
  const tripSum = hubs.reduce((a, h) => a + (pref.trips[h.id] ?? 0), 0)
  // 주 목적지 = 월 왕복 비율 50% 이상(보통 1곳, 반반이면 2곳). 횟수가 모두 0이면 전부.
  const mainHubIds = useMemo(() => {
    const total = hubs.reduce((a, h) => a + (pref.trips[h.id] ?? 0), 0)
    const main = total > 0 ? hubs.filter((h) => (pref.trips[h.id] ?? 0) / total >= 0.5) : hubs
    return (main.length ? main : hubs).map((h) => h.id)
  }, [hubs, pref.trips])

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="게시판으로 돌아가기"><span className="logo"><span /><span /><span /></span>여기살까?</a>
        <nav className="pills">
          <span className="pill active">입지 지도</span>
          <button className="pill" onClick={() => setGuide(true)}>계산 방식</button>
        </nav>
        <a className="back" href="/">← BACK TO BOARD</a>
      </header>

      <main className="stage">
        <div className="modes-area anchor">
          {cur ? (
            <div className={'tappable' + (pop === 'weights' ? ' on' : '')} {...tap('weights', '수단 가중치 조정 열기')}>
              <ModeScorePanel r={cur} action={<span className="tap-hint">가중치 {w.transit}·{w.car}·{w.walk} ↗</span>} />
            </div>
          ) : <div className="panel empty">검색해서 후보지를 넣어 주세요.</div>}
          {pop === 'weights' && <SettingsPopover kind="weights" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        <div className="selected-area anchor">
          <div className="panel selected">
            <div className="panel-head"><h2>선택한 후보지</h2></div>
            <div className="pick" role="tablist" aria-label="후보지 선택">
              {candidates.map((c, i) => <button key={c.id} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(i)} title={c.name}>{i + 1}</button>)}
            </div>
            {cur && (
              editing?.id === cur.candidate.id ? (
                <form className="cand-edit" onSubmit={(e) => { e.preventDefault(); saveEdit() }} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }}>
                  <span className="tag">후보 {String(active + 1).padStart(2, '0')} 수정</span>
                  <label>이름<input value={editing.name} maxLength={40} autoFocus onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
                  <label>분류
                    <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                      <option value="">(없음)</option>
                      {CANDIDATE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <p className="muted">{cur.candidate.address}</p>
                  <div className="edit-actions">
                    <button type="button" className="danger" onClick={deleteEdit}>삭제</button>
                    <span />
                    <button type="button" className="ghost" onClick={() => setEditing(null)}>취소</button>
                    <button type="submit" className="solid">저장</button>
                  </div>
                </form>
              ) : (
                <div className="sel-head">
                  <div className="sel-text">
                    <span className="tag">후보 {String(active + 1).padStart(2, '0')} · 종합 {cur.rank}위{cur.candidate.category ? ` · ${cur.candidate.category}` : ''}</span>
                    <h3>{cur.candidate.name}</h3>
                    <p>{cur.candidate.address}</p>
                  </div>
                  <button className="edit-btn" aria-label={`${cur.candidate.name} 수정`} onClick={() => setEditing({ id: cur.candidate.id, name: cur.candidate.name, category: cur.candidate.category ?? '' })}>수정</button>
                </div>
              )
            )}
            <div className={'hub-list tappable' + (pop === 'trips' ? ' on' : '')} {...tap('trips', '목적지별 월 왕복 횟수 조정 열기')}>
              <div className="hub-list-head"><span>주요 목적지</span><span className="tap-hint">월 왕복 횟수 ↗</span></div>
              {hubs.map((h, i) => {
                const t = pref.trips[h.id] ?? 0
                return (
                  <div className="hub-line" key={h.id}>
                    <span className="hub-mark">{i + 1}</span>
                    <div><b>{h.name}</b><small>{h.category} · 월 왕복 {t}회 · 반영 {tripSum > 0 ? Math.round((t / tripSum) * 100) : Math.round(100 / hubs.length)}%</small></div>
                    <button className="x no-pop" title="이 목적지 빼기" aria-label={`${h.name} 빼기`} onClick={() => update(removeHub(state, h.id))}>×</button>
                  </div>
                )
              })}
              {hubs.length === 0 && <p className="muted">검색해서 목적지를 넣어 주세요(최대 {MAX_HUBS}곳).</p>}
            </div>
            <button className="reset" onClick={() => { if (confirm('후보지·목적지·선호도를 처음 목록으로 되돌릴까요?')) update(defaults(), 0) }}>처음 목록으로</button>
          </div>
          {pop === 'trips' && <SettingsPopover kind="trips" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        <section className="map-area">
          <MapView candidates={candidates} hubs={hubs} active={active} onSelect={select} focusKey={focusKey} hubId={hubId} onHub={setHubPick} insights={insights} focusHubIds={mainHubIds} />
          <SearchBox hubs={hubs} onCandidate={onCandidate} onHub={onHub} />
        </section>

        <aside className="factors-area"><FactorsPanel /></aside>

        <section className="cards-area">
          {results.length > 0 && <CompareCards results={results} hubs={hubs} active={active} onSelect={select} />}
        </section>
      </main>

      <p className="foot">이동 시간은 좌표 거리로 추정한 값입니다(차량은 네이버 실측이 있으면 그 값) · 바꾼 후보지·목적지·선호도는 이 브라우저에만 저장됩니다</p>
      {guide && <GuidePanel onClose={() => setGuide(false)} />}
    </div>
  )
}
