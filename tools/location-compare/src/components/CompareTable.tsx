import { fmt, type CandidateResult } from '../scoring'
import type { Hub } from '../data'

// 아래쪽 넓은 칸: 모든 후보지를 한 표에서 비교한다. 줄을 누르면 그 후보지를 고른다.
type Props = { results: CandidateResult[]; hubs: Hub[]; active: number; onSelect: (index: number) => void }

export function CompareTable({ results, hubs, active, onSelect }: Props) {
  // 열마다 가장 높은 점수를 강조한다
  const best = (pick: (r: CandidateResult) => number | null) => Math.max(...results.map((r) => pick(r) ?? -1))
  const bestTotal = best((r) => r.total)
  const bestHub = hubs.map((_, i) => ({
    hub: best((r) => r.hubs[i].hubScore),
    transit: best((r) => r.hubs[i].scores.transit),
    car: best((r) => r.hubs[i].scores.car),
    walk: best((r) => r.hubs[i].scores.walk),
  }))
  const cls = (v: number | null, b: number) => (v !== null && Math.abs(v - b) < 1e-9 ? 'best' : '')
  const order = results.map((r, i) => ({ r, i })).sort((a, b) => a.r.rank - b.r.rank)

  return (
    <div className="glass compare">
      <div className="compare-head">
        <div><h2>모든 후보지 비교</h2><small>종합 순위순 · 열마다 가장 높은 점수를 밝게 · 줄을 누르면 그 후보지를 지도와 카드에 띄웁니다</small></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th rowSpan={2} className="left">순위 · 후보지</th>
              <th rowSpan={2}>종합</th>
              {hubs.map((h, i) => <th key={h.id} colSpan={4} className="group"><span className="hub-mark">{i + 1}</span>{h.category} · {h.name}</th>)}
            </tr>
            <tr>
              {hubs.map((h) => [
                <th key={h.id + 's'} className="sub">점수</th>,
                <th key={h.id + 't'} className="sub">대중교통</th>,
                <th key={h.id + 'c'} className="sub">차량 출퇴근/여유</th>,
                <th key={h.id + 'w'} className="sub">도보</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {order.map(({ r, i }) => (
              <tr key={r.candidate.id} className={i === active ? 'on' : ''} onClick={() => onSelect(i)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(i) } }}>
                <td className="left"><span className="rank">{r.rank}</span><b>{r.candidate.name}</b><small>{i + 1}번 핀</small></td>
                <td className={'big ' + cls(r.total, bestTotal)}>{fmt(r.total)}</td>
                {r.hubs.map((h, hi) => [
                  <td key={h.hub.id + 's'} className={'mid ' + cls(h.hubScore, bestHub[hi].hub)}>{fmt(h.hubScore)}</td>,
                  <td key={h.hub.id + 't'} className={cls(h.scores.transit, bestHub[hi].transit)}>{h.trip.transit}분<i>{fmt(h.scores.transit)}</i></td>,
                  <td key={h.hub.id + 'c'} className={cls(h.scores.car, bestHub[hi].car)}>{h.trip.carRush}/{h.trip.carFree}분<i>{fmt(h.scores.car)}</i></td>,
                  <td key={h.hub.id + 'w'} className={cls(h.scores.walk, bestHub[hi].walk)}>{h.scores.walk !== null ? <>{h.trip.walk}분<i>{fmt(h.scores.walk)}</i></> : <span className="none">—</span>}</td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
