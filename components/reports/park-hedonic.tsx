"use client"

import { useState } from "react"
import { MapLightbox, type LightboxMap } from "@/components/reports/map-lightbox"
import { SimplePostHeader } from "@/components/simple-post-header"

const IMG = "/images/reports/park-hedonic"

const BASIC: LightboxMap[] = [
  { key: "ds", label: "동탄2 남부", sub: "동탄호수공원 44.5ha · 28개 단지", src: `${IMG}/basic/dongtan-south.jpg` },
  { key: "dn", label: "동탄2 북부", sub: "동탄여울공원 + 청계중앙공원 · 47개 단지", src: `${IMG}/basic/dongtan-north.jpg` },
  { key: "d1", label: "동탄1", sub: "동탄센트럴파크 36.8ha · 66개 단지", src: `${IMG}/basic/dongtan1.jpg` },
  { key: "gg", label: "광교", sub: "광교호수공원 132.8ha · 71개 단지", src: `${IMG}/basic/gwanggyo.jpg` },
]

const COMMERCE: LightboxMap[] = [
  { key: "ds", label: "동탄2 남부", sub: "생활업종 점포 밀도", src: `${IMG}/heat/dongtan-south.jpg` },
  { key: "dn", label: "동탄2 북부", sub: "생활업종 점포 밀도", src: `${IMG}/heat/dongtan-north.jpg` },
  { key: "d1", label: "동탄1", sub: "생활업종 점포 밀도", src: `${IMG}/heat/dongtan1.jpg` },
  { key: "gg", label: "광교", sub: "생활업종 점포 밀도", src: `${IMG}/heat/gwanggyo.jpg` },
]

const TABS = [
  { id: "basic", label: "기본", note: "대표공원(진한 초록)과 분석 단지(점)의 분포", maps: BASIC },
  { id: "commerce", label: "상권", note: "공원 둘레의 생활업종 점포 밀도(반경 300m 커널 밀도)", maps: COMMERCE },
] as const

export function ParkHedonicReport() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("basic")
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SimplePostHeader
        eyebrow="RESEARCH / 부동산 · 헤도닉 분석"
        title="대형공원은 아파트 가격에 자본화되는가"
        subtitle="동탄2 남·북 대조로 본 공원 효과 — 5개 구역 285개 단지"
        tags={["Urban Economics", "Hedonic Regression", "GIS"]}
      />

      <div className="mx-auto max-w-4xl px-4 pb-20">
        <dl className="mt-10 grid gap-5 md:grid-cols-2">
          <div>
            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">연구의 시작</dt>
            <dd className="mt-1 text-[0.95rem] leading-relaxed">
              공원 가까이 살면 집값이 더 나간다고들 하지만, 그 효과가 정말 있는지, 있다면 어떤 길로 가격에 들어오는지는 따져 본 적이 드뭅니다.
              같은 택지지구 안에서 대형공원의 배치만 다른 동탄2 남부와 북부를 나란히 놓고 보았습니다.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent">결론</dt>
            <dd className="mt-1 text-[0.95rem] leading-relaxed">
              대표공원에 가까울수록 다섯 구역 모두에서 아파트 가격이 유의하게 높았고, 100m 가까운 84㎡ 단지는 약 283만~1,131만원 비쌌습니다.
              효과의 크기보다 중요한 차이는 경로로, 공원과 상권이 한 축으로 엮인 곳에서만 효과의 일부가 상권을 거쳐 들어옵니다.
            </dd>
          </div>
        </dl>

        <div className="mt-12 flex items-center gap-2" role="tablist" aria-label="지도 종류">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tab}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                t.id === tab
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">{current.note}</span>
        </div>

        <MapLightbox key={current.id} maps={current.maps} />
      </div>
    </div>
  )
}
