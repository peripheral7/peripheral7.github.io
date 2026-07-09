import { GalleryClient } from "@/components/gallery-client"

// 갤러리 메타데이터 레지스트리 (서버에서 관리)
const galleryRegistry: Record<string, any> = {
  aqui: {
    title: "Clockwork",
    sidebar: "Clockwork",
    eyebrow: "Photography / Filed: 2026.07.08",
    desc: "",
    folder: "/images/photography/aqui/",
  },
  cbr650f: {
    title: "CBR650F (2016)",
    sidebar: "CBR650F (2016)",
    eyebrow: "Garage Log · MOTO-2016",
    desc: "",
    folder: "/images/motorcycles/CBR650F/",
  },
}

// 빌드 시점에 정적 라우팅 생성
export function generateStaticParams() {
  return Object.keys(galleryRegistry).map((key) => ({
    id: key,
  }))
}

// 클라이언트 컴포넌트로 데이터 주입
export default function GalleryPage({ params }: { params: { id: string } }) {
  const id = params.id || "aqui"
  const config = galleryRegistry[id] || galleryRegistry.aqui

  return <GalleryClient config={config} />
}