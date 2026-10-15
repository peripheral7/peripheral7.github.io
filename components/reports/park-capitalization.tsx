import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapCoreMaps,
  parkCapHexMaps,
  parkCapConclusion,
  parkCapVerdict,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapFullCoefTable,
  parkCapHeadlineTable,
  parkCapLimits,
  parkCapMeta,
  parkCapMethodology,
  parkCapRegions,
  parkCapSources,
  parkCapStatNotes,
  parkCapStdTable,
  parkCapMediationTable,
  parkCapModerationTable,
  parkCapMoneyTable,
  parkCapSpatialTable,
  parkCapSemTable,
  parkCapNorthTable,
  parkCapSignalTable,
  parkCapGwanggyoTable,
  parkCapFormTable,
  parkCapStructureTable,
  parkCapQuantileTable,
  parkCapCommerceSelTable,
  type RegionKey,
  type StatTable,
} from "@/content/reports/park-capitalization"

const REGION_DOT: Record<RegionKey, string> = {
  ds: "#2f7a55",
  dn: "#4f93a8",
  d1: "#7d8aa0",
  gg: "#b08a3c",
  iw: "#c2703a",
}

function Dot({ k }: { k: RegionKey }) {
  return (
    <span
      aria-hidden
      className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
      style={{ background: REGION_DOT[k] }}
    />
  )
}

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <>
      <p className="mt-14 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">{n}</p>
      <h3 className="mt-1 text-lg font-extrabold tracking-tight md:text-xl">{children}</h3>
    </>
  )
}

const VERDICT: Record<string, { bg: string; fg: string }> = {
  "확인됨": { bg: "rgba(63,158,112,0.16)", fg: "#2f7a55" },
  "시사적": { bg: "rgba(176,138,60,0.18)", fg: "#8a6a24" },
  "확인 안 됨": { bg: "rgba(120,133,148,0.16)", fg: "#5d6975" },
  "식별 불가": { bg: "rgba(194,112,58,0.16)", fg: "#9a5326" },
  "해당 없음": { bg: "rgba(120,133,148,0.10)", fg: "#788594" },
}

function Verdict({ v }: { v: string }) {
  const c = VERDICT[v] ?? VERDICT["확인 안 됨"]
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.62rem] font-semibold tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      {v}
    </span>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-border py-1.5 text-[0.76rem]">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="text-right font-mono tabular-nums">{v}</dd>
    </div>
  )
}

function Table({ spec }: { spec: StatTable }) {
  return (
    <figure className="mt-5">
      <div className="overflow-hidden rounded border border-border bg-card">
        <figcaption className="border-b border-border px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
          {spec.caption}
        </figcaption>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60">
                {spec.head.map((h, i) => (
                  <th
                    key={`${i}-${h}`}
                    scope="col"
                    className={`border-b border-border px-4 py-2.5 text-[0.72rem] font-semibold text-muted-foreground ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                    style={i === 0 && spec.labelWidth ? { minWidth: spec.labelWidth } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.rows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-border last:border-b-0 ${row.fit ? "bg-muted/40" : ""}`}
                >
                  <th
                    scope="row"
                    className={`px-4 py-2.5 text-left align-top text-[0.82rem] font-normal ${
                      row.strong || row.fit
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    } ${spec.labelWidth ? "whitespace-nowrap" : ""}`}
                    style={spec.labelWidth ? { minWidth: spec.labelWidth } : undefined}
                  >
                    {row.label}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td
                      key={i}
                      className="whitespace-nowrap px-4 py-2.5 text-right align-top font-mono text-[0.8rem] tabular-nums"
                    >
                      <span
                        className={
                          cell.muted
                            ? "text-muted-foreground"
                            : row.strong
                              ? "font-semibold"
                              : ""
                        }
                      >
                        {cell.v}
                      </span>
                      {cell.t ? (
                        <span className="mt-0.5 block text-[0.65rem] font-normal text-muted-foreground">
                          {cell.t}
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {spec.note ? (
        <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-foreground">{spec.note}</p>
      ) : null}
    </figure>
  )
}

function More({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group mt-4 rounded border border-border bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 text-[0.86rem] font-semibold [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block font-mono text-accent transition-transform group-open:rotate-90">›</span>
        {title}
      </summary>
      <div className="border-t border-border px-4 pb-5 pt-1">{children}</div>
    </details>
  )
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
      <strong>{title}</strong> {children}
    </div>
  )
}

export function ParkCapitalizationReport() {
  return (
    <section aria-labelledby="park-cap-title">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
        {parkCapMeta.eyebrow}
      </p>
      <h2 id="park-cap-title" className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
        {parkCapMeta.title}
      </h2>
      <p className="mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground">
        {parkCapMeta.summary}
      </p>
      <p className="mt-3 text-[0.82rem]">
        <a
          href="/reports/park-capitalization-final.pptx"
          download
          className="font-semibold text-accent underline underline-offset-4"
        >
          최종발표 자료 내려받기 (PPTX)
        </a>
      </p>

      <div className="mt-7 rounded border border-border border-l-[3px] border-l-accent bg-card px-5 py-5">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent">결론부터</p>
        <p className="mt-2.5 text-[1.05rem] font-bold leading-relaxed">{parkCapVerdict.lead}</p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">{parkCapVerdict.body}</p>
        <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-3">
          {parkCapVerdict.points.map((p) => (
            <div key={p.k} className="bg-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.76rem] font-semibold">{p.k}</span>
                <span className="font-mono text-[0.92rem] font-bold tabular-nums text-accent">{p.v}</span>
              </div>
              <p className="mt-1 text-[0.74rem] leading-relaxed text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </div>

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4">
        {parkCapFacts.map((f) => (
          <div key={f.label}>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
              {f.label}
            </dt>
            <dd className="mt-0.5 font-mono text-[0.85rem] font-semibold tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      {/* 01 공원 효과 */}
      <SectionTitle n="01">공원은 가격에 자본화되는가</SectionTitle>
      <div className="mt-4">
        <p className="max-w-3xl text-[0.9rem] leading-relaxed text-muted-foreground">
          가장 진한 초록이 대표공원, 작은 사각점이 분석 단지다. 거리는 대표공원의 진출입로까지 잰다.
        </p>
        <MapLightbox maps={parkCapCoreMaps} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
        {parkCapFindings.map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5 bg-card p-4">
            <span className="text-[0.72rem] text-muted-foreground">{f.label}</span>
            <span
              className={`font-mono text-[1.15rem] font-semibold ${
                f.accent ? "text-accent" : "text-foreground"
              }`}
            >
              {f.value}
            </span>
            <span className="text-[0.76rem] leading-relaxed text-muted-foreground">{f.note}</span>
          </div>
        ))}
      </div>
      <Table spec={parkCapHeadlineTable} />
      <Callout title="같은 지구 안에서, 구역마다 따로 추정했다.">
        동탄2 남부와 북부는 시행 주체 · 입주 시기 · 행정구역이 같고 대형공원의 배치만 다르다. 다섯 구역은
        ㎡당 단가가 581만~1,036만원으로 서로 다른 시장이어서 합치지 않았다. 공원의 면적 순위(광교 132.8ha가
        최대)와 효과의 크기는 대응하지 않는다.
      </Callout>

      {/* 02 매개 · 조절 */}
      <SectionTitle n="02">상권을 거쳐 들어오는가</SectionTitle>
      <div className="mt-4">
        <p className="max-w-3xl text-[0.9rem] leading-relaxed text-muted-foreground">
          빨간 육각형이 다빈도 생활업종 점포 밀도다(진할수록 밀집). 남색 점은 지하철역, 자홍 점은 대표공원
          진출입로다. 남부는 상권이 호수공원에 붙어 있고, 북부는 공원이 아니라 동탄역을 따라 깔려 있다.
        </p>
        <MapLightbox maps={parkCapHexMaps} />
      </div>
      <Table spec={parkCapMediationTable} />
      <Callout title="매개는 공원과 상권이 겹치는 곳에서만 선다.">
        동탄1은 총효과의 37%, 일월은 40%가 상권을 경유한다(부분매개). 남부는 상권이 가격을 설명하지 못하고(b),
        북부는 상권이 역을 따라 생겨 공원과 무관하며(a), 광교는 둘 다 끊긴다.
      </Callout>
      <Table spec={parkCapModerationTable} />
      <Callout title="상권은 공원의 가치를 키운다.">
        광교는 매개가 없지만 상권이 큰 쪽(광교중앙역 상업지구)에서 공원 효과가 −0.211***로 커진다. 동탄1도
        같다 — 공원과 상권은 보완 관계다.
      </Callout>

      {/* 03 강건성 */}
      <SectionTitle n="03">결과는 흔들리지 않는가</SectionTitle>
      <Table spec={parkCapSignalTable} />
      <p className="mt-4 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        {parkCapConclusion.robustness}
      </p>

      {/* 04 결론 */}
      <SectionTitle n="04">결론</SectionTitle>
      <div className="mt-4 rounded border border-border border-l-[3px] border-l-accent bg-card px-5 py-4">
        <p className="text-[1.02rem] font-semibold leading-relaxed">{parkCapConclusion.headline}</p>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapConclusion.grounds.map((g, i) => (
          <div key={g.title} className="grid grid-cols-[auto_1fr] gap-4">
            <span className="mt-0.5 font-mono text-[0.72rem] font-semibold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <strong className="block text-[0.9rem]">{g.title}</strong>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-muted-foreground">{g.body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-3xl text-[0.9rem] leading-relaxed">{parkCapConclusion.contribution}</p>

      {/* 부록 — 접어 둔 세부 */}
      <SectionTitle n="부록">자세히 보기</SectionTitle>

      <More title="구역별 해설">
        <div className="mt-4 flex flex-col gap-5">
          {parkCapRegions.map((r) => (
            <section key={r.name} className="overflow-hidden rounded border border-border">
              <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                <Dot k={r.key} />
                <h4 className="text-[0.98rem] font-bold">{r.name}</h4>
                <Verdict v={r.verdict} />
                <span className="ml-auto font-mono text-[0.72rem] tabular-nums text-muted-foreground">
                  단지 {r.n}개 · {r.park}
                </span>
              </header>
              <div className="grid grid-cols-1 gap-4 px-4 py-3.5 lg:grid-cols-[1fr_15rem]">
                <div>
                  <p className="text-[0.9rem] font-semibold leading-relaxed">{r.lead}</p>
                  <p className="mt-2 text-[0.86rem] leading-relaxed">{r.body}</p>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-muted-foreground">{r.why}</p>
                  <p className="mt-2.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">유의할 점 </strong>
                    {r.caution}
                  </p>
                </div>
                <dl className="flex flex-col self-start rounded border border-border bg-muted/30 px-3.5 py-2">
                  <Fact k="계수 (HC1 t)" v={`${r.coef} (${r.t})`} />
                  <Fact k="p값" v={r.p} />
                  <Fact k="수정 R²" v={r.adjr2} />
                  <Fact k="대표공원 거리" v={r.dist} />
                  <Fact k="100m 가까이" v={r.money} />
                </dl>
              </div>
            </section>
          ))}
        </div>
      </More>

      <More title="회귀 전체 · 표준화 계수 · 금액 환산 · 도시구조">
        <Table spec={parkCapFullCoefTable} />
        <Table spec={parkCapStdTable} />
        <Table spec={parkCapMoneyTable} />
        <Table spec={parkCapStructureTable} />
      </More>

      <More title="공간자기상관 · 정의와 사양에 대한 점검">
        <Table spec={parkCapSpatialTable} />
        <Table spec={parkCapSemTable} />
        <Table spec={parkCapNorthTable} />
        <Table spec={parkCapGwanggyoTable} />
        <Table spec={parkCapFormTable} />
        <Table spec={parkCapQuantileTable} />
        <Table spec={parkCapCommerceSelTable} />
      </More>

      <More title="읽는 법 · 자료와 방법">
        <div className="mt-4 flex flex-col gap-3">
          {parkCapStatNotes.map((sn) => (
            <div key={sn.tag} className="rounded border border-border px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {sn.tag}
                </span>
                <strong className="text-[0.86rem]">{sn.title}</strong>
              </div>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted-foreground">{sn.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded border border-border">
          {parkCapSources.map((sc, i) => (
            <div
              key={sc.name}
              className={`grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[5.5rem_1fr] sm:gap-4 ${
                i === 0 ? "" : "border-t border-border"
              }`}
            >
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground">
                {sc.kind}
              </span>
              <div>
                <strong className="text-[0.86rem]">{sc.name}</strong>
                <span className="ml-2 text-[0.8rem] text-accent">{sc.org}</span>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">{sc.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {parkCapMethodology.map((m) => (
            <div key={m.title} className="rounded border border-border px-4 py-3">
              <strong className="block text-[0.86rem]">{m.title}</strong>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted-foreground">{m.body}</p>
            </div>
          ))}
        </div>
      </More>

      <More title="한계와 남은 질문">
        <ul className="mt-4 flex flex-col gap-3">
          {parkCapLimits.map((l) => (
            <li key={l.tag} className="grid grid-cols-[auto_1fr] gap-3">
              <span className="mt-0.5 shrink-0 rounded-sm bg-muted px-2 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {l.tag}
              </span>
              <span className="text-[0.86rem] leading-relaxed">{l.text}</span>
            </li>
          ))}
        </ul>
        <ol className="mt-5 flex flex-col gap-3">
          {parkCapConclusion.questions.map((q) => (
            <li key={q.q} className="rounded border border-border px-4 py-3">
              <strong className="block text-[0.86rem]">{q.q}</strong>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted-foreground">{q.body}</p>
            </li>
          ))}
        </ol>
      </More>

      <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-5 text-[0.72rem] leading-relaxed text-muted-foreground">
        <p>방법론 노트 · {parkCapFooter.method}</p>
        <p className="break-all font-mono leading-[1.9]">{parkCapFooter.files}</p>
      </footer>
    </section>
  )
}
