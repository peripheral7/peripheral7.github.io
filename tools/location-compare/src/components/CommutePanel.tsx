import { useState } from 'react'
import type { CandidateResult } from '../scoring'
import { hubEmoji } from '../data'
import { commuteInsight, hm, wonText, type CommuteSettings } from '../commute'
import type { FuelPrice } from '../fuel'

// 입지 요인 아래: 고른 후보지의 출퇴근 인사이트. 하루 = 월 왕복이 가장 많은 목적지 1회 왕복, 한 달 = 모든 목적지의 월 왕복 합.
// 대중교통·차량을 나란히 둔다. 연비·기름값은 여기서 바로 고친다(이 브라우저에 저장).
// 기름값은 기본이 "자동" = 1순위 후보지 시군구의 오피넷 평균(fuelAuto). 직접 넣으면 그 값, "자동"을 누르면 되돌린다.
type Props = {
  r: CandidateResult; trips: Record<string, number>; settings: CommuteSettings
  fuelAuto: FuelPrice | null; fuelManual: boolean; onKmpl: (n: number) => void; onFuel: (n: number | null) => void
}

const num = (v: string, max: number) => Math.max(0, Math.min(max, Number(v) || 0))

export function CommutePanel({ r, trips, settings, fuelAuto, fuelManual, onKmpl, onFuel }: Props) {
  const ins = commuteInsight(r, trips, settings)
  const [draft, setDraft] = useState<{ kmpl?: string; fuel?: string }>({}) // 입력 중인 글자(입력칸을 떠나면 비움)
  const set = (k: 'kmpl' | 'fuel', v: string) => {
    setDraft({ ...draft, [k]: v })
    const n = num(v, k === 'kmpl' ? 60 : 5000)
    if (n > 0) (k === 'kmpl' ? onKmpl : onFuel)(n)
  }
  const done = () => setDraft({})
  const d = fuelAuto?.at ? new Date(fuelAuto.at) : null
  const at = d ? `${d.getMonth() + 1}/${d.getDate()}` : '' // 오피넷에서 받은 날
  if (!ins) return <div className="panel commute"><div className="panel-head"><h2>출퇴근 인사이트</h2></div><p className="muted">목적지를 넣으면 보입니다.</p></div>
  const { main, day, month } = ins
  return (
    <div className="panel commute">
      <div className="panel-head"><h2>출퇴근 인사이트</h2></div>
      <div className="cm-grid">
        <span />
        <b className="cm-col"><i className="dot transit" />대중교통</b>
        <b className="cm-col"><i className="dot car" />차량</b>

        <span className="cm-label">하루 시간<small>{hubEmoji(main.hub.category)} {main.hub.category} 왕복</small></span>
        <em>{hm(day.transitMin)}{day.walked && <small>도보</small>}</em>
        <em>{hm(day.carMin)}</em>

        <span className="cm-label">하루 교통비</span>
        <em>{wonText(day.transitWon)}</em>
        <em>{wonText(day.carWon)}<small>{day.carKm.toFixed(1)}km</small></em>

        <span className="cm-label">월 교통비<small>월 왕복 {month.trips}회</small></span>
        <em className="strong">{wonText(month.transitWon)}</em>
        <em className="strong">{wonText(month.carWon)}</em>

        <span className="cm-label">월 이동 시간</span>
        <em>{hm(month.transitMin)}</em>
        <em>{hm(month.carMin)}</em>
      </div>
      <div className="cm-inputs">
        <label>연비<span className="unit-input"><input type="number" min={1} max={60} step={0.5} inputMode="decimal" value={draft.kmpl ?? String(settings.kmpl)} onChange={(e) => set('kmpl', e.target.value)} onBlur={done} /><i>km/L</i></span></label>
        <label>기름값<span className="unit-input"><input type="number" min={1} max={5000} step={10} inputMode="numeric" value={draft.fuel ?? String(settings.fuel)} onChange={(e) => set('fuel', e.target.value)} onBlur={done} /><i>원/L</i></span>
          <small className="cm-src">{fuelManual
            ? <>직접 입력 · <button type="button" onClick={() => { done(); onFuel(null) }}>자동</button></>
            : fuelAuto ? `오피넷 ${fuelAuto.area} 평균${at ? ` · ${at}` : ''}` : '기본값'}</small></label>
      </div>
    </div>
  )
}
