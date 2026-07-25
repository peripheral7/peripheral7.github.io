import { GalleryClient } from "@/components/gallery-client"
import { HtmlReport } from "@/components/html-report"
import { PostBoard } from "@/components/post-board"
import { SimplePostHeader } from "@/components/simple-post-header"
import { posts } from "@/lib/posts"
import { boardsByPostId } from "@/content/boards"
import { customReportsByPostId } from "@/content/custom-reports"

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

  const CustomReport = customReportsByPostId[post.id]
  if (CustomReport) {
    return <CustomReport />
  }

  if (post.reportPath) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-4 py-10 md:px-10">
          <SimplePostHeader
            eyebrow={`${post.category} / Filed: ${post.date}`}
            title={post.title}
            tags={post.tags}
          />
          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-lg border border-border shadow-scrap">
            <HtmlReport src={post.reportPath} />
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
    desc: post.description ?? "",
    folder: post.imageFolder,
    tags: post.tags,
  }

  return <GalleryClient config={config} />
}