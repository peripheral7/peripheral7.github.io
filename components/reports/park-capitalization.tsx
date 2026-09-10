import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapAxisMatchTable,
  parkCapCommerceMaps,
  parkCapConventionTable,
  parkCapDiscrimTable,
  parkCapCorrespondence,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapHeadlineTable,
  parkCapImplicitWeightTable,
  parkCapLimits,
  parkCapMaps,
  parkCapMdeTable,
  parkCapMeasureTable,
  parkCapMediationTable,
  parkCapMeta,
  parkCapMethodology,
  parkCapPathTable,
  parkCapReplicationTable,
  parkCapSample,
  parkCapSpatialTable,
  parkCapSpecLadderTable,
  parkCapTier3Table,
  parkCapTierRuleTable,
  parkCapTiers,
  parkCapUnitTable,
  parkCapVarianceTable,
  parkCapVifTable,
  parkCapWeightedTable,
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
        Tier2(10ha 이상), 연녹색이 Tier3(2~10ha)다. 동탄2 북부는 대표공원 조건을 충족하는 공원이
        없어 Tier1이 없다. 배경의 흰 선은 도로망이며, 이미지를 클릭하면 원본 크기로 확대된다.
      </p>
      <MapLightbox maps={parkCapMaps} />

      {/* 02 공원 스톡 */}
      <SectionTitle n="02">도시별 공원 스톡 구성</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        네 지역의 공원을 규모별 면적비로 보면, 겉보기엔 비슷한 2기 신도시들이 판이한 녹지 구조를
        갖고 있다. 이 구성이 곧 통합 지표에 적용되는 가중치이며, 뒤에서 볼 계수 이동의 크기와
        방향을 결정한다. 대표공원의 규모와 우월성이 특히 갈린다 —{" "}
        <strong>광교호수공원은 2위 공원의 3.80배(224.9ha)인 반면 동탄2 북부의 최대 공원은 1.06배에
        그쳐 대표공원이라 부를 수 없다.</strong> 같은 도시들을 최근접거리로 재면 146~168m로
        구별되지 않는다.
      </p>

      <div className="mt-5 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
        {[
          [TIER_COLOR[0], "Tier1 — 지역 대표공원 (2위의 1.3배 이상)"],
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

      {/* 03 핵심 결과 */}
      <SectionTitle n="03">핵심 결과 — 대표공원까지의 거리</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        본 분석의 결론을 먼저 제시한다.{" "}
        <strong>가격에 반영되는 것은 &lsquo;공원까지의 거리&rsquo; 일반이 아니라 그 도시에서 효용이
        가장 높은 공원까지의 거리다.</strong> 공원 변수는 단 하나 — 각 도시의 최상위 위계 공원
        폴리곤 경계까지의 최단거리다. 로그–로그 설정이므로 −0.080은 그 공원까지의 거리가 10%
        멀어질 때 단가가 약 0.80% 낮아진다는 뜻이다. 네 지역 중 둘에서 유의하고, 나머지 둘은
        아래에서 보듯 &lsquo;효과 없음&rsquo;과 &lsquo;탐지 한계 아래&rsquo;로 성격이 서로 다르다.
      </p>
      <Table spec={parkCapHeadlineTable} />
      <Table spec={parkCapAxisMatchTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>같은 공원 자료로 지표만 바꾸면 계수가 0에서 −0.080까지 이동한다.</strong> 동탄2
        남부는 대표공원(동탄호수공원 44.5ha)이 최근접 공원인 단지가 <strong>3.0%</strong>에 불과해,
        최근접거리로 재면 그 공원의 잠재가격이 지수에서{" "}
        <em className="not-italic text-accent">소거된다</em> — 통합거리 계수 +0.019(t=0.61)가 대표공원
        거리로 바꾸는 순간 −0.080(t=−3.03)이 되는 이유다. 효과의 크기로 옮기면, 대표공원에 100m
        가까워지는 것이 광교에서 약 +1.71%(평균 310m 기준, ㎡당 1,213만원에서 약 21만원), 동탄2
        남부에서 약 +0.69%(평균 1,203m 기준, ㎡당 814만원에서 약 6만원)에 해당한다. 광교 쪽 탄력이
        큰 것은 거리가 짧아 같은 100m가 더 큰 비율 변화이기 때문이다.
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
                <dt className="text-muted-foreground">채택 사양 계수</dt>
                <dd className="text-right font-mono font-semibold tabular-nums text-accent">
                  {c.effect}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-[0.86rem] leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* 04 다른 조작화 검증 */}
      <SectionTitle n="04">다른 지표를 검증한 결과</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        이 지표 하나를 남기기까지 후보 여섯 가지를 모두 추정해 비교했다 — 통합 최근접거리, 위계별
        거리의 기하평균, 위계를 모두 넣은 사양, 세 가지 가중지수, 반경 내 공원면적, 그리고 채택한
        최상위 위계 거리다. 통제변수는 전부 고정하고 공원 변수만 바꾼다.
      </p>
      <Table spec={parkCapDiscrimTable} />
      <Table spec={parkCapMeasureTable} />

      <h4 className="mt-8 text-[0.95rem] font-bold">최근접거리 — 이론적으로 부적절하다</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        먼저 선행연구를 두 계열로 구분해 둘 필요가 있다. 하나는 &lsquo;가장 가까운 공원까지의
        거리&rsquo;를 쓰는 <strong>최근접 계열</strong>(이세영 외 2006, 김태범·장희순 2020 등)이고,
        다른 하나는 지역을 대표하는 <strong>대형공원 1개소</strong>까지의 거리를 쓰는 계열(김시은
        2023, 이상준 외 2026)이다. 본 분석이 채택한 지표는 후자에 가깝다.
      </p>
      <Table spec={parkCapVarianceTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        두 계열의 변량 구조는 정반대다.{" "}
        <strong>대형공원 거리는 최근접거리보다 도시 내 표준편차가 3~6배(213~848m 대 74~142m), 도시
        간 변이계수가 9.5배(0.668 대 0.070) 크다.</strong> 대형공원 1개소를 지정해 온 선행연구가
        유의한 결과를 얻어 온 데에는 이 변량 차이가 작용한다 — 대형공원을 지정한 것 자체는 옳은
        선택이었고, 본 분석이 그 계열과 갈리는 지점은 지표가 아니라 경쟁 어메니티의 통제 여부다(§06).
      </p>
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        문제가 되는 것은 최근접 계열이다. 이 지표는 실증적으로 유의하지 않아서가 아니라{" "}
        <strong>이론적으로 부적절하기 때문에</strong> 채택하지 않는다.{" "}
        <strong>첫째, min 연산은 정보를 버린다.</strong> 2ha짜리 소공원 하나가 단지 옆에 있으면
        그 도시의 대형공원이 300m에 있든 3km에 있든 같은 값을 갖는다.{" "}
        <strong>둘째, 계획 신도시에서 도시 간 변별력을 잃는다.</strong> 경계 기준 평균이 네 지역
        모두 146~168m이고 도시 간 변이계수가 0.070에 불과하다.{" "}
        <strong>셋째, 지시 대상이 관측치마다 다르다.</strong> 광교에서는 이 값이 52.4%의 단지에서
        대형공원까지의 거리이고 47.6%에서는 중규모 공원까지의 거리이며, 동탄2 북부에서는 68.3%가
        소규모 공원까지의 거리다.
      </p>

      <h4 className="mt-8 text-[0.95rem] font-bold">거리의 평균 — 부호가 뒤집힌다</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        &lsquo;평균적 접근성&rsquo;을 세 위계 거리의 기하평균으로 구성하면 광교에서 정(+)0.063으로
        기대와 반대 부호이며 유의하다. 위계별 계수의 부호가 엇갈리는 상태에서 등가중 평균하면 상반된
        신호가 상쇄되기 때문이며, 최근접거리가 실패하는 것과 구조가 같다. 도시 간 변별력도 변이계수
        0.269로 대표공원 거리(0.668)의 절반에 못 미친다.{" "}
        <strong className="text-foreground">규모가 다른 공원까지의 거리를 하나로 평균낸다는 발상 자체가
        문제이며, 이는 그 평균을 어떻게 구성하든 마찬가지다</strong> — min을 쓰든(통합 최근접거리),
        기하평균을 쓰든, 가중치를 부여하든 결국 서로 다른 잠재가격을 하나의 계수로 뭉갠다. 대안은
        평균의 방식을 바꾸는 것이 아니라, 애초에 어떤 공원을 잴 것인지를 이론적으로 지정하는
        것이다.
      </p>

      <h4 className="mt-8 text-[0.95rem] font-bold">반경 내 공원면적 — 검토했으나 채택하지 않았다</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        거리 대신 &lsquo;걸어서 닿는 범위 안에 공원이 얼마나 있는가&rsquo;를 재는 방법도 있다. 각
        단지에서 반경 200m부터 1,500m까지 버퍼를 씌우고 그 안에 들어오는 공원 폴리곤의 면적을 합해
        지표로 삼는 방식이다. 이 계열은 min 연산의 정보 손실을 겪지 않는다는 장점이 있으나,{" "}
        <strong>네 지역 중 한 곳에서만 작동해 도시 간 비교라는 이 분석의 목적에 맞지 않는다.</strong>{" "}
        광교(p=0.86)와 동탄2 남부(p=0.84)에서는 어떤 반경에서도 유의하지 않고 부호도 음(−)으로
        뒤집히며, 동탄2 북부는 10% 수준에 그친다. 운정에서만 강하게 유의한데(+0.040, t=6.69), 그
        계수마저 지하철 거리를 통제한 뒤에야 드러나는 억제효과다 — 공원면적과 가격의 단순상관은
        +0.034로 사실상 0이고, 공원이 많은 곳일수록 역에서 멀다는 관계(r=+0.404)가 두 효과를
        상쇄하고 있었다. &ldquo;공원이 많은 단지가 비싸다&rdquo;가 아니라 &ldquo;역거리를 같게 놓고
        비교하면 비싸다&rdquo;는 조건부 진술이므로, 한 지역에서만 성립하는 이 결과를 본문 결론으로
        올리지 않았다.
      </p>

      <h4 className="mt-8 text-[0.95rem] font-bold">조작화 사양 사다리</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        참고로 공원 변수의 조작화를 네 단계로 바꾸었을 때의 계수는 다음과 같다.
      </p>
      <Table spec={parkCapSpecLadderTable} />

      <h4 className="mt-8 text-[0.95rem] font-bold">위계를 나누어 넣기 — Tier3부터 덜어낸다</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        위계별로 거리를 따로 넣으면 각 계수가 다른 위계까지의 거리를 고정한 편미분 효과를 추정하므로,
        통합의 가중평균 문제도 단독 투입의 누락변수 문제도 발생하지 않는다. 여기서 흔한 오해를 짚어둘
        필요가 있다 — <strong>위계를 셋으로 나눈다고 해서 하나의 &lsquo;공원 효과&rsquo;가 셋으로
        쪼개지는 것이 아니다.</strong> 세 계수는 각각 다른 편미분 효과를 추정하므로 효과 자체는
        분산되지 않는다. 분산되는 것은 그 효과를 추정하는 데 쓰이는{" "}
        <em className="not-italic text-accent">자유도와 독립적 변량</em>이다.
      </p>
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        그 대가가 가장 뚜렷한 것이 Tier3(2~10ha)다. 네 지역 모두에서 계수가 유의하지 않고, 부분
        결정계수가 0.2%에 못 미치며, 변수를 빼면 수정 결정계수가 네 지역 전부에서 오른다.{" "}
        <strong>설명력에 기여하지 않으면서 자유도만 소모하고 있었다는 뜻이며, 그래서 회귀에서
        제외했다.</strong> 제거의 효과는 동탄2 남부 Tier1 계수가 −0.060(p&lt;0.10)에서
        −0.062(p&lt;0.05)로 뚜렷해지고, 광교의 최대 VIF가 21.6에서 13.8로 내려가는 것으로 나타난다.
        다만 이는 회귀 변수에서 빼는 것이지 공원 집합에서 빼는 것이 아니다 — 2~10ha 공원은 통합
        최근접거리 산정과 §02의 스톡 구성 서술에 그대로 쓰인다.
      </p>
      <Table spec={parkCapTier3Table} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        Tier3를 덜어낸 위계 2단 사양에서도 5% 수준에서 유의한 것은 동탄2 남부 Tier1 하나뿐이다.
        공원 변수를 하나로 더 줄이면 검정력이 그만큼 회복된다 — 탐지 한계가 광교에서 0.081에서
        0.055로, 동탄2 남부에서 0.088에서 0.074로 낮아진다.
      </p>
      <Table spec={parkCapMdeTable} />

      <h4 className="mt-8 text-[0.95rem] font-bold">가중지수 — 자유도는 아끼지만 상반된 신호를 섞는다</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        자유도 문제를 피하는 또 하나의 대안은 세 거리를 하나의 지수로 묶는 것이다(위계를 모두
        살려둔 단계에서 검토했다). 중요한 것은 이
        사양이 <strong>전 위계 모형의 제약(restricted) 버전</strong>이라는 점이다. 지수에 계수 β를
        부여한 모형은 γ₁ : γ₂ : γ₃ = w₁ : w₂ : w₃ 이라는 선형제약 2개를 가한 것과 같으므로,{" "}
        <strong>부여한 가중치가 임의적인지 여부는 취향의 문제가 아니라 검정의 대상이다.</strong>{" "}
        규모 순 가중(0.6/0.3/0.1), 면적비중 가중, 위계 없이 모든 공원의 면적을 거리로 할인한
        중력지수 세 가지를 검토했다.
      </p>
      <Table spec={parkCapWeightedTable} />
      <Table spec={parkCapImplicitWeightTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        세 가지 이유로 채택하지 않았다. <strong className="text-foreground">첫째, 설명력이
        개선되지 않는다</strong> — 동탄2 남부에서 수정 결정계수가 0.637에서 0.556~0.585로 오히려
        떨어진다. <strong className="text-foreground">둘째, 계수의 부호가 뒤집힌다</strong> — 광교
        면적비중 지수 +0.063(p&lt;0.01), 운정 중력지수 +0.090(p&lt;0.05)으로 &ldquo;공원이 멀수록
        비싸다&rdquo;는 해석 불가능한 결과가 나온다. 무제약 추정에서 위계별 계수의 부호가 엇갈리는데
        (광교 γ₁=−0.026, γ₂=+0.015) 이를 모두 양(+)인 가중치로 묶으면 상반된 신호가 상쇄되기
        때문이며, <strong className="text-foreground">통합 최근접거리가 실패하는 것과 정확히 같은
        메커니즘</strong>이다. <strong className="text-foreground">셋째, 자료가 지지하는 가중치가
        지역마다 다르다</strong> — 하나의 고정 가중치를 네 지역에 공통 적용할 근거가 없다. F검정에서
        제약이 대부분 기각되지 않았으나(광교 0.6/0.3/0.1 p=0.156), 지역별 21~41개 표본에서 이
        검정의 검정력은 낮으므로 기각되지 않은 것이 가중치가 옳다는 증거는 아니다.
      </p>

      {/* 05 기본모형 */}
      <SectionTitle n="05">헤도닉 회귀 — 전체 계수</SectionTitle>
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

      {/* 10 기술통계 */}
      <SectionTitle n="10">표본과 기술통계</SectionTitle>
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

      {/* 11 방법론 */}
      <SectionTitle n="11">데이터 구축 방법론</SectionTitle>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapMethodology.map((m) => (
          <div key={m.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{m.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      {/* 12 한계 */}
      <SectionTitle n="12">한계</SectionTitle>
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
