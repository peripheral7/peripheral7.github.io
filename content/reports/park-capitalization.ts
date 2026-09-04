// 신도시 4곳 공원 자본화 효과 — 공원 분포 구조와 티어별 자본화 효과의 대응
// 출처: KICA 논문작성 파이프라인 05_* 산출물 (2026-09-05 실행분)

export type StatCell = { v: string; t?: string; muted?: boolean }
export type StatRow = { label: string; cells: StatCell[]; strong?: boolean; fit?: boolean }
export type StatTable = { caption: string; head: string[]; rows: StatRow[]; note?: string }

export const REGION_KEYS = ["gg", "ds", "dn", "uj"] as const
export type RegionKey = (typeof REGION_KEYS)[number]

export const parkCapMeta = {
  eyebrow: "Hedonic Price Analysis · 2026-09-05",
  title: "공원 분포가 가격을 만드는 방식",
  summary:
    "광교 · 동탄남부 · 동탄북부 · 운정 4개 지역의 실거래 2,740건을 대상으로, 공원 접근성이 아파트 가격에 자본화되는 정도를 검증했습니다. 공원을 규모별 3단계로 나눠 거리를 각각 투입한 결과, 어느 크기의 공원이 가격을 만드는지가 그 도시의 공원 분포 구조에 따라 달라진다는 점이 드러났습니다.",
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
    label: "공원 규모별 분리 투입의 효과",
    value: "R² 0.33 → 0.74",
    accent: true,
    note: "동탄남부 기준. “가장 가까운 공원까지 거리” 하나로 묶었을 때는 효과가 잡히지 않았으나, 대형·중형·소형을 나눠 넣자 설명력이 두 배 이상 올랐다.",
  },
  {
    label: "도시마다 값을 만드는 공원이 다르다",
    value: "T1 / T2 · T3",
    accent: false,
    note: "광교는 대형공원(Tier1)만, 동탄북부·운정은 중소형(Tier2·T3)만 유의하다. 공원이 있다는 사실보다 어떻게 분포하는지가 결정적이다.",
  },
  {
    label: "풀링 적합성 (Chow Test)",
    value: "F = 342.8",
    accent: false,
    note: "p<0.001 — 4개 지역을 하나로 합쳐 분석하는 것은 부적절. 같은 동탄2 안에서도 남/북을 나눠야 한다.",
  },
  {
    label: "공간자기상관 (Moran's I)",
    value: "0.41 ~ 0.87",
    accent: false,
    note: "4개 지역 전부 p<0.001. OLS 표준오차를 신뢰할 수 없어 공간오차모형(SEM)을 최종 채택했다.",
  },
]

export const parkCapMaps = [
  { key: "gg" as RegionKey, label: "광교", sub: "Gwanggyo", src: "/images/reports/urban-newtowns/Gwanggyo_cluster.jpg" },
  { key: "ds" as RegionKey, label: "동탄남부", sub: "Dongtan South", src: "/images/reports/urban-newtowns/Dongtan_South_cluster.jpg" },
  { key: "dn" as RegionKey, label: "동탄북부", sub: "Dongtan North", src: "/images/reports/urban-newtowns/Dongtan_North_cluster.jpg" },
  { key: "uj" as RegionKey, label: "운정", sub: "Unjeong", src: "/images/reports/urban-newtowns/Unjeong_cluster.jpg" },
]

// §02 공원 분포
export const parkCapTiers = [
  {
    key: "gg" as RegionKey, label: "광교", total: "15개 · 455.7ha",
    t1: 49.4, t2: 44.3, t3: 6.4,
    detail: "Tier1 1개 224.9ha(49.4%) · Tier2 7개 201.7ha(44.3%) · Tier3 7개 29.0ha(6.4%)",
    type: "단일 플래그십형",
    typeBody: "녹지의 절반을 광교호수공원 하나(224.9ha)가 차지하고, 소형공원 비중은 6.4%에 불과하다.",
  },
  {
    key: "ds" as RegionKey, label: "동탄남부", total: "24개 · 286.5ha",
    t1: 15.5, t2: 60.9, t3: 23.5,
    detail: "Tier1 1개 44.5ha(15.5%) · Tier2 10개 174.6ha(60.9%) · Tier3 13개 67.4ha(23.5%)",
    type: "중형 다핵형",
    typeBody: "Tier2 중형공원 10개가 면적의 61%를 차지한다. 어느 한 공원도 압도적이지 않고 규모별로 고르게 퍼져 있다.",
  },
  {
    key: "dn" as RegionKey, label: "동탄북부", total: "14개 · 149.0ha",
    t1: 19.7, t2: 49.0, t3: 31.3,
    detail: "Tier1 1개 29.4ha(19.7%) · Tier2 4개 73.0ha(49.0%) · Tier3 9개 46.7ha(31.3%)",
    type: "소형 파편형",
    typeBody: "총 공원면적이 149ha로 가장 작고, 그중 31%가 2ha 미만 소형공원 9개에 흩어져 있다. Tier1도 29.4ha로 4개 지역 중 가장 작다.",
  },
  {
    key: "uj" as RegionKey, label: "운정", total: "16개 · 168.9ha",
    t1: 33.6, t2: 33.0, t3: 33.4,
    detail: "Tier1 1개 56.8ha(33.6%) · Tier2 4개 55.8ha(33.0%) · Tier3 11개 56.3ha(33.4%)",
    type: "균등 3분할형",
    typeBody: "세 티어가 각각 33% 안팎으로 거의 정확히 3등분된다. 규모별 위계가 가장 평평한 구조다.",
  },
]

const HEAD4 = ["변수", "광교", "동탄남부", "동탄북부", "운정"]

// §03 티어별 자본화 효과 — 핵심 표
export const parkCapTierEffectTable: StatTable = {
  caption: "표 1 · 공원 규모별 거리 계수 (SEM 최종모형)",
  head: HEAD4,
  rows: [
    {
      label: "Tier1 — 대형 (지역 최대 1개)",
      strong: true,
      cells: [
        { v: "−0.11**", t: "z = −2.35" },
        { v: "−0.14***", t: "z = −8.38" },
        { v: "−0.04", t: "z = −1.63", muted: true },
        { v: "−0.03", t: "z = −1.26", muted: true },
      ],
    },
    {
      label: "Tier2 — 중형 (2ha 이상)",
      strong: true,
      cells: [
        { v: "−0.09", t: "z = −1.25", muted: true },
        { v: "−0.06*", t: "z = −1.67" },
        { v: "−0.11***", t: "z = −3.48" },
        { v: "−0.10***", t: "z = −4.72" },
      ],
    },
    {
      label: "Tier3 — 소형 (2ha 미만)",
      strong: true,
      cells: [
        { v: "0.05", t: "z = 0.67", muted: true },
        { v: "−0.05*", t: "z = −1.74" },
        { v: "−0.11***", t: "z = −4.54" },
        { v: "−0.04**", t: "z = −2.03" },
      ],
    },
    {
      label: "λ (공간오차 계수)",
      fit: true,
      cells: [
        { v: "0.93***", t: "z = 176.5" },
        { v: "0.88***", t: "z = 134.2" },
        { v: "0.87***", t: "z = 119.0" },
        { v: "0.68***", t: "z = 25.5" },
      ],
    },
  ],
  note: "*** p<0.01 · ** p<0.05 · * p<0.10. 로그–로그 설정이므로 계수는 탄력성이다.",
}

// §03 대응 관계
export const parkCapCorrespondence = [
  {
    key: "gg" as RegionKey, label: "광교", type: "단일 플래그십형",
    share: "Tier1이 면적의 49.4%",
    effect: "Tier1만 유의 (−0.11**)",
    body: "녹지를 호수공원 하나가 사실상 독점하는 구조라, 이 도시에서 “공원 효과”는 곧 “호수공원 효과”다. 소형공원은 면적 비중이 6.4%에 그쳐 가격에 잡히지 않는다(계수 +0.05, 비유의).",
  },
  {
    key: "ds" as RegionKey, label: "동탄남부", type: "중형 다핵형",
    share: "Tier2가 면적의 60.9%",
    effect: "세 티어 모두 유의 (−0.14 / −0.06 / −0.05)",
    body: "규모별로 고르게 분포한 만큼 세 층위가 모두 값을 만든다. 다만 크기 순서대로 계수가 커져, 큰 공원일수록 근접성의 가치가 크다는 관계가 가장 깨끗하게 관측되는 지역이다.",
  },
  {
    key: "dn" as RegionKey, label: "동탄북부", type: "소형 파편형",
    share: "Tier3가 개수의 64%",
    effect: "Tier2·Tier3만 유의 (둘 다 −0.11***)",
    body: "Tier1이 29.4ha로 작아 “대표 공원”이라 부르기 어렵고, 실제로 계수도 비유의하다. 대신 흩어진 중소형 공원이 효과를 만든다 — 통합 거리 하나만 봤을 때 이 지역의 공원효과가 0.00으로 사라졌던 이유가 여기 있다.",
  },
  {
    key: "uj" as RegionKey, label: "운정", type: "균등 3분할형",
    share: "세 티어가 각 33%",
    effect: "Tier2가 주도 (−0.10***)",
    body: "호수공원(56.8ha)이 있지만 Tier1 계수는 비유의하고 중형공원이 가장 강하다. 위계가 평평한 도시에서는 주민이 실제로 쓰는 공원이 “가장 큰 것”이 아니라 “적당히 크고 가까운 것”임을 시사한다.",
  },
]

// §04 기본모형 OLS
export const parkCapBaselineTable: StatTable = {
  caption: "표 2 · Baseline OLS (상권 제외)",
  head: HEAD4,
  rows: [
    { label: "Building Age (yrs)", cells: [{ v: "−0.04***", t: "(−3.12)" }, { v: "−0.04***", t: "(−3.09)" }, { v: "0.03**", t: "(2.30)" }, { v: "−0.02***", t: "(−7.41)" }] },
    { label: "Households (log)", cells: [{ v: "0.11**", t: "(2.36)" }, { v: "0.00", t: "(0.05)", muted: true }, { v: "−0.02", t: "(−0.79)", muted: true }, { v: "0.01", t: "(0.19)", muted: true }] },
    { label: "Major Brand (dummy)", cells: [{ v: "−0.03", t: "(−0.53)", muted: true }, { v: "0.10***", t: "(3.47)" }, { v: "−0.05", t: "(−1.48)", muted: true }, { v: "0.02", t: "(0.62)", muted: true }] },
    { label: "Parking / Household", cells: [{ v: "−0.39*", t: "(−1.89)" }, { v: "−0.14", t: "(−1.05)", muted: true }, { v: "0.17", t: "(1.44)", muted: true }, { v: "0.13*", t: "(1.95)" }] },
    { label: "Floor", cells: [{ v: "0.00*", t: "(1.79)" }, { v: "0.00***", t: "(5.17)" }, { v: "0.00***", t: "(4.34)" }, { v: "0.00***", t: "(5.79)" }] },
    { label: "Exclusive Area (log, m²)", cells: [{ v: "−0.46***", t: "(−4.77)" }, { v: "−0.46***", t: "(−5.71)" }, { v: "−0.42***", t: "(−5.68)" }, { v: "−0.54***", t: "(−10.52)" }] },
    { label: "Dist. to Tier1 Park (log)", strong: true, cells: [{ v: "−0.15***", t: "(−4.70)" }, { v: "−0.14***", t: "(−8.00)" }, { v: "−0.04", t: "(−1.66)", muted: true }, { v: "−0.05*", t: "(−1.84)" }] },
    { label: "Dist. to Tier2 Park (log)", strong: true, cells: [{ v: "0.04", t: "(0.82)", muted: true }, { v: "0.03", t: "(0.64)", muted: true }, { v: "−0.03", t: "(−0.65)", muted: true }, { v: "−0.07**", t: "(−2.71)" }] },
    { label: "Dist. to Tier3 Park (log)", strong: true, cells: [{ v: "0.04", t: "(0.60)", muted: true }, { v: "0.03", t: "(0.87)", muted: true }, { v: "−0.02", t: "(−0.73)", muted: true }, { v: "0.01", t: "(0.32)", muted: true }] },
    { label: "Dist. to Subway (log)", cells: [{ v: "−0.26***", t: "(−9.99)" }, { v: "−0.33***", t: "(−5.25)" }, { v: "−0.28***", t: "(−12.70)" }, { v: "−0.15***", t: "(−4.77)" }] },
    { label: "R² (Adj-R²)", fit: true, cells: [{ v: "0.88 (0.87)" }, { v: "0.74 (0.73)" }, { v: "0.86 (0.86)" }, { v: "0.92 (0.92)" }] },
    { label: "N (건수) / 단지수", fit: true, cells: [{ v: "537 / 21" }, { v: "853 / 34" }, { v: "901 / 44" }, { v: "449 / 27" }] },
  ],
  note: "OLS는 공간자기상관 때문에 표준오차가 과소추정되므로 유의성 판단은 표 1(SEM)을 기준으로 한다.",
}

// §05 상권
export const parkCapGravityTable: StatTable = {
  caption: "표 3 · 생활상권 중력지수 투입 시 공원 계수 변화 (Gravity OLS)",
  head: HEAD4,
  rows: [
    { label: "Dist. to Tier1 Park (log)", strong: true, cells: [{ v: "−0.07***", t: "(−4.38)" }, { v: "−0.08***", t: "(−4.38)" }, { v: "−0.04*", t: "(−1.88)" }, { v: "−0.06*", t: "(−1.91)" }] },
    { label: "Dist. to Tier2 Park (log)", cells: [{ v: "−0.02", t: "(−1.02)", muted: true }, { v: "0.09**", t: "(2.17)" }, { v: "−0.03", t: "(−0.63)", muted: true }, { v: "−0.06**", t: "(−2.10)" }] },
    { label: "Dist. to Tier3 Park (log)", cells: [{ v: "0.00", t: "(0.21)", muted: true }, { v: "0.00", t: "(0.13)", muted: true }, { v: "−0.02", t: "(−0.74)", muted: true }, { v: "0.01", t: "(0.21)", muted: true }] },
    { label: "Life-Amenity Gravity Index", strong: true, cells: [{ v: "0.09***", t: "(7.52)" }, { v: "0.21***", t: "(3.99)" }, { v: "0.04", t: "(1.32)", muted: true }, { v: "0.05", t: "(0.83)", muted: true }] },
    { label: "R² (Adj-R²)", fit: true, cells: [{ v: "0.97 (0.97)" }, { v: "0.81 (0.80)" }, { v: "0.87 (0.87)" }, { v: "0.92 (0.92)" }] },
  ],
  note: "생활상권 중력지수는 3km 버퍼·거리조락 β=1.0 기준. 상권 성격별(음식/소매/보건의료) 분해는 지역별로 산발적인 결과만 나와 폐기하고 생활상권 전체 기준으로 통일했다.",
}

export const parkCapModerationTable: StatTable = {
  caption: "표 4 · 공원 진입로 주변 상권의 조절효과",
  head: HEAD4,
  rows: [
    {
      label: "상권 근접성 주효과",
      cells: [{ v: "0.07*", t: "(2.15)" }, { v: "0.09***", t: "(8.84)" }, { v: "0.02", t: "(1.18)", muted: true }, { v: "−0.01", t: "(−0.27)", muted: true }],
    },
    {
      label: "공원거리 × 상권 (조절항)",
      strong: true,
      cells: [{ v: "−0.07", t: "(−1.55)", muted: true }, { v: "−0.22***", t: "(−9.21)" }, { v: "−0.03", t: "(−0.80)", muted: true }, { v: "−0.03", t: "(−0.41)", muted: true }],
    },
    { label: "진입로 수 (2-way 클러스터)", fit: true, cells: [{ v: "13" }, { v: "12" }, { v: "16" }, { v: "15" }] },
  ],
  note: "진입로 기준 보행 500m 이내 생활상권 POI 수를 표준화해 투입하고, (단지 × 진입로) 2-way 클러스터-로버스트 표준오차로 추정했다. 조절항이 음(−)이면 상권이 발달한 진입로일수록 공원 근접성의 가치가 커진다는 뜻이다.",
}

// §06 공간계량
export const parkCapSpatialTable: StatTable = {
  caption: "표 5 · 공간자기상관 진단과 모형 선택",
  head: ["지역", "Moran's I (k=3)", "AIC · OLS", "AIC · SEM", "LR test"],
  rows: [
    { label: "광교", cells: [{ v: "0.793", t: "z = 31.6" }, { v: "−994" }, { v: "−1,881" }, { v: "886.6", t: "p<.001" }] },
    { label: "동탄남부", cells: [{ v: "0.748", t: "z = 36.3" }, { v: "−1,770" }, { v: "−2,885" }, { v: "1,114.9", t: "p<.001" }] },
    { label: "동탄북부", cells: [{ v: "0.865", t: "z = 42.4" }, { v: "−1,734" }, { v: "−3,117" }, { v: "1,382.4", t: "p<.001" }] },
    { label: "운정", cells: [{ v: "0.414", t: "z = 14.1" }, { v: "−1,124" }, { v: "−1,284" }, { v: "160.2", t: "p<.001" }] },
  ],
  note: "Moran's I는 가격이 아니라 OLS 잔차의 공간자기상관을 검정한다. 4개 지역 전부 p<0.001이고 AIC도 SEM을 지목해, 최종모형으로 SEM을 채택했다.",
}

export const parkCapCircuityTable: StatTable = {
  caption: "표 6 · 직선거리 vs 보행 실측거리 일치도",
  head: ["지역", "Pearson r", "우회율 평균(SD)", "편차 평균(m)"],
  rows: [
    { label: "광교", cells: [{ v: "0.924" }, { v: "1.432 (0.440)" }, { v: "227.9" }] },
    { label: "동탄남부", cells: [{ v: "0.797" }, { v: "1.211 (0.464)" }, { v: "98.5" }] },
    { label: "동탄북부", cells: [{ v: "0.871" }, { v: "1.289 (0.401)" }, { v: "131.1" }] },
    { label: "운정", cells: [{ v: "0.894" }, { v: "1.418 (0.570)" }, { v: "185.2" }] },
  ],
}

// §07 기술통계
export const parkCapVifTable: StatTable = {
  caption: "표 7 · 변수별 평균(표준편차) / VIF",
  head: HEAD4,
  rows: [
    { label: "Building Age (yrs)", cells: [{ v: "12.71 (2.35) / 2.32" }, { v: "8.08 (1.07) / 2.26" }, { v: "9.36 (1.87) / 1.95" }, { v: "16.72 (5.71) / 3.43" }] },
    { label: "Households (log)", cells: [{ v: "6.91 (0.60) / 1.76" }, { v: "6.95 (0.31) / 2.04" }, { v: "6.67 (0.43) / 1.65" }, { v: "7.00 (0.33) / 2.18" }] },
    { label: "Major Brand (dummy)", cells: [{ v: "0.31 (0.46) / 3.27" }, { v: "0.23 (0.42) / 2.12" }, { v: "0.15 (0.36) / 1.24" }, { v: "0.26 (0.44) / 2.06" }] },
    { label: "Parking / Household", cells: [{ v: "1.41 (0.15) / 4.47" }, { v: "1.21 (0.12) / 2.10" }, { v: "1.28 (0.18) / 1.13" }, { v: "1.34 (0.22) / 2.32" }] },
    { label: "Floor", cells: [{ v: "15.08 (9.36) / 1.21" }, { v: "11.58 (6.18) / 1.02" }, { v: "14.42 (9.30) / 1.26" }, { v: "11.16 (6.65) / 1.10" }] },
    { label: "Exclusive Area (log, m²)", cells: [{ v: "4.37 (0.14) / 1.67" }, { v: "4.28 (0.17) / 2.41" }, { v: "4.30 (0.16) / 1.22" }, { v: "4.36 (0.14) / 1.14" }] },
    { label: "Dist. to Tier1 Park (log)", cells: [{ v: "6.19 (0.76) / 2.45" }, { v: "6.91 (0.81) / 2.47" }, { v: "7.07 (0.72) / 3.37" }, { v: "6.47 (0.48) / 2.06" }] },
    { label: "Dist. to Tier2 Park (log)", cells: [{ v: "6.44 (0.52) / 2.16" }, { v: "6.53 (0.55) / 4.40" }, { v: "6.57 (0.36) / 1.42" }, { v: "6.77 (0.44) / 1.77" }] },
    { label: "Dist. to Tier3 Park (log)", cells: [{ v: "7.14 (0.47) / 2.56" }, { v: "6.25 (0.70) / 3.22" }, { v: "5.97 (0.53) / 1.61" }, { v: "5.83 (0.46) / 1.72" }] },
    { label: "Dist. to Subway (log)", cells: [{ v: "6.42 (0.98) / 6.79" }, { v: "8.13 (0.21) / 1.70" }, { v: "7.01 (0.66) / 5.24" }, { v: "6.91 (0.45) / 5.63" }] },
    { label: "Life-Amenity Gravity", cells: [{ v: "5.05 (1.36) / 2.42" }, { v: "2.09 (0.42) / 4.18" }, { v: "3.94 (1.12) / 2.62" }, { v: "3.41 (0.36) / 4.32" }] },
  ],
  note: "셀 표기: 평균 (표준편차) / VIF. 전 지역 VIF 10 미만으로 다중공선성 문제 없음 — 티어 3변수의 로그 상관도 최대 |r|=0.45로 낮아 동시 투입에 무리가 없다.",
}

export const parkCapSample = [
  { key: "gg" as RegionKey, label: "광교", rows: [["거래건수", "537"], ["단지 수", "21"], ["공원 수", "15개 455.7ha"], ["진입로", "24개"]] },
  { key: "ds" as RegionKey, label: "동탄남부", rows: [["거래건수", "853"], ["단지 수", "34"], ["공원 수", "24개 286.5ha"], ["진입로", "33개"]] },
  { key: "dn" as RegionKey, label: "동탄북부", rows: [["거래건수", "901"], ["단지 수", "44"], ["공원 수", "14개 149.0ha"], ["진입로", "22개"]] },
  { key: "uj" as RegionKey, label: "운정", rows: [["거래건수", "449"], ["단지 수", "27"], ["공원 수", "16개 168.9ha"], ["진입로", "25개"]] },
]

export const parkCapMethodology = [
  {
    title: "① 공원 데이터 — 공식 도시계획시설 결정경계",
    body: "OSM의 leisure=park 태그는 실제 공원이 아닌 위치에 점이 찍히는 문제가 있어, 국토교통부 공식 도시계획시설(공원) 결정경계(LSMD_CONT_UQ162)로 교체했다. 관리번호 대분류 중 UQT2(공원)만 채택하고 UQT3(녹지)·UQT1(광장)은 제외했다.",
  },
  {
    title: "② 최소면적 2ha — “10분 순환 산책” 기준",
    body: "법정 공원이라도 800~2,000㎡대 부지가 다수 섞여 있어 하한을 따로 정했다. 도보 10분을 500m로 환산하고, 같은 길을 되짚지 않는 500m 순환 산책로가 들어갈 최소 면적을 등주부등식으로 구해(500²/4π ≈ 19,894㎡) 20,000㎡를 채택했다.",
  },
  {
    title: "③ 규모 3단계 — Tier1 / Tier2 / Tier3",
    body: "Tier1은 지역별 면적 최대 1개로 매개중심성·접근성을 종합해 진출입로를 다수 배치했고, Tier2(2ha 이상)와 Tier3(2ha 미만)는 각각 공원 중앙 대표점 1개로 단순화했다. 회귀에는 티어별 최근접거리를 각각 로그변환해 투입한다.",
  },
]

export const parkCapLimits = [
  {
    tag: "인과 식별",
    text: "횡단면 자료이므로 계수는 조건부 연관이다. λ가 0.68~0.93으로 높다는 것은 학군·조망·지형처럼 측정하지 못한 입지요인이 여전히 공간적으로 뭉쳐 있다는 뜻이며, SEM은 이를 흡수해 표준오차를 바로잡을 뿐 제거하지 못한다.",
  },
  {
    tag: "n=4",
    text: "공원 분포 구조와 티어별 효과의 대응은 4개 지역의 사례 대조이지 통계적 검정이 아니다. 규모별 위계가 다른 도시를 더 확보해야 일반화할 수 있다.",
  },
  {
    tag: "티어 경계",
    text: "Tier1을 “지역별 최대 1개”로 정의했기 때문에, 동탄북부처럼 최대 공원이 29.4ha에 그치는 지역에서는 Tier1이 다른 도시의 Tier2와 사실상 같은 급이다. 절대 규모 기준을 병용한 재검토가 필요하다.",
  },
  {
    tag: "자유도",
    text: "조절효과는 진입로 12~16개 수준의 2-way 클러스터로 추정되어 유효 자유도가 작다. 동탄남부의 강한 결과도 보수적으로 읽어야 한다.",
  },
]

export const parkCapFooter = {
  method:
    "종속변수 ln(만원/㎡) · 계약년월 고정효과 · 단지 클러스터-로버스트 표준오차(OLS) / (단지,진입로) 2-way 클러스터(조절효과) · 공간가중치 k=3 KNN · 동탄2 남/북 실측 좌표 보정 분할 · 동탄역 남/북 공유 처리 · 공원 폴리곤은 동탄북부·운정에 별도 축소 경계 적용.",
  files:
    "05_02_descriptive_corr.xlsx · 05_03_regression_results.xlsx · 05_04_chow_test.xlsx · 05_05_park_distance_diagnostics.xlsx · 05_06_spatial_analysis.xlsx · 05_07_commercial_moderation.xlsx · 02_01_parks_by_park.csv",
}
