import Link from "next/link"

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
    <>
      <div className="fixed top-0 left-0 z-50 w-full bg-background/70 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Link
            href="/"
            className="inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent"
          >
            ← BACK TO BOARD
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl pt-16">
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
    </>
  )
}