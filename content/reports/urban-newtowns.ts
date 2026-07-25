export const urbanNewtownsMeta = {
  eyebrow: "Urban Economics · New Town Comparison",
  title: "광교 · 동탄 · 운정 신도시 아파트 가격 결정요인 비교연구",
  subtitle:
    "OSM 기반 접근성 변수, 상업시설 중력지수(gravity index), DBSCAN 클러스터링을 결합해 세 신도시의 공간구조 차이를 지도로 시각화하고, 헤도닉 회귀 및 공간자기상관 분석(Moran's I, SAR/SEM/SDM)을 통해 지역 간 이질성을 검증했습니다.",
  tags: ["Urban Economics", "Hedonic Model", "Spatial Analysis"],
}

export const urbanNewtownsMaps = [
  {
    id: "gwanggyo",
    label: "광교 (Gwanggyo)",
    tag: "Cluster 01",
    src: "/reports/03_03_map_integrated_Gwanggyo_200_cluster_interactive.html",
  },
  {
    id: "dongtan",
    label: "동탄 (Dongtan)",
    tag: "Cluster 02",
    src: "/reports/03_03_map_integrated_Dongtan_200_cluster_interactive.html",
  },
  {
    id: "unjeong",
    label: "운정 (Unjeong)",
    tag: "Cluster 03",
    src: "/reports/03_03_map_integrated_Unjeong_200_cluster_interactive.html",
  },
]

export const urbanNewtownsResultReport = "/reports/06_interactive_report.html"