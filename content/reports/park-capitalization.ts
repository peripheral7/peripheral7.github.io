// 신도시 4곳 헤도닉모형 종합결과 — 동탄2를 남/북 이질적 지역으로 분리한 이후 재추정
// 출처: KICA 논문작성 파이프라인 05_* 산출물 (2026-09-04 실행분)

export type StatCell = { v: string; t?: string; muted?: boolean }
export type StatRow = { label: string; cells: StatCell[]; strong?: boolean; fit?: boolean }
export type StatTable = { caption: string; head: string[]; rows: StatRow[]; note?: string }

export const REGION_KEYS = ["gg", "ds", "dn", "uj"] as const
export type RegionKey = (typeof REGION_KEYS)[number]

export const parkCapRegions: { key: RegionKey; label: string; sub: string }[] = [
  { key: "gg", label: "광교", sub: "Gwanggyo" },
  { key: "ds", label: "동탄남부", sub: "Dongtan South" },
  { key: "dn", label: "동탄북부", sub: "Dongtan North" },
  { key: "uj", label: "운정", sub: "Unjeong" },
]

export const parkCapMeta = {
  eyebrow: "Hedonic Price Analysis · 2026-09-04",
  title: "신도시 4곳 헤도닉모형 종합결과",
  summary:
    "공원 접근성이 아파트 가격에 미치는 자본화 효과 — 동탄2를 남/북 이질적 지역으로 분리한 이후 재추정한 전체 통계분석 결과입니다.",
}

export const parkCapFacts = [
  { label: "표본", value: "2,740건" },
  { label: "단지", value: "126개" },
  { label: "지역", value: "4곳" },
  { label: "종속변수", value: "ln(만원/㎡)" },
  { label: "최종모형", value: "SEM (공간오차)" },
]

// §00 핵심 요약
export const parkCapFindings = [
  {
    label: "풀링 적합성 (Chow Test)",
    value: "F = 418.1",
    accent: false,
    note: "p<0.001 — 4개 지역을 하나로 합쳐 분석하는 것은 통계적으로 부적절. 지역별 개별 모형이 타당함.",
  },
  {
    label: "공원거리 탄력성 (SEM, 4개 지역)",
    value: "−0.06 ~ −0.15",
    accent: true,
    note: "전부 1~5% 수준 유의. OLS(baseline)에서 동탄북부만 비유의했으나 SEM에서는 4개 지역 전부 유의한 공원 프리미엄이 드러남.",
  },
  {
    label: "동탄남부 vs 동탄북부",
    value: "−0.15 / −0.06",
    accent: false,
    note: "같은 동탄2 안에서도 남/북 공원 프리미엄이 2.5배 차이 — 인위적 분할선이 아니라 실제 이질적 지역임을 재확인.",
  },
  {
    label: "공간자기상관 (Moran's I)",
    value: "0.45 ~ 0.88",
    accent: false,
    note: "4개 지역 전부 p<0.001로 유의 — OLS 대신 공간계량모형(SEM) 채택 근거.",
  },
]

// 지역별 클러스터 지도 (2×2, 클릭 확대)
export const parkCapMaps = [
  { key: "gg" as RegionKey, label: "광교", sub: "Gwanggyo", src: "/images/reports/urban-newtowns/Gwanggyo_cluster.jpg" },
  { key: "ds" as RegionKey, label: "동탄남부", sub: "Dongtan South", src: "/images/reports/urban-newtowns/Dongtan_South_cluster.jpg" },
  { key: "dn" as RegionKey, label: "동탄북부", sub: "Dongtan North", src: "/images/reports/urban-newtowns/Dongtan_North_cluster.jpg" },
  { key: "uj" as RegionKey, label: "운정", sub: "Unjeong", src: "/images/reports/urban-newtowns/Unjeong_cluster.jpg" },
]

// §01 표본 개요
export const parkCapSample = [
  { key: "gg" as RegionKey, label: "광교", rows: [["거래건수", "537"], ["단지 수", "21"], ["R² (Gravity)", "0.97"], ["공원거리 β (SEM)", "−0.13**"]] },
  { key: "ds" as RegionKey, label: "동탄남부", rows: [["거래건수", "853"], ["단지 수", "34"], ["R² (Gravity)", "0.75"], ["공원거리 β (SEM)", "−0.15***"]] },
  { key: "dn" as RegionKey, label: "동탄북부", rows: [["거래건수", "901"], ["단지 수", "44"], ["R² (Gravity)", "0.87"], ["공원거리 β (SEM)", "−0.06***"]] },
  { key: "uj" as RegionKey, label: "운정", rows: [["거래건수", "449"], ["단지 수", "27"], ["R² (Gravity)", "0.92"], ["공원거리 β (SEM)", "−0.09***"]] },
]

const HEAD4 = ["변수", "광교", "동탄남부", "동탄북부", "운정"]

// §02 기술통계 · VIF
export const parkCapVifTable: StatTable = {
  caption: "표 1 · 변수별 평균(표준편차) / VIF",
  head: HEAD4,
  rows: [
    { label: "Building Age (yrs)", cells: [{ v: "12.71 (2.35) / 2.27" }, { v: "8.08 (1.07) / 2.27" }, { v: "9.36 (1.87) / 1.66" }, { v: "16.72 (5.71) / 3.14" }] },
    { label: "Households (log)", cells: [{ v: "6.91 (0.60) / 1.59" }, { v: "6.95 (0.31) / 1.70" }, { v: "6.67 (0.43) / 1.41" }, { v: "7.00 (0.33) / 1.35" }] },
    { label: "Major Brand (dummy)", cells: [{ v: "0.31 (0.46) / 2.84" }, { v: "0.23 (0.42) / 2.04" }, { v: "0.15 (0.36) / 1.20" }, { v: "0.26 (0.44) / 1.90" }] },
    { label: "Parking / Household", cells: [{ v: "1.41 (0.15) / 3.80" }, { v: "1.21 (0.12) / 1.94" }, { v: "1.28 (0.18) / 1.13" }, { v: "1.34 (0.22) / 2.14" }] },
    { label: "Floor", cells: [{ v: "15.08 (9.36) / 1.18" }, { v: "11.58 (6.18) / 1.01" }, { v: "14.42 (9.30) / 1.27" }, { v: "11.16 (6.65) / 1.09" }] },
    { label: "Exclusive Area (log, m²)", cells: [{ v: "4.37 (0.14) / 1.45" }, { v: "4.28 (0.17) / 2.23" }, { v: "4.30 (0.16) / 1.12" }, { v: "4.36 (0.14) / 1.12" }] },
    { label: "Straight Dist. to Park (log)", cells: [{ v: "6.37 (0.51) / 1.81" }, { v: "6.47 (0.63) / 2.95" }, { v: "6.44 (0.73) / 2.77" }, { v: "6.33 (0.46) / 1.33" }] },
    { label: "Dist. to Subway (log)", cells: [{ v: "6.42 (0.98) / 5.76" }, { v: "8.13 (0.21) / 1.59" }, { v: "7.01 (0.66) / 3.94" }, { v: "6.91 (0.45) / 4.02" }] },
    { label: "Life-Amenity Gravity", cells: [{ v: "5.05 (1.36) / 1.74" }, { v: "2.09 (0.42) / 2.67" }, { v: "3.94 (1.12) / 2.76" }, { v: "3.41 (0.36) / 3.34" }] },
  ],
  note: "셀 표기: 평균 (표준편차) / VIF. 동탄남/북부의 지하철거리 VIF는 동탄역 남/북 공유 처리 이후 값. 전 지역 VIF 10 미만으로 다중공선성 문제 없음(층/층제곱 제거 이후 안정화).",
}

// §03 Baseline OLS
export const parkCapBaselineTable: StatTable = {
  caption: "표 2 · Baseline OLS (상권 제외)",
  head: HEAD4,
  rows: [
    { label: "Building Age (yrs)", cells: [{ v: "−0.06***", t: "(−3.33)" }, { v: "−0.01", t: "(−0.94)", muted: true }, { v: "0.03***", t: "(3.20)" }, { v: "−0.02***", t: "(−6.37)" }] },
    { label: "Households (log)", cells: [{ v: "0.09", t: "(1.66)", muted: true }, { v: "0.05", t: "(0.93)", muted: true }, { v: "−0.04", t: "(−1.35)", muted: true }, { v: "0.02", t: "(0.50)", muted: true }] },
    { label: "Major Brand (dummy)", cells: [{ v: "0.01", t: "(0.23)", muted: true }, { v: "0.14***", t: "(4.05)" }, { v: "−0.05", t: "(−1.68)", muted: true }, { v: "0.01", t: "(0.38)", muted: true }] },
    { label: "Parking / Household", cells: [{ v: "−0.47", t: "(−1.37)", muted: true }, { v: "−0.22", t: "(−1.42)", muted: true }, { v: "0.18", t: "(1.48)", muted: true }, { v: "0.14*", t: "(2.03)" }] },
    { label: "Floor", cells: [{ v: "0.00***", t: "(3.89)" }, { v: "0.00***", t: "(3.33)" }, { v: "0.00***", t: "(4.80)" }, { v: "0.00***", t: "(6.30)" }] },
    { label: "Exclusive Area (log, m²)", cells: [{ v: "−0.33**", t: "(−2.45)" }, { v: "−0.44***", t: "(−5.70)" }, { v: "−0.39***", t: "(−4.80)" }, { v: "−0.53***", t: "(−9.57)" }] },
    { label: "Straight Dist. to Park (log)", strong: true, cells: [{ v: "−0.20**", t: "(−2.70)" }, { v: "−0.18***", t: "(−7.30)" }, { v: "0.00", t: "(0.00)", muted: true }, { v: "−0.08***", t: "(−3.85)" }] },
    { label: "Dist. to Subway (log)", cells: [{ v: "−0.26***", t: "(−5.17)" }, { v: "−0.28***", t: "(−3.83)" }, { v: "−0.32***", t: "(−10.88)" }, { v: "−0.16***", t: "(−4.71)" }] },
    { label: "R² (Adj-R²)", fit: true, cells: [{ v: "0.84 (0.83)" }, { v: "0.70 (0.70)" }, { v: "0.86 (0.86)" }, { v: "0.91 (0.91)" }] },
    { label: "F (Wald, cluster-robust)", fit: true, cells: [{ v: "58.02" }, { v: "29.58" }, { v: "40.91" }, { v: "155.01" }] },
    { label: "N (건수) / 단지수", fit: true, cells: [{ v: "537 / 21" }, { v: "853 / 34" }, { v: "901 / 44" }, { v: "449 / 27" }] },
  ],
  note: "*** p<0.01 · ** p<0.05 · * p<0.10. 계수 아래 회색 줄은 t값. 복합몰 더미(mall_dummy)는 대부분 지역에서 분산이 0에 가까워 다중공선성을 유발하므로 전 지역 공통으로 제외했다.",
}

// §04 Gravity OLS
export const parkCapGravityTable: StatTable = {
  caption: "표 3 · Gravity OLS (상권 포함)",
  head: HEAD4,
  rows: [
    { label: "Building Age (yrs)", cells: [{ v: "−0.03***", t: "(−4.01)" }, { v: "−0.03", t: "(−1.59)", muted: true }, { v: "0.03***", t: "(3.80)" }, { v: "−0.02***", t: "(−6.09)" }] },
    { label: "Households (log)", cells: [{ v: "0.06***", t: "(3.69)" }, { v: "0.08", t: "(1.49)", muted: true }, { v: "−0.04", t: "(−1.19)", muted: true }, { v: "0.03", t: "(0.75)", muted: true }] },
    { label: "Major Brand (dummy)", cells: [{ v: "0.09***", t: "(3.69)" }, { v: "0.09**", t: "(2.42)" }, { v: "−0.04", t: "(−1.47)", muted: true }, { v: "0.00", t: "(−0.19)", muted: true }] },
    { label: "Parking / Household", cells: [{ v: "0.14", t: "(1.30)", muted: true }, { v: "−0.16", t: "(−1.31)", muted: true }, { v: "0.15", t: "(1.31)", muted: true }, { v: "0.15**", t: "(2.44)" }] },
    { label: "Floor", cells: [{ v: "0.00***", t: "(6.19)" }, { v: "0.00***", t: "(3.90)" }, { v: "0.00***", t: "(4.91)" }, { v: "0.00***", t: "(5.93)" }] },
    { label: "Exclusive Area (log, m²)", cells: [{ v: "−0.40***", t: "(−5.50)" }, { v: "−0.44***", t: "(−5.89)" }, { v: "−0.36***", t: "(−4.14)" }, { v: "−0.55***", t: "(−10.51)" }] },
    { label: "Straight Dist. to Park (log)", strong: true, cells: [{ v: "−0.09***", t: "(−3.37)" }, { v: "−0.11***", t: "(−2.76)" }, { v: "0.01", t: "(0.56)", muted: true }, { v: "−0.08***", t: "(−4.60)" }] },
    { label: "Dist. to Subway (log)", cells: [{ v: "−0.13***", t: "(−6.06)" }, { v: "−0.20***", t: "(−3.21)" }, { v: "−0.28***", t: "(−7.14)" }, { v: "−0.13***", t: "(−3.58)" }] },
    { label: "Life-Amenity Gravity", cells: [{ v: "0.09***", t: "(9.08)" }, { v: "0.13**", t: "(2.68)" }, { v: "0.04", t: "(1.37)", muted: true }, { v: "0.08", t: "(1.59)", muted: true }] },
    { label: "R² (Adj-R²)", fit: true, cells: [{ v: "0.97 (0.97)" }, { v: "0.75 (0.74)" }, { v: "0.87 (0.87)" }, { v: "0.92 (0.92)" }] },
    { label: "F (Wald, cluster-robust)", fit: true, cells: [{ v: "563.65" }, { v: "40.63" }, { v: "52.53" }, { v: "286.55" }] },
  ],
}

// §05 보행 vs 직선
export const parkCapCircuityTable: StatTable = {
  caption: "표 4 · 직선 vs 보행 거리 일치도",
  head: ["지역", "N", "Pearson r", "우회율 평균(SD)", "편차 평균(m)"],
  rows: [
    { label: "광교", cells: [{ v: "537" }, { v: "0.922" }, { v: "1.426 (0.263)" }, { v: "265.0" }] },
    { label: "동탄남부", cells: [{ v: "853" }, { v: "0.898" }, { v: "1.472 (0.547)" }, { v: "307.6" }] },
    { label: "동탄북부", cells: [{ v: "901" }, { v: "0.985" }, { v: "1.229 (0.173)" }, { v: "208.5" }] },
    { label: "운정", cells: [{ v: "449" }, { v: "0.898" }, { v: "1.472 (0.319)" }, { v: "302.1" }] },
  ],
  note: "동탄북부는 우회율(1.23)이 가장 낮고 직선-보행 상관(0.985)이 가장 높음 — 격자형 신규 가로망 특성.",
}

// §06 Chow / Moran
export const parkCapChow = [
  ["F-statistic", "418.11"],
  ["df1 / df2", "42 / 2,684"],
  ["p-value", "<0.001"],
  ["판정", "풀링 부적절"],
]
export const parkCapMoran = [
  { key: "gg" as RegionKey, label: "광교", v: "0.876 (p<.001)" },
  { key: "ds" as RegionKey, label: "동탄남부", v: "0.760 (p<.001)" },
  { key: "dn" as RegionKey, label: "동탄북부", v: "0.865 (p<.001)" },
  { key: "uj" as RegionKey, label: "운정", v: "0.452 (p<.001)" },
]

// §07 SEM
export const parkCapFitTable: StatTable = {
  caption: "표 5 · OLS → SAR → SEM 적합도 비교",
  head: ["지역", "AIC (OLS)", "AIC (SAR)", "AIC (SEM)", "LR test (SEM)"],
  rows: [
    { label: "광교", cells: [{ v: "−831.9" }, { v: "−1701.7" }, { v: "−1883.0", }, { v: "1051.0 (p<.001)" }] },
    { label: "동탄남부", cells: [{ v: "−1661.9" }, { v: "−2783.4" }, { v: "−2881.1" }, { v: "1219.2 (p<.001)" }] },
    { label: "동탄북부", cells: [{ v: "−1708.3" }, { v: "−2667.1" }, { v: "−3098.6" }, { v: "1390.3 (p<.001)" }] },
    { label: "운정", cells: [{ v: "−1100.4" }, { v: "−1206.3" }, { v: "−1278.4" }, { v: "178.0 (p<.001)" }] },
  ],
  note: "AIC 기준으로 4개 지역 전부 SAR보다 SEM(공간오차모형)이 우월해 최종 채택. LR test 전부 p<0.001.",
}

export const parkCapSemTable: StatTable = {
  caption: "표 6 · SEM 최종모형 계수 (직선거리 기준, 상권 제외)",
  head: HEAD4,
  rows: [
    { label: "Constant", cells: [{ v: "12.99***", t: "(12.86)" }, { v: "10.48***", t: "(13.64)" }, { v: "10.87***", t: "(46.22)" }, { v: "9.96***", t: "(27.85)" }] },
    { label: "Building Age (yrs)", cells: [{ v: "−0.10***", t: "(−7.29)" }, { v: "−0.00", t: "(−0.02)", muted: true }, { v: "−0.01", t: "(−1.03)", muted: true }, { v: "−0.02***", t: "(−12.09)" }] },
    { label: "Households (log)", cells: [{ v: "−0.13**", t: "(−2.44)" }, { v: "−0.02", t: "(−0.50)", muted: true }, { v: "0.05*", t: "(1.75)" }, { v: "0.04", t: "(1.58)", muted: true }] },
    { label: "Major Brand (dummy)", cells: [{ v: "−0.09", t: "(−0.94)", muted: true }, { v: "0.20***", t: "(5.39)" }, { v: "0.07**", t: "(2.21)" }, { v: "−0.01", t: "(−0.26)", muted: true }] },
    { label: "Parking / Household", cells: [{ v: "−0.05", t: "(−0.17)", muted: true }, { v: "−0.32***", t: "(−3.61)" }, { v: "−0.11**", t: "(−2.12)" }, { v: "0.08*", t: "(1.75)" }] },
    { label: "Floor", cells: [{ v: "0.00***", t: "(8.20)" }, { v: "0.00***", t: "(9.31)" }, { v: "0.00***", t: "(11.26)" }, { v: "0.00***", t: "(6.75)" }] },
    { label: "Exclusive Area (log, m²)", cells: [{ v: "−0.30***", t: "(−19.43)" }, { v: "−0.30***", t: "(−23.69)" }, { v: "−0.43***", t: "(−35.39)" }, { v: "−0.52***", t: "(−24.13)" }] },
    { label: "Straight Dist. to Park (log)", strong: true, cells: [{ v: "−0.13**", t: "(−2.09)" }, { v: "−0.15***", t: "(−8.20)" }, { v: "−0.06***", t: "(−2.79)" }, { v: "−0.09***", t: "(−4.64)" }] },
    { label: "Dist. to Subway (log)", cells: [{ v: "−0.23***", t: "(−4.65)" }, { v: "−0.13*", t: "(−1.91)" }, { v: "−0.26***", t: "(−9.65)" }, { v: "−0.13***", t: "(−4.73)" }] },
    { label: "λ (Spatial Error)", fit: true, cells: [{ v: "0.93***", t: "(176.52)" }, { v: "0.90***", t: "(134.19)" }, { v: "0.88***", t: "(118.96)" }, { v: "0.69***", t: "(25.53)" }] },
  ],
}

// §06 보행 vs 직선 해석
export const parkCapCircuityReading = {
  headline: "우회율이 말해주는 것 — 그리고 직선거리를 써도 되는 이유",
  paras: [
    "우회율은 보행 실측거리를 직선거리로 나눈 값이다. 4개 지역 모두 1.23~1.47 사이로, 실제로 걸어야 하는 거리가 직선거리보다 23~47% 길다. 이 격차 자체는 어느 도시에나 있는 정상적인 값이지만, 지역 간 편차가 도시조직의 성격을 드러낸다.",
    "동탄북부는 우회율이 가장 낮고(1.229) 표준편차도 가장 작으며(0.173) 직선-보행 상관이 0.985로 사실상 완전 일치한다 — 격자형으로 새로 깔린 가로망에서는 직선거리가 보행거리를 거의 그대로 대리한다. 반대로 동탄남부는 평균 우회율(1.472)보다 표준편차(0.547)가 문제다. 단지에 따라 우회 정도가 제각각이라는 뜻으로, 하천·간선도로 같은 물리적 장애물이 특정 단지에만 걸린 결과로 보인다.",
    "이 진단이 회귀 해석에 직접 영향을 준다. 직선거리는 보행 접근성의 대리변수이므로, 우회율 편차가 큰 지역일수록 측정오차가 커지고 계수가 0쪽으로 눌리는 감쇠편의(attenuation bias)가 생긴다. 상관이 0.90~0.99로 매우 높아 집계 수준에서는 직선거리로 대체해도 무방하지만, 개별 단지 수준에서는 200~300m의 체계적 과소평가가 존재한다는 점을 전제로 읽어야 한다.",
  ],
  keyInsight:
    "여기서 중요한 반증이 하나 나온다 — 동탄북부는 직선-보행 일치도가 4개 지역 중 가장 높은데도(r=0.985) baseline OLS에서 공원거리 계수가 0.00으로 잡히지 않았다. 즉 동탄북부의 공원효과 부재는 거리를 잘못 쟀기 때문이 아니다. §09에서 보듯 공원이 소형으로 파편화되어 있어 “최근접 공원 1개까지의 거리”라는 지표 자체가 그 동네의 녹지환경을 대표하지 못하는 것이 원인에 가깝다.",
}

// §07 풀링검정 · 공간자기상관 해석
export const parkCapPoolingReading = {
  chow: {
    title: "Chow Test — “신도시”는 하나의 범주가 아니다",
    paras: [
      "귀무가설은 “4개 지역의 회귀계수가 모두 같다”이다. F=418.11(df 42/2,684, p<0.001)로 압도적으로 기각된다. 자유도 42는 계수 14개 × (지역 4개−1)에서 나온 값으로, 어느 한두 변수가 아니라 모형 전체가 지역마다 다르게 작동한다는 뜻이다.",
      "실무적으로 이는 “2기 신도시”를 하나의 동질적 범주로 묶어 회귀 한 번 돌리는 관행에 대한 직접적인 반증이다. 더 나아가 같은 동탄2 안에서도 남부(−0.15)와 북부(−0.06)의 공원 프리미엄이 2.5배 차이 나므로, 행정구역이나 사업지구 단위가 곧 분석 단위가 될 수 없다는 점도 함께 보여준다.",
      "다만 Chow test는 “다르다”만 말할 뿐 어느 계수가 어떻게 다른지는 알려주지 않는다. 따라서 이 검정은 지역별 개별 추정을 정당화하는 관문일 뿐이고, 실제 해석은 표 2·3·6의 지역별 계수를 직접 비교해야 한다.",
    ],
  },
  moran: {
    title: "Moran's I — OLS를 그대로 믿으면 안 되는 이유",
    paras: [
      "여기서 검정하는 것은 가격 자체가 아니라 OLS 잔차의 공간자기상관이다. 잔차가 공간적으로 뭉쳐 있다는 것은 “오차항이 서로 독립”이라는 OLS의 핵심 가정이 깨졌다는 뜻이고, 이 경우 표준오차가 과소추정되어 t값이 부풀고 실제로는 유의하지 않은 계수가 유의해 보이게 된다. 4개 지역 전부 p<0.001이므로 OLS 결과를 그대로 인용하는 것은 위험하다.",
      "값의 크기도 정보를 준다. 광교(0.876)·동탄북부(0.865)가 높고 운정(0.452)이 뚜렷하게 낮다. 운정이 낮은 이유는 공간구조가 단순해서가 아니라, 건축연한이 가격을 거의 결정해버려서(가격과의 단순상관 −0.851) 잔차에 남는 공간적 패턴이 적기 때문으로 보는 편이 타당하다.",
      "SEM의 λ(0.93·0.90·0.88·0.69)가 Moran's I와 같은 순서로 배열되는 것도 같은 이야기다. λ가 이렇게 높다는 것은 학군·조망·지형·단지 평판처럼 모형에 넣지 못한 입지요인이 공간적으로 강하게 뭉쳐 있다는 뜻이며, SEM은 그것을 흡수해 표준오차를 바로잡아줄 뿐 제거해주지는 않는다.",
    ],
    caution:
      "따라서 표 6의 SEM 계수는 인과효과가 아니라 “공간적 교란을 제거한 뒤의 조건부 연관”으로 읽어야 한다. 공원 조성 전후를 비교하는 준실험 설계가 아닌 이상, 이 값을 “공원을 만들면 가격이 이만큼 오른다”로 옮기는 것은 과잉해석이다.",
  },
}

// §09 공원 티어 구성
export const parkCapTiers = [
  { key: "gg" as RegionKey, label: "광교", total: "15개 공원 · 455.7ha", t1: 49.4, t2: 44.3, t3: 6.4, detail: "Tier1 1개(49.4%) · Tier2 7개(44.3%) · Tier3 7개(6.4%)" },
  { key: "ds" as RegionKey, label: "동탄남부", total: "24개 공원 · 286.5ha", t1: 15.5, t2: 60.9, t3: 23.5, detail: "Tier1 1개(15.5%) · Tier2 10개(60.9%) · Tier3 13개(23.5%)" },
  { key: "dn" as RegionKey, label: "동탄북부", total: "25개 공원 · 339.3ha", t1: 31.7, t2: 41.6, t3: 26.7, detail: "Tier1 1개(31.7%) · Tier2 6개(41.6%) · Tier3 18개(26.7%)" },
  { key: "uj" as RegionKey, label: "운정", total: "25개 공원 · 275.9ha", t1: 20.6, t2: 55.1, t3: 24.3, detail: "Tier1 1개(20.6%) · Tier2 9개(55.1%) · Tier3 15개(24.3%)" },
]

export const parkCapSupplyTable: StatTable = {
  caption: "표 9 · 규모 대비 공원 공급 지표",
  head: ["지역", "녹지율", "Tier1 집중도", "공원수/단지", "공원면적ha/단지"],
  rows: [
    { label: "광교", cells: [{ v: "17.4%" }, { v: "49.4%" }, { v: "0.43" }, { v: "13.02" }] },
    { label: "동탄남부", cells: [{ v: "11.3%" }, { v: "15.5%" }, { v: "0.45" }, { v: "5.41" }] },
    { label: "동탄북부", cells: [{ v: "12.3%" }, { v: "31.7%" }, { v: "0.40" }, { v: "5.47" }] },
    { label: "운정", cells: [{ v: "14.4%" }, { v: "20.6%" }, { v: "0.68" }, { v: "7.46" }] },
  ],
  note: "녹지율 = 전체 공원면적 / 지역 bbox 면적. Tier1 집중도 = Tier1 면적 / 전체 공원면적. 단지수는 K-apt 전수(거래사례 미포함 단지 포함).",
}

export const parkCapTypology = [
  { label: "광교", type: "단일 플래그십형", body: "전체 녹지의 절반(49.4%)이 공원 하나(호수공원)이고, 단지당 공원면적(13.02ha)도 다른 지역의 2배 가까이 된다." },
  { label: "동탄남부", type: "고른 분산형", body: "Tier1 집중도가 4개 지역 중 가장 낮아(15.5%) 어느 한 공원도 압도적이지 않다." },
  { label: "동탄북부", type: "다수 소형 파편형", body: "공원 개수의 72%(18개)가 Tier3(10ha 미만)인데 면적은 26.7%뿐이라, 자잘한 공원이 흩어져 있는 구조다." },
  { label: "운정", type: "다품종 균형형", body: "단지당 공원수(0.68개)가 4개 지역 중 가장 많지만 총 면적은 가장 작아(275.9ha), 크지 않은 공원 여러 개를 골고루 나눠 쓰는 구조다." },
]

export const parkCapStructureNotes = [
  { label: "광교", body: "단일 플래그십 구조이니 “공원효과”가 사실상 “호수공원 효과”와 같다. 공원 크기별 회귀에서도 Tier1 거리만 유의하고 Tier2/3는 비유의했다." },
  { label: "동탄남부", body: "Tier1 집중도가 가장 낮은데도 회귀에서는 여전히 Tier1이 지배적으로 유의했고, “공원이 클수록 근접성의 가치가 크다”는 가설을 4개 지역 중 가장 일관되게 지지했다." },
  { label: "동탄북부", body: "소형공원이 파편화된 구조(개수 72%, 면적 27%)라 “최근접 공원 1개까지 거리”라는 단일 지표로는 신호가 잘 안 잡힌다. 그러나 SEM에서는 효과가 회복된다(−0.06***) — 파편화된 녹지는 개별 거리보다 “동네 전체의 누적 녹지 환경”으로 작동할 가능성을 시사한다." },
  { label: "운정", body: "단지당 공원수가 가장 많은 다품종 구조라, 주민이 실제 자주 쓰는 공원은 멀리 있는 Tier1(호수공원)보다 가까운 Tier2(중형공원)일 가능성이 높다. 실제로 유일하게 Tier2가 Tier1보다 더 유의했던 지역이 운정이다." },
]

export const parkCapMethodology = [
  {
    title: "① 데이터 출처 — OSM에서 공식 도시계획시설 데이터로",
    body: "최초에는 OSM의 leisure=park 태그로 공원 폴리곤을 추출했으나 태깅 부정확성으로 실제 공원이 아닌 위치에 점이 찍히는 문제가 확인됐다. 이를 국토교통부 공식 도시계획시설(공원) 결정경계 데이터(“국토계획공간시설(경기)”, LSMD_CONT_UQ162)로 교체했다. 관리번호(MNUM) 대분류 중 UQT2(공원)만 채택해 경기도 전역 7,083건에서 4개 지역과 겹치는 폴리곤을 추출했다(UQT3 녹지·UQT1 광장은 제외).",
  },
  {
    title: "② 최소면적 기준 — “10분 순환 산책 가능”",
    body: "법정 공원이라도 소공원·어린이공원처럼 800~2,000㎡대 부지가 다수 섞여 있어 “실제로 산책할 만한 공간”이라는 하한을 별도로 정했다. 프로젝트가 이미 “도보 10분”을 500m로 환산해 쓰고 있어, 같은 길을 되짚지 않는 500m 순환 산책로가 들어갈 최소 면적을 등주부등식으로 구했다 — 둘레 500m 원의 면적 500²/4π ≈ 19,894㎡. 실제 공원은 원보다 비효율적 형태가 대부분이라 이 값 자체가 관대한 하한이며, 반올림해 20,000㎡(2ha)를 채택했다.",
  },
  {
    title: "③ 3단계 효용 티어 분류",
    body: "2ha 이상 공원을 이용 강도에 따라 3단계로 나눴다. Tier1(지역별 면적 최대 1개 — 광교호수공원, 운정호수공원 등)은 이용이 가장 많은 고효용 공원으로 보고, 매개중심성(통행량 근사)·최근접 단지거리(접근성)를 종합한 알고리즘으로 진출입로를 지역당 최대 10개까지 뽑았다. Tier2(그 외 2ha 이상 대형공원)와 Tier3(2ha 미만 소형공원)는 각각 공원 중앙 대표점 1개로 단순화했다.",
  },
]

export const parkCapFooter = {
  method:
    "종속변수 ln(만원/㎡) · 단지 클러스터-로버스트 표준오차(OLS) · 공간가중치 k=3 KNN · 동탄역 남/북 공유 처리 반영 · 공원 진입로는 통행량(매개중심성)·접근성·공원 커버리지 종합기준으로 재선정(동탄북부 7개, 그 외 10개) · 운정 경계는 (37.74381, 126.72266) 우측 하단으로 재지정(호수공원 전체 포함).",
  files:
    "05_02_descriptive_corr.xlsx · 05_03_regression_results.xlsx · 05_04_chow_test.xlsx · 05_05_park_distance_diagnostics.xlsx · 05_06_spatial_analysis.xlsx · 05_08_park_size_capitalization.xlsx · 02_01_parks_by_park.csv",
}
