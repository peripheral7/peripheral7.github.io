"use client"

import Image from "next/image"
import { useBoardFilter, type Filter } from "@/components/board-filter-context"
import { SiteFeatures } from "@/components/site-features"
import { WheretoPoster } from "@/components/whereto-poster"
import { FEATURES, STUDY_MATERIALS } from "@/lib/features"

const nav: { label: string; value: Filter }[] = [
  { label: "Research", value: "RESEARCH" },
  { label: "Photography", value: "PHOTOGRAPHY" },
  { label: "Index", value: "ALL" },
]

export function SiteHero() {
  const { setFilter } = useBoardFilter()

  return (
    <header className="relative w-full bg-background text-foreground">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            2026
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Field File
          </span>
        </div>
        <nav className="hidden gap-7 md:flex">
          {nav.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground underline-offset-8 transition-colors hover:text-foreground hover:underline"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <span className="bg-accent px-2 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-foreground">
          Classified · Open
        </span>
      </div>

      {/* 가운데 사진 + 오른쪽 열(여기살까? 포스터 · 기능모음 · 평가사 학습자료).
          - 휴대폰: 모두 가운데 정렬로 위→아래로 쌓인다.
          - md~lg(웹 반쪽 화면): 사진이 왼쪽으로 비켜서고 오른쪽 열이 붙는다. md 는 오른쪽 열 한 칸(포스터 위·목록 아래, 그만큼 사진이 길어짐), lg 는 두 칸(포스터 | 목록).
          - xl: 사진은 화면 가운데 그대로, 오른쪽 열 하나(폭 15rem)에 포스터(위)·글자 목록(아래).
          사진과 오른쪽 열은 같은 격자 줄에 있어 줄 높이 = max(사진 2:3 높이, 오른쪽 열 내용 높이).
          사진 상자는 self-stretch 라 오른쪽 열이 더 길면 사진이 그만큼 길어진다(object-cover 로 잘라 채움) — 목록이 사진 밖으로 삐져나오지 않는다. */}
      <div className="relative flex min-h-[calc(100svh-72px)] flex-col items-center justify-center px-5 pb-16 md:px-10">
        <div className="grid w-full justify-items-center md:w-auto md:grid-cols-[20rem_auto] md:justify-items-stretch md:gap-x-12 lg:grid-cols-[24rem_auto] xl:w-full xl:grid-cols-[minmax(0,1fr)_28rem_minmax(0,1fr)] xl:gap-x-16">
          <div className="relative aspect-[2/3] w-full max-w-md self-stretch overflow-hidden md:col-start-1 md:row-start-1 md:max-w-none xl:col-start-2">
            <Image
              src="/images/hero-tree.jpg"
              alt="A bare-branched tree reaching across a pale evening sky above dense forest"
              fill
              priority
              sizes="(max-width: 768px) 92vw, (max-width: 1024px) 20rem, (max-width: 1280px) 24rem, 28rem"
              className="object-cover"
            />
          </div>

          <div className="w-full max-w-md md:col-start-1 md:row-start-2 md:max-w-none xl:col-start-2">
            {/* caption line above the title, sitting on the photo edge */}
            <p className="mt-3 flex items-center justify-between whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground md:tracking-[0.12em] lg:tracking-[0.25em]">
              <span>20231009 · 17:55</span>
              <span>Fig. 01 — Field Study</span>
            </p>

            {/* title, right at the bottom of the photograph */}
            <h1 className="mt-1 text-center font-sans text-[13vw] font-bold leading-[1] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Moon
            </h1>

            <p className="mt-2 text-pretty text-center text-sm leading-relaxed text-muted-foreground">
              Land evaluation research and photographs.
            </p>
          </div>

          <aside className="mt-10 grid w-full max-w-xs gap-10 md:col-start-2 md:row-start-1 md:mt-0 md:w-60 md:max-w-none md:grid-rows-[auto_1fr] md:gap-y-8 lg:w-auto lg:grid-cols-[14rem_14rem] lg:grid-rows-1 lg:gap-x-6 xl:col-start-3 xl:w-60 xl:grid-cols-1 xl:grid-rows-[auto_1fr]">
            <WheretoPoster className="mx-auto w-60 md:mx-0 md:w-full md:self-start" />
            <div className="flex flex-col gap-4 text-center md:self-end md:text-left">
              <SiteFeatures title="기능모음" items={FEATURES} />
              <SiteFeatures title="평가사 학습자료" items={STUDY_MATERIALS} />
            </div>
          </aside>
        </div>

        <span className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Scroll to the board ↓
        </span>
      </div>
    </header>
  )
}
