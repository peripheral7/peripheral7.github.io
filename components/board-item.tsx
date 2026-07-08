import Image from "next/image"
import type { Post } from "@/lib/posts"

function Tape() {
  // a strip of masking tape holding the card to the board
  return (
    <span
      aria-hidden
      className="tape absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-2"
    />
  )
}

export function BoardItem({ post }: { post: Post }) {
  const hasImage = Boolean(post.image)
  const previewText = post.body ?? post.meta

  return (
    <article
      className="scrap group relative mb-6 break-inside-avoid"
      style={{ ["--r" as string]: `${post.rotate}deg` }}
      tabIndex={0}
    >
      {/* every card is taped on top */}
      <Tape />

      <div className="bg-card p-3 pb-4 shadow-scrap ring-1 ring-black/5">
        {/* media: image, or a fixed amount of text when there is no image —
            which one renders is decided per-post, dynamically, from post.image */}
        <div className="relative">
          {/* category — faint, floated top-right, overlaid on the media */}
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

        {/* title */}
        <h3 className="text-balance px-0.5 pb-1 pt-3 font-sans text-base font-bold leading-tight text-card-foreground">
          {post.title}
        </h3>

        {/* optional link-out action, e.g. interactive maps / reports */}
        {post.href && (
          <a
            href={post.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 inline-flex w-fit items-center gap-1 px-0.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-accent underline-offset-4 hover:underline"
          >
            {post.linkLabel ?? "Open"} ↗
          </a>
        )}

        {/* tags + date */}
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
    </article>
  )
}
