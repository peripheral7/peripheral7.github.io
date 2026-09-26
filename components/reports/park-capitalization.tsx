import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapCoreMaps,
  parkCapConclusion,
  parkCapFacts,
  parkCapFindings,
  parkCapFooter,
  parkCapFullCoefTable,
  parkCapHeadlineTable,
  parkCapLimits,
  parkCapMeta,
  parkCapMethodology,
  parkCapRegions,
  parkCapSources,
  parkCapStatNotes,
  parkCapStdTable,
  parkCapMediationTable,
  parkCapMoneyTable,
  parkCapSpatialTable,
  parkCapSemTable,
  parkCapGwanggyoTable,
  type RegionKey,
  type StatTable,
} from "@/content/reports/park-capitalization"

const REGION_DOT: Record<RegionKey, string> = {
  ds: "#2f7a55",
  dn: "#4f93a8",
  d1: "#7d8aa0",
  gg: "#b08a3c",
  iw: "#c2703a",
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

const VERDICT: Record<string, { bg: string; fg: string }> = {
  "확인됨": { bg: "rgba(63,158,112,0.16)", fg: "#2f7a55" },
  "시사적": { bg: "rgba(176,138,60,0.18)", fg: "#8a6a24" },
  "확인 안 됨": { bg: "rgba(120,133,148,0.16)", fg: "#5d6975" },
  "식별 불가": { bg: "rgba(194,112,58,0.16)", fg: "#9a5326" },
  "해당 없음": { bg: "rgba(120,133,148,0.10)", fg: "#788594" },
}

function Verdict({ v }: { v: string }) {
  const c = VERDICT[v] ?? VERDICT["확인 안 됨"]
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[0.62rem] font-semibold tracking-wide"
      style={{ background: c.bg, color: c.fg }}
    >
      {v}
    </span>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-border py-1.5 text-[0.76rem]">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="text-right font-mono tabular-nums">{v}</dd>
    </div>
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

      {/* 00 한눈에 보기 */}
      <SectionTitle n="00">한눈에 보기</SectionTitle>
      <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
        {parkCapFindings.map((f) => (
          <div key={f.label} className="flex flex-col gap-2 bg-card p-5">
            <span className="text-[0.72rem] text-muted-foreground">{f.label}</span>
            <span
              className={`font-mono text-[1.2rem] font-semibold ${
                f.accent ? "text-accent" : "text-foreground"
              }`}
            >
              {f.value}
            </span>
            <span className="text-[0.78rem] leading-relaxed text-muted-foreground">{f.note}</span>
          </div>
        ))}
      </div>
      <Table spec={parkCapHeadlineTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>같은 지구 안에서 비교했다.</strong> 동탄2 남부와 북부는 시행 주체도, 입주 시기도,
        행정구역도 같다. 도시끼리 비교할 때 통제할 수 없는 제도·시장 요인이 여기서는 상당 부분
        고정되고, 남는 차이는 대형공원의 배치다.{" "}
        <em className="not-italic text-accent">그리고 지역을 합치지 않았다</em> — 다섯 구역의 ㎡당
        단가가 652만원에서 1,249만원까지 두 배 차이 나므로, 하나의 가격함수로 묶으면 그 평균값은 어느
        구역의 것도 아니게 된다. 지역 고정효과를 넣은 풀링도, 지역 간 계수를 다시 회귀하는 메타분석도
        하지 않았다.
      </div>

      {/* 01 읽는 법 */}
      <SectionTitle n="01">이 보고서를 읽는 법</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        표본이 지역당 23~36개로 작다. 이 크기에서는 계수 하나에 별표가 몇 개 붙었는지보다, 그 별표가
        어떤 조건에서 붙었는지가 중요하다. 아래 다섯 가지를 먼저 읽어 두면 각 구역의 결과를 정확히
        해석할 수 있다.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {parkCapStatNotes.map((sn) => (
          <div key={sn.tag} className="rounded border border-border bg-card px-4 py-3.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {sn.tag}
              </span>
              <strong className="text-[0.88rem]">{sn.title}</strong>
            </div>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{sn.body}</p>
          </div>
        ))}
      </div>

      {/* 02 지역별 */}
      <SectionTitle n="02">구역별로 본 공원 효과</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        다섯 구역을 효과가 뚜렷한 순서로 싣는다. 구역마다 대표공원을 하나 지정하고 그 거리를 유일한
        공원 변수로 넣었으며, 나머지 일곱 개 통제변수는 전 구역 동일하다. 앞의 두 구역이 핵심 대조군인
        동탄2 남부와, 비교 사례인 일월저수지 일대다.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {parkCapRegions.map((r) => (
          <section key={r.name} className="overflow-hidden rounded border border-border bg-card">
            <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
              <Dot k={r.key} />
              <h4 className="text-[1.02rem] font-bold">{r.name}</h4>
              <Verdict v={r.verdict} />
              <span className="ml-auto font-mono text-[0.72rem] tabular-nums text-muted-foreground">
                단지 {r.n}개 · {r.park}
              </span>
            </header>

            <div className="grid grid-cols-1 gap-5 px-5 py-4 lg:grid-cols-[1fr_16rem]">
              <div>
                <p className="text-[0.92rem] font-semibold leading-relaxed">{r.lead}</p>
                <p className="mt-2.5 text-[0.88rem] leading-relaxed">{r.body}</p>
                <p className="mt-2.5 text-[0.88rem] leading-relaxed text-muted-foreground">{r.why}</p>
                <p className="mt-3 rounded border-l-[3px] border-l-accent bg-muted/40 px-3.5 py-2.5 text-[0.85rem] leading-relaxed">
                  <strong>유의할 점 </strong>
                  {r.caution}
                </p>
              </div>

              <dl className="flex flex-col self-start rounded border border-border bg-muted/30 px-3.5 py-2">
                <Fact k="계수 (HC1 t)" v={`${r.coef} (${r.t})`} />
                <Fact k="p값" v={r.p} />
                <Fact k="HC3 재추정" v={r.hc3} />
                <Fact k="수정 R²" v={r.adjr2} />
                <Fact k="최대 VIF" v={r.vif} />
                <Fact k="대표공원 거리" v={r.dist} />
                <Fact k="가격 수준" v={r.price} />
                <Fact k="거리 절반 시" v={r.money} />
                <Fact k="95% 신뢰구간" v={r.moneyCI} />
              </dl>
            </div>
          </section>
        ))}
      </div>

      {/* 03 나란히 놓고 보기 */}
      <SectionTitle n="03">다섯 구역을 나란히 놓으면</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 계수만이 아니라 모형 전체를 비교하면, 구역마다 가격을 움직이는 축이 다르다는 것이 드러난다.
      </p>
      <Table spec={parkCapFullCoefTable} />
      <Table spec={parkCapStdTable} />
      <Table spec={parkCapMoneyTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>공원의 면적 순위와 자본화 순위가 어긋난다.</strong> 대표공원을 큰 순서로 놓으면
        광교 163.6 → 동탄1 67.1 → 동탄2 남부 44.5 → 동탄2 북부 29.4 → 일월 28.1ha인데, 계수가
        유의한 곳은 가장 작은 두 곳 중 하나(일월)와 가운데(동탄2 남부)다. 가장 큰 광교는 부호까지
        반대다.
        <br />
        <br />
        <em className="not-italic text-accent">가격을 지배하는 요인도 구역마다 다르다.</em> 동탄2
        남부는 전용면적과 대표공원, 동탄2 북부와 동탄1은 지하철 거리, 광교와 일월은 생활상권이 1위다.
        같은 동탄2 안에서도 남과 북의 축이 다르며, 이것이 지역을 합쳐 추정하지 않은 이유이기도 하다.
      </div>

      {/* 04 매개와 공간 */}
      <SectionTitle n="04">상권을 경유하는가, 결과는 흔들리지 않는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원이 상권을 끌어들이고 그 상권이 가격에 자본화된다면, 공원 효과의 일부는 상권을 경유한다.
        Baron &amp; Kenny 단계적 회귀로 이 경로를 분리하고 부트스트랩 5,000회로 구간을 구했다.
      </p>
      <Table spec={parkCapMediationTable} />
      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>매개는 다섯 구역 어디에서도 확립되지 않는다.</strong> 간접효과의 95% 구간이 모두 0을
        포함한다. 그런데 갈라 보면 절반은 성립한다 —{" "}
        <em className="not-italic text-accent">상권이 가격을 설명하는 b경로는 다섯 중 세 곳에서 1%
        수준으로 유의하다.</em> 서지 않는 것은 &lsquo;그 상권이 공원 때문에 생겼다&rsquo;는 연결고리
        쪽이다. 공원 거리가 상권을 설명하는 a경로가 뚜렷한 곳은 동탄2 남부(부분 R² 0.195)와
        북부(0.387)뿐이고, 그마저 간접효과로는 구간이 0을 넘지 못한다.
      </div>
      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        가까운 단지끼리 모형이 설명하지 못한 부분을 공유하면 표준오차가 실제보다 작아진다. 직접효과
        모형 잔차의 모란 지수로 확인했다.
      </p>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        처음에는 동탄1을 동탄2 북부에 합쳐 하나의 지역으로 두었다. 동탄여울공원이 두 지구의 접경에
        있어 동탄1을 빼면 공원 서편 배후지가 사라지기 때문이다. 그러나 그렇게 묶은 표본은 모란
        I가 0.384(p=0.001)로 단일 시장이 아니었고, 평균 단가도 985만원과 737만원으로 34% 차이 났다.{" "}
        <strong className="text-foreground">독립 구역으로 분리하자 동탄1의 자기상관은 사라졌다</strong>
        (I≈0, p=0.75).
      </p>
      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        그래도 동탄2 북부에는 자기상관이 남는다. 표준오차가 실제보다 작아져 공원 계수의 비유의가
        가짜일 수 있으므로, 공간오차모형(SEM)으로 오차항의 공간의존을 흡수해 다시 추정했다.
      </p>
      <Table spec={parkCapSemTable} />
      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>공간의존은 실재하지만 결론을 바꾸지 않는다.</strong> λ는 여섯 설정 중 다섯에서
        유의하고 여과잔차의 자기상관은 완전히 사라지는데, 대표공원 계수는 −0.039에서 −0.056 사이로
        OLS의 −0.051과 사실상 같다.{" "}
        <em className="not-italic text-accent">북부에서 공원이 잡히지 않는 것은 표준오차가 왜곡되어서가
        아니라, 그 구역에 생활권의 초점이 될 대형공원이 없기 때문이다.</em>
      </div>
      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        광교에도 확인할 것이 하나 있다. 구역을 광교지구 택지개발사업 경계로 자르면 광교호수공원
        <strong> 남안</strong>의 단지 여섯 곳이 빠진다. 행정구역이 용인시 기흥구 영덕동, 지구가
        용인흥덕지구여서 광교 밖이지만 호수까지는 145~714m로 가깝다. 표본에서 가장 가까운 쪽이
        잘려 나간 것이 광교의 계수가 양(+)인 원인일 수 있으므로, 경계를 넓혀 가며 확인했다.
      </p>
      <Table spec={parkCapGwanggyoTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        아니었다. 경계를 넓힐수록 계수가 0에 가까워질 뿐 부호가 바뀌지 않는다. 오히려 확장 표본이
        구역을 좁게 잡은 근거가 된다 — 흥덕지구 더미가 −0.272(p&lt;0.001)로, 같은 호수를 낀 거리에서도
        두 지구의 단가가 32% 차이 난다(852만원 대 1,249만원). 같은 공원을 공유하되 서로 다른 시장인
        것이다. 광교지구 안에도 호수에서 89m 떨어진 단지가 있어, 남안 단지를 빼도 근거리 관측이
        사라지지는 않는다.
      </p>

      {/* 04 결론 */}
      <SectionTitle n="05">결론</SectionTitle>
      <div className="mt-4 rounded border border-border border-l-[3px] border-l-accent bg-card px-5 py-4">
        <p className="text-[1.02rem] font-semibold leading-relaxed">{parkCapConclusion.headline}</p>
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
      <div className="mt-6 rounded border border-border bg-muted/30 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>강건성 </strong>
        {parkCapConclusion.robustness}
      </div>
      <p className="mt-6 max-w-3xl text-[0.9rem] leading-relaxed">{parkCapConclusion.contribution}</p>

      <h4 className="mt-8 text-[0.95rem] font-bold">지도교수께 여쭙고 싶은 세 가지</h4>
      <ol className="mt-3 flex flex-col gap-4">
        {parkCapConclusion.questions.map((q) => (
          <li key={q.q} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{q.q}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{q.body}</p>
          </li>
        ))}
      </ol>

      {/* 부록 A 지도 */}
      <SectionTitle n="부록 A">대표공원은 어디인가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        도시계획시설(공원) 결정경계 자료에는 공원 이름이 없다 — ALIAS 필드가 전부 비어 있어
        &lsquo;동탄여울공원&rsquo;을 코드로 특정할 방법이 없다. 그래서 OpenStreetMap의 지명 폴리곤과
        겹쳐 보고 확정했다. 동탄여울공원은 OSM 폴리곤의 90.2%를 덮고 교차하는 결정 레코드가 그
        하나뿐이며, 반석산근린공원은 OSM 폴리곤을 100% 포함한다. 아래 지도에서 가장 진한 초록이
        대표공원, 점이 분석 단지다.
      </p>
      <MapLightbox maps={parkCapCoreMaps} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        지도를 나란히 놓으면 이 보고서의 결론이 눈으로도 보인다. 동탄2 남부는 대표공원이 시가지
        한복판에 앉아 단지들이 그 둘레에 퍼져 있고, 북부의 여울공원은 하천을 따라 가늘게 뻗어 지구
        가장자리를 스친다. 광교는 공원이 지구를 통째로 갈라놓아 어느 단지든 가깝고, 일월은 촘촘한
        기성시가지 속에 공원 하나가 섬처럼 놓여 있다.{" "}
        <strong className="text-foreground">어느 공원을 대표로 삼느냐가 결론을 상당 부분 정한다</strong>
        는 점은 한계로 남긴다.
      </p>

      {/* 부록 B 자료 */}
      <SectionTitle n="부록 B">자료와 방법</SectionTitle>
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
              <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground">{sc.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {parkCapMethodology.map((m) => (
          <div key={m.title} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{m.title}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{m.body}</p>
          </div>
        ))}
      </div>

      {/* 부록 C 한계 */}
      <SectionTitle n="부록 C">한계</SectionTitle>
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
