export const urbanNewtownsMeta = {
  eyebrow: "Urban Economics · New Town Comparison",
  title: "신도시 아파트 가격 결정요인 비교연구",
  subtitle:
    "광교 · 동탄2 남부 · 동탄2 북부 · 운정 4개 지역의 실거래 2,740건을 단지 단위 121개로 집계하고, 공원까지의 거리를 도시계획시설 결정경계 폴리곤까지의 최단거리로 측정해 헤도닉 회귀로 검증했습니다. 계획적으로 조성된 신도시에서는 '가장 가까운 공원까지의 거리'가 네 지역 모두 146~168m로 수렴해 변별력을 잃으며, 어느 규모의 공원인지를 지정하는 것만으로 계수가 0에서 유의한 부(−)의 값으로 이동합니다. 동탄2는 남/북이 서로 이질적인 지역임이 확인되어 별개 지역으로 분리 추정했습니다.",
  tags: ["Urban Economics", "Hedonic Model", "Spatial Analysis"],
}

// [2026-09-01] 인터랙티브 folium 지도(iframe 3종)는 제거하고 정적 이미지로 대체했다.
// [2026-09-04] 동탄2 남/북 분리에 따라 지도가 4장이 되었고, 지도 데이터는
//   content/reports/park-capitalization.ts 의 parkCapMaps 에서 관리한다.
//   하단 "기초통계 및 단계별 분석 (Interactive Report)" 섹션은 기초통계가 본문에
//   포함되면서 통째로 제거했다(06_interactive_report.html 임베드 해제).
