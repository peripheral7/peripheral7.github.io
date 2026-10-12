import { useEffect, useRef, useState } from 'react'
import { MAX_HUBS, type Hub, type Place } from '../data'
import { search, searchAvailable } from '../naver'

// 지도 위 검색창 하나: 부동산(아파트·주소)과 목적지(학교·회사 등)를 같은 창에서 찾고, 결과에서 바로 후보지/목적지로 넣는다.
// API 사용량을 아끼려고 글자를 칠 때마다가 아니라 Enter·검색 단추를 누를 때만 부른다.

type Props = { hubs: Hub[]; onCandidate: (p: Place) => void; onHub: (p: Place, replaceId?: string) => void }

export function SearchBox({ hubs, onCandidate, onHub }: Props) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Place[]>([])
  const [msg, setMsg] = useState('')
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
      setItems(places)
      setMsg(places.length ? '' : errors[0] || '검색 결과가 없습니다.')
    } catch (err) { setItems([]); setMsg((err as Error).message || '검색에 실패했습니다.') }
    finally { setBusy(false) }
  }

  const done = (fn: () => void) => { fn(); setOpen(false); setQ(''); setItems([]); last.current = '' }

  return (
    <div className="search" ref={box}>
      <form className="search-bar" onSubmit={run} role="search">
        <svg viewBox="0 0 20 20" aria-hidden><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => (items.length || msg) && setOpen(true)} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          placeholder={enabled ? '아파트·주소·학교·회사 검색' : '검색 준비 중 (네이버 키 필요)'} aria-label="후보지·목적지 검색" maxLength={40} />
        <button type="submit" disabled={busy}>{busy ? '…' : '검색'}</button>
      </form>
      {open && (msg || items.length > 0) && (
        <div className="search-results">
          {msg && <p className="muted">{msg}</p>}
          {items.map((p, i) => (
            <div className="result" key={i}>
              <div><b>{p.name}</b><small>{p.category ? `${p.category} · ` : ''}{p.address}</small></div>
              <div className="result-actions">
                <button onClick={() => done(() => onCandidate(p))}>후보지로</button>
                {hubs.length < MAX_HUBS
                  ? <button onClick={() => done(() => onHub(p))}>목적지로</button>
                  : hubs.map((h) => <button key={h.id} onClick={() => done(() => onHub(p, h.id))} title={`${h.name} 대신 목적지로`}>{h.category} 대신</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
