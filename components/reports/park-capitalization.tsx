import Image from "next/image"
import {
  parkCapConclusions,
  parkCapCoefTable,
  parkCapDecay,
  parkCapFacts,
  parkCapLimits,
  parkCapMaps,
  parkCapMeta,
  parkCapModerationTable,
  parkCapMoneyTable,
  parkCapNotes,
  parkCapR2Table,
  parkCapSpatialTable,
} from "@/content/reports/park-capitalization"

type Cell = { v: string; t?: string; muted?: boolean }
type Row = { label: string; sub?: string; strong?: boolean; cells: Cell[] }
type TableSpec = { caption: string; head: string[]; rows: Row[] }

function StatTable({ spec }: { spec: TableSpec }) {
  return (
    <figure className="mt-5 overflow-hidden rounded border border-border bg-card">
      <figcaption className="border-b border-border px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
        {spec.caption}
      </figcaption>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
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
              <tr key={row.label} className="border-b border-border last:border-b-0">
                <th
                  scope="row"
                  className={`px-4 py-2.5 text-left align-top text-[0.82rem] font-normal ${
                    row.strong ? "font-semibold" : ""
                  }`}
                >
                  {row.label}
                  {row.sub ? (
                    <span className="mt-0.5 block font-mono text-[0.65rem] font-normal text-muted-foreground">
                      {row.sub}
                    </span>
                  ) : null}
                </th>
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className="whitespace-nowrap px-4 py-2.5 text-right align-top font-mono text-[0.8rem] tabular-nums"
                  >
                    <span className={cell.muted ? "text-muted-foreground" : ""}>{cell.v}</span>
                    {cell.t ? (
                      <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
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
    </figure>
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

export function ParkCapitalizationReport() {
  const decayMax = Math.max(
    ...parkCapDecay.rows.flatMap((r) => r.values.map((v) => Math.abs(v)))
  )

  return (
    <section aria-labelledby="park-cap-title">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">
        {parkCapMeta.eyebrow}
      </p>
      <h2
        id="park-cap-title"
        className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl"
      >
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
            <dd className="mt-0.5 font-mono text-[0.85rem] font-semibold tabular-nums">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* 결론 요약 */}
      <div className="mt-8 rounded border border-border border-l-[3px] border-l-accent bg-card p-5 md:p-6">
        <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-accent">
          결론 요약
        </h3>
        <ol className="mt-4 flex flex-col gap-4">
          {parkCapConclusions.map((c) => (
            <li key={c.n} className="grid grid-cols-[1.6rem_1fr] gap-3">
              <span className="pt-0.5 font-mono text-[0.7rem] font-semibold text-accent">
                {c.n}
              </span>
              <span className="text-[0.92rem] leading-relaxed">{c.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 3개 신도시 클러스터 지도 — 결론 요약 바로 아래 한 행 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {parkCapMaps.map((m) => (
          <figure
            key={m.id}
            className="overflow-hidden rounded border border-border bg-card"
          >
            <div className="relative aspect-square w-full bg-muted">
              <Image
                src={m.src}
                alt={`${m.label} 공원 및 상권 클러스터 지도`}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <figcaption className="flex items-baseline justify-between border-t border-border px-3 py-2">
              <strong className="text-[0.8rem]">{m.label}</strong>
              <span className="font-mono text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                {m.sub}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-foreground">
        공식 도시계획시설(공원) 결정경계 기준 도시공원(10ha 이상 진한 녹색 / 미만 연녹색)과
        생활상권 DBSCAN 클러스터(붉은 원, 반경 ∝ √점포수), 공원 진입로를 함께 표시했다.
      </p>

      {/* 01 자본화 효과 */}
      <SectionTitle n="01">공원 자본화 효과는 견고하다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        로그–로그 설정이므로 계수는 곧 탄력성이다. 기본모형에서 공원까지 직선거리가 10%
        멀어질 때 단가는 광교 1.7%, 동탄 1.6%, 운정 0.8% 하락하며 세 지역 모두 1% 수준에서
        유의하다.
      </p>
      <StatTable spec={parkCapCoefTable} />
      <p className="mt-4 max-w-3xl text-[0.92rem] leading-relaxed">
        상권지수를 넣었을 때의 반응은 지역마다 다르다. 광교에서는 계수가 −0.17에서 −0.07로
        절반 이하로 줄어드는데, 광교의 공원 프리미엄 상당 부분이 실은 “공원과 상권이 함께
        발달한 입지”의 프리미엄이었음을 뜻한다. 반면 운정은 −0.08로 전혀 변하지 않아 공원
        효과가 상권과 독립적으로 존재한다. 가장 중요한 것은 마지막 행으로, 공간자기상관을
        통제한 SEM에서도 계수가 살아남으며 동탄은 <strong>−0.16에서 −0.21로 오히려 강해진다</strong>.
      </p>

      {/* 02 효과의 크기 */}
      <SectionTitle n="02">효과의 크기: 얼마나 큰가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        계수의 유의성과 계수의 크기는 다른 질문이다. 공원 접근성이 실제로 아파트 가격의
        얼마를 설명하고, 거리 100m가 몇 퍼센트·몇 만원의 가치를 갖는지를 세 각도에서 환산했다.
      </p>
      <StatTable spec={parkCapR2Table} />
      <p className="mt-4 max-w-3xl text-[0.92rem] leading-relaxed">
        동탄이 가장 극적이다. 공원거리 변수 하나를 빼면 <strong>R²가 0.66에서 0.39로 무너진다.</strong>{" "}
        건축연령·세대수·브랜드·층수·면적·지하철거리를 모두 넣고도 설명하지 못하던 가격 변동의
        44.9%를 공원거리 하나가 잡아낸다. 운정의 18.6%는 공원 효과가 없어서가 아니라 다른
        변수들이 이미 가격을 거의 다 설명하고 있기 때문이다(공원 제외 R²가 이미 0.895).
      </p>

      <h4 className="mt-8 text-[0.95rem] font-semibold">거리 100m의 가격 효과 — 상수가 아니다</h4>
      <p className="mt-2 max-w-3xl text-[0.92rem] leading-relaxed">
        로그–로그 모형이므로 100m의 가치는 출발 거리에 따라 달라진다. 공원 코앞에서의 100m와
        1km 밖에서의 100m는 체감이 다르며, 모형이 이를 그대로 반영한다.
      </p>
      <div className="mt-5 overflow-x-auto rounded border border-border bg-card p-4">
        <div className="min-w-[42rem]">
          <div className="grid grid-cols-[7rem_repeat(5,minmax(0,1fr))] gap-2 border-b border-border pb-2">
            <span />
            {parkCapDecay.cols.map((c) => (
              <span
                key={c}
                className="font-mono text-[0.62rem] tabular-nums text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          {parkCapDecay.rows.map((r) => (
            <div
              key={r.label}
              className="mt-2 grid grid-cols-[7rem_repeat(5,minmax(0,1fr))] items-center gap-2"
            >
              <span className="flex flex-col leading-tight">
                <strong className="text-[0.82rem]">{r.label}</strong>
                <span className="font-mono text-[0.62rem] text-muted-foreground">{r.beta}</span>
              </span>
              {r.values.map((v, i) => (
                <span
                  key={i}
                  className="relative flex h-7 items-center overflow-hidden rounded-sm bg-muted pl-1.5 font-mono text-[0.7rem] tabular-nums"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 border-r-2 border-accent bg-accent/20"
                    style={{ width: `${(Math.abs(v) / decayMax) * 100}%` }}
                  />
                  <span className="relative">{v.toFixed(2)}%</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-foreground">
        막대 길이는 하락률의 상대 크기. 동탄에서 공원 200m 거리의 단지가 300m로 밀려나면 단가가
        8.2% 낮아지지만, 1,000m에서 1,100m로 밀려날 때는 2.0%에 그친다. 공원 프리미엄은
        근거리에 집중된다.
      </p>

      <h4 className="mt-8 text-[0.95rem] font-semibold">금액 환산 — 실제 거래가로 얼마인가</h4>
      <StatTable spec={parkCapMoneyTable} />
      <p className="mt-4 max-w-3xl text-[0.92rem] leading-relaxed">
        가장 직관적인 요약은 두 번째 행이다. 같은 신도시 안에서 공원과 가까운 단지와 먼 단지
        사이에는 <strong>광교 1.07억, 동탄 1.28억, 운정 0.29억의 가격 차이</strong>가 존재하며,
        이는 면적·층·연령·브랜드·지하철 접근성을 모두 동일하게 맞춘 뒤에 남는 순수한 공원
        프리미엄이다.
      </p>

      {/* 03 공간계량 */}
      <SectionTitle n="03">공간자기상관: OLS만으로는 부족하다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        OLS 잔차의 Moran&apos;s I는 세 지역 모두 1% 수준에서 유의하며, 광교·동탄은 0.8을 넘는 극히
        강한 공간군집을 보인다. 이웃 정의(k=2,3,4)를 바꿔도 값이 안정적이어서 가중행렬 설정에
        따른 인위적 결과가 아니다.
      </p>
      <StatTable spec={parkCapSpatialTable} />
      <p className="mt-4 max-w-3xl text-[0.92rem] leading-relaxed">
        Robust LM 검정이 결론을 갈라준다. 동탄(p=0.923)과 운정(p=0.799)에서 lag 항은 전혀
        유의하지 않은 반면 error 항은 강하게 유의하며, AIC도 세 지역 모두 SEM을 지목한다. 즉
        가격의 공간적 연관은 “이웃 가격이 내 가격을 끌어올리는” 파급(lag) 구조가 아니라,
        모형에 넣지 못한 입지요인이 공간적으로 뭉쳐 있는 오차(error) 구조다.
      </p>

      {/* 04 상권 조절효과 */}
      <SectionTitle n="04">상권은 수준을 올리되 기울기를 바꾸지 않는다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        통제변수로서의 상권은 강력하다. 생활상권 중력지수는 광교 0.09***, 동탄 0.19***로 유의하며
        설명력을 크게 끌어올린다(광교 R² 0.86→0.96, 동탄 0.66→0.75). 그러나 조절변수로서는
        무효하다.
      </p>
      <StatTable spec={parkCapModerationTable} />
      <p className="mt-4 max-w-3xl text-[0.92rem] leading-relaxed">
        기준점(공원 진입로 / 단지)과 측정방식(단순카운트 / 거리조락 중력모형), 버퍼 반경(300m /
        500m)을 바꿔가며 검정했으나 상호작용항은 모든 사양에서 비유의했다. 반면 같은 회귀식
        안에서 상권의 주효과는 광교·동탄에서 강하게 유의하다. 상권과 공원은 각각 독립적으로
        가격에 기여하는 <strong>가산적(additive) 관계</strong>이며, 한쪽이 다른 쪽의 한계효과를
        증폭하거나 상쇄하는 곱셈적 관계가 아니다.
      </p>

      {/* 05 유의사항 */}
      <SectionTitle n="05">해석상 유의사항</SectionTitle>
      <div className="mt-4 flex flex-col gap-4">
        {parkCapNotes.map((n) => (
          <div
            key={n.title}
            className="rounded border border-border border-l-[3px] border-l-muted-foreground/40 bg-muted/40 px-4 py-3.5"
          >
            <strong className="block text-[0.85rem]">{n.title}</strong>
            <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted-foreground">{n.body}</p>
          </div>
        ))}
      </div>

      {/* 06 한계 */}
      <SectionTitle n="06">한계</SectionTitle>
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
    </section>
  )
}
