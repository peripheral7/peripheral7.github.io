import { useEffect, useRef } from 'react'
import { DEFAULT_PREFERENCE, MAX_TRIPS, weightShares, type Hub, type Preference, type Weights } from '../data'

// 칸(카드)을 누르면 그 칸 바로 오른쪽에 뜨는 작은 설정 창. 바꾸는 즉시 점수에 반영되고 이 브라우저에 저장된다.
// 수단 가중치는 숫자로 직접 넣는다(0~999). 하나를 바꿔도 나머지는 그대로 두고, 합이 100 과 다르면 100 기준 비율을 보여 준다
// (계산은 합에 대한 비율로 하므로 합이 100 을 넘어도 동작한다. 설정 창 밖의 카드에는 이 비율만 보인다).
type Props = { kind: 'trips' | 'weights'; hubs: Hub[]; value: Preference; onChange: (p: Preference) => void; onClose: () => void }

const MODES: { key: keyof Weights; label: string; note: string }[] = [
  { key: 'transit', label: '대중교통', note: '대기·도보·환승을 후보지끼리 비교' },
  { key: 'car', label: '차량', note: '출퇴근 ÷ 여유 시간을 후보지끼리 비교' },
  { key: 'walk', label: '도보', note: '걷는 시간 · 20분까지 도보권' },
]

const toInt = (v: string, max: number) => Math.max(0, Math.min(max, Math.round(Number(v)) || 0))

export function SettingsPopover({ kind, hubs, value, onChange, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      // 바깥을 누르면 닫힘 — 창을 여는 칸(data-pop-trigger)은 제외(그 칸을 다시 누르면 칸 쪽에서 닫는다)
      if (box.current && !box.current.contains(t) && !t.closest('[data-pop-trigger]')) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    box.current?.querySelector<HTMLInputElement>('input')?.focus() // 처음 열 때만
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [])

  const w = value.weights
  const total = w.transit + w.car + w.walk
  const share = weightShares(w)
  const setWeight = (key: keyof Weights, v: string) => onChange({ ...value, weights: { ...w, [key]: toInt(v, 999) } })
  const setTrips = (id: string, v: number) => onChange({ ...value, trips: { ...value.trips, [id]: Math.max(0, Math.min(MAX_TRIPS, Math.round(v) || 0)) } })
  const reset = () => onChange(kind === 'weights' ? { ...value, weights: DEFAULT_PREFERENCE.weights } : { ...value, trips: DEFAULT_PREFERENCE.trips })

  return (
    <div className="popover" ref={box} role="dialog" aria-label={kind === 'weights' ? '수단 가중치 조정' : '방문지 월 왕복 횟수 조정'}>
      <div className="pop-head">
        <b>{kind === 'weights' ? '수단 가중치' : '월 왕복 횟수'}</b>
        <button className="close" aria-label="닫기" onClick={onClose}>×</button>
      </div>
      {kind === 'weights' ? (
        <>
          {MODES.map((m) => (
            <label className="weight-input" key={m.key}>
              <span><b>{m.label}</b><small>{m.note}</small></span>
              <input type="number" min={0} max={999} step={1} inputMode="numeric" aria-label={`${m.label} 가중치`} value={w[m.key]}
                onFocus={(e) => e.currentTarget.select()} onChange={(e) => setWeight(m.key, e.target.value)} />
            </label>
          ))}
          <p className="sum-note" role="status">
            합계 <b>{total}</b>{total !== 100 && <> · 100 기준 <b>{share.transit}·{share.car}·{share.walk}</b></>}
          </p>
        </>
      ) : hubs.map((h) => (
        <div className="trips" key={h.id}>
          <span><b>{h.name}</b><small>{h.category} · 0~{MAX_TRIPS}회</small></span>
          <span className="stepper">
            <input type="number" min={0} max={MAX_TRIPS} inputMode="numeric" aria-label={`${h.name} 월 왕복 횟수`} value={value.trips[h.id] ?? 0} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setTrips(h.id, Number(e.target.value))} />
          </span>
          <label className="transit-use" title="체크하면 주 이동수단과 상관없이 항상 대중교통을 이용하는 것으로 계산합니다(차량은 점수에는 넣고 카드에서 회색으로 표시)">
            <input type="checkbox" checked={!!value.transitUse?.[h.id]} onChange={(e) => onChange({ ...value, transitUse: { ...value.transitUse, [h.id]: e.target.checked } })} />대중교통 이용
          </label>
        </div>
      ))}
      <div className="pop-foot"><button className="ghost" onClick={reset}>기본값</button><button className="solid" onClick={onClose}>완료</button></div>
    </div>
  )
}
