import Image from "next/image"
import type { Post } from "@/lib/posts"

function Pin({ kind }: { kind?: Post["pin"] }) {
  if (kind === "tape") {
    return (
      <span
        aria-hidden
        className="tape absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-2"
      />
    )
  }
  if (kind === "clip") {
    return (
      <span
        aria-hidden
        className="absolute -top-2 right-6 h-8 w-4 rounded-sm border-2 border-muted-foreground/60 bg-transparent"
      />
    )
  }
  // default: push pin
  return (
    <span aria-hidden className="absolute -top-2 left-1/2 -translate-x-1/2">
      <span className="block size-4 rounded-full bg-accent shadow-scrap ring-2 ring-accent/30" />
    </span>
  )
}

function Stamp({ category }: { category: Post["category"] }) {
  return (
    <span className="inline-block border border-accent/70 px-1.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-accent">
      {category}
    </span>
  )
}

export function BoardItem({ post }: { post: Post }) {
  return (
    <article
      className="scrap group relative mb-6 break-inside-avoid"
      style={{ ["--r" as string]: `${post.rotate}deg` }}
      tabIndex={0}
    >
      <Pin kind={post.pin} />

      {post.variant === "photo" && (
        <div className="bg-card p-2.5 pb-4 shadow-scrap ring-1 ring-black/5">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
            <Image
              src={post.image ?? "/placeholder.svg"}
              alt={post.imageAlt ?? post.title}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover grayscale-[0.15] transition-all duration-500 group-hover:grayscale-0"
            />
            <span className="absolute left-2 top-2">
              <Stamp category={post.category} />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 px-1 pt-3">
            <h3 className="font-sans text-sm font-bold leading-tight text-card-foreground">
              {post.title}
            </h3>
          </div>
          <div className="flex items-center justify-between px-1 pt-1">
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {post.meta}
            </p>
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {post.ref}
            </p>
          </div>
        </div>
      )}

      {post.variant === "map" && (
        <div className="bg-card p-2 shadow-scrap ring-1 ring-black/5">
          <div className="relative aspect-[5/4] w-full overflow-hidden">
            <Image
              src={post.image ?? "/placeholder.svg"}
              alt={post.imageAlt ?? post.title}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover mix-blend-multiply"
            />
            <span className="absolute right-2 top-2">
              <Stamp category={post.category} />
            </span>
          </div>
          <div className="flex items-center justify-between px-1 pt-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-card-foreground">
              {post.title}
            </h3>
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {post.ref}
            </span>
          </div>
        </div>
      )}

      {post.variant === "note" && (
        <div className="bg-card p-5 shadow-scrap ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <Stamp category={post.category} />
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {post.ref}
            </span>
          </div>
          <h3 className="font-sans text-base font-extrabold uppercase leading-tight tracking-tight text-card-foreground">
            {post.title}
          </h3>
          <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {post.meta}
          </p>
          {post.body && (
            <p className="mt-3 border-t border-dashed border-border pt-3 text-sm leading-relaxed text-card-foreground/85">
              {post.body}
            </p>
          )}
        </div>
      )}

      {post.variant === "interactive" && (
        <div className="bg-card p-5 shadow-scrap ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <Stamp category={post.category} />
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {post.ref}
            </span>
          </div>

          <div className="flex items-center gap-3 border border-dashed border-border bg-muted/40 px-3 py-2">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-6 shrink-0 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9h16.5M3.75 15h16.5M11.25 3.75c-2.25 3-2.25 13.5 0 16.5M12.75 3.75c2.25 3 2.25 13.5 0 16.5M4.5 4.5A9 9 0 1 1 4.5 19.5 9 9 0 0 1 4.5 4.5Z"
              />
            </svg>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              Interactive HTML
            </span>
          </div>

          <h3 className="mt-3 font-sans text-base font-extrabold uppercase leading-tight tracking-tight text-card-foreground">
            {post.title}
          </h3>
          <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {post.meta}
          </p>

          {post.href && (
            <a
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 border border-foreground px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {post.linkLabel ?? "Open"} ↗
            </a>
          )}
        </div>
      )}

      {post.variant === "clipping" && (
        <div className="bg-accent p-6 text-accent-foreground shadow-scrap">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-accent-foreground/80">
            {post.category}
          </p>
          <blockquote className="mt-3 text-balance font-sans text-xl font-bold leading-snug">
            {post.title}
          </blockquote>
          <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-wider text-accent-foreground/80">
            {post.meta}
          </p>
        </div>
      )}
    </article>
  )
}
