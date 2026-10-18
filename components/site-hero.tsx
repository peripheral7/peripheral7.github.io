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
          - md~lg(웹 반쪽 화면): 사진이 왼쪽으로 비켜서고, 오른쪽에 두 칸 — 포스터는 사진 위쪽 끝, 글자 목록은 사진 아래쪽 끝에 맞춘다.
          - xl: 사진은 화면 가운데 그대로, 오른쪽 열 하나(폭 15rem)에 포스터(위)·글자 목록(아래)을 사진 높이 안에 맞춘다.
          오른쪽 열 높이 = 사진 높이(폭 × 1.5: 20rem→30rem, 24rem→36rem, 28rem→42rem). 사진 폭을 바꾸면 이 높이도 같이 바꾼다. */}
      <div className="relative flex min-h-[calc(100svh-72px)] flex-col items-center justify-center px-5 pb-16 md:px-10">
        <div className="relative flex w-full flex-col items-center md:flex-row md:items-start md:justify-center md:gap-12 xl:block">
          <figure className="relative w-full max-w-md shrink-0 md:w-[20rem] lg:w-[24rem] xl:mx-auto xl:w-[28rem]">
            <Image
              src="/images/hero-tree.jpg"
              alt="A bare-branched tree reaching across a pale evening sky above dense forest"
              width={1200}
              height={1800}
              priority
              sizes="(max-width: 768px) 92vw, (max-width: 1024px) 20rem, (max-width: 1280px) 24rem, 28rem"
              className="h-auto w-full object-fill"
            />

            {/* caption line above the title, sitting on the photo edge */}
            <figcaption className="mt-3 flex items-center justify-between whitespace-nowrap font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground md:tracking-[0.12em] lg:tracking-[0.25em]">
              <span>20231009 · 17:55</span>
              <span>Fig. 01 — Field Study</span>
            </figcaption>

            {/* title, right at the bottom of the photograph */}
            <h1 className="mt-1 text-center font-sans text-[13vw] font-bold leading-[1] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Moon
            </h1>

            <p className="mt-2 text-pretty text-center text-sm leading-relaxed text-muted-foreground">
              Land evaluation research and photographs.
            </p>
          </figure>

          <aside className="mt-10 grid w-full max-w-xs gap-10 md:mt-0 md:h-[30rem] md:w-auto md:max-w-none md:grid-cols-[13.5rem_13.5rem] md:gap-x-6 lg:h-[36rem] xl:gap-y-0 lg:grid-cols-[14rem_14rem] xl:absolute xl:left-[calc(50%+14rem+4rem)] xl:top-0 xl:h-[42rem] xl:w-60 xl:grid-cols-1 xl:grid-rows-[auto_1fr]">
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
