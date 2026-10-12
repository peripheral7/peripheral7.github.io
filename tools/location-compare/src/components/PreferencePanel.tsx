import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Hub, MobilityPreference } from '../types'
type Props = { hubs: Hub[]; onSaved: () => void }
const modes = ['대중교통', '차량', '도보·자전거']
const initialPreference: MobilityPreference = { primary_modes: ['대중교통'], secondary_modes: ['차량'], transit_weight: 50, car_weight: 30, active_weight: 20, transit_priority_hub_ids: [], hub_monthly_roundtrips: {}, hub_weight_multipliers: {} }
export function PreferencePanel({ hubs, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<MobilityPreference>(initialPreference)
  const [error, setError] = useState('')
  useEffect(() => {
    api('preferences')
      .then(response => response.ok ? response.json() : Promise.reject())
      .then((saved: MobilityPreference) => setData({ ...initialPreference, ...saved, hub_monthly_roundtrips: saved.hub_monthly_roundtrips ?? {}, hub_weight_multipliers: saved.hub_weight_multipliers ?? {} }))
      .catch(() => setError('선호도 설정을 불러오지 못했습니다.'))
  }, [])
  const toggle = (key: 'primary_modes' | 'secondary_modes', mode: string) => setData(current => ({ ...current, [key]: current[key].includes(mode) ? current[key].filter(item => item !== mode) : [...current[key], mode] }))
  const toggleHub = (id: number) => setData(current => ({ ...current, transit_priority_hub_ids: current.transit_priority_hub_ids.includes(id) ? current.transit_priority_hub_ids.filter(item => item !== id) : [...current.transit_priority_hub_ids, id] }))
  const setRoundTrips = (id: number, value: string) => {
    const parsed = Math.max(0, Math.min(60, Number.parseInt(value || '0', 10) || 0))
    setData(current => ({ ...current, hub_monthly_roundtrips: { ...current.hub_monthly_roundtrips, [String(id)]: parsed } }))
  }
  const save = async () => {
    if (!data.primary_modes.length && !data.secondary_modes.length) return setError('주요 또는 보조 이동수단을 한 가지 이상 선택해 주세요.')
    if (hubs.length && hubs.every(hub => (data.hub_monthly_roundtrips[String(hub.id)] ?? 0) === 0)) return setError('월 왕복 횟수를 한 곳 이상 입력해 주세요.')
    setError('')
    try {
      const response = await api('preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!response.ok) throw Error()
      setOpen(false); onSaved()
    } catch { setError('선호도 저장에 실패했습니다. 다시 시도해 주세요.') }
  }
  return <>
    <button className="secondary-button" onClick={() => setOpen(true)}>교통 선호도 설정</button>
    {open && <div className="preference-overlay" role="dialog" aria-modal="true" aria-label="교통 선호도 설정">
      <section className="preference-dialog">
        <div className="preference-dialog-head"><div><p className="eyebrow">MOBILITY PREFERENCE</p><h3>교통 선호도 설정</h3></div><button className="dialog-close" onClick={() => setOpen(false)} aria-label="교통 선호도 설정 닫기">×</button></div>
        <div className="preference-form">
          <div className="preference-group"><b>주요 이동수단 <small>복수 선택</small></b><div>{modes.map(mode => <label key={mode}><input type="checkbox" checked={data.primary_modes.includes(mode)} onChange={() => toggle('primary_modes', mode)} />{mode}</label>)}</div></div>
          <div className="preference-group"><b>보조 이동수단 <small>복수 선택</small></b><div>{modes.map(mode => <label key={mode}><input type="checkbox" checked={data.secondary_modes.includes(mode)} onChange={() => toggle('secondary_modes', mode)} />{mode}</label>)}</div></div>
          <div className="preference-group"><b>대중교통 우선 거점</b><div className="priority-hubs">{hubs.length ? hubs.map(hub => <label key={hub.id}><input type="checkbox" checked={data.transit_priority_hub_ids.includes(hub.id)} onChange={() => toggleHub(hub.id)} />{hub.category} · {hub.name}</label>) : <span>저장된 주요 거점이 없습니다.</span>}</div></div>
          <div className="preference-group hub-weight-section"><b>거점별 월 왕복 횟수</b><p>생활 이동 종합점수는 월 왕복 횟수를 반영해 산정합니다. 0회 거점은 계산에서 제외되며, 횟수가 많을수록 영향이 더 커집니다. 이동 접근성은 10점 만점입니다.</p><div className="hub-frequency-list">{hubs.length ? hubs.map(hub => <div key={hub.id} className="hub-frequency-row"><span><b>{hub.category}</b> · {hub.name}</span><label><small>월 왕복</small><input type="number" min="0" max="60" inputMode="numeric" value={data.hub_monthly_roundtrips[String(hub.id)] ?? 0} onChange={event => setRoundTrips(hub.id, event.target.value)} aria-label={`${hub.name} 월 왕복 횟수`} /><em>회</em></label></div>) : <span>저장된 주요 거점이 없습니다.</span>}</div></div>
          {error && <p className="form-error">{error}</p>}<div className="preference-actions"><button className="secondary-button" onClick={() => setOpen(false)}>취소</button><button className="primary-button" onClick={save}>선호도 저장 및 지수 반영</button></div>
        </div>
      </section>
    </div>}
  </>
}
