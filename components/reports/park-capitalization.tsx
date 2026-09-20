import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapClassTable,
  parkCapAll9Maps,
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
  parkCapMediationDropTable,
  parkCapMeta,
  parkCapMethodology,
  parkCapRejected,
  parkCapReplicationTable,
  parkCapSensitivityTable,
  parkCapSizeSpecTable,
  parkCapSources,
  parkCapSpatialTable,
  parkCapTierRuleTable,
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
        <strong>이 분석이 묻는 것은 하나다 — 공원은 아파트 가격에 영향을 미치는가.</strong> 수도권
        9개 신도시 333개 단지를 쓰되,{" "}
        <em className="not-italic text-accent">지역을 합치지 않고 각각 따로 추정한다.</em> 단가가
        528만원에서 1,956만원까지 3.7배, 건축연령이 5년에서 31년까지 차이 나는 시장을 하나의
        가격함수로 묶을 근거가 없기 때문이다. 지역 고정효과를 넣은 풀링도, 지역 간 계수를 다시
        회귀하는 메타분석도 하지 않았다. 공원이 상권을 경유하는 경로는 8개 지역 중 한 곳에서만
        성립해 부록 A로 내렸다.
      </div>

      {/* 01 핵심 결과 */}
      <SectionTitle n="01">공원은 아파트 가격에 영향을 미치는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        각 지역에서 30ha 이상인 공원 하나를 대표공원으로 지정하고 그 거리를 유일한 공원 변수로
        넣었다. 어느 공원을 대표로 삼을지는 세 가지 기준으로 나누어 모두 추정했다 — 경계 300m 안
        생활상권이 가장 많은 공원(A), 가장 넓은 공원(B), 그 지역 분석 단지들의 평균 거리가 가장
        짧은 공원(C)이다.
      </p>
      <Table spec={parkCapHeadlineTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>일관되지 않는다.</strong> 세 기준 모두에서 유의하고 다중검정 보정까지 통과하는
        지역은 <strong>동탄2 남부 하나</strong>다(−0.110, p&lt;0.001). 광교(−0.055)와
        일산(−0.060)은 10% 수준이며 세 기준에서 값이 같아 안정적이지만 보정을 넘지 못한다.
        <br />
        <br />
        <em className="not-italic text-accent">그리고 김포한강에서는 부호가 뒤집힌다.</em> 대표공원을
        상권 최대로 고르면 −0.072, 면적 최대로 고르면 −0.165, 접근 최대로 고르면 +0.060이다. 같은
        지역·같은 표본·같은 통제변수인데 어느 공원을 대표로 삼느냐만 바꿔서 이렇게 움직인다.{" "}
        <strong>30ha 이상 후보가 여럿인 지역에서는 선정이 곧 결론이다.</strong>
      </div>

      {/* 02 대표공원 */}
      <SectionTitle n="02">어느 공원이 대표공원인가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        선정이 결론을 좌우한다면, 실제로 어느 공원이 뽑혔는지 눈으로 확인해야 한다. 아래는 9개
        지역의 공원 지도다. 붉은 윤곽이 대표공원(기준 A)이고 면적과 경계 300m 상권 건수를 공원 위에
        적었다. 진한 초록이 대표공원, 중간 초록이 중규모(10~30ha), 옅은 초록이 소규모(2~10ha),
        점이 분석 단지다.
      </p>
      <MapLightbox maps={parkCapAll9Maps} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>지도가 문제를 드러낸다.</strong> 분당의 대표공원은 지구{" "}
        <strong>서쪽 가장자리</strong>에, 판교의 대표공원은 <strong>동쪽 가장자리</strong>에 있다 —
        두 지역의 경계가 맞닿아 있어 사실 같은 공원이다. 김포한강도 대표공원이 동쪽에 치우쳐 있고
        분석 단지 대부분은 서쪽·중앙에 있다.
        <br />
        <br />
        원인은 상권 기준에 있다.{" "}
        <em className="not-italic text-accent">지구 경계에 걸친 공원은 300m 버퍼로 옆 시가지의
        상권까지 끌어온다.</em> 그래서 &lsquo;그 신도시 주민이 쓰는 공원&rsquo;이 아니라 &lsquo;옆
        동네 상권과 붙은 공원&rsquo;이 뽑힌다. 반대로 후보가 1~3개소인 광교·동탄2 남부·일산·운정은
        세 기준이 같은 공원을 가리켜 이 문제가 없다.
      </div>
      <Table spec={parkCapClassTable} />

      <h4 className="mt-8 text-[0.95rem] font-bold">규모별로 나누어 넣으면</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        대표공원·중규모·소규모 거리를 한 회귀에 함께 넣어 지역별로 추정했다.
      </p>
      <Table spec={parkCapSizeSpecTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong>여기서도 일관된 패턴이 없다.</strong> 중규모 계수가 분당 +0.062(p&lt;0.01), 광교
        −0.028(p&lt;0.05), 양주옥정 −0.134(p&lt;0.01)로 방향이 엇갈린다. 소규모는 광교
        −0.059(p&lt;0.01) 외에 유의한 곳이 없다.{" "}
        <strong className="text-foreground">지역을 합치면 이 불일치가 평균되어 깔끔한 결과가
        나오지만, 그 평균값은 어느 지역의 가격함수도 아니다.</strong>
      </p>
      <Table spec={parkCapSensitivityTable} />

      {/* 03 선행연구 재현 */}
      <SectionTitle n="03">선행연구는 재현되는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        본 분석의 계수는 선행연구가 보고해 온 값보다 작다. 재현되지 않는 것인지, 아니면 다른 것을
        재고 있는 것인지를 같은 자료로 확인했다. 이 절의 사다리는 표본을 넓히기 전의 4개 지역 기준
        추정이다. 선행연구가 채택해 온 세 가지 선택 — 대표공원 1개소만
        투입, 중심점 좌표 사용, 경쟁 어메니티 미통제 — 을 하나씩 되돌리며 계수를 추적한다.
      </p>
      <Table spec={parkCapReplicationTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong>재현된다. 그러나 그 크기는 상권 통제를 빼는 한 단계에서 만들어진다.</strong> 광교는
        −0.052에서 −0.267로 다섯 배, 동탄2 남부는 −0.118에서 −0.240으로 두 배가 되며 t값이 −2.47에서
        −6.38로 뛴다. 중심점으로 바꾸는 단계는 계수를 키우되 t값은 낮추는데, 대형공원 중심점까지의
        거리에는 공원 반경이 바닥값으로 더해져 로그 변량이 압축되기 때문이다.
      </p>
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong className="text-foreground">다만 이것을 선행연구의 오류라 부를 수는 없다.</strong>{" "}
        상권을 통제하지 않은 계수는 <strong>총효과</strong>를, 통제한 계수는{" "}
        <strong>직접효과</strong>를 추정하며 서로 다른 질문에 답한다. &ldquo;공원 근처에 사는 것의
        가치&rdquo;를 묻는다면 공원과 함께 오는 상권까지가 소비자가 구매하는 묶음이므로 통제하지 않는
        편이 옳고, &ldquo;상권이 같을 때 공원만의 가치&rdquo;를 묻는다면 통제해야 한다. 본 분석은
        후자를 추정하므로 정의상 더 작다.
      </p>

      {/* 04 자료 */}
      <SectionTitle n="04">자료와 기초통계</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        2025년 상반기 국토교통부 실거래가 공개시스템의 아파트 매매 자료를 9개 신도시 333개 단지로
        집계했다(자료 출처 일람은 부록 C). 평형을 국민주택규모 두 구간으로 한정하고, 단지×평형 내부
        상·하위 5%를 절사한 뒤, 지역×평형별 층 계수로 기준층 가격에 환산해 평균했다. 마지막으로{" "}
        <strong>단지당 한 평형만 남긴다</strong> — 좌표가 중복되면 그 단지가 계수 식별에 두 번
        기여하기 때문이다.
      </p>
      <Table spec={parkCapDescTable} />

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        아래는 초기 4개 지역의 상세 지도다(9개 지역 전체 지도는 §02). 도시계획시설(공원) 결정경계
        기준으로 공원을 규모 3단계로 칠하고 분석 단지를 점으로 얹었다.
      </p>
      <MapLightbox maps={parkCapMaps} />
      <div className="mt-5 flex flex-wrap gap-4 text-[0.72rem] text-muted-foreground">
        {[
          [TIER_COLOR[0], "지역 최대 공원"],
          [TIER_COLOR[1], "10ha 이상"],
          [TIER_COLOR[2], "2~10ha"],
        ].map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <i aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>


      <SectionTitle n="05">결론</SectionTitle>
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
      <SectionTitle n="부록 A">상권 매개 — 일관된 결론에 이르지 못했다</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        신도시는 지구단위계획에서 대형공원과 중심상업지구를 나란히 배치한다. 그렇다면 공원 근접
        프리미엄의 일부는 공원 자체가 아니라 함께 배치된 상권을 경유할 것이다. 이 가설을 Baron–Kenny
        3단계로 분해하고 간접효과의 신뢰구간을 백분위 부트스트랩 5,000회로 구했다.{" "}
        <strong>8개 지역 중 한 곳에서만 성립했고, 그래서 본문 결과로 삼지 않았다.</strong>
      </p>
      <Table spec={parkCapMediationDropTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong>8개 지역 중 신뢰구간이 0을 배제하는 곳은 둘이고, 그중 하나는 해석할 수 없다.</strong>{" "}
        분당은 간접효과 신뢰구간이 0을 배제하지만 총효과가 −0.012(t=−0.70)로 사실상 0이어서
        매개비율이 정의되지 않는다. 실질적으로 매개가 성립하는 곳은 광교 하나(56.9%)다.
      </p>
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        방향도 엇갈린다. 광교·동탄2 남부·일산은 a 경로가 음(−)으로 &lsquo;공원에 가까울수록 상권이
        강하다&rsquo;인 반면, 분당은 <strong>+0.434(t=3.60)</strong>로 반대다.{" "}
        <strong className="text-foreground">공원과 상권의 동시 배치는 모든 신도시의 공통 설계
        원리가 아니다.</strong> 지역을 합쳐 매개비율을 하나로 보고하면 이 차이가 지워지므로, 이
        보고서는 풀링 매개를 싣지 않는다.
      </p>
      <p className="mt-4 max-w-3xl text-[0.9rem] leading-relaxed">
        아래 지도는 생활상권 POI 밀도를 육각 그리드(폭 225m)로 얹고 공원을 규모별로 구분한 것이다
        (초기 4개 지역). 동탄2 남부는 동탄호수공원 가장자리에 상권 밀집 셀이 직접 닿아 있는 반면,
        운정은 호수공원 주변이 비어 있고 상권이 지구 외곽에 따로 형성되어 있다.
      </p>
      <MapLightbox maps={parkCapCommerceMaps} />


      <SectionTitle n="부록 B">검토했으나 채택하지 않은 것</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 변수의 조작화와 연구설계의 선택지를 모두 추정해 비교했다. 각각의 접근과 결과, 채택하지
        않은 이유를 정리한다.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapRejected.map((r) => (
          <div key={r.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{r.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </div>
      <Table spec={parkCapBaselineTable} />
      <Table spec={parkCapTierRuleTable} />
      <Table spec={parkCapConventionTable} />
      <Table spec={parkCapUnitTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        분석단위를 거래로 두면 공원 계수가 훨씬 강하게 나온다. 공원까지의 거리는 단지 안에서 변하지
        않으므로 광교 381건의 거래는 서로 다른 381개의 거리값이 아니라 21개의 거리값이 반복된 것이며,
        잔차의 급내상관은 0.46~0.85에 이른다. Moulton 보정계수 8.1~18.6은 순진한 OLS 표준오차가
        2.9~4.3배 과소추정됨을 뜻한다.{" "}
        <strong className="text-foreground">거래 2,740건의 유효표본은 2,740이 아니라 단지 수에
        가깝다.</strong>
      </p>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        단지 단위로 올리면 좌표 중복이 사라져(121개 관측치에 고유 좌표 121개) 가중치행렬이 실질적인
        공간 인접성을 측정한다. 다섯 가중치 사양 중 5% 수준에서 유의한 것은 광교 k=3 하나뿐이고 부호도
        음(−)이다. 거래 단위에서 0.414~0.865로 강하게 나타나던 모란 지수는 공간 구조가 아니라 좌표
        중복의 산물이었다. Chow 검정 F=8.48(df 32/78, p&lt;0.001)로 네 지역을 하나로 묶는 것은
        기각된다.
      </p>
      <Table spec={parkCapCircuityTable} />

      {/* 부록 C */}
      <SectionTitle n="부록 C">자료 출처와 구축 방법론</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        사용한 자료는 모두 공개 자료이며, 좌표계는 EPSG:5179(UTM-K)로 통일했다.
      </p>
      <div className="mt-5 overflow-hidden rounded border border-border bg-card">
        {parkCapSources.map((sc, i) => (
          <div
            key={sc.name}
            className={`grid grid-cols-1 gap-1 px-4 py-3.5 sm:grid-cols-[5.5rem_1fr] sm:gap-4 ${
              i === 0 ? "" : "border-t border-border"
            }`}
          >
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted-foreground">
              {sc.kind}
            </span>
            <div>
              <strong className="text-[0.88rem]">{sc.name}</strong>
              <span className="ml-2 text-[0.8rem] text-accent">{sc.org}</span>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">
                {sc.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h4 className="mt-8 text-[0.95rem] font-bold">구축 방법</h4>
      <div className="mt-4 flex flex-col gap-4">
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
