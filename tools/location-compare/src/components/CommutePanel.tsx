import { useState } from 'react'
import type { CandidateResult } from '../scoring'
import { hubEmoji } from '../data'
import { commuteInsight, hm, wonText, type CommuteSettings } from '../commute'
import type { FuelPrice } from '../fuel'
import { catName, pn, t } from '../i18n'

// 입지 요인 아래: 고른 후보지의 출퇴근 인사이트. 하루 = 주 방문이 가장 많은 목적지 1회 왕복, 한 달 = 모든 목적지의 (주 방문 × 4주) 왕복 합.
// 대중교통·차량을 나란히 둔다. 연비·기름값은 여기서 바로 고친다(이 브라우저에 저장).
// 기름값은 기본이 "자동" = 1순위 후보지 시군구의 오피넷 평균(fuelAuto). 직접 넣으면 그 값, "자동"을 누르면 되돌린다.
type Props = {
  r: CandidateResult; weekly: Record<string, number>; settings: CommuteSettings
  fuelAuto: FuelPrice | null; fuelManual: boolean; onKmpl: (n: number) => void; onFuel: (n: number | null) => void
}

const num = (v: string, max: number) => Math.max(0, Math.min(max, Number(v) || 0))

export function CommutePanel({ r, weekly, settings, fuelAuto, fuelManual, onKmpl, onFuel }: Props) {
  const ins = commuteInsight(r, weekly, settings)
  const [draft, setDraft] = useState<{ kmpl?: string; fuel?: string }>({}) // 입력 중인 글자(입력칸을 떠나면 비움)
  const set = (k: 'kmpl' | 'fuel', v: string) => {
    setDraft({ ...draft, [k]: v })
    const n = num(v, k === 'kmpl' ? 60 : 5000)
    if (n > 0) (k === 'kmpl' ? onKmpl : onFuel)(n)
  }
  const done = () => setDraft({})
  const d = fuelAuto?.at ? new Date(fuelAuto.at) : null
  const at = d ? `${d.getMonth() + 1}/${d.getDate()}` : '' // 오피넷에서 받은 날
  if (!ins) return <div className="panel commute"><div className="panel-head"><h2>{t('출퇴근 인사이트', 'Commute insights')}</h2></div><p className="muted">{t('목적지를 넣으면 보입니다.', 'Add a destination to see this.')}</p></div>
  const { main, day, month } = ins
  // 대중교통 자료가 아직 없는 후보지(검색으로 넣은 곳)는 대중교통 칸을 비운다 — 걸어가는 경우(도보 10분 이내)는 그대로
  const tp = main.transitPending
  const dev = <em className="muted">{t('개발 중', 'in progress')}</em>
  return (
    <div className="panel commute">
      <div className="panel-head"><h2>{t('출퇴근 인사이트', 'Commute insights')}</h2></div>
      <div className="cm-grid">
        <span />
        <b className="cm-col"><i className="dot transit" />{t('대중교통', 'Transit')}</b>
        <b className="cm-col"><i className="dot car" />{t('차량', 'Car')}</b>

        <span className="cm-label">{t('하루 시간', 'Time per day')}<small>{hubEmoji(main.hub.category)} {t(`${main.hub.category} 왕복`, `${catName(main.hub.category)} round trip`)}</small></span>
        {tp && !day.walked ? dev : <em>{hm(day.transitMin)}{day.walked && <small>{t('도보', 'walk')}</small>}</em>}
        <em>{hm(day.carMin)}</em>

        <span className="cm-label">{t('하루 교통비', 'Cost per day')}</span>
        {tp && !day.walked ? dev : <em>{wonText(day.transitWon)}</em>}
        <em>{wonText(day.carWon)}<small>{day.carKm.toFixed(1)}km</small></em>

        <span className="cm-label">{t('월 교통비', 'Cost per month')}<small>{t(`월 왕복 ${Math.round(month.trips * 10) / 10}회(주 방문 × 4)`, `${Math.round(month.trips * 10) / 10} round trips/month (weekly × 4)`)}</small></span>
        {tp ? dev : <em className="strong">{wonText(month.transitWon)}</em>}
        <em className="strong">{wonText(month.carWon)}</em>

        <span className="cm-label">{t('월 이동 시간', 'Time per month')}</span>
        {tp ? dev : <em>{hm(month.transitMin)}</em>}
        <em>{hm(month.carMin)}</em>
      </div>
      <div className="cm-inputs">
        <label>{t('연비', 'Fuel economy')}<span className="unit-input"><input type="number" min={1} max={60} step={0.5} inputMode="decimal" value={draft.kmpl ?? String(settings.kmpl)} onChange={(e) => set('kmpl', e.target.value)} onBlur={done} /><i>km/L</i></span></label>
        <label>{t('기름값', 'Fuel price')}<span className="unit-input"><input type="number" min={1} max={5000} step={10} inputMode="numeric" value={draft.fuel ?? String(settings.fuel)} onChange={(e) => set('fuel', e.target.value)} onBlur={done} /><i>{t('원/L', '₩/L')}</i></span>
          <small className="cm-src">{fuelManual
            ? <>{t('직접 입력', 'Manual')} · <button type="button" onClick={() => { done(); onFuel(null) }}>{t('자동', 'Auto')}</button></>
            : fuelAuto ? t(`오피넷 ${fuelAuto.area} 평균${at ? ` · ${at}` : ''}`, `Opinet ${pn(fuelAuto.area)} avg.${at ? ` · ${at}` : ''}`) : t('기본값', 'Default')}</small></label>
      </div>
    </div>
  )
}
