import Image from "next/image"
import type { Post } from "@/lib/posts"

function Tape() {
  // A strip of masking tape holding the card to the board.
  // Rendered INSIDE CardBody (not as a sibling in BoardItem), so the
  // tape is always structurally part of the card itself — it can never
  // end up detached, duplicated incorrectly, or missing when a new
  // card is generated.
  return (
    <span
      aria-hidden
      className="tape pointer-events-none absolute -top-4 left-1/2 z-20 h-7 w-28 -translate-x-1/2 -rotate-2"
    />
  )
}

function CardBody({ post }: { post: Post }) {
  const hasImage = Boolean(post.image)
  const previewText = post.body ?? post.meta

  return (
    <div className="relative bg-card p-3 pb-4 shadow-scrap ring-1 ring-black/5">
      <Tape />

      <div className="relative">
        <span className="pointer-events-none absolute right-1.5 top-1.5 z-10 rounded-sm bg-background/70 px-1.5 py-0.5 font-mono text-[0.58rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 backdrop-blur-[1px]">
          {post.category}
        </span>

        {hasImage ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
            <Image
              src={post.image ?? "/placeholder.svg"}
              alt={post.imageAlt ?? post.title}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover grayscale-[0.15] transition-all duration-500 group-hover:grayscale-0"
            />
          </div>
        ) : (
          <p className="line-clamp-6 border border-dashed border-border bg-muted/30 px-3 py-4 pt-6 text-sm leading-relaxed text-card-foreground/85">
            {previewText}
          </p>
        )}
      </div>

      <h3 className="text-balance px-0.5 pb-1 pt-3 font-sans text-base font-bold leading-tight text-card-foreground">
        {post.title}
      </h3>

      <div className="flex items-center justify-between gap-2 px-0.5 pt-2">
        <div className="flex flex-wrap items-center gap-1">
          {post.tags?.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
        <time className="shrink-0 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          {post.date}
        </time>
      </div>
    </div>
  )
}

export function BoardItem({ post }: { post: Post }) {
  const style = { ["--r" as string]: `${post.rotate}deg` }

  // `.scrap` (the hover transform) now lives on an INNER wrapper, not on
  // the outer <a>/<article>. The outer element is the actual multi-column
  // "break-inside-avoid" fragment and must never transform itself — that
  // combination is what caused the tape to get clipped/hidden on hover
  // on some cards. The inner wrapper carries the tape+card together as
  // one visual unit, so they always move as one on hover.
  const inner = (
    <div className="scrap relative pt-4" style={style}>
      <CardBody post={post} />
    </div>
  )

  if (post.href) {
    return (
      
        href={post.href}
        className="group relative mb-6 block break-inside-avoid overflow-visible"
        tabIndex={0}
      >
        {inner}
      </a>
    )
  }

  return (
    <article
      className="group relative mb-6 break-inside-avoid overflow-visible"
      tabIndex={0}
    >
      {inner}
    </article>
  )
}