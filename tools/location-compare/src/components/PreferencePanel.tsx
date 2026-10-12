import { useEffect } from 'react'
import { DEFAULT_PREFERENCE, type Hub, type Preference, type Weights } from '../data'

type Props = { hubs: Hub[]; value: Preference; onChange: (p: Preference) => void; onClose: () => void }

const MODES: { key: keyof Weights; label: string; note: string }[] = [
  { key: 'transit', label: '대중교통', note: '대기·도보·환승을 후보지끼리 비교' },
  { key: 'car', label: '차량', note: '출퇴근 ÷ 여유 시간(정체 배율)을 비교' },
  { key: 'walk', label: '도보', note: '걷는 시간만 · 30분 초과면 빠짐' },
]

export function PreferencePanel({ hubs, value, onChange, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sum = Math.max(1, value.weights.transit + value.weights.car + value.weights.walk)
  const setWeight = (key: keyof Weights, v: number) => onChange({ ...value, weights: { ...value.weights, [key]: v } })
  const setTrips = (id: string, v: number) => onChange({ ...value, trips: { ...value.trips, [id]: Math.max(0, Math.min(60, Math.round(v) || 0)) } })

  return (
    <div className="overlay" onClick={onClose}>
      <section className="glass drawer" role="dialog" aria-modal="true" aria-label="교통 선호도 설정" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><div><small>MOBILITY PREFERENCE</small><h2>교통 선호도</h2></div><button className="close" aria-label="닫기" onClick={onClose}>×</button></div>
        <p className="hint">바꾸는 즉시 점수에 반영되고, 이 브라우저에 저장됩니다.</p>

        <h3>수단 가중치</h3>
        {MODES.map((m) => (
          <label className="slider" key={m.key}>
            <span><b>{m.label}</b><small>{m.note}</small></span>
            <input type="range" min={0} max={100} step={5} value={value.weights[m.key]} onChange={(e) => setWeight(m.key, Number(e.target.value))} />
            <em>{Math.round((value.weights[m.key] / sum) * 100)}%</em>
          </label>
        ))}

        <h3>주요 방문지 월 왕복 횟수</h3>
        {hubs.map((h) => (
          <label className="trips" key={h.id}>
            <span><b>{h.name}</b><small>{h.category}</small></span>
            <span className="stepper">
              <button type="button" aria-label={`${h.name} 횟수 줄이기`} onClick={() => setTrips(h.id, (value.trips[h.id] ?? 0) - 1)}>−</button>
              <input type="number" min={0} max={60} inputMode="numeric" aria-label={`${h.name} 월 왕복 횟수`} value={value.trips[h.id] ?? 0} onChange={(e) => setTrips(h.id, Number(e.target.value))} />
              <button type="button" aria-label={`${h.name} 횟수 늘리기`} onClick={() => setTrips(h.id, (value.trips[h.id] ?? 0) + 1)}>+</button>
            </span>
          </label>
        ))}

        <div className="drawer-foot">
          <button className="ghost" onClick={() => onChange(DEFAULT_PREFERENCE)}>기본값으로</button>
          <button className="solid" onClick={onClose}>완료</button>
        </div>
      </section>
    </div>
  )
}
