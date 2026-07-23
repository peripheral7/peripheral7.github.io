import Link from "next/link"

export function SimplePostHeader({
  eyebrow,
  title,
  tags,
}: {
  eyebrow: string
  title: string
  tags?: string[]
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/"
        className="inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent"
      >
        ← BACK TO BOARD
      </Link>

      <div className="mt-6 flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </span>
        <h1 className="font-sans text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
          {title}
        </h1>
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
    </div>
  )
}