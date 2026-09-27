"use client"

import { useEffect, useState } from "react"

type Summary = {
  correct: number
  total: number
  needsReview?: number
  todayCount?: number
  lastStudyDate?: string | null
} | null

const DAILY_SUBJECTS = ["law", "practice", "theory"] as const
type DailySubject = (typeof DAILY_SUBJECTS)[number]
const DAILY_LABEL: Record<DailySubject, string> = { law: "법규", practice: "실무", theory: "이론" }
const isDailySubject = (x: unknown): x is DailySubject => DAILY_SUBJECTS.includes(x as DailySubject)

// 매일 테스트(/reports/daily-test.html)가 남기는 요약. "오늘 했는지·연속이 이어지는지"는 페이지를 열지 않아도
// 날짜가 바뀌면 달라지므로, 결과가 아니라 재료(마지막 응시일·그날 점수·그날로 끝나는 연속 일수·요일별 과목·과목별 시작일·
// 과목별 마지막 기록·다음 회차)를 저장해 두고 여기서 오늘 날짜로 판단한다.
// pattern: v3 = 요일마다 그날 볼 과목들(배열, 월~일), v2(예전) = 요일마다 과목 하나('law'|'practice'|'rest').
type DailySummary = {
  lastDate: string | null
  lastScore: number | null
  run: number
  dayStart: number
  pattern: (string | string[])[]
  starts?: Partial<Record<DailySubject, string>>
  last?: Partial<Record<DailySubject, { date: string; score: number } | null>>
  next: Record<string, { title: string } | undefined>
} | null

// 브라우저별 로컬 스토리지에 저장된 두 과목(행정법/실무) 퀴즈 요약을 읽어
// "오늘 얼마나 했는지"와 "뭘 복습해야 하는지"를 보여준다 — 전체 진행률(%)보다
// 이 두 가지가 실제 복습 판단에 더 도움이 된다는 판단. 서버 집계 아닌 이 브라우저 한정 기록.
const SUBJECTS = [
  { key: "admin-law-quiz-summary-v1", label: "감정평가법규", href: "/reports/appraisal-law-quiz.html" },
  { key: "admin-practice-quiz-summary-v1", label: "감정평가실무", href: "/reports/appraisal-practice-quiz.html" },
] as const

const DAILY_KEY = "daily-test-summary-v1"
const DAILY_HREF = "/reports/daily-test.html"

const pad2 = (n: number) => String(n).padStart(2, "0")
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

function todayStr() {
  return fmtDate(new Date())
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

function readDaily(): DailySummary {
  try {
    const raw = window.localStorage.getItem(DAILY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DailySummary
    if (parsed && typeof parsed.run === "number" && Array.isArray(parsed.pattern) && parsed.pattern.length === 7) return parsed
    return null
  } catch {
    return null
  }
}

// 매일 테스트의 "오늘" 상태 — 하루가 바뀌는 시각(dayStart)을 반영한 날짜로 계산한다.
function dailyStatus(s: NonNullable<DailySummary>) {
  const now = new Date(Date.now() - (s.dayStart || 0) * 3600000)
  const today = fmtDate(now)
  const yesterday = fmtDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const weekday = (now.getDay() + 6) % 7 // 월=0 … 일=6
  const raw = s.pattern[weekday]
  const listed = (Array.isArray(raw) ? raw : [raw]).filter(isDailySubject)
  // 과목별 시작일이 아직 안 된 과목은 오늘 계획에서 뺀다(예: 이론 기본개념은 정해진 날부터)
  const planned = DAILY_SUBJECTS.filter((k) => listed.includes(k) && !(s.starts?.[k] && today < (s.starts[k] as string)))
  // 예전(v2) 요약에는 과목별 기록이 없다 — 그날 응시가 있으면 그날의 (하나뿐인) 과목을 한 것으로 본다
  const isDone = (k: DailySubject) => (s.last ? s.last[k]?.date === today : s.lastDate === today)
  const done = planned.filter(isDone).length
  const pending = planned.filter((k) => !isDone(k)).map((k) => s.next?.[k]?.title ?? DAILY_LABEL[k])
  const doneToday = s.lastDate === today
  const streak = s.lastDate === today || s.lastDate === yesterday ? s.run : 0
  return { planned: planned.length, done, pending, doneToday, streak, score: s.lastScore }
}

export function SubjectProgressPanel() {
  const [summaries, setSummaries] = useState<Summary[] | null>(null)
  const [daily, setDaily] = useState<DailySummary>(null)

  useEffect(() => {
    setSummaries(SUBJECTS.map((s) => readSummary(s.key)))
    setDaily(readDaily())
  }, [])

  if (!summaries || (summaries.every((s) => s === null) && daily === null)) return null

  const dailyState = daily ? dailyStatus(daily) : null

  return (
    <div className="flex w-52 shrink-0 select-none flex-col gap-4 font-mono">
      <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
        Today&apos;s Review
      </span>
      <div className="flex flex-col gap-3">
        {dailyState && (
          <a
            href={DAILY_HREF}
            className="group flex flex-col gap-1 border-l-2 border-border pl-3 transition-colors hover:border-accent"
          >
            <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
              매일 테스트
            </span>
            <span className="text-[0.7rem] tracking-wide text-muted-foreground">
              {dailyState.planned === 0 && !dailyState.doneToday ? (
                <span className="text-muted-foreground/70">오늘은 쉬는 날</span>
              ) : dailyState.pending.length === 0 ? (
                <>
                  오늘 완료 <span className="text-foreground">{dailyState.score}</span>점
                </>
              ) : (
                <>
                  오늘 <span className="text-foreground">{dailyState.done}</span>/{dailyState.planned} 완료
                </>
              )}
            </span>
            {dailyState.pending.length > 0 && (
              <span className="flex flex-wrap gap-x-2 text-[0.7rem] tracking-wide text-muted-foreground/70">
                {dailyState.pending.map((title) => (
                  <span key={title} className="whitespace-nowrap">
                    {title}
                  </span>
                ))}
              </span>
            )}
            <span className="text-[0.7rem] tracking-wide">
              {dailyState.streak > 0 ? (
                <>
                  연속 <span className="text-accent">{dailyState.streak}</span>일
                </>
              ) : (
                <span className="text-muted-foreground">연속 기록 없음</span>
              )}
            </span>
          </a>
        )}
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
