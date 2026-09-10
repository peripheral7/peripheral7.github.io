import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapCommerceMaps,
  parkCapConventionTable,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapHeadlineTable,
  parkCapLimits,
  parkCapMaps,
  parkCapMediationTable,
  parkCapMeta,
  parkCapMethodology,
  parkCapPathTable,
  parkCapRejected,
  parkCapReplicationTable,
  parkCapSample,
  parkCapSpatialTable,
  parkCapTierRuleTable,
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

      {/* 01 핵심 결과 */}
      <SectionTitle n="01">공원은 가격에 어떻게 반영되는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        결론부터 적는다.{" "}
        <strong>가격에 반영되는 것은 &lsquo;공원까지의 거리&rsquo; 일반이 아니라, 그 도시에서 효용이
        가장 높은 공원까지의 거리다.</strong> 규모에 따라 법정 유치거리가 250m에서 &lsquo;제한
        없음&rsquo;까지 차등되는 이상 모든 공원을 같은 재화로 놓을 수 없기 때문이며, 본 분석의 공원
        변수는 각 도시의 대표공원 경계까지의 최단거리 하나다. 네 지역 모두에서 계수의 부호는 음(−)
        으로 이론과 일치하고, 그중 둘에서 통계적으로 유의하다.
      </p>
      <Table spec={parkCapHeadlineTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>크기를 실감으로 옮기면 이렇다.</strong> 광교에서 광교호수공원에 100m 더 가까운
        단지는 84㎡ 기준 약 <strong>1,750만원</strong> 비싸다(평균 10.2억). 동탄2 남부에서 동탄호수
        공원 쪽으로 100m는 약 <strong>455만원</strong>이다(평균 6.6억). 같은 탄력성이라도 광교 쪽
        금액이 큰 것은 대표공원까지의 평균 거리가 310m로 짧아 100m가 더 큰 비율 변화이기 때문이다.
        <br />
        <br />
        다만 이 크기는 입지 요인 중 가장 작다.{" "}
        <em className="not-italic text-accent">같은 회귀에서 지하철 거리는 −0.28(동탄2 북부),
        생활상권 지수는 +0.24(동탄2 남부)로 네 지역의 모든 공원 계수를 압도한다.</em> 공원은 신도시
        아파트 가격을 만드는 세 입지 요인 가운데 가장 작은 축이다.
      </div>

      <h4 className="mt-8 text-[0.95rem] font-bold">네 지역을 관통하는 결과 — 공원이 아니라 경로</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        지역별 계수는 표본이 21~41개로 얇아 둘은 유의하고 둘은 그렇지 않다. 반면 네 지역 121개
        단지를 함께 놓고 보면 훨씬 안정적인 결과가 하나 나온다 —{" "}
        <strong>공원 근접 프리미엄의 상당 부분은 공원 자체가 아니라, 공원과 함께 배치된 상권을
        경유한다.</strong>
      </p>
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        대표공원까지의 거리가 10% 멀어지면 단가는 약 <strong>0.67%</strong> 낮아진다(총효과
        −0.067, t=−4.48). 그런데 생활상권 지수를 함께 통제하면 그 값이 <strong>0.40%</strong>로
        줄어든다(직접효과 −0.040, t=−2.91). 사라진 <strong>0.27%p가 상권을 경유한 몫</strong>이며,
        전체의 <strong className="text-accent">40.4%</strong>다. 부트스트랩 5,000회 신뢰구간
        (−0.045 ~ −0.012)이 0을 포함하지 않는다. 신도시의 지구단위계획이 대형공원과 중심상업지구를
        나란히 배치하기 때문이다 — 광교호수공원 ↔ 광교중앙역, 동탄호수공원 ↔ 워터프론트 상업지구.
        분해의 근거와 지역별 편차는 §07에서 다룬다.
      </p>

      {/* 02 표본과 기술통계 */}
      <SectionTitle n="02">표본과 기술통계</SectionTitle>
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
        <strong className="text-foreground"> 단지당 1평형 121</strong>. 마지막 단계에서 84형을
        기본으로 하고 84형 거래가 하한에 못 미치는 7개 단지만 59형으로 대체했다. 고유좌표 121개로
        좌표당 1.00이며, 거래 3건 이하로 집계된 관측치가 16개(13.2%) 포함된다.
      </p>
      <Table spec={parkCapVifTable} />

      {/* 03 지도 */}
      <SectionTitle n="03">규모 위계별 공원 분포</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        도시계획시설(공원) 결정경계 기준으로 각 지역의 공원을 규모 3단계로 칠하고, 회귀에 실제로
        들어간 단지 121개를 점으로 표시했다. 진한 녹색이 Tier1(지역 대표공원), 중간 녹색이
        Tier2(10ha 이상), 연녹색이 Tier3(2~10ha)다. 동탄2 북부는 대표공원 조건을 충족하는 공원이
        없어 Tier1이 없다. 배경의 흰 선은 도로망이며, 이미지를 클릭하면 원본 크기로 확대된다.
      </p>
      <MapLightbox maps={parkCapMaps} />

      {/* 04 공원 스톡 */}
      <SectionTitle n="04">도시별 공원 스톡 구성</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        네 지역의 공원을 규모별 면적비로 보면, 겉보기엔 비슷한 2기 신도시들이 판이한 녹지 구조를
        갖고 있다. 대표공원의 규모가 특히 갈린다 — 광교호수공원 224.9ha에서 동탄2 북부의 최대
        공원 29.4ha까지 여덟 배 차이다.
      </p>

      <div className="mt-5 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
        {[
          [TIER_COLOR[0], "Tier1 — 지역 대표공원"],
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

      {/* 05 기본모형 */}
      <SectionTitle n="05">헤도닉 회귀 — 전체 계수</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        채택 사양은 공원 변수를 하나만 쓰지만, 규모별로 나누어 넣었을 때 각 위계가 어떻게 거동하는
        지와 통제변수의 전체 계수를 함께 싣는다.
      </p>
      <Table spec={parkCapBaselineTable} />

      {/* 06 선행연구 재현 */}
      <SectionTitle n="06">선행연구는 어떻게 유의한 효과를 얻었나</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        본 분석의 계수는 선행연구가 보고해 온 값보다 현저히 작다. 그 차이가 어디에서 오는지를
        같은 자료로 확인했다. 선행연구가 채택해 온 세 가지 선택 — 대표공원 1개소만 투입, 중심점
        좌표 사용, 경쟁 어메니티 미통제 — 을 하나씩 되돌리며 계수를 추적한다.
      </p>
      <Table spec={parkCapReplicationTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>거리 측정점이 아니라 어메니티 통제 누락이 결정적이다.</strong> 신도시는
        지구단위계획에서 대형공원과 중심상업지구를 함께 배치한다 — 광교호수공원 ↔ 광교중앙역,
        동탄호수공원 ↔ 워터프론트 상업지구. 상권을 통제하지 않으면 공원 거리 계수가{" "}
        <em className="not-italic text-accent">공원 + 상권 + 역세권이라는 복합 입지 프리미엄을
        통째로 흡수한다.</em> 다만 이것이 선행연구의 오류라는 뜻은 아니다. 상권을 통제하지 않은
        계수는 <strong>총효과</strong>를, 통제한 계수는 <strong>직접효과</strong>를 추정하며 서로
        다른 질문에 답한다. 본 분석은 후자를 추정하므로 정의상 더 작다.
      </div>

      {/* 07 매개효과 */}
      <SectionTitle n="07">상권은 공원 효과를 매개하는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        총효과와 직접효과가 다르다면 그 차이가 어디로 갔는지 확인할 수 있다. 공원 접근성(X)이
        생활상권(M)을 거쳐 가격(Y)에 이르는 경로를 Baron–Kenny 3단계로 분해하고, 간접효과의
        신뢰구간을 백분위 부트스트랩 5,000회로 구했다. 선형모형이므로{" "}
        <strong>총효과 c = 직접효과 c′ + 간접효과 a·b</strong> 가 정확히 성립한다.
      </p>
      <Table spec={parkCapMediationTable} />
      <Table spec={parkCapPathTable} />

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        a 경로의 강도 차이는 공간 배치에서 그대로 드러난다. 아래 지도는 같은 배경 규약에
        생활상권 POI 밀도를 육각 그리드(폭 225m)로 얹고 공원은 윤곽선만 남긴 것이다.
        동탄2 남부는 상권 밀집지가 공원 회랑을 따라 늘어서 있는 반면, 운정은 호수공원 주변이
        비어 있고 상권이 지구 외곽에 별도로 형성되어 있다.
      </p>
      <MapLightbox maps={parkCapCommerceMaps} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        풀링 기준 총효과 −0.067 중 −0.027(40.4%)이 상권을 경유하고, 신뢰구간이 0을 포함하지
        않는다. 동탄2 남부에서는 47.5%다. 반면 운정은 공원거리가 상권 지수를 전혀 설명하지 못하고
        (R²=0.000) 매개도 성립하지 않는다.{" "}
        <strong className="text-foreground">공원과 상권이 계획 단계에서 함께 배치된 도시에서만
        매개가 나타난다</strong>는 뜻이며, &ldquo;상권 통제가 계수를 절반으로 줄인다&rdquo;는 관찰의
        메커니즘을 직접 보여준다. 다만 매개분석은 매개변수와 결과 사이에 미관측 교란이 없다는 강한
        가정에 의존하므로, 간접효과는 인과적 매개량이 아니라 선형 분해상의 몫으로 읽어야 한다.
      </p>

      {/* 08 연구설계 검증 */}
      <SectionTitle n="08">연구설계의 다른 선택지를 검증한 결과</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        Tier1 판정 규칙, 거리 측정 규약, 분석단위 세 가지에 대해서도 대안을 모두 추정해 비교했다.
      </p>
      <Table spec={parkCapTierRuleTable} />
      <Table spec={parkCapConventionTable} />
      <Table spec={parkCapUnitTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        분석단위를 거래로 두면 공원 계수가 훨씬 강하게 나온다. 공원까지의 거리는 단지 안에서 변하지
        않으므로 광교 381건의 거래는 서로 다른 381개의 거리값이 아니라 21개의 거리값이 반복된
        것이며, 잔차의 급내상관은 0.46~0.85에 이른다. Moulton 보정계수 8.1~18.6은 순진한 OLS
        표준오차가 2.9~4.3배 과소추정됨을 뜻한다.{" "}
        <strong className="text-foreground">거래 2,740건의 유효표본은 2,740이 아니라 단지 수에
        가깝다.</strong>
      </p>

      {/* 09 공간계량 */}
      <SectionTitle n="09">공간자기상관</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        분석단위를 단지로 두면 좌표 중복이 없으므로(121개 관측치에 고유 좌표 121개) 가중치행렬이
        실질적인 공간 인접성을 측정한다. 거래 단위 자료에서는 같은 단지의 거래 수십 건이 동일한
        대표점 좌표를 공유해 k=3 최근접 이웃의 99~100%가 같은 단지의 다른 거래가 되고, 공간가중치
        행렬 W가 공간적 인접성이 아니라 <strong>&ldquo;같은 단지 여부&rdquo;</strong>를 측정하게 된다.
      </p>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        Chow 검정 F=8.48(df 32/78, p&lt;0.001)로 네 지역을 하나로 묶는 것은 기각된다. 같은 동탄2
        안에서도 남/북의 공원 구조와 계수가 다르므로, 행정구역이나 사업지구 단위가 곧 분석 단위가
        될 수 없다.
      </p>
      <Table spec={parkCapCircuityTable} />

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

      {/* 12 검토 후 미채택 */}
      <SectionTitle n="12">검토했으나 채택하지 않은 지표</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 변수를 하나로 정하기까지 네 가지 방식을 모두 추정해 비교했다. 각각의 접근과 결과,
        그리고 채택하지 않은 이유를 정리한다.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapRejected.map((r) => (
          <div key={r.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{r.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        네 방식의 실패는 형태가 같다.{" "}
        <strong className="text-foreground">규모가 다른 공원들을 하나의 값으로 뭉개면, 그 연산이
        최솟값이든 평균이든 가중합이든 서로 다른 잠재가격이 섞여 어느 것으로도 수렴하지 않는
        계수가 남는다.</strong> 섞이는 비율은 그 도시의 공원 구성이 정하므로, 같은 이름의 변수가
        도시마다 다른 재화를 가리키게 된다. 대안은 뭉개는 방식을 바꾸는 것이 아니라 어떤 공원을
        잴 것인지를 먼저 지정하는 것이며, 그것이 본 분석이 대표공원 하나로 돌아간 이유다.
      </p>

      <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-5 text-[0.72rem] leading-relaxed text-muted-foreground">
        <p>방법론 노트 · {parkCapFooter.method}</p>
        <p className="break-all font-mono leading-[1.9]">{parkCapFooter.files}</p>
      </footer>
    </section>
  )
}
