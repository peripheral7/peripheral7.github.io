import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapCorrespondence,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapGravityTable,
  parkCapLimits,
  parkCapMaps,
  parkCapMeta,
  parkCapMethodology,
  parkCapModerationTable,
  parkCapSample,
  parkCapSpatialTable,
  parkCapTierEffectTable,
  parkCapTiers,
  parkCapVifTable,
  type RegionKey,
  type StatTable,
} from "@/content/reports/park-capitalization"

const REGION_DOT: Record<RegionKey, string> = {
  gg: "#3f9e70",
  ds: "#b08a3c",
  dn: "#4f93a8",
  uj: "#c2703a",
}

const TIER_COLOR = ["#0a5c2b", "#3f9142", "#8fcf82"] as const

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
                    key={h}
                    scope="col"
                    className={`border-b border-border px-4 py-2.5 text-[0.72rem] font-semibold text-muted-foreground ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
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
                    }`}
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

      {/* 00 핵심 요약 */}
      <SectionTitle n="00">핵심 요약</SectionTitle>
      <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
        {parkCapFindings.map((f) => (
          <div key={f.label} className="flex flex-col gap-2 bg-card p-5">
            <span className="text-[0.72rem] text-muted-foreground">{f.label}</span>
            <span
              className={`font-mono text-[1.35rem] font-semibold tabular-nums ${
                f.accent ? "text-accent" : "text-foreground"
              }`}
            >
              {f.value}
            </span>
            <span className="text-[0.78rem] leading-relaxed text-muted-foreground">{f.note}</span>
          </div>
        ))}
      </div>

      {/* 01 지도 */}
      <SectionTitle n="01">지역별 공원 · 상권 클러스터 지도</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공식 도시계획시설(공원) 결정경계 기준 도시공원과 생활상권 DBSCAN 클러스터(붉은 원, 반경 ∝
        √점포수), 공원 진입로를 함께 표시했다. 이미지를 클릭하면 원본 크기로 확대된다.
      </p>
      <MapLightbox maps={parkCapMaps} />

      {/* 02 공원 분포 */}
      <SectionTitle n="02">도시별 공원 분포</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        네 지역의 공원을 규모별 3단계로 나눠 면적비를 보면, 겉보기엔 비슷해 보이던 신도시들이 실은
        판이한 녹지 구조를 갖고 있다. 이 구조 차이가 뒤에서 볼 자본화 효과의 차이와 그대로 맞물린다.
      </p>

      <div className="mt-5 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
        {[
          [TIER_COLOR[0], "Tier1 — 지역 최대 1개"],
          [TIER_COLOR[1], "Tier2 — 2ha 이상"],
          [TIER_COLOR[2], "Tier3 — 2ha 미만"],
        ].map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <i aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-5">
        {parkCapTiers.map((t) => (
          <div key={t.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-[0.8rem]">
              <strong className="flex items-center gap-2">
                <Dot k={t.key} />
                {t.label}
                <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.62rem] font-semibold text-muted-foreground">
                  {t.type}
                </span>
              </strong>
              <span className="font-mono text-[0.72rem] tabular-nums text-muted-foreground">
                {t.total}
              </span>
            </div>
            <div className="mt-1.5 flex h-[22px] overflow-hidden rounded-sm">
              <span style={{ width: `${t.t1}%`, background: TIER_COLOR[0] }} />
              <span style={{ width: `${t.t2}%`, background: TIER_COLOR[1] }} />
              <span style={{ width: `${t.t3}%`, background: TIER_COLOR[2] }} />
            </div>
            <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">{t.detail}</p>
            <p className="mt-1 text-[0.85rem] leading-relaxed">{t.typeBody}</p>
          </div>
        ))}
      </div>

      {/* 03 핵심: 대응관계 */}
      <SectionTitle n="03">공원 분포와 자본화 효과의 대응</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 거리를 규모별로 나눠 각각 투입하면, <strong>도시마다 값을 만드는 공원의 크기가 다르다</strong>는
        사실이 드러난다. 로그–로그 설정이므로 계수는 탄력성이며, 예컨대 −0.11은 그 규모 공원까지의
        거리가 10% 멀어질 때 단가가 약 1.1% 낮아진다는 뜻이다.
      </p>
      <Table spec={parkCapTierEffectTable} />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {parkCapCorrespondence.map((c) => (
          <div key={c.key} className="rounded border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-[0.9rem] font-semibold">
              <Dot k={c.key} />
              {c.label}
              <span className="font-normal text-muted-foreground">· {c.type}</span>
            </div>
            <dl className="mt-3 flex flex-col gap-1.5 border-y border-dashed border-border py-2.5 text-[0.75rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">분포</dt>
                <dd className="text-right font-mono tabular-nums">{c.share}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">효과</dt>
                <dd className="text-right font-mono font-semibold tabular-nums text-accent">
                  {c.effect}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.86rem] leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>규모별로 나누기 전에는 이 구조가 전혀 보이지 않았다.</strong> “가장 가까운 공원까지의
        거리” 하나만 쓰면 대형공원과 소형공원의 상반된 신호가 한 계수에 뭉개진다. 실제로 통합거리
        기준에서는 동탄남부의 설명력이 R² 0.33까지 떨어지고 광교는 계수 부호가 뒤집혔는데, 규모별로
        분리하자 각각 0.74와 −0.11**로 정상화됐다. <em className="not-italic text-accent">공원 접근성은
        단일 지표로 다룰 변수가 아니다</em>는 것이 이 분석의 방법론적 결론이다.
      </div>

      {/* 04 기본모형 */}
      <SectionTitle n="04">헤도닉 회귀 — 기본모형</SectionTitle>
      <Table spec={parkCapBaselineTable} />

      {/* 05 상권 */}
      <SectionTitle n="05">상권을 넣으면 공원 효과는 얼마나 남는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        생활상권 중력지수를 추가 투입하면 Tier1 계수가 광교 −0.15→−0.07, 동탄남부 −0.14→−0.08로
        절반 가까이 줄어든다. 대형공원 프리미엄의 상당 부분이 “공원과 상권이 함께 발달한 입지”의
        효과였다는 뜻이다. 반면 동탄북부·운정은 상권지수 자체가 비유의해 그런 상쇄가 일어나지 않는다.
      </p>
      <Table spec={parkCapGravityTable} />
      <Table spec={parkCapModerationTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        조절효과는 <strong className="text-foreground">동탄남부에서만 뚜렷하다</strong>(−0.22***). 중형공원이
        면적의 61%를 차지하고 상권도 그 주변에 붙어 발달한 구조라, 공원과 상권이 서로의 가치를
        키우는 관계가 성립한다. 나머지 세 지역에서는 상권이 공원 프리미엄의 크기를 바꾸지 못한다.
      </p>

      {/* 06 공간계량 */}
      <SectionTitle n="06">공간자기상관과 모형 선택</SectionTitle>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        Chow 검정 F=342.8(df 48/2,676, p&lt;0.001)로 네 지역을 하나로 묶는 것은 기각된다. 같은 동탄2
        안에서도 남/북의 공원 구조와 계수가 다르므로, 행정구역이나 사업지구 단위가 곧 분석 단위가 될
        수 없다는 점을 함께 보여준다.
      </p>
      <Table spec={parkCapCircuityTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        직선거리와 보행 실측거리의 상관은 0.80~0.92로 높지만 우회율 표준편차가 0.40~0.57로 커,
        개별 단지 수준에서는 대체가 어렵다. 회귀에는 직선거리를 쓰되 계수를 보행 접근성의 대리값으로
        읽어야 하며, 우회율 편차가 큰 지역일수록 감쇠편의로 계수가 0쪽으로 눌릴 수 있다.
      </p>

      {/* 07 기술통계 */}
      <SectionTitle n="07">표본과 기술통계</SectionTitle>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {parkCapSample.map((s) => (
          <div key={s.key} className="rounded border border-border bg-card p-4">
            <div className="flex items-center gap-2 pb-2 text-[0.88rem] font-semibold">
              <Dot k={s.key} />
              {s.label}
            </div>
            <dl className="flex flex-col">
              {s.rows.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-2 border-t border-dashed border-border py-1.5 text-[0.76rem]"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-mono font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <Table spec={parkCapVifTable} />

      {/* 08 방법론 */}
      <SectionTitle n="08">공원 데이터 구축 방법론</SectionTitle>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapMethodology.map((m) => (
          <div key={m.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{m.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      {/* 09 한계 */}
      <SectionTitle n="09">한계</SectionTitle>
      <ul className="mt-4 flex flex-col gap-3">
        {parkCapLimits.map((l) => (
          <li key={l.tag} className="grid grid-cols-[auto_1fr] gap-3">
            <span className="mt-0.5 shrink-0 rounded-sm bg-muted px-2 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {l.tag}
            </span>
            <span className="text-[0.88rem] leading-relaxed">{l.text}</span>
          </li>
        ))}
      </ul>

      <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-5 text-[0.72rem] leading-relaxed text-muted-foreground">
        <p>방법론 노트 · {parkCapFooter.method}</p>
        <p className="break-all font-mono leading-[1.9]">{parkCapFooter.files}</p>
      </footer>
    </section>
  )
}
