import { useEffect } from 'react'
import { MAX_HUBS } from '../data'
import { TRANSIT_PARTS, WALK_LIMIT } from '../scoring'

// 화면 안의 "계산 방식" 안내. 더 자세한 설명과 예시는 tools/location-compare/README.md.
export function GuidePanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const pct = (x: number) => `${Math.round(x * 100)}%`

  return (
    <div className="overlay" onClick={onClose}>
      <section className="glass drawer guide" role="dialog" aria-modal="true" aria-label="계산 방식 안내" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><div><small>HOW IT WORKS</small><h2>기능과 계산 방식</h2></div><button className="close" aria-label="닫기" onClick={onClose}>×</button></div>

        <h3>1. 화면 구성</h3>
        <ul>
          <li><b>지도</b> — 번호 원은 후보지, 마름모는 주요 방문지. 선택한 후보지에서 방문지까지 점선을 긋습니다. 핀을 누르면 그 후보지 카드로 넘어갑니다.</li>
          <li><b>후보지 카드</b> — 좌우로 넘겨 후보지를 바꿉니다. 한 장에 종합 점수와 방문지(최대 {MAX_HUBS}곳)별 대중교통·차량·도보 세부 내용이 있습니다.</li>
          <li><b>교통 선호도</b> — 수단 가중치와 방문지별 월 왕복 횟수를 바꾸면 점수가 바로 다시 계산됩니다.</li>
        </ul>

        <h3>2. 이동 시간(가상 추정)</h3>
        <p>길찾기 API 없이 <b>두 지점의 직선거리(km)</b>로만 추정합니다. 같은 거리면 같은 시간이 나옵니다.</p>
        <ul>
          <li>도보 = 거리 ÷ 시속 4.7km</li>
          <li>대중교통 = 역·정류장까지 도보(4분 + 거리×0.7분, 3~18분) + 대기(5분 + 거리÷6, 최대 +7분) + 탑승(시속 22km) + 환승(3km 이하 0회 · 12km 이하 1회 · 그 이상 2회, 1회당 5분)</li>
          <li>차량 여유 = 거리 ÷ 시속 31km + 3분 · 출퇴근 = 여유 × 1.52 + 4분</li>
        </ul>

        <h3>3. 수단별 점수 (10점 만점)</h3>
        <ul>
          <li><b>대중교통 — 후보지끼리 상대 비교.</b> 같은 방문지를 두고 대기·도보·환승 각각에서 가장 좋은 후보지가 10점, 나머지는 <code>10 × 최솟값 ÷ 내 값</code>(환승은 0회도 나눌 수 있게 각각 +1). 세 항목을 대기 {pct(TRANSIT_PARTS.wait)} · 도보 {pct(TRANSIT_PARTS.access)} · 환승 {pct(TRANSIT_PARTS.transfers)}로 합칩니다. 탑승 시간은 점수에 넣지 않고 표시만 합니다.</li>
          <li><b>차량 — 후보지끼리 상대 비교.</b> 정체 배율 = 출퇴근 ÷ 여유 시간. 배율이 가장 낮은 후보지가 10점, 나머지는 <code>10 × 최저 배율 ÷ 내 배율</code>.</li>
          <li><b>도보 — 시간만.</b> 5분 이하 10점, {WALK_LIMIT}분 0점 사이 직선. <b>{WALK_LIMIT}분을 넘으면 카드에 표시하지 않고 계산에서도 뺍니다.</b></li>
        </ul>

        <h3>4. 가중치와 종합 점수</h3>
        <ul>
          <li><b>방문지 점수</b> = 수단별 점수를 수단 가중치로 가중 평균. 가중치는 합이 100이 아니어도 비율로 씁니다.</li>
          <li><b>도보가 30분을 넘는 경우</b> — 그 방문지에 걸어갈 수 있는 후보지가 하나라도 있으면, 못 걷는 후보지는 도보 <b>0점</b>으로 계산합니다(빼 버리면 못 걷는 쪽이 오히려 유리해지기 때문). 아무 후보지도 걸어갈 수 없는 방문지(예: 본가)는 도보를 빼고 대중교통·차량 가중치만으로 다시 나눕니다.</li>
          <li><b>종합 점수</b> = 방문지 점수를 <b>월 왕복 횟수 비율</b>로 가중 평균(카드의 "반영 %"). 횟수가 모두 0이면 방문지를 똑같이 봅니다.</li>
          <li>순위는 종합 점수 순입니다. 상대 비교라서 후보지를 바꾸면 다른 후보지의 대중교통·차량 점수도 바뀔 수 있습니다.</li>
        </ul>

        <h3>5. 한계</h3>
        <ul>
          <li>실제 노선·배차·도로 정체는 반영하지 않은 추정입니다. 길찾기 API를 붙이면 2번만 바꾸면 됩니다.</li>
          <li>지금의 차량 공식(출퇴근 = 여유 × 1.52 + 4분)에서는 거리가 짧을수록 정체 배율이 커져, 가까운 후보지의 차량 점수가 낮게 나옵니다. 실제 교통 자료가 들어오면 사라질 성질입니다.</li>
          <li>후보지 주소는 임시 입력이며, 주소 검색은 추후 추가 예정입니다.</li>
        </ul>
      </section>
    </div>
  )
}
