// 글 페이지 맨 위 머리말. 사이트로 돌아가는 링크는 화면 위 상단바(폭 1440px 미만) 또는 왼쪽 플로팅 목차(그 이상)가 맡는다
// (components/site-topbar.tsx · site-sidebar.tsx).
export function SimplePostHeader({
  eyebrow,
  title,
  subtitle,
  tags,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  tags?: string[]
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24">
      <div className="mt-6 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </span>
        <h1 className="font-sans text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {subtitle}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 h-px w-full bg-border" />
    </div>
  )
}
