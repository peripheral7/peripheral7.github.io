import { useEffect, useRef, useState } from 'react'
import { HUB_CATEGORIES, MAX_HUBS, NEW_HUB_TRIPS, type Hub, type Place } from '../data'
import { guessHubCategory, money } from '../store'
import { placeSearchAvailable, search, searchAvailable } from '../naver'

// 지도 위 검색창 하나: 부동산(아파트·주소)과 목적지(학교·회사 등)를 같은 창에서 찾고, 결과에서 바로 후보지/목적지로 넣는다.
// API 사용량을 아끼려고 글자를 칠 때마다가 아니라 Enter·검색 단추를 누를 때만 부른다.

type Props = {
  hubs: Hub[]
  onCandidate: (p: Place, name: string, deposit?: number, rent?: number) => void
  onHub: (p: Place, replaceId: string | undefined, name: string, category: string, trips: number) => void
}
// 등록 창에서 정하는 주요 설정: 후보지 = 이름·보증금·월세, 목적지 = 이름·분류·월 왕복 횟수(·바꿀 목적지)
type Draft = { index: number; kind: 'candidate' | 'hub'; name: string; category: string; deposit: string; rent: string; trips: string; replaceId?: string }

export function SearchBox({ hubs, onCandidate, onHub }: Props) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Place[]>([])
  const [msg, setMsg] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null) // 등록 전 주요 설정 정하기
  const box = useRef<HTMLDivElement>(null)
  const last = useRef('')
  const enabled = searchAvailable()

  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const query = q.trim()
    setOpen(true)
    if (!enabled) { setItems([]); setMsg('네이버 키를 넣고 빌드하면 검색할 수 있습니다(README 9절).'); return }
    if (query.length < 2) { setItems([]); setMsg('두 글자 이상 입력해 주세요.'); return }
    if (query === last.current && items.length) return // 같은 검색을 되풀이하지 않는다
    setBusy(true); setMsg('')
    try {
      const { places, errors } = await search(query)
      last.current = query
      setItems(places); setDraft(null)
      setMsg(places.length ? '' : errors[0] || (placeSearchAvailable() ? '검색 결과가 없습니다.' : '결과가 없습니다. 지금은 도로명·지번 주소로만 찾을 수 있어요(아파트·학교 이름 검색은 준비 중).'))
    } catch (err) { setItems([]); setMsg((err as Error).message || '검색에 실패했습니다.') }
    finally { setBusy(false) }
  }

  const done = (fn: () => void) => { fn(); setOpen(false); setQ(''); setItems([]); setDraft(null); last.current = '' }
  const start = (index: number, kind: Draft['kind'], replaceId?: string) => {
    const p = items[index]
    setDraft({ index, kind, name: p.name, category: guessHubCategory(p), deposit: '', rent: '', trips: String(NEW_HUB_TRIPS), replaceId })
  }
  const commit = () => {
    if (!draft) return
    const p = items[draft.index]
    const name = draft.name.trim() || p.name
    done(() => (draft.kind === 'candidate' ? onCandidate(p, name, money(draft.deposit), money(draft.rent)) : onHub(p, draft.replaceId, name, draft.category, money(draft.trips) ?? 0)))
  }

  return (
    <div className="search" ref={box}>
      <form className="search-bar" onSubmit={run} role="search">
        <svg viewBox="0 0 20 20" aria-hidden><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => (items.length || msg) && setOpen(true)} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          placeholder={!enabled ? '검색 준비 중 (네이버 키 필요)' : placeSearchAvailable() ? '아파트·주소·학교·회사 검색' : '도로명·지번 주소 검색'} aria-label="후보지·목적지 검색" maxLength={40} />
        <button type="submit" disabled={busy}>{busy ? '…' : '검색'}</button>
      </form>
      {open && (msg || items.length > 0) && (
        <div className="search-results">
          {msg && <p className="muted">{msg}</p>}
          {items.map((p, i) => (
            <div className={'result' + (draft?.index === i ? ' drafting' : '')} key={i}>
              <div><b>{p.name}</b><small>{p.category ? `${p.category} · ` : ''}{p.address}</small></div>
              {draft?.index === i ? (
                <form className="register" onSubmit={(e) => { e.preventDefault(); commit() }}>
                  <span className="register-title">{draft.kind === 'candidate' ? '후보지로 등록' : '목적지로 등록'}</span>
                  <label>이름<input value={draft.name} maxLength={40} autoFocus onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
                  {draft.kind === 'candidate' ? <>
                    <label>보증금<span className="unit-input"><input type="number" min={0} step={100} inputMode="numeric" placeholder="예: 1000" value={draft.deposit} onChange={(e) => setDraft({ ...draft, deposit: e.target.value })} /><i>만원</i></span></label>
                    <label>월세<span className="unit-input"><input type="number" min={0} step={1} inputMode="numeric" placeholder="예: 50" value={draft.rent} onChange={(e) => setDraft({ ...draft, rent: e.target.value })} /><i>만원</i></span></label>
                  </> : <>
                    <label>분류
                      <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                        {HUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label>월 왕복<span className="unit-input"><input type="number" min={0} max={60} step={1} inputMode="numeric" value={draft.trips} onChange={(e) => setDraft({ ...draft, trips: e.target.value })} /><i>회</i></span></label>
                  </>}
                  {draft.kind === 'hub' && hubs.length >= MAX_HUBS && (
                    <label>바꿀 목적지
                      <select value={draft.replaceId} onChange={(e) => setDraft({ ...draft, replaceId: e.target.value })}>
                        {hubs.map((h) => <option key={h.id} value={h.id}>{h.category} · {h.name}</option>)}
                      </select>
                    </label>
                  )}
                  <div className="register-actions"><button type="button" className="ghost" onClick={() => setDraft(null)}>취소</button><button type="submit" className="solid">등록</button></div>
                </form>
              ) : (
                <div className="result-actions">
                  <button onClick={() => start(i, 'candidate')}>후보지로</button>
                  <button onClick={() => start(i, 'hub', hubs.length >= MAX_HUBS ? hubs[hubs.length - 1].id : undefined)}>목적지로</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
