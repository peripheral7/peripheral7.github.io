import { GalleryClient } from "@/components/gallery-client"
import { posts } from "@/lib/posts"

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