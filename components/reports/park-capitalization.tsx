import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapBaselineTable,
  parkCapCircuityTable,
  parkCapClassTable,
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
  parkCapMediationTable,
  parkCapMeta,
  parkCapMethodology,
  parkCapPathTable,
  parkCapRejected,
  parkCapReplicationTable,
  parkCapSample,
  parkCapSensitivityTable,
  parkCapSizeSpecTable,
  parkCapSources,
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

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>이 분석이 묻는 것은 하나다 — 공원은 아파트 가격에 영향을 미치는가.</strong> 답을
        얻으려면 두 가지를 먼저 정해야 한다. 어떤 공원을 잴 것인가(§02), 그리고 선행연구가 보고해 온
        큰 계수는 무엇의 산물인가(§03). 공원이 상권을 경유해 가격에 이르는 경로도 검토했으나 네 지역
        중 한 곳에서만 성립해 부록 A로 내렸다.
      </div>

      {/* 01 핵심 결과 */}
      <SectionTitle n="01">공원은 아파트 가격에 영향을 미치는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        결론부터 적는다. <strong>영향을 미친다 — 단, 대규모 공원에 한한다.</strong> 여기서 대규모는
        면적 30ha 이상이면서 호수 같은 경관 요소를 끼고 있거나 상권이 인접한 공원이다. 공원 변수는
        하나이며, 각 지역의 대규모 공원 폴리곤 경계까지의 최단거리를 로그변환한 값이다.
      </p>
      <Table spec={parkCapHeadlineTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>크기를 실감으로 옮기면 이렇다.</strong> 동탄호수공원 쪽으로 100m 더 가까운 단지는
        84㎡ 기준 약 <strong>455만원</strong> 비싸다(평균 6.59억). 광교는 약{" "}
        <strong>1,640만원</strong>인데(평균 10.23억), 계수는 더 작지만 대규모 공원까지의 평균 거리가
        267m로 짧아 같은 100m가 더 큰 비율 변화이기 때문이다.
        <br />
        <br />
        <em className="not-italic text-accent">다만 이 크기는 입지 요인 가운데 가장 작다.</em> 같은
        회귀에서 지하철 거리는 −0.28(동탄2 북부), 생활상권 지수는 +0.24(동탄2 남부)로 모든 공원
        계수를 압도한다. 그리고 <strong>동탄2 북부에는 대규모에 해당하는 공원이 아예 없다</strong> —
        최대 공원이 29.4ha다. 이 지역에서 공원 효과가 관측되지 않는 것은 측정의 실패가 아니라 대상의
        부재다.
      </div>

      {/* 02 규모 */}
      <SectionTitle n="02">규모별로 자본화 효과가 다른가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        &lsquo;공원까지의 거리&rsquo;를 하나의 변수로 쓰면 규모가 다른 공원이 한 값에 뭉개진다. 법정
        기준부터가 규모에 따라 유치거리를 250m에서 &lsquo;제한 없음&rsquo;까지 차등하는데, 그렇다면
        잠재가격도 규모마다 다를 것이다. 세 등급으로 나누어 확인했다.
      </p>
      <Table spec={parkCapClassTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        면적만으로 자르지 않은 이유는 광교의 50.9ha 공원이다. 면적 조건은 넘지만 경계 300m 안
        생활상권이 71건뿐이고 호수도 없다 —{" "}
        <strong>크지만 이용 유인이 없는 공원</strong>이다. 효용가치 요소를 조건으로 붙이는 근거가
        여기에 있고, 뒤에서 보듯 이 조건을 빼면 실제로 계수가 약해진다.
      </p>
      <Table spec={parkCapSizeSpecTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>규모별로 다르다 — 그것도 아주 선명하게.</strong> 대규모만 음(−)으로 유의하고,
        중규모(10~30ha)는 네 지역 어디에서도 유의하지 않으며 광교·동탄2 남부에서는 부호가 정(+)으로
        나온다. 소규모(2~10ha)를 추가하면 부분 결정계수가{" "}
        <strong>0.0001~0.0019</strong>에 그치면서 수정 결정계수는 네 지역 전부에서 떨어진다 —
        설명력에 기여하지 않고 자유도만 쓴다.{" "}
        <em className="not-italic text-accent">즉 &lsquo;공원 면적 총량&rsquo;으로 정책 효과를
        추정하는 접근은 이 자료에서 지지되지 않는다.</em> 반영되는 것은 총량이 아니라 대규모 공원
        하나의 유무와 그 거리다.
      </div>

      <h4 className="mt-8 text-[0.95rem] font-bold">기준을 바꾸면 결론이 뒤집힌다</h4>
      <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed">
        이 결과가 판정 기준에 얼마나 민감한지 확인했다. 결론은 <strong>매우 민감하다</strong>는
        것이고, 그래서 기준을 명시하는 일 자체가 결과의 일부가 된다.
      </p>
      <Table spec={parkCapSensitivityTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        효용요소 조건을 빼면 광교가 −0.034에서 −0.024로 약해지고, 하한을 20ha로 낮추면 광교 +0.006,
        동탄2 북부 +0.055(p&lt;0.05)로 <strong>부호가 뒤집힌다.</strong> 40ha로 올려도 광교의 대규모
        구성이 바뀌지 않아 결과는 같다. 30ha가 자료에서 읽히는 경계이지만 이론적으로 도출된 값은
        아니며, 이 의존성은 한계로 남긴다(부록 D).
      </p>

      {/* 03 선행연구 재현 */}
      <SectionTitle n="03">선행연구는 재현되는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        본 분석의 계수는 선행연구가 보고해 온 값보다 작다. 재현되지 않는 것인지, 아니면 다른 것을
        재고 있는 것인지를 같은 자료로 확인했다. 선행연구가 채택해 온 세 가지 선택 — 대표공원 1개소만
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
        2025년 상반기 국토교통부 실거래가 공개시스템의 아파트 매매 2,740건을 단지 단위 121개로
        집계했다(자료 출처 일람은 부록 C). 평형을 국민주택규모 두 구간으로 한정하고, 단지×평형 내부
        상·하위 5%를 절사한 뒤, 지역×평형별 층 계수로 기준층 가격에 환산해 평균했다. 마지막으로{" "}
        <strong>단지당 한 평형만 남긴다</strong> — 좌표가 중복되면 그 단지가 계수 식별에 두 번
        기여하기 때문이다.
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
        아래 지도는 도시계획시설(공원) 결정경계 기준으로 각 지역의 공원을 규모 3단계로 칠하고, 회귀에
        들어간 단지를 점으로 얹은 것이다. 이미지를 클릭하면 원본 크기로 열린다.
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
      <div className="mt-4 flex flex-col gap-5">
        {parkCapTiers.map((t) => (
          <div key={t.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-[0.8rem]">
              <strong className="flex items-center gap-2">
                <Dot k={t.key} />
                {t.label}
              </strong>
              <span className="font-mono text-[0.72rem] tabular-nums text-muted-foreground">
                {t.total}
              </span>
            </div>
            <div className="mt-1.5 flex h-[18px] overflow-hidden rounded-sm">
              <span style={{ width: `${t.t1}%`, background: TIER_COLOR[0] }} />
              <span style={{ width: `${t.t2}%`, background: TIER_COLOR[1] }} />
              <span style={{ width: `${t.t3}%`, background: TIER_COLOR[2] }} />
            </div>
            <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">{t.detail}</p>
          </div>
        ))}
      </div>

      {/* 05 결론 */}
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
        <strong>결과는 한 지역에서만 성립했고, 그래서 본문 결과로 삼지 않았다.</strong>
      </p>
      <Table spec={parkCapMediationTable} />
      <Table spec={parkCapPathTable} />
      <Table spec={parkCapMediationDropTable} />
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        <strong>네 지역 중 신뢰구간이 0을 배제하는 곳은 동탄2 남부 하나뿐이다</strong>(간접효과
        −0.072, 95% CI −0.143 ~ −0.023, 매개비율 47.5%). 광교는 a 경로가 강한데도(부분 R² 0.297)
        간접효과 신뢰구간이 −0.289 ~ +0.022로 0을 포함하고, 동탄2 북부와 운정은 a 경로 자체가
        성립하지 않는다(부분 R² 0.007 · 0.002).
      </p>
      <p className="mt-3 max-w-3xl text-[0.9rem] leading-relaxed">
        네 지역을 묶은 풀링에서는 간접효과가 −0.027(40.4%)로 유의하지만,{" "}
        <strong className="text-foreground">동탄2 남부를 빼면 신뢰구간이 −0.044 ~ +0.001로 0을
        포함한다.</strong> 나머지 세 지역은 어느 것을 빼도 매개가 유지되는데 동탄2 남부만 빼면
        사라진다 — 풀링 추정치가 이 한 지역에서 나온다는 뜻이다. 따라서 &ldquo;공원 효과의 40%가
        상권을 경유한다&rdquo;를 네 지역의 결론으로 서술할 수 없다. 공원과 상권이 계획 단계에서 실제로
        함께 배치된 도시에서만 나타나는 국지적 현상으로 읽는 것이 정확하다.
      </p>
      <p className="mt-4 max-w-3xl text-[0.9rem] leading-relaxed">
        아래 지도는 생활상권 POI 밀도를 육각 그리드(폭 225m)로 얹고 공원을 규모별로 구분한 것이다.
        진한 윤곽이 지역 최대 공원이다. 동탄2 남부는 동탄호수공원 가장자리에 상권 밀집 셀이 직접 닿아
        있는 반면, 운정은 호수공원 주변이 비어 있고 상권이 지구 외곽에 따로 형성되어 있다. 매개가
        성립하는 곳과 그렇지 않은 곳의 차이가 배치에서 그대로 드러난다.
      </p>
      <MapLightbox maps={parkCapCommerceMaps} />

      {/* 부록 B */}
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
