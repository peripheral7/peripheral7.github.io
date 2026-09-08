export const urbanNewtownsMeta = {
  eyebrow: "Urban Economics · New Town Comparison",
  title: "신도시 아파트 가격 결정요인 비교연구",
  subtitle:
    "광교 · 동탄2 남부 · 동탄2 북부 · 운정 4개 지역의 실거래 2,740건을 단지 단위 121개로 집계해, 공원 접근성이 아파트 가격에 자본화되는 정도를 헤도닉 회귀로 검증했습니다. 공원 변수의 조작화만 네 단계로 바꿔가며 계수의 이동을 추적한 결과, 통합 지표가 규모별로 상반된 효과를 상쇄시켜 공원 효과를 지우거나 엉뚱한 규모에 귀속시킨다는 점이 드러났습니다. 동탄2는 남/북이 서로 이질적인 지역임이 확인되어 별개 지역으로 분리 추정했습니다.",
  tags: ["Urban Economics", "Hedonic Model", "Spatial Analysis"],
}

// [2026-09-01] 인터랙티브 folium 지도(iframe 3종)는 제거하고 정적 이미지로 대체했다.
// [2026-09-04] 동탄2 남/북 분리에 따라 지도가 4장이 되었고, 지도 데이터는
//   content/reports/park-capitalization.ts 의 parkCapMaps 에서 관리한다.
//   하단 "기초통계 및 단계별 분석 (Interactive Report)" 섹션은 기초통계가 본문에
//   포함되면서 통째로 제거했다(06_interactive_report.html 임베드 해제).
