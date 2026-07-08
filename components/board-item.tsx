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

function Stamp({ category }: { category: Post["category"] }) {
  return (
    <span className="inline-block border border-accent/70 px-1.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.2em] text-accent">
      {category}
    </span>
  )
}

export function BoardItem({ post }: { post: Post }) {
  const hasImage = Boolean(post.image)

  return (
    <article
      className="scrap group relative mb-6 break-inside-avoid"
      style={{ ["--r" as string]: `${post.rotate}deg` }}
      tabIndex={0}
    >
      {/* every card is taped on top */}
      <Tape />

      <div className="bg-card p-3 pb-4 shadow-scrap ring-1 ring-black/5">
        {/* date + category */}
        <div className="flex items-center justify-between gap-2 px-0.5 pb-2">
          <time className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {post.date}
          </time>
          <Stamp category={post.category} />
        </div>

        {/* title */}
        <h3 className="text-balance px-0.5 pb-3 font-sans text-base font-bold leading-tight text-card-foreground">
          {post.title}
        </h3>

        {/* main image, or article highlight when there is no image */}
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
          <p className="border-t border-dashed border-border px-0.5 pt-3 text-sm leading-relaxed text-card-foreground/85">
            {post.body ?? post.meta}
          </p>
        )}
      </div>
    </article>
  )
}
