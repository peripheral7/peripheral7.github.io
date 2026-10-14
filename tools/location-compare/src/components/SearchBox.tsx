import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { placeNear, type MapPoint } from '../placeNear'
import { HUB_CATEGORIES, MAX_HUBS, MAX_WEEKLY, WEEKS_PER_MONTH, defaultWeekly, type Hub, type Place } from '../data'
import { guessHubCategory, money } from '../store'
import { normalizeQuery, placeSearchAvailable, reverseGeocode, search, searchAvailable } from '../naver'

// 지도 위 검색창 하나: 후보지(아파트·주소)와 목적지(학교·회사 등)를 같은 창에서 찾는다.
// - 글자를 치다 잠깐 멈추면(LIVE_DELAY) 저절로 검색해 아래에 결과를 띄운다. Enter 는 바로 검색.
//   같은 검색어는 이 화면에서 다시 부르지 않고(cache), 늦게 온 옛 검색 결과는 버린다(seq).
// - 결과는 지금 지도 가운데에서 가까운 순으로 늘어놓고(거리 표시), 지도에도 작은 점으로 찍는다.
// - 결과를 누르면 지도가 그 위치로 가고, 결과 목록 바로 오른쪽에 "후보지로 / 목적지로" 단추 → 그 자리에서 등록 창.

const MAP_PICK_NAME = '지도에서 고른 곳' // 지도 우클릭으로 고른 곳의 임시 이름(주소를 받으면 바뀜)
const LIVE_DELAY = 450 // ms — 타자를 멈춘 뒤 이만큼 지나면 검색
const MIN_LEN = 2

type Props = {
  hubs: Hub[]
  tripsOf: (id: string) => number
  onCandidate: (p: Place, name: string, deposit?: number, rent?: number, maint?: number) => void
  onHub: (p: Place, replaceId: string | undefined, name: string, category: string, trips: number) => void
  onPreview: (p: Place | null, fly?: boolean) => void // 결과를 누르면 지도를 그 위치로(fly=false 면 임시 핀만)
  onResults: (list: Place[]) => void // 결과 전부(지도에 작은 점)
  centerRef: { current: { lat: number; lng: number } | null } // 지금 지도 가운데
  external?: { place: Place; kind: 'candidate' | 'hub'; at: MapPoint; n: number } | null // 지도 우클릭으로 고른 곳 → 누른 점 옆에 바로 등록 창
}
// 등록 창에서 정하는 주요 설정: 후보지 = 이름·보증금·월세, 목적지 = 이름·분류·주 방문 횟수(비워 두면 분류 기본값 — 학교·직장 주 5, 본가 주 1)
type Draft = { kind: 'candidate' | 'hub'; name: string; category: string; deposit: string; rent: string; maint: string; trips: string }

// 맞춤법 검사·자동 고침을 끈 입력칸 속성
const plain = { spellCheck: false, autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off' } as const

// 두 점 사이 거리(km, 짧은 거리라 평면 근사)
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot((a.lat - b.lat) * 111, (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180))
const kmText = (d: number) => (d < 1 ? `${Math.round(d * 1000 / 10) * 10}m` : `${d < 10 ? d.toFixed(1) : Math.round(d)}km`)

export function SearchBox({ hubs, tripsOf, onCandidate, onHub, onPreview, onResults, centerRef, external }: Props) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [items, setItemsRaw] = useState<Place[]>([])
  const setItems = (list: Place[]) => { setItemsRaw(list); onResults(list) }
  const [msg, setMsg] = useState('')
  const [picked, setPicked] = useState<number | null>(null) // 누른 결과
  const [draft, setDraft] = useState<Draft | null>(null) // 등록 전 주요 설정
  const [sideTop, setSideTop] = useState(0) // 오른쪽 단추 칸을 누른 결과 줄 높이에 맞춘다
  const [floatAt, setFloatAt] = useState<MapPoint | null>(null) // 지도 우클릭 등록: 등록 창을 검색창 아래가 아니라 누른 점 옆에
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const cache = useRef(new Map<string, { places: Place[]; error: string }>())
  const seq = useRef(0)
  const enabled = searchAvailable()

  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  const reset = () => { setPicked(null); setDraft(null); setFloatAt(null); onPreview(null) }

  const run = async (raw: string) => {
    const query = normalizeQuery(raw) // "망포  래미안"·"망포 래미안 " 은 같은 검색어(다시 부르지 않음)
    if (!enabled) { setItems([]); setMsg('네이버 키를 넣고 빌드하면 검색할 수 있습니다(README 10절).'); return }
    if (query.length < MIN_LEN) { seq.current++; setItems([]); setMsg(''); setBusy(false); reset(); return }
    const id = ++seq.current
    const hit = cache.current.get(query)
    let res = hit
    if (!res) {
      setBusy(true)
      try {
        const { places, errors } = await search(query)
        res = { places, error: places.length ? '' : errors[0] || '' }
        if (!errors.length) cache.current.set(query, res) // 실패한 검색은 기억하지 않는다
      } catch (err) { res = { places: [], error: (err as Error).message || '검색에 실패했습니다.' } }
    }
    if (id !== seq.current) return // 그사이 다른 검색어를 쳤다
    setBusy(false); setOpen(true); reset()
    // 지금 지도 가운데에서 가까운 순(네이버 지역 검색에는 위치 조건이 없어, 받은 결과를 여기서 줄 세운다)
    const c = centerRef.current
    setItems(c ? [...res.places].sort((a, b) => km(a, c) - km(b, c)) : res.places)
    setMsg(res.places.length ? '' : res.error || (placeSearchAvailable() ? '검색 결과가 없습니다.' : '결과가 없습니다. 지금은 도로명·지번 주소로만 찾을 수 있어요.'))
  }

  // 타자를 멈추면 저절로 검색
  useEffect(() => {
    const t = setTimeout(() => { void run(q) }, LIVE_DELAY)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  // 지도 우클릭 "후보지로/목적지로": 그 한 곳을 결과로 놓고 등록 창을 바로 연다(지도는 움직이지 않음)
  // 좌표 → 주소를 바로 받아 결과 줄·등록 창에 채운다(이름은 사용자가 아직 안 고쳤을 때만 주소로 바꿈)
  useEffect(() => {
    if (!external) return
    const { lat, lng } = external.place
    const id = ++seq.current // 진행 중인 검색 결과는 버린다
    const coord = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    const p: Place = { ...external.place, name: MAP_PICK_NAME, address: '주소 찾는 중…' }
    setBusy(false); setItems([p]); setMsg(''); setOpen(false); setPicked(0); setSideTop(0); setFloatAt(external.at)
    setDraft({ kind: external.kind, name: MAP_PICK_NAME, category: '기타', deposit: '', rent: '', maint: '', trips: '' })
    onPreview(p, false)
    void reverseGeocode(lat, lng).then((a) => {
      if (id !== seq.current) return // 그사이 다른 곳을 고르거나 검색했다
      const name = a ? a.building || (a.rough ? MAP_PICK_NAME : a.address.split(' ').slice(2).join(' ') || a.address) : MAP_PICK_NAME
      const q: Place = { ...p, name, address: a?.address ?? coord }
      setItems([q])
      setDraft((d) => (d && d.name === MAP_PICK_NAME ? { ...d, name } : d))
    })
  }, [external?.n]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (i: number, row: HTMLElement) => {
    setPicked(i); setDraft(null)
    setSideTop(row.offsetTop - (list.current?.scrollTop ?? 0))
    onPreview(items[i])
  }
  const start = (kind: Draft['kind']) => {
    const p = items[picked!]
    setDraft({ kind, name: p.name, category: guessHubCategory(p), deposit: '', rent: '', maint: '', trips: '' })
  }
  // 목적지가 이미 꽉 찼으면 주 방문이 가장 적은 목적지 자리에 넣는다(바꿀 목적지를 따로 고르지 않음)
  const replaceHub = hubs.length >= MAX_HUBS ? hubs.reduce((a, h) => (tripsOf(h.id) < tripsOf(a.id) ? h : a)) : undefined
  const commit = () => {
    if (!draft || picked === null) return
    const p = items[picked]
    const name = draft.name.trim() || p.name
    if (draft.kind === 'candidate') onCandidate(p, name, money(draft.deposit), money(draft.rent), money(draft.maint))
    else onHub(p, replaceHub?.id, name, draft.category.trim() || '기타', weekly)
    setOpen(false); setQ(''); setItems([]); setMsg(''); reset(); seq.current++
  }
  // 등록 창에서 취소: 지도 우클릭으로 연 창이면 통째로 닫고, 검색 결과에서 연 창이면 "후보지로/목적지로" 단추로 돌아간다
  const cancel = () => { if (floatAt) { setItems([]); reset(); seq.current++ } else setDraft(null) }

  // 주 방문: 직접 넣은 값(0.5 단위), 비었으면 분류 기본값
  const typed = Number((draft?.trips ?? '').replace(',', '.'))
  const weekly = draft?.trips.trim() && Number.isFinite(typed) ? Math.max(0, Math.min(MAX_WEEKLY, Math.round(typed * 2) / 2)) : defaultWeekly(draft?.category ?? '')
  const custom = draft && !HUB_CATEGORIES.includes(draft.category) ? draft.category : ''

  const form = draft && picked !== null && items[picked] ? (
    <form className="register" onSubmit={(e) => { e.preventDefault(); commit() }} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); cancel() } }}>
      <span className="register-title">{draft.kind === 'candidate' ? '후보지로 등록' : '목적지로 등록'}</span>
      <p className="register-addr">📍 {items[picked].address}</p>
      <label>이름<input {...plain} value={draft.name} maxLength={40} autoFocus onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
      {draft.kind === 'candidate' ? <>
        <label>보증금<span className="unit-input"><input {...plain} type="number" min={0} step={100} inputMode="numeric" placeholder="예: 1000" value={draft.deposit} onChange={(e) => setDraft({ ...draft, deposit: e.target.value })} /><i>만원</i></span></label>
        <label>월세<span className="unit-input"><input {...plain} type="number" min={0} step={1} inputMode="numeric" placeholder="예: 50" value={draft.rent} onChange={(e) => setDraft({ ...draft, rent: e.target.value })} /><i>만원</i></span></label>
        <label>관리비<span className="unit-input"><input {...plain} type="number" min={0} step={1} inputMode="numeric" placeholder="예: 7" value={draft.maint} onChange={(e) => setDraft({ ...draft, maint: e.target.value })} /><i>만원</i></span></label>
      </> : <>
        <div className="field">
          <span>분류</span>
          <div className="cat-pick" role="radiogroup" aria-label="분류">
            {HUB_CATEGORIES.map((c) => (
              <button type="button" key={c} role="radio" aria-checked={draft.category === c} className={draft.category === c ? 'on' : ''} onClick={() => setDraft({ ...draft, category: c })}>{c}</button>
            ))}
            <input {...plain} className={'cat-custom' + (custom ? ' on' : '')} value={custom} maxLength={8} placeholder="직접 입력" aria-label="분류 직접 입력"
              onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <span>주 방문</span>
          <div className="trip-input">
            <input type="range" min={0} max={MAX_WEEKLY} step={0.5} value={weekly} aria-label="주 방문 횟수(끌어서)" onChange={(e) => setDraft({ ...draft, trips: e.target.value })} />
            <span className="unit-input"><input {...plain} type="text" inputMode="decimal" maxLength={4} value={draft.trips || String(weekly)} aria-label="주 방문 횟수(직접 입력)" onChange={(e) => setDraft({ ...draft, trips: e.target.value.replace(/[^\d.]/g, '') })} /><i>회</i></span>
          </div>
          <small className="register-hint">{draft.trips ? '' : `${draft.category || '기타'} 기본값 · `}월 {Math.round(weekly * WEEKS_PER_MONTH * 10) / 10}회</small>
        </div>
        {replaceHub && <p className="register-note">목적지는 최대 {MAX_HUBS}곳 — 주 방문이 가장 적은 「{replaceHub.name}」 자리에 들어갑니다.</p>}
      </>}
      <div className="register-actions"><button type="button" className="ghost" onClick={cancel}>취소</button><button type="submit" className="solid">등록</button></div>
    </form>
  ) : null

  return (
    <>
    <div className="search" ref={box}>
      <form className="search-bar" role="search" onSubmit={(e) => { e.preventDefault(); void run(q) }}>
        <button type="submit" className="search-go" aria-label="검색" disabled={busy}>
          <svg viewBox="0 0 20 20" aria-hidden><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        <input value={q} {...plain} onChange={(e) => setQ(e.target.value)} onFocus={() => (items.length || msg) && setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); reset() } }}
          placeholder={enabled ? '후보지 및 목적지 검색' : '검색 준비 중 (네이버 키 필요)'} aria-label="후보지 및 목적지 검색" maxLength={40} />
        {busy && <span className="search-busy" aria-label="검색 중" />}
      </form>
      {open && (msg || items.length > 0) && (
        <div className="search-drop">
          <div className="search-results" ref={list} role="listbox" aria-label="검색 결과">
            {msg && <p className="muted">{msg}</p>}
            {items.map((p, i) => (
              <button type="button" role="option" aria-selected={picked === i} className={'result' + (picked === i ? ' on' : '')} key={i} onClick={(e) => pick(i, e.currentTarget)}>
                <b>{p.name}{centerRef.current && <em className="result-km">{kmText(km(p, centerRef.current))}</em>}</b><small>{p.category ? `${p.category} · ` : ''}{p.address}</small>
              </button>
            ))}
          </div>
          {picked !== null && items[picked] && (
            <div className={'search-side' + (draft && !floatAt ? ' form' : '')} style={{ top: draft ? 0 : Math.max(0, sideTop) }}>
              {!draft || floatAt ? (
                <div className="side-actions">
                  <button type="button" onClick={() => start('candidate')}>후보지로</button>
                  <button type="button" onClick={() => start('hub')}>목적지로</button>
                </div>
              ) : (
                form
              )}
            </div>
          )}
        </div>
      )}
    </div>
    {floatAt && form && <FloatBox at={floatAt} onClose={cancel}>{form}</FloatBox>}
    </>
  )
}

/** 지도 위 누른 점 옆에 뜨는 등록 창. 내용 크기가 바뀌면(주소가 들어오는 등) 자리를 다시 잡고, 바깥을 누르면 닫는다. */
function FloatBox({ at, onClose, children }: { at: MapPoint; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setPos(placeNear(at, el.offsetWidth, el.offsetHeight))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [at])
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const down = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close.current() }
    window.addEventListener('pointerdown', down, true)
    return () => window.removeEventListener('pointerdown', down, true)
  }, [])
  return (
    <div ref={ref} className="search-side form map-register" role="dialog" aria-label="지도에서 고른 곳 등록" onContextMenu={(e) => e.preventDefault()}
      style={pos ?? { left: at.x, top: at.y, visibility: 'hidden' }}>
      {children}
    </div>
  )
}
