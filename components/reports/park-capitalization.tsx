import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapCommerceMaps,
  parkCapConclusion,
  parkCapConventionTable,
  parkCapDescTable,
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
  parkCapSpecContrastTable,
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

      {/* 01 자료와 기초통계 */}
      <SectionTitle n="01">자료와 기초통계</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        2025년 상반기 국토교통부 아파트 실거래 2,740건을 단지 단위 121개로 집계했다. 평형을 국민
        주택규모 두 구간으로 한정하고, 단지×평형 내부 상·하위 5%를 절사한 뒤, 지역×평형별 층
        계수로 기준층 가격에 환산해 평균했다. 마지막으로{" "}
        <strong>단지당 한 평형만 남긴다</strong> — 84형을 기본으로 하고 거래가 하한에 못 미치는 7개
        단지만 59형으로 대체했다. 좌표가 중복되면 그 단지가 계수 식별에 두 번 기여하기 때문이다.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {parkCapSample.map((sm) => (
          <div key={sm.key} className="rounded border border-border bg-card p-4">
            <div className="flex items-center gap-2 pb-2 text-[0.88rem] font-semibold">
              <Dot k={sm.key} />
              {sm.label}
            </div>
            <dl className="flex flex-col">
              {sm.rows.map(([k, v]) => (
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
      <Table spec={parkCapDescTable} />

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        아래 지도는 도시계획시설(공원) 결정경계 기준으로 각 지역의 공원을 규모 3단계로 칠하고,
        회귀에 들어간 단지를 점으로 얹은 것이다. 진한 초록이 Tier1(지역 대표공원), 중간 초록이
        Tier2(10ha 이상), 옅은 초록이 Tier3(2~10ha)다. 이미지를 클릭하면 원본 크기로 열린다.
      </p>
      <MapLightbox maps={parkCapMaps} />

      <div className="mt-6 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
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

      {/* 02 사양 대비 */}
      <SectionTitle n="02">무엇을 재는가 — 사양 대비와 선행연구 재현</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 접근성은 하나로 정해진 변수가 아니다. 같은 자료·같은 통제변수에서 공원 변수만 바꾸면
        계수가 크게 움직인다. 먼저 세 가지 사양을 나란히 놓는다 — 규모를 가리지 않는{" "}
        <strong>통합 최근접거리</strong>, 그 도시의 <strong>대표공원 단독</strong>, 그리고
        대표공원과 <strong>Tier2를 함께</strong> 넣은 사양이다.
      </p>
      <Table spec={parkCapSpecContrastTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>세 가지가 읽힌다.</strong> 첫째, 통합 최근접거리는 계획 신도시에서 작동하지 않는다.
        네 지역 평균이 146~168m로 수렴해 변량이 없기 때문이며, 대표공원 거리로 바꾸면 동탄2 남부에서
        0.019가 −0.080이 된다.{" "}
        <em className="not-italic text-accent">이 지역은 대표공원이 최근접인 단지가 3.0%에 불과해,
        최근접거리로 재면 44.5ha 동탄호수공원의 값이 지수에서 지워진다.</em> 둘째, Tier2를 함께
        넣으면 대표공원 계수가 −0.080에서 −0.062로 줄고 Tier2 계수는 오히려 정(+)으로 나온다.
        규모가 다른 공원의 잠재가격이 서로 다르다는 뜻이며, 이를 하나로 묶는 지표가 실패하는
        이유이기도 하다. 셋째, 그럼에도 위계를 나눌수록 자유도와 독립적 변량을 잃는다. 지역별
        관측치가 21~41개인 표본에서는 공원 변수를 하나로 두는 편이 검정력이 높아, 본 분석은 ②를
        채택한다.
      </div>

      <h4 className="mt-8 text-[0.95rem] font-bold">선행연구는 어떻게 더 큰 계수를 얻었나</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        본 분석의 계수는 선행연구가 보고해 온 값보다 작다. 그 차이가 어디에서 오는지를 같은 자료로
        확인했다. 선행연구가 채택해 온 세 가지 선택 — 대표공원 1개소만 투입, 중심점 좌표 사용,
        경쟁 어메니티 미통제 — 을 하나씩 되돌리며 계수를 추적한다.
      </p>
      <Table spec={parkCapReplicationTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong>결정적인 것은 거리 측정점이 아니라 상권 통제를 빼는 한 단계였다.</strong> 광교는
        −0.052에서 −0.267로 다섯 배, 동탄2 남부는 −0.118에서 −0.240으로 두 배가 되며 t값이 −2.47
        에서 −6.38로 뛴다. 중심점으로 바꾸는 단계는 계수를 키우되 t값은 낮추는데, 대형공원 중심점
        까지의 거리에는 공원 반경이 바닥값으로 더해져 로그 변량이 압축되기 때문이다.{" "}
        <strong className="text-foreground">다만 이것을 선행연구의 오류로 부를 수는 없다.</strong>{" "}
        상권을 통제하지 않은 계수는 총효과를, 통제한 계수는 직접효과를 추정하며 서로 다른 질문에
        답한다. 그 차이가 실제로 어디로 갔는지는 §04에서 분해한다.
      </p>

      {/* 03 공원 효과 */}
      <SectionTitle n="03">공원이 주택가격에 미치는 효과</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        채택 사양의 결과다. 공원 변수는 하나 — 그 도시에서 효용이 가장 높은 공원의 폴리곤 경계까지
        최단거리를 로그변환한 값이다. 네 지역 모두에서 계수의 부호는 음(−)으로 이론과 일치하고,
        그중 둘에서 통계적으로 유의하다.
      </p>
      <Table spec={parkCapHeadlineTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>크기를 실감으로 옮기면 이렇다.</strong> 광교호수공원에 100m 더 가까운 단지는 84㎡
        기준 약 <strong>1,750만원</strong> 비싸다(평균 10.2억). 동탄2 남부에서 동탄호수공원 쪽으로
        100m는 약 <strong>455만원</strong>이다(평균 6.6억). 같은 탄력성이라도 광교 쪽 금액이 큰
        것은 대표공원까지의 평균 거리가 310m로 짧아 100m가 더 큰 비율 변화이기 때문이다.
        <br />
        <br />
        <em className="not-italic text-accent">다만 이 크기는 입지 요인 가운데 가장 작다.</em> 같은
        회귀에서 지하철 거리는 −0.28(동탄2 북부), 생활상권 지수는 +0.24(동탄2 남부)로 네 지역의
        모든 공원 계수를 압도한다. 비유의한 두 지역도 성격이 다르다 — 운정의 −0.034는 부호가 맞지만
        탐지 한계(0.080) 아래이고, 동탄2 북부의 −0.011은 탐지 한계의 5분의 1로 이 지역에는 애초에
        대표공원 조건을 충족하는 공원이 없다.
      </div>

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 이외 변수까지 포함한 전체 계수는 다음과 같다. 위계별 거동을 함께 보기 위해 Tier1·Tier2를
        동시에 넣은 사양을 싣는다.
      </p>
      <Table spec={parkCapBaselineTable} />

      {/* 04 상권 매개 */}
      <SectionTitle n="04">상권이 공원 효과를 매개한다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        지역별 계수는 표본이 얇아 둘만 유의하다. 반면 네 지역 121개 단지를 함께 놓으면 훨씬
        안정적인 결과가 하나 나온다 —{" "}
        <strong>공원 근접 프리미엄의 40%는 공원 자체가 아니라, 공원과 함께 계획된 상권을
        경유한다.</strong> 공원 접근성(X)이 생활상권(M)을 거쳐 가격(Y)에 이르는 경로를 Baron–Kenny
        3단계로 분해하고, 간접효과의 신뢰구간을 백분위 부트스트랩 5,000회로 구했다. 선형모형이므로{" "}
        <strong>총효과 c = 직접효과 c′ + 간접효과 a·b</strong> 가 정확히 성립한다.
      </p>
      <Table spec={parkCapMediationTable} />
      <Table spec={parkCapPathTable} />

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        대표공원까지의 거리가 10% 멀어지면 단가는 약 <strong>0.67%</strong> 낮아진다(총효과).
        상권을 함께 통제하면 그 값이 <strong>0.40%</strong>로 줄고, 사라진{" "}
        <strong className="text-accent">0.27%p가 상권을 경유한 몫</strong>이다. 다만 이 매개는 네
        지역에 고르게 나타나지 않는다. 동탄2 남부에서 47.5%로 가장 크고, 운정에서는 공원거리가 상권
        지수를 전혀 설명하지 못해(R²=0.000) 매개가 성립하지 않는다.
      </p>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        그 차이는 공간 배치에서 그대로 드러난다. 아래 지도는 같은 배경 규약에 생활상권 POI 밀도를
        육각 그리드(폭 225m)로 얹고 공원은 윤곽선만 남긴 것이다. 동탄2 남부는 상권 밀집지가 공원
        회랑을 따라 늘어서 있는 반면, 운정은 호수공원 주변이 비어 있고 상권이 지구 외곽에 별도로
        형성되어 있다.
      </p>
      <MapLightbox maps={parkCapCommerceMaps} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        <strong className="text-foreground">공원과 상권이 계획 단계에서 함께 배치된 도시에서만
        매개가 나타난다.</strong> 신도시의 지구단위계획은 대형공원과 중심상업지구를 나란히 놓는다 —
        광교호수공원 ↔ 광교중앙역, 동탄호수공원 ↔ 워터프론트 상업지구. 이것이 &ldquo;상권 통제가
        계수를 절반으로 줄인다&rdquo;는 §02의 관찰에 대한 답이다. 다만 매개분석은 매개변수와 결과
        사이에 미관측 교란이 없다는 강한 가정에 의존하므로, 간접효과는 인과적 매개량이 아니라 선형
        분해상의 몫으로 읽어야 한다.
      </p>

      {/* 05 공간자기상관 */}
      <SectionTitle n="05">공간자기상관 검토</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        헤도닉 모형의 잔차가 공간적으로 상관되어 있으면 OLS 표준오차를 신뢰할 수 없고 공간계량모형이
        필요해진다. 진단 결과는 <strong>분석단위 선택에 극도로 민감했다.</strong> 거래 단위로 두면
        같은 단지의 거래 수십 건이 동일한 대표점 좌표를 공유해 k=3 최근접 이웃의 99~100%가 같은
        단지의 다른 거래가 되고, 공간가중치 행렬 W가 공간적 인접성이 아니라{" "}
        <strong>&ldquo;같은 단지 여부&rdquo;</strong>를 측정하게 된다. 단지 단위로 올리면 좌표
        중복이 사라진다(121개 관측치에 고유 좌표 121개).
      </p>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong>다섯 가지 가중치 사양 중 5% 수준에서 유의한 것은 광교 k=3 하나뿐이고, 그것도 부호가
        음(−)이다.</strong> 정(+)의 공간자기상관은 어느 지역·어느 사양에서도 확인되지 않는다.
        거래 단위 자료에서 0.414~0.865로 강하게 나타나던 모란 지수가 사라진 것이므로, 그 값은 공간
        구조가 아니라 좌표 중복의 산물이었다고 보아야 한다. 따라서 공간계량모형은 최종모형이 아니라
        강건성 검토로만 다룬다. Chow 검정 F=8.48(df 32/78, p&lt;0.001)로 네 지역을 하나로 묶는 것은
        기각되며, 같은 동탄2 안에서도 남/북의 계수 구조가 달라 사업지구 단위가 곧 분석 단위가 될 수
        없다.
      </p>

      {/* 06 결론 */}
      <SectionTitle n="06">결론</SectionTitle>
      <div className="mt-4 rounded border border-border border-l-[3px] border-l-accent bg-card px-5 py-4">
        <p className="text-[1.02rem] font-semibold leading-relaxed">
          {parkCapConclusion.headline}
        </p>
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
      <p className="mt-6 max-w-3xl text-[0.9rem] leading-relaxed">
        {parkCapConclusion.contribution}
      </p>

      <h4 className="mt-8 text-[0.95rem] font-bold">지도교수께 여쭙고 싶은 세 가지</h4>
      <ol className="mt-3 flex flex-col gap-4">
        {parkCapConclusion.questions.map((q) => (
          <li key={q.q} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{q.q}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{q.body}</p>
          </li>
        ))}
      </ol>

      {/* 부록 A */}
      <SectionTitle n="부록 A">검토했으나 채택하지 않은 지표</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 변수를 하나로 정하기까지 네 가지 방식을 모두 추정해 비교했다. 각각의 접근과 결과,
        채택하지 않은 이유를 정리한다.
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
        도시마다 다른 재화를 가리키게 된다.
      </p>

      {/* 부록 B */}
      <SectionTitle n="부록 B">연구설계의 다른 선택지</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        Tier1 판정 규칙, 거리 측정 규약, 분석단위, 직선거리 근사 네 가지에 대해서도 대안을 모두
        추정해 비교했다.
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
      <Table spec={parkCapCircuityTable} />

      {/* 부록 C */}
      <SectionTitle n="부록 C">데이터 구축 방법론</SectionTitle>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapMethodology.map((m) => (
          <div key={m.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{m.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>
      <Table spec={parkCapVifTable} />

      {/* 부록 D */}
      <SectionTitle n="부록 D">한계</SectionTitle>
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
