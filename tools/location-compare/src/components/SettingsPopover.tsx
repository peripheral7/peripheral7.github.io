import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PREFERENCE, LIFESTYLES, MAX_WEEKLY, WEEKS_PER_MONTH, applyLifestyle, defaultWeekly, lifestyleOf, lifestyleWeights, setLifestyleWeights, weightShares, type Hub, type HubMode, type ModeKey, type Preference } from '../data'

// 칸(카드)을 누르면 그 칸 바로 오른쪽에 뜨는 작은 설정 창. 바꾸는 즉시 점수에 반영되고 이 브라우저에 저장된다.
// 교통평점 창(10-14): 수단 가중치 숫자 대신 **라이프스타일**을 고른다(data.ts LIFESTYLES — 고르면 가중치·자전거 사용이 정해짐).
// 각 카드에 그 라이프스타일의 수단 비율을 작은 막대로 보인다. 왼쪽 아래 "세부설정" = 지금 고른 라이프스타일의 수단 비율을 숫자로(합 100 기준 비율).
// 목적지 창: 주 방문(왕복) 횟수(0.5 단위, 월 4회 = 주 1회)와 그 목적지에 갈 때 쓰는 이동수단(자동 = 가중치로 섞음).
type Props = { kind: 'weekly' | 'weights'; hubs: Hub[]; value: Preference; onChange: (p: Preference) => void; onClose: () => void }

export const MODE_INFO: Record<ModeKey, { label: string; emoji: string; note: string }> = {
  transit: { label: '대중교통', emoji: '🚌', note: '대기·정류장까지 도보·환승' },
  car: { label: '차량', emoji: '🚗', note: '정체 · 거리 대비 시간 · 대로 진입' },
  walk: { label: '도보', emoji: '🚶', note: '걷는 시간 · 10분까지 도보권' },
  bike: { label: '자전거', emoji: '🚲', note: '자전거 길 시간 · 40분까지' },
}
const HUB_MODES: { m: HubMode; label: string }[] = [{ m: 'auto', label: '자동' }, { m: 'transit', label: '🚌' }, { m: 'car', label: '🚗' }, { m: 'walk', label: '🚶' }, { m: 'bike', label: '🚲' }]

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

  const setWeekly = (id: string, v: number) => onChange({ ...value, weekly: { ...value.weekly, [id]: Math.max(0, Math.min(MAX_WEEKLY, Math.round((v || 0) * 2) / 2)) } })
  const setMode = (id: string, m: HubMode) => onChange({ ...value, hubMode: { ...value.hubMode, [id]: m } })
  const [detail, setDetail] = useState(false) // 세부설정(비율 입력) 펼침
  const life = lifestyleOf(value)
  const detailKeys: ModeKey[] = value.bike ? ['transit', 'car', 'walk', 'bike'] : ['transit', 'car', 'walk']
  const setW = (k: ModeKey, v: number) => onChange(setLifestyleWeights(value, { ...value.weights, [k]: Math.max(0, Math.min(100, Math.round(v || 0))) }))
  const wSum = detailKeys.reduce((a, k) => a + (value.weights[k] ?? 0), 0)
  // 기본값 = 기본 라이프스타일(대중교통 출퇴근) + 세부설정에서 바꾼 비율 모두 지움
  const reset = () => onChange(kind === 'weights'
    ? applyLifestyle({ ...value, lifeCustom: {}, weights: { ...DEFAULT_PREFERENCE.weights } }, DEFAULT_PREFERENCE.lifestyle!)
    : { ...value, weekly: Object.fromEntries(hubs.map((h) => [h.id, defaultWeekly(h.category)])), hubMode: {} })

  return (
    <div className="popover" ref={box} role="dialog" aria-label={kind === 'weights' ? '라이프스타일 고르기' : '목적지 방문 횟수·이동수단 조정'}>
      <div className="pop-head">
        <b>{kind === 'weights' ? '라이프스타일' : '주 방문 횟수 · 이동수단'}</b>
        <button className="close" aria-label="닫기" onClick={onClose}>×</button>
      </div>
      {kind === 'weights' ? (
        <div className="life-list" role="radiogroup" aria-label="라이프스타일">
          {LIFESTYLES.map((l) => {
            const keys: ModeKey[] = l.bike ? ['transit', 'car', 'walk', 'bike'] : ['transit', 'car', 'walk']
            const sh = weightShares(lifestyleWeights(value, l), keys)
            const on = value.lifestyle === l.id
            return (
              <button type="button" key={l.id} role="radio" aria-checked={on} className={'life-card' + (on ? ' on' : '')} onClick={() => onChange(applyLifestyle(value, l.id))}>
                <span className="life-emoji" aria-hidden>{l.emoji}</span>
                <span className="life-text"><b>{l.label}{value.lifeCustom?.[l.id] ? <i className="life-custom">세부설정</i> : null}</b><small>{l.note}</small>
                  <span className="life-bar" aria-label={keys.map((k) => `${MODE_INFO[k].label} ${sh[k]}%`).join(' · ')}>
                    {keys.map((k) => <i key={k} className={k} style={{ width: `${sh[k]}%` }} />)}
                  </span>
                </span>
              </button>
            )
          })}
          {!value.lifestyle && <p className="sum-note">지금은 예전에 숫자로 정한 비율을 쓰는 중 — 하나를 고르면 바뀝니다.</p>}
          {detail && (
            <div className="life-detail" role="group" aria-label={`${life ? life.label : '직접 정한'} 수단 비율`}>
              <b>{life ? `${life.emoji} ${life.label}` : '직접 정한 비율'} 비율</b>
              {detailKeys.map((k) => (
                <label key={k}><span><span className={`dot ${k}`} />{MODE_INFO[k].label}</span>
                  <span className="unit-input"><input type="number" min={0} max={100} step={5} inputMode="numeric" value={value.weights[k] ?? 0} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setW(k, Number(e.target.value))} /><i>%</i></span>
                </label>
              ))}
              <small className={wSum === 100 ? 'muted' : 'warn'}>합 {wSum}{wSum === 100 ? '' : ` — 100 ${wSum > 100 ? '초과' : '부족'}(비율로 계산)`}</small>
            </div>
          )}
        </div>
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
      <div className="pop-foot">
        {kind === 'weights' && <button type="button" className="link detail-link" aria-expanded={detail} onClick={() => setDetail(!detail)}>세부설정 {detail ? '▴' : '▾'}</button>}
        <button className="ghost" onClick={reset}>기본값</button><span className="spacer" /><button className="solid" onClick={onClose}>완료</button>
      </div>
    </div>
  )
}
