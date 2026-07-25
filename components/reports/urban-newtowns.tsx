import { SimplePostHeader } from "@/components/simple-post-header"

const maps = [
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

export function UrbanEconomicsNewTownsReport() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 py-10 md:px-10">
        <SimplePostHeader
          eyebrow="Urban Economics · New Town Comparison"
          title="광교 · 동탄 · 운정 신도시 아파트 가격 결정요인 비교연구"
          subtitle="OSM 기반 접근성 변수, 상업시설 중력지수(gravity index), DBSCAN 클러스터링을 결합해 세 신도시의 공간구조 차이를 지도로 시각화하고, 헤도닉 회귀 및 공간자기상관 분석(Moran's I, SAR/SEM/SDM)을 통해 지역 간 이질성을 검증했습니다."
          tags={["Urban Economics", "Hedonic Model", "Spatial Analysis"]}
        />

        <div className="mx-auto mt-12 max-w-4xl">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
            01 – 03
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight md:text-2xl">
            공원 및 상권 클러스터(200m) 지도
          </h2>
        </div>

        <div className="mx-auto mt-6 grid max-w-4xl gap-7">
          {maps.map((map) => (
            <section
              key={map.id}
              id={map.id}
              className="overflow-hidden rounded border border-border bg-card"
            >
              <div className="flex items-baseline justify-between border-b border-border px-4 py-2.5">
                <strong className="text-sm">{map.label}</strong>
                <span className="font-mono text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                  {map.tag}
                </span>
              </div>

              <div className="relative w-full aspect-video bg-neutral-100">
                <iframe
                  src={map.src}
                  loading="lazy"
                  title={`${map.label} cluster interactive map`}
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>

              <div className="border-t border-border px-4 py-2 text-right text-xs">
                <a
                  href={map.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent hover:underline"
                >
                  전체 화면으로 열기 ↗
                </a>
              </div>
            </section>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
            04
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight md:text-2xl">
            종합 결과 (Interactive Report)
          </h2>

          <div className="mt-6 overflow-hidden rounded border border-border bg-card">
            <iframe
              src="/reports/06_interactive_report.html"
              loading="lazy"
              title="Cross-city interactive results report"
              className="block h-[1400px] w-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}