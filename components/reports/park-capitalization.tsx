import { MapLightbox } from "@/components/reports/map-lightbox"
import {
  parkCapCoreMaps,
  parkCapHexMaps,
  parkCapConclusion,
  parkCapVerdict,
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
  parkCapNorthTable,
  parkCapSignalTable,
  parkCapGwanggyoTable,
  parkCapFormTable,
  parkCapStructureTable,
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

      <div className="mt-7 rounded border border-border border-l-[3px] border-l-accent bg-card px-5 py-5">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent">결론부터</p>
        <p className="mt-2.5 text-[1.05rem] font-bold leading-relaxed">{parkCapVerdict.lead}</p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">{parkCapVerdict.body}</p>
        <div className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-3">
          {parkCapVerdict.points.map((p) => (
            <div key={p.k} className="bg-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.76rem] font-semibold">{p.k}</span>
                <span className="font-mono text-[0.92rem] font-bold tabular-nums text-accent">{p.v}</span>
              </div>
              <p className="mt-1 text-[0.74rem] leading-relaxed text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </div>

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

      {/* 지도 — 다섯 구역의 대표공원과 분석 단지 */}
      <div className="mt-10">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
          다섯 구역의 대표공원과 분석 단지
        </p>
        <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed text-muted-foreground">
          가장 진한 초록이 각 구역의 대표공원, 옅은 초록이 2ha 이상의 다른 공원, 작은 사각점이
          분석 단지다. 동탄2 남부는 대표공원이 시가지 한복판에 앉아 단지들이 그 둘레에 퍼져 있다.
          북부는 하천을 따라 가늘게 뻗은 여울공원이 생활권 가장자리에, 청계중앙공원이 동탄역 시범단지
          한가운데에 있다. 광교는 공원이 지구를 통째로 갈라놓아 지구 안 단지는 어디든 가깝고, 일월은
          촘촘한 기성시가지의 가장자리에 공원 하나가 놓여 있다. 흐리게 덮인 곳은 분석 범위 밖이다.
        </p>
        <MapLightbox maps={parkCapCoreMaps} />
      </div>

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
        고정되고, 남는 차이는 대형공원의 배치다. 다만 남부에는 오산시 단지가 섞여 있어 택지지구 밖
        더미로 분리해야 하고, 북부는 대표공원을 어떻게 정의하느냐에 결과가 민감하다.{" "}
        <em className="not-italic text-accent">그리고 지역을 합치지 않았다</em> — 다섯 구역의 ㎡당
        단가가 582만원에서 1,037만원까지 차이 나므로, 하나의 가격함수로 묶으면 그 평균값은 어느
        구역의 것도 아니게 된다. 지역 고정효과를 넣은 풀링도, 지역 간 계수를 다시 회귀하는 메타분석도
        하지 않았다.
      </div>

      {/* 01 읽는 법 */}
      <SectionTitle n="01">이 보고서를 읽는 법</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        구역별 표본이 39~77개로 작다. 계수에 별표가 몇 개 붙었는지보다 그 별표가 어떤 조건에서
        붙었는지가 중요하다.
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
        구역마다 대표공원을 하나 지정하고 그 진출입로까지의 거리를 공원 변수로 넣는다. 통제변수는
        구역마다 근거를 달아 조금씩 다르다(표 2 주). 효과가 뚜렷한 순서로 싣는다.
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
        모형 전체를 비교하면 구역마다 가격을 움직이는 축이 다르다.
      </p>
      <Table spec={parkCapFullCoefTable} />
      <Table spec={parkCapStdTable} />
      <Table spec={parkCapMoneyTable} />

      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>공원의 면적 순위와 효과의 크기가 어긋난다.</strong> 대표공원을 큰 순서로 놓으면
        광교 132.8 → 동탄2 남부 44.5 → 동탄1 36.8 → 동탄2 북부 29.4+21.3 → 일월 28.1ha인데, 탄력성은
        가장 작은 일월(−0.093)이 가장 크고 광교(−0.087)가 그다음이다.
        <br />
        <br />
        <em className="not-italic text-accent">가격을 지배하는 요인도 구역마다 다르다.</em> 동탄2
        남부는 택지지구 밖 더미(오산시 단지)와 건축연령, 동탄2 북부와 광교는 대중교통 거리,
        동탄1과 일월은 건축연령이 1위다. 대표공원은 어느 구역에서도 1~3위에 오르지 못한다 —
        공원은 가격의 주된 결정요인이 아니라 그 위에 얹히는 몫이다.
      </div>

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        공원 효과의 크기는 비슷한데 경로와 지배 요인이 갈린다. 도시의 성격과 공원 배치, 상권이 무엇을
        따라 생겼는지로 구역을 나란히 놓으면 다음과 같다.
      </p>
      <Table spec={parkCapStructureTable} />

      {/* 04 매개와 공간 */}
      <SectionTitle n="04">상권을 경유하는가, 결과는 흔들리지 않는가</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        공원이 상권을 끌어들이고 그 상권이 가격에 자본화된다면, 공원 효과의 일부는 상권을 경유한다.
        Baron &amp; Kenny 단계적 회귀로 경로를 분리해 a·b 경로가 유의하고 상권을 통제했을 때 직접효과가
        줄어드는지를 본다.
      </p>
      <div className="mt-6">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
          공원과 생활상권의 겹침
        </p>
        <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed text-muted-foreground">
          같은 도판에 생활업종 점포 밀도를 육각형으로 얹고 분석 단지를 사각점으로 함께 찍었다. 파랑이
          진할수록 점포가 몰려 있다. 분석 범위(택지지구와 공원 링) 밖은 흐리게 덮고, 상권과 학교는 범위
          안의 것만 그렸다. 동탄2 남부는 상권 덩어리가 대표공원에 붙어 있어 공원 거리가 상권 지수를
          설명하는 a경로가 뚜렷하다(부분 R² 0.479). 동탄2 북부는 상권이 공원과 무관하게 동탄역을 따라
          깔려 있다(0.022). 갈색 점은 지하철역, 자홍 점은 대표공원 진출입로, 주황 삼각형은 초등학교다.
          동탄2 북부의 보라색 점선은 동탄순환대로 — 상권 덩어리가 공원이 아니라 역에 붙어 있는 것이 보인다.
        </p>
        <MapLightbox maps={parkCapHexMaps} />
      </div>

      <Table spec={parkCapMediationTable} />
      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>매개는 동탄2 남부와 동탄1에서만 성립한다.</strong> Baron &amp; Kenny의 세 조건이
        서는 곳은 다섯 중 둘이다 —{" "}
        <em className="not-italic text-accent">동탄2 남부는 총효과 −0.134의 54%가, 동탄1은
        −0.146의 44%가 상권을 경유하고, 상권을 통제해도 직접효과가 유의하게 남아 부분매개다.</em>{" "}
        남부는 상권이 작아 호수공원이 상권의 위치를 정했고, 동탄1은 센트럴파크와 중심상업지구가 한 축으로
        계획되었다. 나머지 세 구역은 끊기는 고리가 다르다 — 광교는 상권이 가격을 설명하지 못하고(b),
        동탄2 북부와 일월은 상권이 공원이 아니라 역·구도심을 따라 생겼다(a). 공원이 상권을 만든다는
        연결고리는 공원이 생활권 안에 있거나 상업 축과 함께 계획될 때 선다.
      </div>
      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        가까운 단지끼리 모형이 설명하지 못한 부분을 공유하면 표준오차가 실제보다 작아진다. 직접효과
        모형 잔차의 모란 지수로 확인했다.
      </p>
      <Table spec={parkCapSpatialTable} />
      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        잔차의 자기상관은 동탄2 남부의 k=3에서만 10% 수준으로 남는다. 확인 삼아 네 구역을
        공간오차모형(SEM)으로 다시 추정했다.
      </p>
      <Table spec={parkCapSemTable} />
      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>공간모형을 거쳐도 결과는 그대로다.</strong> λ는 어디서도 유의하지 않고, 공원 계수는
        남부 −0.063, 북부 −0.060, 광교 −0.085, 일월 −0.092로 OLS와 거의 같으며 모두 1% 수준이다.{" "}
        <em className="not-italic text-accent">이전 판에서 북부·일월에 남던 자기상관은 대표공원 정의와 표본 범위를 바로잡자 사라졌다.</em>
      </div>

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        동탄2 북부는 경부고속도로와 동탄순환대로가 시가지를 가르고, 생활권 가장자리의 여울공원과
        시범단지 한가운데의 청계중앙공원이 함께 있다. 대표공원과 구역을 어떻게 보느냐에 따라 계수가
        어떻게 움직이는지 확인한다.
      </p>
      <Table spec={parkCapNorthTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        구역 더미는 넣든 빼든 공원 계수를 −0.049~−0.062 안에 두어 결론을 바꾸지 않는다. 경계를
        긋는 방식이 임의적일 수 있어 본 사양에는 넣지 않았다. 결과를 가르는 것은 대표공원의 정의다 —
        여울공원만 쓰면 +0.045로 부호가 바뀐다.
      </p>

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        광교는 표본의 62%가 택지지구 밖이다. 지구 안(29개)과 밖(48개)의 가격 단층을 다른 구역과 같은
        더미 하나로 흡수하는데, 그 처리에 따라 계수가 얼마나 움직이는지 확인한다.
      </p>
      <Table spec={parkCapGwanggyoTable} />
      <p className="mt-3 max-w-3xl text-[0.88rem] leading-relaxed text-muted-foreground">
        더미를 빼면 계수가 −0.100, 법정동 더미 아홉 개로 바꾸면 −0.162로 커진다. 크기는 처리에
        민감하지만 부호와 유의성은 달라지지 않는다. 지구 밖을 어떻게 다루느냐가 광교에서 가장 큰
        연구자 재량이다.
      </p>

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        지금까지의 점검을 한 표로 모으면 공원 신호가 약한 곳이 드러난다.
      </p>
      <Table spec={parkCapSignalTable} />
      <div className="mt-5 rounded border border-border border-l-[3px] border-l-accent bg-muted/40 px-4 py-3.5 text-[0.88rem] leading-relaxed">
        <strong>정의에 가장 민감한 곳은 동탄2 북부와 동탄1이다.</strong> 북부는 대표공원에 청계중앙공원을
        넣느냐에 부호가 갈리고, 동탄1은 경계 대신 진출입로로 재야 효과가 드러난다. 일월은 반대로 통제 전
        상관이 거의 없고(+0.10) 건축연령을 통제해야 계수가 드러난다.{" "}
        <em className="not-italic text-accent">공원 효과는 무엇을 대표공원으로, 어디를 입구로 보느냐는 측정의 정의 위에 서 있다.</em>
      </div>

      <p className="mt-6 max-w-3xl text-[0.92rem] leading-relaxed">
        마지막으로 함수형을 바꿔 본다. 같은 신도시 호수공원을 다룬 이상준 외(2026)는 가격을 그대로 두고
        거리만 로그로 둔 선형-로그를 썼다.
      </p>
      <Table spec={parkCapFormTable} />

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

      <h4 className="mt-8 text-[0.95rem] font-bold">남은 질문</h4>
      <ol className="mt-3 flex flex-col gap-4">
        {parkCapConclusion.questions.map((q) => (
          <li key={q.q} className="rounded border border-border bg-card px-4 py-3.5">
            <strong className="block text-[0.88rem]">{q.q}</strong>
            <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted-foreground">{q.body}</p>
          </li>
        ))}
      </ol>

      {/* 부록 A 자료 */}
      <SectionTitle n="부록 A">자료와 방법</SectionTitle>
      <p className="mt-3 max-w-3xl text-[0.92rem] leading-relaxed">
        모두 공개 자료이며 좌표계는 EPSG:5179(UTM-K)로 통일한다. 공원 결정경계에는 이름 필드가
        비어 있어, 대표공원은 OpenStreetMap 지명 폴리곤과 겹쳐 확정한다(동탄여울공원 90.2%).
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

      {/* 부록 B 한계 */}
      <SectionTitle n="부록 B">한계</SectionTitle>
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
