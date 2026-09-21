import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapAll9Maps,
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

const VERDICT: Record<string, { bg: string; fg: string }> = {
  "확인됨": { bg: "rgba(63,158,112,0.16)", fg: "#2f7a55" },
  "시사적": { bg: "rgba(176,138,60,0.18)", fg: "#8a6a24" },
  "확인 안 됨": { bg: "rgba(120,133,148,0.16)", fg: "#5d6975" },
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
        <strong>지역을 합치지 않았다.</strong> 여섯 신도시의 ㎡당 단가가 550만원에서 1,614만원까지
        세 배, 건축연령이 8년에서 31년까지 차이 난다. 이런 시장을 하나의 가격함수로 묶으면 그 평균값은
        어느 지역의 것도 아니게 된다. 그래서 지역 고정효과를 넣은 풀링도, 지역 간 계수를 다시 회귀하는
        메타분석도 하지 않았다.{" "}
        <em className="not-italic text-accent">대신 검정이 여러 번이 되므로 다중검정 보정을
        적용했다</em> — 그 의미는 바로 다음 절에서 설명한다.
      </div>

      {/* 01 읽는 법 */}
      <SectionTitle n="01">이 보고서를 읽는 법</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        표본이 지역당 27~71개로 작다. 이 크기에서는 계수 하나에 별표가 몇 개 붙었는지보다, 그 별표가
        어떤 조건에서 붙었는지가 중요하다. 아래 여섯 가지를 먼저 읽어 두면 각 지역의 결과를 정확히
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
      <SectionTitle n="02">신도시별로 본 공원 효과</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        여섯 지역을 효과가 뚜렷한 순서로 싣는다. 각 지역마다 대표공원을 하나(분당은 둘) 지정하고 그
        거리를 유일한 공원 변수로 넣었으며, 나머지 일곱 개 통제변수는 전 지역 동일하다.
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
                <Fact k="BH 보정 q" v={r.bhq} />
                <Fact k="HC3 재추정" v={r.hc3} />
                <Fact k="탐지 한계 MDE" v={r.mde} />
                <Fact k="단지 1개 제거" v={r.loo} />
                <Fact k="수정 R²" v={r.adjr2} />
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
      <SectionTitle n="03">여섯 지역을 나란히 놓으면</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 계수만이 아니라 모형 전체를 비교하면, 지역마다 가격을 움직이는 축이 다르다는 것이 드러난다.
      </p>
      <Table spec={parkCapFullCoefTable} />
      <Table spec={parkCapStdTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>여섯 지역에서 공원 계수의 부호는 모두 음(−)이다.</strong> 방향은 일치한다는 뜻이다.
        그러나 크기가 −0.110에서 −0.018까지 여섯 배 차이가 나고, 통계적으로 확인되는 것은 하나뿐이다.
        <br />
        <br />
        <em className="not-italic text-accent">가격을 지배하는 요인도 지역마다 다르다.</em> 동탄2
        남부는 대표공원, 광교·분당·동탄2 북부는 지하철 거리, 일산은 세대수, 운정은 건축연령이 1위다.
        같은 수도권 신도시라도 가격 형성의 축이 다르며, 이것이 지역을 합쳐 추정하지 않은 이유이기도 하다.
      </div>

      {/* 04 결론 */}
      <SectionTitle n="04">결론</SectionTitle>
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
        &lsquo;분당중앙공원&rsquo;을 코드로 특정할 방법이 없다. 그래서 공원에 번호와 면적을 붙인
        지도를 그려 폴리곤을 눈으로 확인한 뒤 지명을 부여했다. 아래 지도에서 붉은 윤곽이 30ha 이상
        공원이고, 점이 분석 단지다. 제외한 세 지역(판교·김포한강·양주옥정)도 함께 싣는다.
      </p>
      <MapLightbox maps={parkCapAll9Maps} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        규칙으로 대표공원을 뽑으면 지구 가장자리 공원이 선택되는 문제가 있었다. 경계에 걸친 공원은
        반경 300m 안에 옆 시가지의 상권까지 끌어오기 때문이다. 분당에서 규칙이 고른 52.0ha 공원을 쓰면
        계수가 −0.133(p=0.004)이었으나, 지도를 보고 율동공원 일대와 분당중앙공원으로 지정하자
        −0.018(p=0.267)로 바뀌었다.{" "}
        <strong className="text-foreground">어느 공원을 대표로 삼느냐가 결론을 상당 부분
        정한다</strong>는 점은 한계로 남긴다.
      </p>

      {/* 부록 B 제외 지역 */}
      <SectionTitle n="부록 B">제외한 세 지역</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        9개 신도시로 시작해 세 곳을 제외했다. 기준은 계수 값이 아니라 <strong>모형 품질</strong>이며,
        기준을 먼저 정하고 적용했다.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {[
          ["판교", "지하철 거리 VIF 46.74", "관측치 23개에 설명변수 7개로 변수들이 서로 거의 선형결합이 된다. 개별 계수를 신뢰할 수 없다."],
          ["양주옥정", "F 검정 p=0.268", "모형 전체가 유의하지 않다. 수정 R²가 0.155로, '설명력이 없다'는 귀무가설을 기각하지 못한다. 어떤 계수도 해석할 수 없다."],
          ["김포한강", "수정 R² 0.294 · 부호 반대", "가격 변동의 70%를 모형이 설명하지 못하고, 공원 계수가 +0.060으로 이론과 반대 방향이다."],
        ].map(([n, why, body]) => (
          <div key={n} className="grid grid-cols-[auto_1fr] gap-4 rounded border border-border bg-card px-4 py-3.5">
            <div className="shrink-0">
              <strong className="block text-[0.88rem]">{n}</strong>
              <span className="font-mono text-[0.68rem] text-accent">{why}</span>
            </div>
            <p className="text-[0.86rem] leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        제외 자체가 연구자의 선택이라는 점은 남는다. 다만 세 지역을 모두 포함해도 다중검정 보정을
        통과하는 곳은 동탄2 남부 하나로 같다 — 제외가 결론을 만들어내지는 않았다.
      </p>

      {/* 부록 C 자료 */}
      <SectionTitle n="부록 C">자료와 방법</SectionTitle>
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

      {/* 부록 D 한계 */}
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
