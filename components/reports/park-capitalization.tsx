import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapCorrespondence,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapLimits,
  parkCapMagnitude,
  parkCapMaps,
  parkCapMeta,
  parkCapMethodology,
  parkCapModelSelectTable,
  parkCapSample,
  parkCapSpatialTable,
  parkCapSpecLadderTable,
  parkCapTiers,
  parkCapUnitTable,
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

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        가구의 입찰함수가 규모가 다른 여러 공원까지의 거리에 각각 의존하고 그 잠재가격이 서로
        다르다면, 이를 하나의 지수(최근접거리)로 대체한 추정계수는 어떤 개별 잠재가격으로도
        수렴하지 않고 이들의 <strong>가중평균</strong>으로 수렴한다. 가중치는 각 규모가 최근접이
        되는 관측치의 비중, 즉 <em className="not-italic text-accent">그 도시의 공원 스톡 구성
        그 자체</em>가 결정한다. 지수는 오차 없이 측정되므로 이는 고전적 측정오차가 아니며,
        표본을 늘려도 해소되지 않는다. 같은 이름의 변수가 도시마다 다른 복합재를 가리키게 되는 것이다.
      </div>

      {/* 01 지도 */}
      <SectionTitle n="01">규모 위계별 공원 분포</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        도시계획시설(공원) 결정경계 기준으로 각 지역의 공원을 규모 3단계로 칠하고, 회귀에 실제로
        들어간 단지 121개를 점으로 표시했다. 진한 녹색이 Tier1(지역 대표공원), 중간 녹색이
        Tier2(10ha 이상), 연녹색이 Tier3(2~10ha)다. 배경의 흰 선은 도로망이다. 이미지를 클릭하면
        원본 크기로 확대된다.
      </p>
      <MapLightbox maps={parkCapMaps} />

      {/* 02 공원 분포 */}
      <SectionTitle n="02">도시별 공원 스톡 구성</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        네 지역의 공원을 규모별 면적비로 보면, 겉보기엔 비슷한 2기 신도시들이 판이한 녹지 구조를
        갖고 있다. 이 구성이 곧 통합 지표에 적용되는 가중치이며, 뒤에서 볼 편의의 방향과 크기를
        결정한다. 참고로 <strong>통합 최근접거리의 평균은 네 지역 모두 308~371m로 거의 같다</strong> —
        이 지표만 보면 네 도시의 공원 환경은 구별되지 않는다.
      </p>

      <div className="mt-5 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
        {[
          [TIER_COLOR[0], "Tier1 — 지역 대표공원 1개소"],
          [TIER_COLOR[1], "Tier2 — 10ha 이상"],
          [TIER_COLOR[2], "Tier3 — 2~10ha"],
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

      {/* 03 핵심: 조작화 사다리 */}
      <SectionTitle n="03">조작화를 한 단계씩 올리면 무엇이 드러나는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        통제변수를 완전히 고정한 채 공원 변수만 네 단계로 바꿔 추정했다. ⓪ 공원 변수를 넣지 않은
        모형, ① 위계를 통합한 최근접거리, ② 지역 대표공원 거리만, ③ 세 위계 동시. 로그–로그
        설정이므로 계수는 탄력성이며, −0.067은 그 규모 공원까지의 거리가 10% 멀어질 때 단가가 약
        0.67% 낮아진다는 뜻이다.
      </p>
      <Table spec={parkCapSpecLadderTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>①→②에서 회복되는 것과 ②→③에서 교정되는 것이 다르다.</strong> 동탄2 남부에서는
        통합거리(0.014, t=0.34)를 대표공원 거리로 바꾸는 것만으로 −0.082(p&lt;0.01)가 나타난다 —
        <em className="not-italic text-accent"> 효과의 존재 여부</em>가 회복된다. 반대로 운정에서는
        대표공원 단독으로 유의해 보이던 −0.045가 세 위계를 함께 넣자 −0.009로 사라지고 Tier2가
        −0.070으로 드러난다 — <em className="not-italic text-accent">효과의 귀속 대상</em>이 교정된다.
        그리고 어느 도시에서 어느 이행이 결정적인지는 그 도시의 공원 스톡 구성이 정한다.
      </div>

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
                <dt className="text-muted-foreground">편의 유형</dt>
                <dd className="text-right font-mono font-semibold tabular-nums text-accent">
                  {c.effect}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.86rem] leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* 04 기본모형 */}
      <SectionTitle n="04">헤도닉 회귀 — 기본모형</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        가장 견고한 결과는 공원이 아니라 <strong>지하철 거리</strong>다. 네 지역 모두에서
        −0.10~−0.26으로 유의하며, 어느 지역에서도 공원보다 계수가 크다. 특히 동탄2 북부에서
        −0.26으로 가장 큰데, 이 지역의 공원 계수는 세 위계 모두 0에 가깝다.
      </p>
      <Table spec={parkCapBaselineTable} />

      <figure className="mt-5">
        <div className="overflow-hidden rounded border border-border bg-card">
          <figcaption className="border-b border-border px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
            유의한 두 계수의 경제적 크기
          </figcaption>
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
            {parkCapMagnitude.map((m) => (
              <div key={m.label} className="bg-card p-5">
                <p className="text-[0.8rem] font-semibold">{m.label}</p>
                <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">
                  탄력성 {m.elast} · {m.base}
                </p>
                <p className="mt-3 font-mono text-[1.4rem] font-semibold tabular-nums text-accent">
                  {m.pct}
                </p>
                <p className="text-[0.72rem] text-muted-foreground">
                  100m 접근 시 · {m.won} · 거리 절반이면 {m.half}
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[0.75rem] leading-relaxed text-muted-foreground">
          금액은 각 지역 평균 거래가(동탄2 남부 6.59억 · 운정 4.23억) 기준. 두 효과 모두 거리를
          절반으로 줄여야 5% 남짓으로, 전용면적(−0.38~−0.61)이나 지하철(−0.26)에 비하면 작은
          크기다.
        </p>
      </figure>

      {/* 05 분석단위 */}
      <SectionTitle n="05">거래를 세느냐 단지를 세느냐</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        같은 자료를 거래 단위로 돌리면 공원 계수가 훨씬 강하게 나온다. 어느 단계에서 갈라지는지를
        한 단계씩 분해했다. 계약년월 고정효과 제거나 이상치 절사는 거의 영향이 없고, 결정적인 것은
        <strong> 층 처리와 가중치</strong> 두 가지였다.
      </p>
      <Table spec={parkCapUnitTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        공원까지의 거리는 단지 안에서 변하지 않는다. 광교 381건의 거래는 서로 다른 381개의 거리값이
        아니라 21개의 거리값이 반복된 것이며, 잔차의 급내상관은 0.46~0.85에 이른다. Moulton 보정계수
        8.1~18.6은 순진한 OLS 표준오차가 2.9~4.3배 과소추정됨을 뜻하고, 실제 클러스터-로버스트
        표준오차의 확대 배율(2.6~3.9배)과 잘 맞는다. 요컨대 <strong className="text-foreground">거래
        2,740건의 유효표본은 2,740이 아니라 단지 수에 가깝다.</strong> 표준오차 문제는
        클러스터-로버스트로 해결되지만, 좌표 중복이 공간가중치행렬을 무너뜨리는 문제는 그것으로
        교정되지 않는다.
      </p>

      {/* 06 공간계량 */}
      <SectionTitle n="06">공간자기상관 — 분석단위를 바꾸자 사라졌다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        거래 단위 자료에서는 같은 단지의 거래 수십 건이 동일한 대표점 좌표를 공유한다. 그 결과
        k=3 최근접 이웃의 99~100%가 같은 단지의 다른 거래가 되고, 공간가중치행렬 W가 공간적 인접성이
        아니라 <strong>“같은 단지 여부”</strong>를 측정하게 된다. 이때 추정되는 공간오차계수
        0.68~0.93은 공간적 파급이 아니라 동일 단지 반복거래의 가격 유사성이며, 클러스터-로버스트
        표준오차가 이미 처리하는 구조를 이중으로 통제한 셈이다. 분석단위를 단지로 올리자 이
        인위적 상관이 사라졌다.
      </p>
      <Table spec={parkCapSpatialTable} />
      <Table spec={parkCapModelSelectTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        Chow 검정 F=21.43(df 33/77, p&lt;0.001)로 네 지역을 하나로 묶는 것은 기각된다. 같은 동탄2
        안에서도 남/북의 공원 구조와 계수가 다르므로, 행정구역이나 사업지구 단위가 곧 분석 단위가 될
        수 없다. 규모 위계에 대해 제기한 집계편의의 논리를 공간 단위에 그대로 적용한 결과이기도 하다.
      </p>
      <Table spec={parkCapCircuityTable} />

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
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        표본 흐름: 거래 2,740 → 평형 한정 2,611 → 이상치 절사 2,275 → 단지×평형 158 →
        <strong className="text-foreground"> 단지당 1평형 121</strong>. 마지막 단계에서 84형을 기본으로
        하고 84형 거래가 하한에 못 미치는 7개 단지만 59형으로 대체했다. 고유좌표 121개로 좌표당
        1.00 — 좌표 중복이 완전히 사라진다. 거래 3건 이하로 집계된 관측치가 16개(13.2%) 포함된다.
      </p>
      <Table spec={parkCapVifTable} />

      {/* 08 방법론 */}
      <SectionTitle n="08">데이터 구축 방법론</SectionTitle>
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
