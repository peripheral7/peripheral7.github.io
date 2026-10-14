import { useEffect, useRef } from 'react'
import { DEFAULT_PREFERENCE, MAX_WEEKLY, WEEKS_PER_MONTH, activeModes, defaultWeekly, weightShares, type Hub, type HubMode, type ModeKey, type Preference } from '../data'

// 칸(카드)을 누르면 그 칸 바로 오른쪽에 뜨는 작은 설정 창. 바꾸는 즉시 점수에 반영되고 이 브라우저에 저장된다.
// 수단 가중치는 숫자로 직접 넣는다(0~999). 하나를 바꿔도 나머지는 그대로 두고, 합이 100 과 다르면 100 기준 비율을 보여 준다
// (계산은 합에 대한 비율로 하므로 합이 100 을 넘어도 동작한다. 설정 창 밖의 카드에는 이 비율만 보인다).
// 자전거는 따로 켜는 이동수단 — 켜면 가중치 칸이 생긴다(상권·공공시설 반경도 2배).
// 목적지 창: 주 방문(왕복) 횟수(0.5 단위, 월 4회 = 주 1회)와 그 목적지에 갈 때 쓰는 이동수단(자동 = 가중치로 섞음).
type Props = { kind: 'weekly' | 'weights'; hubs: Hub[]; value: Preference; onChange: (p: Preference) => void; onClose: () => void }

export const MODE_INFO: Record<ModeKey, { label: string; emoji: string; note: string }> = {
  transit: { label: '대중교통', emoji: '🚌', note: '대기·정류장까지 도보·환승' },
  car: { label: '차량', emoji: '🚗', note: '정체 · 거리 대비 시간 · 대로 진입' },
  walk: { label: '도보', emoji: '🚶', note: '걷는 시간 · 10분까지 도보권' },
  bike: { label: '자전거', emoji: '🚲', note: '자전거 길 시간 · 40분까지' },
}
const HUB_MODES: { m: HubMode; label: string }[] = [{ m: 'auto', label: '자동' }, { m: 'transit', label: '🚌' }, { m: 'car', label: '🚗' }, { m: 'walk', label: '🚶' }, { m: 'bike', label: '🚲' }]

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
  const modes = activeModes(value)
  const total = modes.reduce((a, k) => a + (w[k] ?? 0), 0)
  const share = weightShares(w, modes)
  const setWeight = (key: ModeKey, v: string) => onChange({ ...value, weights: { ...w, [key]: toInt(v, 999) } })
  const setWeekly = (id: string, v: number) => onChange({ ...value, weekly: { ...value.weekly, [id]: Math.max(0, Math.min(MAX_WEEKLY, Math.round((v || 0) * 2) / 2)) } })
  const setMode = (id: string, m: HubMode) => onChange({ ...value, hubMode: { ...value.hubMode, [id]: m } })
  const reset = () => onChange(kind === 'weights'
    ? { ...value, weights: DEFAULT_PREFERENCE.weights }
    : { ...value, weekly: Object.fromEntries(hubs.map((h) => [h.id, defaultWeekly(h.category)])), hubMode: {} })

  return (
    <div className="popover" ref={box} role="dialog" aria-label={kind === 'weights' ? '수단 가중치 조정' : '목적지 방문 횟수·이동수단 조정'}>
      <div className="pop-head">
        <b>{kind === 'weights' ? '수단 가중치' : '주 방문 횟수 · 이동수단'}</b>
        <button className="close" aria-label="닫기" onClick={onClose}>×</button>
      </div>
      {kind === 'weights' ? (
        <>
          {modes.map((k) => (
            <label className="weight-input" key={k}>
              <span><b>{MODE_INFO[k].emoji} {MODE_INFO[k].label}</b><small>{MODE_INFO[k].note}</small></span>
              <input type="number" min={0} max={999} step={1} inputMode="numeric" aria-label={`${MODE_INFO[k].label} 가중치`} value={w[k] ?? 0}
                onFocus={(e) => e.currentTarget.select()} onChange={(e) => setWeight(k, e.target.value)} />
            </label>
          ))}
          <button type="button" className={'bike-toggle' + (value.bike ? ' on' : '')} aria-pressed={!!value.bike} onClick={() => onChange({ ...value, bike: !value.bike })}>
            🚲 자전거 {value.bike ? '이용 중' : '이용'}<small>{value.bike ? '독립 이동수단으로 계산 · 상권·공공시설 반경 2배' : '켜면 자전거를 이동수단으로 따로 계산(상권·공공시설 반경도 2배)'}</small>
          </button>
          <p className="sum-note" role="status">
            합계 <b>{total}</b>{total !== 100 && <> · 100 기준 <b>{modes.map((k) => share[k]).join('·')}</b></>}
          </p>
        </>
      ) : hubs.map((h) => {
        const n = value.weekly[h.id] ?? 0
        const mode = value.hubMode?.[h.id] ?? 'auto'
        return (
          <div className="trips" key={h.id}>
            <span><b>{h.name}</b><small>{h.category} · 주 0~{MAX_WEEKLY}회(0.5 단위) · 월 {Math.round(n * WEEKS_PER_MONTH * 10) / 10}회</small></span>
            <span className="stepper">
              <input type="number" min={0} max={MAX_WEEKLY} step={0.5} inputMode="decimal" aria-label={`${h.name} 주 방문 횟수`} value={n} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setWeekly(h.id, Number(e.target.value))} />
            </span>
            <span className="hub-mode seg" role="radiogroup" aria-label={`${h.name} 이동수단`} title="자동 = 수단 가중치로 섞음. 수단을 고르면 이 목적지 점수는 그 수단만으로(다른 수단은 카드에 회색으로 참고)">
              {HUB_MODES.filter((x) => x.m !== 'bike' || value.bike).map((x) => (
                <button key={x.m} type="button" role="radio" aria-checked={mode === x.m} className={mode === x.m ? 'on' : ''} aria-label={x.m === 'auto' ? '자동' : MODE_INFO[x.m as ModeKey].label} onClick={() => setMode(h.id, x.m)}>{x.label}</button>
              ))}
            </span>
          </div>
        )
      })}
      <div className="pop-foot"><button className="ghost" onClick={reset}>기본값</button><button className="solid" onClick={onClose}>완료</button></div>
    </div>
  )
}
