import { useCallback, useEffect, useMemo, useState } from 'react'
import { BASE_DEPOSIT, MAX_HUBS, baseRent, hubEmoji, weightShares, won, type Place } from './data'
import { evaluate, fmt, hubInsights } from './scoring'
import { addCandidate, load, money, removeCandidate, removeHub, save, setHub, updateCandidate, type State } from './store'
import { MapView } from './components/MapView'
import { SearchBox } from './components/SearchBox'
import { ModeScorePanel, FactorsPanel } from './components/Panels'
import { CompareCards } from './components/CompareCards'
import { SettingsPopover } from './components/SettingsPopover'
import { GuidePanel } from './components/GuidePanel'
import { CatGallery, CatRegister } from './components/CatPanel'
import { catIndex, loadCats, pruneCats, removeMyPhoto, saveCats, type CatState } from './cats'
import { CommutePanel } from './components/CommutePanel'
import { ListingCards, SpotCards } from './components/Recommend'
import { DEFAULT_FUEL, loadCommute, saveCommute, type CommuteSaved } from './commute'
import { fuelPriceFor } from './fuel'

// " · 3,000/40 (1,000 기준 월 50)" — 금액을 안 넣었으면 빈 글자
const rentText = (c: { deposit?: number; rent?: number }) => {
  const b = baseRent(c)
  return b === null ? '' : ` · ${won(c.deposit ?? 0)}/${c.rent ?? 0}${c.deposit === BASE_DEPOSIT ? '' : ` (${won(BASE_DEPOSIT)} 기준 월 ${b})`}`
}

export default function App() {
  const [state, setState] = useState<State>(load)
  const [active, setActive] = useState(0)
  const [focusKey, setFocusKey] = useState(0) // 목록이 바뀌면 지도를 다시 맞춘다
  const [pop, setPop] = useState<'none' | 'trips' | 'weights'>('none')
  const [guide, setGuide] = useState(false)
  const [hubPick, setHubPick] = useState<string | null>(null) // 지도 장단점 기준 목적지
  const [preview, setPreview] = useState<Place | null>(null) // 검색 결과를 누르면 지도가 그 위치로
  const [editing, setEditing] = useState<{ id: string; name: string; deposit: string; rent: string } | null>(null) // 수정 중인 후보지(금액은 입력 글자 그대로)
  const [catState, setCatState] = useState<CatState>(() => pruneCats(loadCats())) // 길고양이 지수(선택 요인) — 사진은 이 브라우저에만 저장
  const [commute, setCommute] = useState<CommuteSaved>(loadCommute) // 출퇴근 인사이트의 연비·기름값(null = 자동)
  const [catDlg, setCatDlg] = useState<'none' | 'register' | 'gallery'>('none')
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null) // 카드에서 "사진 보기"를 누른 후보지(없으면 선택한 후보지)
  const { candidates, hubs, pref } = state
  const results = useMemo(() => (candidates.length ? evaluate(candidates, hubs, pref) : []), [candidates, hubs, pref])
  const cur = results[Math.min(active, results.length - 1)]
  const hubId = hubs.some((h) => h.id === hubPick) ? hubPick : hubs[0]?.id ?? null
  const hubIndex = hubs.findIndex((h) => h.id === hubId)
  // 기름값 자동 = 1순위 후보지가 있는 시군구의 오피넷 평균(후보지가 여러 지역에 걸쳐도 1순위 기준 하나로 모두 계산)
  const topAddress = results.find((r) => r.rank === 1)?.candidate.address ?? ''
  const fuelAuto = useMemo(() => (topAddress ? fuelPriceFor(topAddress) : null), [topAddress])
  const saveC = (s: CommuteSaved) => { setCommute(s); saveCommute(s) }
  const insights = useMemo(() => (hubIndex >= 0 ? hubInsights(results, hubIndex) : results.map(() => ({ pros: [], cons: [] }))), [results, hubIndex])

  useEffect(() => { save(state) }, [state])
  useEffect(() => { saveCats(catState) }, [catState])
  const catIdx = useMemo(() => (catState.on ? candidates.map((c) => catIndex(c, catState.cats)) : null), [catState, candidates])
  const setCats = (next: CatState) => { const ok = saveCats(next); if (ok) setCatState(next); return ok }
  useEffect(() => { if (active > candidates.length - 1) setActive(Math.max(0, candidates.length - 1)) }, [candidates.length, active])

  const select = useCallback((i: number) => setActive(i), [])
  const update = (next: State, nextActive?: number) => { setState(next); if (nextActive !== undefined) setActive(nextActive); setFocusKey((k) => k + 1) }
  const onCandidate = (p: Place, name: string, deposit?: number, rent?: number) => update(addCandidate(state, p, name, deposit, rent), candidates.length)
  const onHub = (p: Place, replaceId: string | undefined, name: string, category: string, trips: number) => update(setHub(state, p, replaceId, name, category, trips))
  const toggle = (k: 'trips' | 'weights') => setPop((p) => (p === k ? 'none' : k))
  // 카드를 누르면(또는 Enter·Space) 설정 창이 열리게 하는 속성
  const tap = (k: 'trips' | 'weights', label: string) => ({
    role: 'button', tabIndex: 0, 'aria-expanded': pop === k, 'aria-label': label, 'data-pop-trigger': k,
    onClick: (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest('.no-pop')) toggle(k) },
    onKeyDown: (e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); toggle(k) } },
  })
  const w = weightShares(pref.weights) // 카드에는 합 100 기준 비율로
  // 번호 = 종합 순위(지도 핀·번호 단추 모두), 단추는 순위 순서로
  const ranks = useMemo(() => results.map((r) => r.rank), [results])
  const byRank = candidates.map((c, i) => ({ c, i, rank: ranks[i] ?? i + 1 })).sort((a, b) => a.rank - b.rank)
  // 선택한 후보지 박스 위쪽 ‹ › : 순위 순서로 앞·뒤 후보지(끝에서는 처음으로 돈다)
  const step = (d: number) => {
    if (!byRank.length) return
    const k = byRank.findIndex((x) => x.i === active)
    select(byRank[(k + d + byRank.length) % byRank.length].i)
  }
  const rename = (id: string, name: string) => setState(updateCandidate(state, id, { name }))
  const saveEdit = () => { if (editing) setState(updateCandidate(state, editing.id, { name: editing.name, deposit: money(editing.deposit), rent: money(editing.rent) })); setEditing(null) }
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
            <div className="sel-nav">
              <button type="button" className="prev" aria-label="앞 순위 후보지" onClick={() => step(-1)} disabled={byRank.length < 2}>‹</button>
              <button type="button" className="next" aria-label="다음 순위 후보지" onClick={() => step(1)} disabled={byRank.length < 2}>›</button>
            </div>
            <div className="sel-body">
            {cur && (
              editing?.id === cur.candidate.id ? (
                <form className="cand-edit" onSubmit={(e) => { e.preventDefault(); saveEdit() }} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }}>
                  <span className="tag">후보지 수정</span>
                  <label>이름<input spellCheck={false} autoComplete="off" value={editing.name} maxLength={40} autoFocus onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
                  <label>보증금<span className="unit-input"><input type="number" min={0} step={100} inputMode="numeric" placeholder="예: 1000" value={editing.deposit} onChange={(e) => setEditing({ ...editing, deposit: e.target.value })} /><i>만원</i></span></label>
                  <label>월세<span className="unit-input"><input type="number" min={0} step={1} inputMode="numeric" placeholder="예: 50" value={editing.rent} onChange={(e) => setEditing({ ...editing, rent: e.target.value })} /><i>만원</i></span></label>
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
                    <span className="tag">종합 {cur.rank}위{rentText(cur.candidate)}</span>
                    <h3>{cur.candidate.name}</h3>
                    <p>{cur.candidate.address}</p>
                  </div>
                  <button className="edit-btn" aria-label={`${cur.candidate.name} 수정`} onClick={() => setEditing({ id: cur.candidate.id, name: cur.candidate.name, deposit: cur.candidate.deposit?.toString() ?? '', rent: cur.candidate.rent?.toString() ?? '' })}>수정</button>
                </div>
              )
            )}
            <div className={'hub-list tappable' + (pop === 'trips' ? ' on' : '')} {...tap('trips', '목적지별 월 왕복 횟수 조정 열기')}>
              <div className="hub-list-head"><span>주요 목적지</span><span className="tap-hint">월 왕복 횟수 ↗</span></div>
              {hubs.map((h) => {
                const t = pref.trips[h.id] ?? 0
                return (
                  <div className="hub-line" key={h.id}>
                    <span className="hub-mark" aria-hidden>{hubEmoji(h.category)}</span>
                    <div><b>{h.name}</b><small>{h.category} · 월 왕복 {t}회 · 반영 {tripSum > 0 ? Math.round((t / tripSum) * 100) : Math.round(100 / hubs.length)}%</small></div>
                    <button className="x no-pop" title="이 목적지 빼기" aria-label={`${h.name} 빼기`} onClick={() => update(removeHub(state, h.id))}>×</button>
                  </div>
                )
              })}
              {hubs.length === 0 && <p className="muted">검색해서 목적지를 넣어 주세요(최대 {MAX_HUBS}곳).</p>}
            </div>
            <div className="pick" role="tablist" aria-label="후보지 선택">
              {byRank.map(({ c, i, rank }) => <button key={c.id} role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => select(i)} title={c.name} aria-label={`${rank}위 ${c.name}`}>{rank}</button>)}
            </div>
            </div>
          </div>
          {pop === 'trips' && <SettingsPopover kind="trips" hubs={hubs} value={pref} onChange={(p) => setState({ ...state, pref: p })} onClose={close} />}
        </div>

        <section className="map-area">
          <MapView candidates={candidates} hubs={hubs} active={active} onSelect={select} focusKey={focusKey} hubId={hubId} onHub={setHubPick} insights={insights} focusHubIds={mainHubIds} ranks={ranks} preview={preview} />
          <SearchBox hubs={hubs} tripsOf={(id) => pref.trips[id] ?? 0} onCandidate={onCandidate} onHub={onHub} onPreview={setPreview} />
        </section>

        <aside className="factors-area">
          <FactorsPanel cat={catIdx && cur ? catIdx[Math.min(active, catIdx.length - 1)] ?? null : null} catOn={catState.on}
            onToggleCat={() => setCats({ ...catState, on: !catState.on })} onRegister={() => setCatDlg('register')} onGallery={() => { setGalleryIdx(null); setCatDlg('gallery') }} />
          {cur && <CommutePanel r={cur} trips={pref.trips} settings={{ kmpl: commute.kmpl, fuel: commute.fuel ?? fuelAuto?.price ?? DEFAULT_FUEL }}
            fuelAuto={fuelAuto} fuelManual={commute.fuel !== null} onKmpl={(n) => saveC({ ...commute, kmpl: n })} onFuel={(n) => saveC({ ...commute, fuel: n })} />}
        </aside>

        {/* 후보지별 비교 양옆: 추천 카드 자리(추후 광고) — 왼쪽 부동산 매물, 오른쪽 카페·식당 */}
        <ListingCards candidates={candidates} />
        <SpotCards candidates={candidates} />

        <section className="cards-area">
          {results.length > 0 && <CompareCards results={results} hubs={hubs} active={active} onSelect={select} onRename={rename} cats={catIdx ?? undefined} onCatPhotos={(i) => { setGalleryIdx(i); setCatDlg('gallery') }} />}
        </section>
      </main>

      <p className="foot">이동 시간은 좌표 거리로 추정한 값입니다(차량은 네이버 실측이 있으면 그 값) · 바꾼 후보지·목적지·선호도는 이 브라우저에만 저장됩니다</p>
      {guide && <GuidePanel onClose={() => setGuide(false)} />}
      {catDlg === 'register' && <CatRegister state={catState} onChange={setCats} onClose={() => setCatDlg('none')} />}
      {catDlg === 'gallery' && catIdx && (() => {
        const i = Math.min(galleryIdx ?? active, catIdx.length - 1)
        return <CatGallery title={candidates[i]?.name ?? ''} cats={catIdx[i]?.cats ?? []} user={catState.user} onRemoveMine={(id) => setCats(removeMyPhoto(catState, id))} onClose={() => setCatDlg('none')} />
      })()}
    </div>
  )
}
