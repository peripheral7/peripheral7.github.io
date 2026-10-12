import { useEffect, useRef } from 'react'
import { DEFAULT_PREFERENCE, type Hub, type Preference, type Weights } from '../data'

// "조정"을 누른 칸 바로 오른쪽에 뜨는 작은 설정 창. 바꾸는 즉시 점수에 반영되고 이 브라우저에 저장된다.
type Props = { kind: 'trips' | 'weights'; hubs: Hub[]; value: Preference; onChange: (p: Preference) => void; onClose: () => void }

const MODES: { key: keyof Weights; label: string; note: string }[] = [
  { key: 'transit', label: '대중교통', note: '대기·도보·환승을 후보지끼리 비교' },
  { key: 'car', label: '차량', note: '출퇴근 ÷ 여유 시간을 후보지끼리 비교' },
  { key: 'walk', label: '도보', note: '걷는 시간 · 30분 초과는 표시 안 함' },
]

export function SettingsPopover({ kind, hubs, value, onChange, onClose }: Props) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (box.current && !box.current.contains(t) && !t.closest('.adjust')) onClose() // 바깥을 누르면 닫힘(조정 단추는 제외)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    box.current?.querySelector<HTMLElement>('input')?.focus()
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [onClose])

  const sum = Math.max(1, value.weights.transit + value.weights.car + value.weights.walk)
  const setWeight = (key: keyof Weights, v: number) => onChange({ ...value, weights: { ...value.weights, [key]: v } })
  const setTrips = (id: string, v: number) => onChange({ ...value, trips: { ...value.trips, [id]: Math.max(0, Math.min(60, Math.round(v) || 0)) } })
  const reset = () => onChange(kind === 'weights' ? { ...value, weights: DEFAULT_PREFERENCE.weights } : { ...value, trips: DEFAULT_PREFERENCE.trips })

  return (
    <div className="glass popover" ref={box} role="dialog" aria-label={kind === 'weights' ? '수단 가중치 조정' : '방문지 월 왕복 횟수 조정'}>
      <div className="pop-head">
        <b>{kind === 'weights' ? '수단 가중치' : '월 왕복 횟수'}</b>
        <button className="close" aria-label="닫기" onClick={onClose}>×</button>
      </div>
      {kind === 'weights'
        ? MODES.map((m) => (
          <label className="slider" key={m.key}>
            <span><b>{m.label}</b><small>{m.note}</small></span>
            <input type="range" min={0} max={100} step={5} value={value.weights[m.key]} onChange={(e) => setWeight(m.key, Number(e.target.value))} />
            <em>{Math.round((value.weights[m.key] / sum) * 100)}%</em>
          </label>
        ))
        : hubs.map((h) => (
          <div className="trips" key={h.id}>
            <span><b>{h.name}</b><small>{h.category} · 0~60회</small></span>
            <span className="stepper">
              <button type="button" aria-label={`${h.name} 횟수 줄이기`} onClick={() => setTrips(h.id, (value.trips[h.id] ?? 0) - 1)}>−</button>
              <input type="number" min={0} max={60} inputMode="numeric" aria-label={`${h.name} 월 왕복 횟수`} value={value.trips[h.id] ?? 0} onChange={(e) => setTrips(h.id, Number(e.target.value))} />
              <button type="button" aria-label={`${h.name} 횟수 늘리기`} onClick={() => setTrips(h.id, (value.trips[h.id] ?? 0) + 1)}>+</button>
            </span>
          </div>
        ))}
      <div className="pop-foot"><button className="ghost" onClick={reset}>기본값</button><button className="solid" onClick={onClose}>완료</button></div>
    </div>
  )
}
