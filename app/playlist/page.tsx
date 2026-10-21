import { posts } from "@/lib/posts"
import { SimplePostHeader } from "@/components/simple-post-header"

function PlaylistEmbed({ className }: { className?: string }) {
  return (
    <div className={`w-full max-w-[420px] overflow-hidden rounded-xl ${className ?? ""}`}>
      <iframe
        title="Spotify playlist embed"
        style={{ borderRadius: "12px", border: 0 }}
        src="https://open.spotify.com/embed/playlist/4RuCo76AS11MiS9cpbnEqP?utm_source=generator&theme=0&si=38fb8c4cc6f04b79"
        width="100%"
        height="352"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        allowFullScreen
      />
    </div>
  )
}

export default function SpotifyPlaylistPage() {
  const post = posts.find((p) => p.id === "05-playlist")

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [05-playlist] 기록을 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 py-10 md:px-10">
        <SimplePostHeader
          eyebrow={`${post.category} / Filed: ${post.date}`}
          title={post.title}
          tags={post.tags}
        />
        {/* 사진과 플레이어를 같은 격자 칸에 겹쳐 놓는다. 칸 높이 = max(사진 높이, 플레이어 352px + 여백) 이라
            폰처럼 사진이 낮아지는 화면에서도 플레이어가 잘리지 않고, 사진은 object-cover 로 늘어나 배경을 채운다. */}
        <div className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-lg border border-border bg-white shadow-scrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image ?? "/placeholder.svg"}
            alt={post.imageAlt ?? post.title}
            className="col-start-1 row-start-1 block h-full w-full object-cover"
          />
          <div className="col-start-1 row-start-1 flex items-center justify-center p-4 sm:p-6">
            <PlaylistEmbed className="shadow-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}