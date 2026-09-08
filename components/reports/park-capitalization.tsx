import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapConventionTable,
  parkCapCorrespondence,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapLimits,
  parkCapMaps,
  parkCapMediationTable,
  parkCapMeta,
  parkCapMethodology,
  parkCapPathTable,
  parkCapReplicationTable,
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
        결정한다. 참고로 <strong>통합 최근접거리의 평균은 네 지역 모두 146~168m로 거의 같다</strong> —
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
        설정이므로 계수는 탄력성이며, −0.080은 그 규모 공원까지의 거리가 10% 멀어질 때 단가가 약
        0.8% 낮아진다는 뜻이다.
      </p>
      <Table spec={parkCapSpecLadderTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>통합 지표는 신도시에서 정보를 담지 못한다.</strong> 공원 경계까지 재면 “가장 가까운
        공원까지 거리”가 평균 146~168m로 네 지역이 사실상 같아진다 — 어느 단지든 걸어서 2분 안에
        어떤 공원이든 닿는다는 뜻이고, 이 지표로는 도시 간 차이도 도시 내 차이도 잡히지 않는다.
        실제로 동탄2 남부에서 통합계수는 +0.019(t=0.61), 광교는 +0.003(t=0.11)으로 부호조차 반대다.
        여기서 <em className="not-italic text-accent">어느 규모의 공원인지를 지정하는 것만으로</em>{" "}
        동탄2 남부는 −0.080(p&lt;0.01), 광교는 −0.044(p&lt;0.05)가 된다. 예외는 운정으로, 세 위계가
        균등해 통합 지표가 특정 규모로 치우치지 않는 유일한 지역이며 그곳에서만 통합계수가
        유의하다(−0.065, p&lt;0.05).
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
        세 위계를 동시에 넣으면 공원 계수 중 10% 수준에서라도 유의한 것은 동탄2 남부 Tier1
        하나뿐이다. 가장 견고한 결과는 공원이 아니라 <strong>지하철 거리</strong>와{" "}
        <strong>생활상권 지수</strong>다.
      </p>
      <Table spec={parkCapBaselineTable} />

      {/* 05 선행연구 재현 */}
      <SectionTitle n="05">선행연구는 어떻게 유의한 효과를 얻었나</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        선행연구는 대체로 대표 대형공원 1개소의 중심좌표를 쓰고, 상권 접근성을 따로 통제하지
        않는다. 우리 사양에서 출발해 그 관행으로 한 단계씩 되돌리며 어디서 유의성이 생기는지
        특정했다.
      </p>
      <Table spec={parkCapReplicationTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>거리 측정점이 아니라 어메니티 통제 누락이 결정적이다.</strong> 신도시는
        지구단위계획에서 대형공원과 중심상업지구를 함께 배치한다 — 광교호수공원 ↔ 광교중앙역,
        동탄호수공원 ↔ 워터프론트 상업지구. 상권을 통제하지 않으면 공원 계수가{" "}
        <em className="not-italic text-accent">공원 + 상권 + 역세권이라는 복합 입지 프리미엄을
        통째로 흡수한다.</em> 다만 이것이 선행연구의 오류라는 뜻은 아니다. 상권을 통제하지 않은
        계수는 <strong>총효과</strong>를, 통제한 계수는 <strong>직접효과</strong>를 추정하며 서로
        다른 질문에 답한다.
      </div>

      <Table spec={parkCapConventionTable} />

      {/* 06 매개효과 */}
      <SectionTitle n="06">상권은 공원 효과를 매개하는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        총효과와 직접효과가 다르다면 그 차이가 어디로 갔는지 확인할 수 있다. 공원 접근성(X)이
        생활상권(M)을 거쳐 가격(Y)에 이르는 경로를 Baron–Kenny 3단계로 분해하고, 간접효과의
        신뢰구간을 백분위 부트스트랩 5,000회로 구했다. 선형모형이므로{" "}
        <strong>총효과 c = 직접효과 c′ + 간접효과 a·b</strong> 가 정확히 성립한다.
      </p>
      <Table spec={parkCapMediationTable} />
      <Table spec={parkCapPathTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        풀링 기준 총효과 −0.067 중 −0.029(42.4%)가 상권을 경유하고, 신뢰구간이 0을 포함하지
        않는다. 동탄2 남부에서는 47.5%다. 반면 동탄2 북부와 운정은 a 경로 자체가 비유의해 매개가
        성립하지 않는다 — 특히 운정은 공원거리가 상권 지수를 전혀 설명하지 못한다(R²=0.000).
        <strong className="text-foreground"> 공원과 상권이 함께 배치된 도시에서만 매개가
        나타난다</strong>는 뜻이며, 이는 “상권 통제가 계수를 절반으로 줄인다”는 관찰의 메커니즘을
        직접 보여준다. 다만 매개분석은 매개변수와 결과 사이에 미관측 교란이 없다는 강한 가정에
        의존하므로, 표 5의 간접효과는 인과적 매개량이 아니라 선형 분해상의 몫으로 읽어야 한다.
      </p>

      {/* 07 분석단위 */}
      <SectionTitle n="07">거래를 세느냐 단지를 세느냐</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        같은 자료를 거래 단위로 돌리면 공원 계수가 훨씬 강하게 나온다. 어느 단계에서 갈라지는지를
        한 단계씩 분해했다. 계약년월 고정효과 제거나 이상치 절사는 거의 영향이 없고, 결정적인 것은
        <strong> 층 처리와 가중치</strong> 두 가지였다.
      </p>
      <Table spec={parkCapUnitTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        공원까지의 거리는 단지 안에서 변하지 않는다. 광교 381건의 거래는 서로 다른 381개의 거리값이
        아니라 21개의 거리값이 반복된 것이며, 잔차의 급내상관은 0.46~0.85에 이른다. Moulton 보정계수
        8.1~18.6은 순진한 OLS 표준오차가 2.9~4.3배 과소추정됨을 뜻한다.{" "}
        <strong className="text-foreground">거래 2,740건의 유효표본은 2,740이 아니라 단지 수에
        가깝다.</strong>
      </p>

      {/* 08 공간계량 */}
      <SectionTitle n="08">공간자기상관 — 분석단위를 바꾸자 사라졌다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        거래 단위 자료에서는 같은 단지의 거래 수십 건이 동일한 대표점 좌표를 공유해, k=3 최근접
        이웃의 99~100%가 같은 단지의 다른 거래가 된다. 공간가중치행렬 W가 공간적 인접성이 아니라{" "}
        <strong>“같은 단지 여부”</strong>를 측정하는 것이다. 분석단위를 단지로 올리자 이 인위적
        상관이 사라졌다.
      </p>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        Chow 검정 F=19.06(df 33/77, p&lt;0.001)로 네 지역을 하나로 묶는 것은 기각된다. 잔차의
        공간자기상관이 확인되지 않으므로 공간계량모형은 최종모형이 아니라 강건성 검토로만 다룬다.
      </p>
      <Table spec={parkCapCircuityTable} />

      {/* 09 기술통계 */}
      <SectionTitle n="09">표본과 기술통계</SectionTitle>
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

      {/* 10 방법론 */}
      <SectionTitle n="10">데이터 구축 방법론</SectionTitle>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapMethodology.map((m) => (
          <div key={m.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{m.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      {/* 11 한계 */}
      <SectionTitle n="11">한계</SectionTitle>
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
