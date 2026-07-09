import { GalleryClient } from "@/components/gallery-client"
import { posts } from "@/lib/posts"

export function generateStaticParams() {
  return posts.map((post) => ({ id: post.id }))
}

export default function GalleryPage({ params }: { params: { id: string } }) {
  const post = posts.find((p) => p.id === params.id)

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [{params.id}] 기록을 찾을 수 없습니다. JSON 데이터를 확인하세요.
      </div>
    )
  }

  // 카테고리에 따른 정확한 이미지 폴더 경로 생성 (대소문자/복수형 예외처리)
  let folderPath = `/images/${post.category.toLowerCase()}/${post.id}/`
  if (post.category.toUpperCase() === "MOTORCYCLE") {
    folderPath = `/images/motorcycles/${post.id === "cbr650f" ? "CBR650F" : post.id}/`
  }

  const config = {
    title: post.title,
    sidebar: post.title,
    eyebrow: `${post.category} / Filed: ${post.date}`,
    desc: post.description || "",
    folder: folderPath, // 예: "/images/photography/aqui/"
  }

  return <GalleryClient config={config} />
}