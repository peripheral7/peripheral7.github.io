import { fmt, WALK_LIMIT, type CandidateResult } from '../scoring'
import type { Hub } from '../data'

// 아래쪽: 후보지 카드를 가로로 늘어놓는다. 모든 카드가 같은 줄(행)을 공유해서(CSS subgrid)
// "대중교통" 줄을 옆으로 읽으면 후보지끼리 대기·역까지 도보·환승을, "차량" 줄은 출퇴근/낮 차이를 바로 비교할 수 있다.

type Props = { results: CandidateResult[]; hubs: Hub[]; active: number; onSelect: (index: number) => void }

// 점수(0~10)만큼 칸 아래쪽에 색 선을 채운다 — 숫자를 읽지 않아도 길이로 바로 비교된다.
const Line = ({ v, kind }: { v: number; kind: 'total' | 'hub' | 'transit' | 'car' | 'walk' }) => (
  <i className={`score-line ${kind}`} style={{ '--v': Math.max(0, Math.min(10, v)) / 10 } as React.CSSProperties} aria-hidden />
)

export function CompareCards({ results, hubs, active, onSelect }: Props) {
  const rows = 1 + hubs.length * 4
  const best = (pick: (r: CandidateResult) => number | null) => Math.max(...results.map((r) => pick(r) ?? -1))
  const isBest = (v: number | null, b: number) => v !== null && Math.abs(v - b) < 1e-9 && results.length > 1

  return (
    <div className="panel compare">
      <div className="panel-head"><h2>후보지별 비교</h2><small className="muted">점수 높은 순 · 같은 줄을 옆으로 읽으면 비교됩니다 · 카드를 누르면 그 후보지를 지도에</small></div>
      <div className="cards-scroll">
        <div className="cards-grid" style={{ gridTemplateRows: `repeat(${rows}, auto)`, gridTemplateColumns: `112px repeat(${results.length}, minmax(232px, 1fr))` }}>
          {/* 왼쪽 줄 이름 */}
          <div className="col labels" style={{ gridRow: `1 / span ${rows}` }}>
            <div className="cell head-cell"><span className="muted">후보지</span></div>
            {hubs.map((h, i) => [
              <div key={h.id + 'h'} className="cell hub-cell"><span className="hub-mark">{i + 1}</span><span>{h.category}</span></div>,
              <div key={h.id + 't'} className="cell row-label"><span className="dot transit" />대중교통</div>,
              <div key={h.id + 'c'} className="cell row-label"><span className="dot car" />차량</div>,
              <div key={h.id + 'w'} className="cell row-label"><span className="dot walk" />도보</div>,
            ])}
          </div>

          {results.map((r, i) => ({ r, i })).sort((a, b) => a.r.rank - b.r.rank).map(({ r, i }) => (
            <button key={r.candidate.id} className={'col card' + (i === active ? ' on' : '')} style={{ gridRow: `1 / span ${rows}` }} onClick={() => onSelect(i)}>
              <div className="cell head-cell">
                <span className="rank">{r.rank}</span>
                <div className="card-name"><b>{r.candidate.name}</b><small>{i + 1}번 핀 · {r.candidate.address}</small></div>
                <strong className={isBest(r.total, best((x) => x.total)) ? 'best' : ''}>{fmt(r.total)}<Line v={r.total} kind="total" /></strong>
              </div>
              {r.hubs.map((h, hi) => {
                const t = h.trip, s = h.scores
                const diff = t.carRush - t.carFree
                const { free, rush } = t.carSource
                const measured = free && rush ? ' · 네이버 실측' : free ? ' · 낮 실측·출퇴근 추정' : rush ? ' · 출퇴근 실측·낮 추정' : ' · 거리 추정'
                return [
                  <div key={h.hub.id + 'h'} className="cell hub-cell"><span>{h.hub.name}</span><small>{t.km.toFixed(1)}km · 반영 {Math.round(h.share * 100)}%</small><b className={isBest(h.hubScore, best((x) => x.hubs[hi].hubScore)) ? 'best' : ''}>{fmt(h.hubScore)}<Line v={h.hubScore} kind="hub" /></b></div>,
                  <div key={h.hub.id + 't'} className="cell mode-cell">
                    <div><b>{t.transit}분</b><small>대기 {t.wait}분 · 정류장까지 도보 {t.access}분 · 환승 {t.transfers}회</small></div>
                    <em className={isBest(s.transit, best((x) => x.hubs[hi].scores.transit)) ? 'best' : ''}>{fmt(s.transit)}<Line v={s.transit} kind="transit" /></em>
                  </div>,
                  <div key={h.hub.id + 'c'} className="cell mode-cell">
                    <div><b>출퇴근 {t.carRush}분 · 낮 {t.carFree}분</b><small>차이 +{diff}분 ({s.carRatio.toFixed(2)}배){measured}</small></div>
                    <em className={isBest(s.car, best((x) => x.hubs[hi].scores.car)) ? 'best' : ''}>{fmt(s.car)}<Line v={s.car} kind="car" /></em>
                  </div>,
                  <div key={h.hub.id + 'w'} className="cell mode-cell">
                    {s.walk !== null
                      ? <><div><b>{t.walk}분</b><small>걸어서</small></div><em className={isBest(s.walk, best((x) => x.hubs[hi].scores.walk)) ? 'best' : ''}>{fmt(s.walk)}<Line v={s.walk} kind="walk" /></em></>
                      : <div><span className="muted">{WALK_LIMIT}분 초과{h.walkCounts ? ' · 0점으로 계산' : ''}</span></div>}
                  </div>,
                ]
              })}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
