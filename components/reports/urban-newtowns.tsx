import { ParkCapitalizationReport } from "@/components/reports/park-capitalization"
import { SimplePostHeader } from "@/components/simple-post-header"
import {
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
        <div className="mt-10">
          <ParkCapitalizationReport />
        </div>

        <p className="mt-16 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
          부록
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight md:text-2xl">
          기초통계 및 단계별 분석 (Interactive Report)
        </h2>
        <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed text-muted-foreground">
          변수별 기초통계량·VIF, 기본모형과 거리지표 비교, 확장모형과 Chow Test, 공간계량분석,
          종합논의를 탭으로 정리한 상세 리포트입니다.
        </p>

        <div className="mt-6 overflow-hidden rounded border border-border bg-card">
          <iframe
            src={urbanNewtownsResultReport}
            loading="lazy"
            title="Cross-city interactive results report"
            className="block h-[1400px] w-full border-0"
          />
        </div>

        <div className="mt-3 text-right text-xs">
          <a
            href={urbanNewtownsResultReport}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent hover:underline"
          >
            전체 화면으로 열기 ↗
          </a>
        </div>
      </div>
    </div>
  )
}
