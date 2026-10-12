import { useEffect, useMemo, useState } from 'react'
import { CANDIDATES, DEFAULT_PREFERENCE, HUBS, type Preference } from './data'
import { evaluate, fmt } from './scoring'
import { MapView } from './components/MapView'
import { CandidateCarousel } from './components/CandidateCarousel'
import { PreferencePanel } from './components/PreferencePanel'
import { GuidePanel } from './components/GuidePanel'

const KEY = 'locCompare.v2' // 교통 선호도만 이 브라우저에 저장한다

function loadPreference(): Preference {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && saved.weights && saved.trips) {
      return { weights: { ...DEFAULT_PREFERENCE.weights, ...saved.weights }, trips: { ...DEFAULT_PREFERENCE.trips, ...saved.trips } }
    }
  } catch { /* 저장소를 못 쓰거나 내용이 깨졌으면 기본값 */ }
  return DEFAULT_PREFERENCE
}

export default function App() {
  const [pref, setPref] = useState<Preference>(loadPreference)
  const [active, setActive] = useState(0)
  const [panel, setPanel] = useState<'none' | 'pref' | 'guide'>('none')
  const results = useMemo(() => evaluate(CANDIDATES, HUBS, pref), [pref])
  const best = results.find((r) => r.rank === 1)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(pref)) } catch { /* 저장 못 해도 화면은 동작 */ }
  }, [pref])

  const w = pref.weights
  const wSum = Math.max(1, w.transit + w.car + w.walk)
  const tripSum = HUBS.reduce((a, h) => a + (pref.trips[h.id] ?? 0), 0)

  return (
    <div className="shell">
      <header className="topbar">
        <a className="logo" href="/" aria-label="게시판으로 돌아가기"><span /><span /><span /></a>
        <nav className="pills">
          <span className="pill active">입지 지도</span>
          <button className="pill" onClick={() => setPanel('pref')}>교통 선호도</button>
          <button className="pill" onClick={() => setPanel('guide')}>계산 방식</button>
        </nav>
        <a className="back" href="/">← BACK TO BOARD</a>
      </header>

      <main className="stage">
        <section className="map-area">
          <MapView candidates={CANDIDATES} hubs={HUBS} active={active} onSelect={setActive} />
          <h1 className="title">입지 비교<small>Residential Location</small></h1>
        </section>

        <aside className="side">
          <div className="glass stats">
            <div className="stat"><span>후보지</span><b>{CANDIDATES.length}</b></div>
            <div className="stat"><span>주요 방문지</span><b>{HUBS.length}</b></div>
            <div className="stat wide"><span>최고 점수</span><b>{best ? fmt(best.total) : '—'}<i>/10</i></b><em>{best?.candidate.name}</em></div>
          </div>

          <div className="glass block">
            <div className="block-head"><h2>주요 방문지</h2><button className="link" onClick={() => setPanel('pref')}>조정 ↗</button></div>
            {HUBS.map((h, i) => {
              const t = pref.trips[h.id] ?? 0
              return (
                <div className="hub-line" key={h.id}>
                  <span className="hub-mark">{i + 1}</span>
                  <div><b>{h.name}</b><small>{h.category} · 월 왕복 {t}회</small></div>
                  <strong>{tripSum > 0 ? Math.round((t / tripSum) * 100) : Math.round(100 / HUBS.length)}%</strong>
                </div>
              )
            })}
          </div>

          <div className="glass block">
            <div className="block-head"><h2>수단 가중치</h2><button className="link" onClick={() => setPanel('pref')}>조정 ↗</button></div>
            <div className="weight-bar" aria-hidden>
              <span className="w-transit" style={{ width: `${(w.transit / wSum) * 100}%` }} />
              <span className="w-car" style={{ width: `${(w.car / wSum) * 100}%` }} />
              <span className="w-walk" style={{ width: `${(w.walk / wSum) * 100}%` }} />
            </div>
            <div className="weight-legend">
              <span><i className="w-transit" />대중교통 {Math.round((w.transit / wSum) * 100)}%</span>
              <span><i className="w-car" />차량 {Math.round((w.car / wSum) * 100)}%</span>
              <span><i className="w-walk" />도보 {Math.round((w.walk / wSum) * 100)}%</span>
            </div>
          </div>
        </aside>

        <section className="cards">
          <CandidateCarousel results={results} active={active} onChange={setActive} />
        </section>
      </main>

      <p className="foot">이동 시간은 좌표 거리로 추정한 가상 값입니다 · 후보지 주소는 임시 입력 · 교통 선호도는 이 브라우저에만 저장됩니다</p>

      {panel === 'pref' && <PreferencePanel hubs={HUBS} value={pref} onChange={setPref} onClose={() => setPanel('none')} />}
      {panel === 'guide' && <GuidePanel onClose={() => setPanel('none')} />}
    </div>
  )
}
