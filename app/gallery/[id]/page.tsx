import { GalleryClient } from "@/components/gallery-client"
import { HtmlReport } from "@/components/html-report"
import { PostBoard } from "@/components/post-board"
import { posts } from "@/lib/posts"
import { boardsByPostId } from "@/content/boards"
import Link from "next/link"

export function generateStaticParams() {
  return posts.map((post) => ({ id: post.id }))
}

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = posts.find((p) => p.id === id)

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [{id}] 기록을 찾을 수 없습니다.
      </div>
    )
  }

  const board = boardsByPostId[post.id]
  if (board) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <PostBoard title={post.title} eyebrow={`${post.category} / Filed: ${post.date}`} backHref="/" sections={board} />
      </main>
    )
  }

// 새로 추가된 분기: HTML 리포트를 DOM에 직접 삽입해 자연스럽게 렌더링 (iframe 미사용)
  if (post.reportFolder) {
  const src = `${post.reportFolder}dashboard.html`
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-10">
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent"
        >
          ← BACK TO BOARD
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {post.category} / Filed: {post.date}
          </span>
          <h1 className="font-sans text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            {post.title}
          </h1>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-border shadow-scrap">
          <HtmlReport src={src} />
        </div>
      </div>
    </div>
  )
}

  if (!post.imageFolder) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [{post.id}] imageFolder가 지정되지 않았습니다.
      </div>
    )
  }

  const config = {
    title: post.title,
    sidebar: post.title,
    eyebrow: `${post.category} / Filed: ${post.date}`,
    desc: "",
    folder: post.imageFolder,
  }

  return <GalleryClient config={config} />
}