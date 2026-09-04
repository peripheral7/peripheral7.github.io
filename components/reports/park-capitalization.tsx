import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapChow,
  parkCapCircuityReading,
  parkCapCircuityTable,
  parkCapFacts,
  parkCapFindings,
  parkCapFitTable,
  parkCapFooter,
  parkCapGravityTable,
  parkCapMaps,
  parkCapMeta,
  parkCapMethodology,
  parkCapMoran,
  parkCapPoolingReading,
  parkCapSample,
  parkCapSemTable,
  parkCapStructureNotes,
  parkCapSupplyTable,
  parkCapTiers,
  parkCapTypology,
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
                  className={`border-b border-border last:border-b-0 ${
                    row.fit ? "bg-muted/40" : ""
                  }`}
                >
                  <th
                    scope="row"
                    className={`px-4 py-2.5 text-left align-top text-[0.82rem] font-normal ${
                      row.strong || row.fit ? "font-semibold text-foreground" : "text-muted-foreground"
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

      {/* 00 핵심 요약 — 결론을 맨 위에 */}
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

      {/* 지역별 지도 — 2×2, 클릭 확대 */}
      <SectionTitle n="01">지역별 공원 · 상권 클러스터 지도</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공식 도시계획시설(공원) 결정경계 기준 도시공원과 생활상권 DBSCAN 클러스터(붉은 원,
        반경 ∝ √점포수), 공원 진입로를 함께 표시했다. 이미지를 클릭하면 원본 크기로 확대된다.
      </p>
      <MapLightbox maps={parkCapMaps} />

      {/* 02 표본 개요 */}
      <SectionTitle n="02">표본 개요</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        동탄2 남/북 경계를 실측 좌표로 보정한 이후 확정된 지역별 표본이다. 동탄남부·북부는 이제
        별개 지역으로 완전히 독립 추정된다.
      </p>
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
                  className="flex items-baseline justify-between border-t border-dashed border-border py-1.5 text-[0.78rem]"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* 03 기술통계 */}
      <SectionTitle n="03">기술통계 · VIF</SectionTitle>
      <Table spec={parkCapVifTable} />

      {/* 04 기본모형 */}
      <SectionTitle n="04">헤도닉 회귀 — 기본모형 (상권 제외)</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        클러스터-로버스트 표준오차(단지 단위) OLS. 공원거리는 직선거리 로그이며 상권지수는 아직
        투입하지 않은 baseline 모형이다. <strong>동탄북부의 공원거리 계수는 정확히 0.00</strong>
        (t=0.00)으로 baseline 단계에서는 공원 프리미엄이 검출되지 않는다 — 다만 §08 SEM에서
        공간자기상관을 통제하면 유의한 음(−0.06***)의 효과가 다시 드러난다.
      </p>
      <Table spec={parkCapBaselineTable} />

      {/* 05 중력모형 */}
      <SectionTitle n="05">헤도닉 회귀 — 중력모형 (상권 포함)</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        생활상권 중력지수(3km 버퍼, β=1.0 고정)를 추가 투입한 모형. 상권지수 투입 후 공원거리
        계수가 얼마나 줄어드는지가 “공원-상권 공발달” 여부를 가늠하는 단서다.
      </p>
      <Table spec={parkCapGravityTable} />
      <div className="mt-4 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>광교</strong>(−0.20→−0.09, 55.0% 감소)와 <strong>동탄남부</strong>(−0.18→−0.11,
        38.9% 감소)는 상권지수 투입 시 공원거리 계수가 큰 폭으로 줄어든다 — 공원 프리미엄 상당
        부분이 “공원과 상권이 함께 발달한 입지” 효과였다는 뜻이다. 반면 <strong>운정</strong>은
        −0.08→−0.08로 사실상 변화가 없어 공원 효과가 상권과 독립적으로 존재하며,{" "}
        <strong>동탄북부</strong>는 baseline 단계부터 계수가 0.00이라 애초에 줄어들 효과 자체가 없다.
      </div>

      {/* 06 거리지표 진단 */}
      <SectionTitle n="06">공원거리 지표 진단 — 보행 vs 직선</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        보행 실측거리와 직선거리의 우회율(Circuity) 및 일치도. 회귀 비교가 아니라 지표 자체의
        신뢰도 점검용이다.
      </p>
      <Table spec={parkCapCircuityTable} />

      <h4 className="mt-7 text-[0.95rem] font-semibold">{parkCapCircuityReading.headline}</h4>
      {parkCapCircuityReading.paras.map((p) => (
        <p key={p.slice(0, 24)} className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
          {p}
        </p>
      ))}
      <div className="mt-4 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        {parkCapCircuityReading.keyInsight}
      </div>

      {/* 07 풀링·공간자기상관 */}
      <SectionTitle n="07">풀링 검정 · 공간자기상관</SectionTitle>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-border bg-card p-4">
          <div className="pb-2 text-[0.88rem] font-semibold">Chow Test — 4개 지역 풀링 적합성</div>
          <dl className="flex flex-col">
            {parkCapChow.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between border-t border-dashed border-border py-1.5 text-[0.78rem]"
              >
                <dt className="text-muted-foreground">{k}</dt>
                <dd
                  className={`font-mono font-medium tabular-nums ${
                    k === "판정" ? "text-accent" : ""
                  }`}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <div className="pb-2 text-[0.88rem] font-semibold">
            Moran&apos;s I — 잔차 공간자기상관 (k=3)
          </div>
          <dl className="flex flex-col">
            {parkCapMoran.map((m) => (
              <div
                key={m.key}
                className="flex items-baseline justify-between border-t border-dashed border-border py-1.5 text-[0.78rem]"
              >
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Dot k={m.key} />
                  {m.label}
                </dt>
                <dd className="font-mono font-medium tabular-nums">{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <h4 className="mt-7 text-[0.95rem] font-semibold">{parkCapPoolingReading.chow.title}</h4>
      {parkCapPoolingReading.chow.paras.map((p) => (
        <p key={p.slice(0, 24)} className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
          {p}
        </p>
      ))}

      <h4 className="mt-7 text-[0.95rem] font-semibold">{parkCapPoolingReading.moran.title}</h4>
      {parkCapPoolingReading.moran.paras.map((p) => (
        <p key={p.slice(0, 24)} className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
          {p}
        </p>
      ))}
      <div className="mt-4 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        {parkCapPoolingReading.moran.caution}
      </div>

      {/* 08 SEM */}
      <SectionTitle n="08">공간계량모형 — 최종 채택 (SEM)</SectionTitle>
      <Table spec={parkCapFitTable} />
      <Table spec={parkCapSemTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        <strong className="text-foreground">
          동탄북부는 baseline OLS에서 공원거리 계수가 0.00(비유의)이었으나, 공간오차항으로
          자기상관을 통제한 SEM에서는 −0.06***으로 유의한 음의 효과가 회복된다
        </strong>{" "}
        — OLS 잔차에 섞여 있던 공간적 노이즈가 공원 효과를 가려온 사례로 해석된다.
      </p>

      {/* 09 공원 데이터 방법론 */}
      <SectionTitle n="09">공원 데이터 구축 방법론 · 지역별 구성</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        앞선 모든 분석이 딛고 선 “공원” 정의 자체를 어떻게 만들었는지 기술한다 — 데이터 출처,
        공원으로 인정하는 최소 기준, 3단계 효용 티어 분류, 그리고 그 결과로 나온 지역별 공원
        구성의 차이.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapMethodology.map((m) => (
          <div key={m.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{m.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      <h4 className="mt-8 text-[0.95rem] font-semibold">지역별 공원 구성 — 티어 면적비</h4>
      <div className="mt-2 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
        {[
          ["#0a5c2b", "Tier1 (고효용 대형)"],
          ["#3f9142", "Tier2 (저효용 대형)"],
          ["#8fcf82", "Tier3 (2ha 미만 소형)"],
        ].map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <i aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {parkCapTiers.map((t) => (
          <div key={t.key}>
            <div className="flex items-baseline justify-between text-[0.8rem]">
              <strong className="flex items-center gap-2">
                <Dot k={t.key} />
                {t.label}
              </strong>
              <span className="font-mono text-[0.72rem] tabular-nums text-muted-foreground">
                {t.total}
              </span>
            </div>
            <div className="mt-1 flex h-[22px] overflow-hidden rounded-sm">
              <span style={{ width: `${t.t1}%`, background: "#0a5c2b" }} />
              <span style={{ width: `${t.t2}%`, background: "#3f9142" }} />
              <span style={{ width: `${t.t3}%`, background: "#8fcf82" }} />
            </div>
            <p className="mt-1 text-[0.72rem] text-muted-foreground">{t.detail}</p>
          </div>
        ))}
      </div>

      <Table spec={parkCapSupplyTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>네 지역은 서로 다른 “공원 구조 유형”에 가깝다.</strong>
        <ul className="mt-2 flex flex-col gap-1.5">
          {parkCapTypology.map((t) => (
            <li key={t.label}>
              <strong>{t.label}</strong>는 <em className="not-italic text-accent">{t.type}</em>이다 —{" "}
              {t.body}
            </li>
          ))}
        </ul>
      </div>

      <h4 className="mt-8 text-[0.95rem] font-semibold">
        이 구조가 앞선 회귀 결과를 어떻게 설명하는가
      </h4>
      <ul className="mt-3 flex flex-col gap-2.5">
        {parkCapStructureNotes.map((n) => (
          <li key={n.label} className="grid grid-cols-[auto_1fr] gap-3">
            <span className="mt-0.5 shrink-0 rounded-sm bg-muted px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-muted-foreground">
              {n.label}
            </span>
            <span className="text-[0.88rem] leading-relaxed">{n.body}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
        공원 크기별 자본화효과 상세 결과는 별도 시험분석 산출물(05_08_park_size_capitalization.xlsx)
        참고 — n=4 지역·지역당 대형공원 1~4개 수준이라 이 절의 해석은 확정적 결론이 아닌 탐색적
        신호로 읽어야 한다.
      </p>

      <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-5 text-[0.72rem] leading-relaxed text-muted-foreground">
        <p>방법론 노트 · {parkCapFooter.method}</p>
        <p className="break-all font-mono leading-[1.9]">{parkCapFooter.files}</p>
      </footer>
    </section>
  )
}
