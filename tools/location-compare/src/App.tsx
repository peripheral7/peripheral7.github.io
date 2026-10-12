import { useCallback, useEffect, useMemo, useState } from 'react'
import { MAX_HUBS, type Place } from './data'
import { evaluate, fmt } from './scoring'
import { addCandidate, defaults, load, removeCandidate, removeHub, save, setHub, type State } from './store'
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
  const { candidates, hubs, pref } = state
  const results = useMemo(() => (candidates.length ? evaluate(candidates, hubs, pref) : []), [candidates, hubs, pref])
  const best = results.find((r) => r.rank === 1)
  const cur = results[Math.min(active, results.length - 1)]

  useEffect(() => { save(state) }, [state])
  useEffect(() => { if (active > candidates.length - 1) setActive(Math.max(0, candidates.length - 1)) }, [candidates.length, active])

  const select = useCallback((i: number) => setActive(i), [])
  const update = (next: State, nextActive?: number) => { setState(next); if (nextActive !== undefined) setActive(nextActive); setFocusKey((k) => k + 1) }
  const onCandidate = (p: Place) => update(addCandidate(state, p), candidates.length)
  const onHub = (p: Place, replaceId?: string) => update(setHub(state, p, replaceId))
  const toggle = (k: 'trips' | 'weights') => setPop((p) => (p === k ? 'none' : k))
  const close = () => setPop('none')
  const tripSum = hubs.reduce((a, h) => a + (pref.trips[h.id] ?? 0), 0)

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
        <div className="panel stats-line">
          <span><small>후보지</small><b>{candidates.length}</b></span>
          <span><small>주요 목적지</small><b>{hubs.length}<i>/{MAX_HUBS}</i></b></span>
          <span className="best-cell"><small>최고 점수</small><b>{best ? fmt(best.total) : '—'}</b><em>{best?.candidate.name}</em></span>
        </div>

        <div className="modes-area anchor">
          {cur ? (
            <ModeScorePanel r={cur} action={<button className={'adjust' + (pop === 'weights' ? ' on' : '')} aria-expanded={pop === 'weights'} onClick={() => toggle('weights')}>가중치 조정 ↗</button>} />
          ) : <div className="panel empty">검색해서 후보지를 넣어 주세요.</div>}
          {pop === 'weights' && <SettingsPopover kind="weights" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        <div className="selected-area anchor">
          <div className="panel selected">
            <div className="panel-head"><h2>선택한 후보지</h2><button className={'adjust' + (pop === 'trips' ? ' on' : '')} aria-expanded={pop === 'trips'} onClick={() => toggle('trips')}>방문 횟수 조정 ↗</button></div>
            <div className="pick" role="tablist" aria-label="후보지 선택">
              {candidates.map((c, i) => <button key={c.id} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(i)} title={c.name}>{i + 1}</button>)}
            </div>
            {cur && (
              <div className="sel-head">
                <div><span className="tag">후보 {String(active + 1).padStart(2, '0')} · 종합 {cur.rank}위</span><h3>{cur.candidate.name}</h3><p>{cur.candidate.address}</p></div>
                <button className="x" title="이 후보지 빼기" aria-label={`${cur.candidate.name} 빼기`} onClick={() => update(removeCandidate(state, cur.candidate.id))}>×</button>
              </div>
            )}
            <div className="hub-list">
              {hubs.map((h, i) => {
                const t = pref.trips[h.id] ?? 0
                return (
                  <div className="hub-line" key={h.id}>
                    <span className="hub-mark">{i + 1}</span>
                    <div><b>{h.name}</b><small>{h.category} · 월 왕복 {t}회 · 반영 {tripSum > 0 ? Math.round((t / tripSum) * 100) : Math.round(100 / hubs.length)}%</small></div>
                    <button className="x" title="이 목적지 빼기" aria-label={`${h.name} 빼기`} onClick={() => update(removeHub(state, h.id))}>×</button>
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
          <MapView candidates={candidates} hubs={hubs} active={active} onSelect={select} focusKey={focusKey} />
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
