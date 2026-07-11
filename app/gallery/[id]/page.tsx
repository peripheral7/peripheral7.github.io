import { GalleryClient } from "@/components/gallery-client"
import { PostBoard } from "@/components/post-board"
import { posts } from "@/lib/posts"
import { boardsByPostId } from "@/content/boards"

export function generateStaticParams() {
  return posts.map((post) => ({ id: post.id }))
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = posts.find((p) => p.id === id)

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [{id}] 기록을 찾을 수 없습니다. JSON 데이터를 확인하세요.
      </div>
    )
  }

  // Board-layout override: if this post's id is registered in
  // boardsByPostId, render the pinned mood-board layout instead of the
  // default masonry gallery. Everything else about the post (title,
  // category, date) still comes from lib/posts.ts as usual.
  const board = boardsByPostId[post.id]
  if (board) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <PostBoard
          title={post.title}
          eyebrow={`${post.category} / Filed: ${post.date}`}
          backHref="/"
          sections={board}
        />
      </main>
    )
  }

  if (!post.imageFolder) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [{post.id}] imageFolder가 지정되지 않았습니다. content/posts/{post.id}.json에 imageFolder 필드를 추가하세요.
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