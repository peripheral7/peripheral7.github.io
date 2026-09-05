"use client"

import { useEffect, useState } from "react"

type Summary = {
  correct: number
  total: number
  needsReview?: number
  todayCount?: number
  lastStudyDate?: string | null
} | null

// 브라우저별 로컬 스토리지에 저장된 두 과목(행정법/실무) 퀴즈 요약을 읽어
// "오늘 얼마나 했는지"와 "뭘 복습해야 하는지"를 보여준다 — 전체 진행률(%)보다
// 이 두 가지가 실제 복습 판단에 더 도움이 된다는 판단. 서버 집계 아닌 이 브라우저 한정 기록.
const SUBJECTS = [
  { key: "admin-law-quiz-summary-v1", label: "감정평가법규", href: "/reports/appraisal-law-quiz.html" },
  { key: "admin-practice-quiz-summary-v1", label: "감정평가실무", href: "/reports/appraisal-practice-quiz.html" },
] as const

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function readSummary(storageKey: string): Summary {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Summary
    if (parsed && typeof parsed.correct === "number" && typeof parsed.total === "number" && parsed.total > 0) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function SubjectProgressPanel() {
  const [summaries, setSummaries] = useState<Summary[] | null>(null)

  useEffect(() => {
    setSummaries(SUBJECTS.map((s) => readSummary(s.key)))
  }, [])

  if (!summaries || summaries.every((s) => s === null)) return null

  return (
    <div className="flex w-52 shrink-0 select-none flex-col gap-4 font-mono">
      <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
        Today&apos;s Review
      </span>
      <div className="flex flex-col gap-3">
        {SUBJECTS.map((subject, i) => {
          const summary = summaries[i]
          const studiedToday = summary?.lastStudyDate === todayStr()
          const todayCount = studiedToday ? summary?.todayCount ?? 0 : 0
          const review = summary?.needsReview ?? 0

          return (
            <a
              key={subject.key}
              href={subject.href}
              className="group flex flex-col gap-1 border-l-2 border-border pl-3 transition-colors hover:border-accent"
            >
              <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                {subject.label}
              </span>
              <span className="text-[0.7rem] tracking-wide text-muted-foreground">
                오늘 <span className="text-foreground">{todayCount}</span>문제
                {!studiedToday && <span className="ml-1 text-muted-foreground/70">· 오늘 미학습</span>}
              </span>
              <span className="text-[0.7rem] tracking-wide">
                {review > 0 ? (
                  <>
                    복습 필요 <span className="text-accent">{review}</span>문제
                  </>
                ) : (
                  <span className="text-muted-foreground">복습할 것 없음</span>
                )}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
