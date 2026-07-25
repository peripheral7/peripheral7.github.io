import { SimplePostHeader } from "@/components/simple-post-header"
import {
  urbanNewtownsMaps,
  urbanNewtownsMeta,
  urbanNewtownsResultReport,
} from "@/content/reports/urban-newtowns"

export function UrbanNewtownsReport() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SimplePostHeader
        eyebrow={urbanNewtownsMeta.eyebrow}
        title={urbanNewtownsMeta.title}
        subtitle={urbanNewtownsMeta.subtitle}
        tags={urbanNewtownsMeta.tags}
      />

      <div className="mx-auto max-w-4xl px-4 pb-20">
        <p className="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
          01 – 03
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight md:text-2xl">
          공원 및 상권 클러스터(200m) 지도
        </h2>

        <div className="mt-6 grid gap-7">
          {urbanNewtownsMaps.map((map) => (
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

              <div className="relative w-full aspect-[4/3] bg-neutral-100 md:aspect-video">
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

        <p className="mt-16 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
          04
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight md:text-2xl">
          종합 결과 (Interactive Report)
        </h2>

        <div className="mt-6 overflow-hidden rounded border border-border bg-card">
          <iframe
            src={urbanNewtownsResultReport}
            loading="lazy"
            title="Cross-city interactive results report"
            className="block h-[1400px] w-full border-0"
          />
        </div>
      </div>
    </div>
  )
}