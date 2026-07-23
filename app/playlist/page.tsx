"use client"

import Link from "next/link"

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
  const wallpaperSrc = "/images/spotify/playlist_wallpaper.JPG"

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 고정 사이드바: GalleryClient와 동일한 틀 */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border p-6 md:flex">
        <div>
          <Link
            href="/"
            className="inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-accent"
          >
            ← BACK TO BOARD
          </Link>
          <nav className="mt-10 flex flex-col gap-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span>Research</span>
            <span>Photography</span>
            <span>Motorcycle</span>
          </nav>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역: 양옆 검은(배경) 여백은 max-w 컨테이너로 구현 */}
      <main className="flex-1 bg-background px-4 py-10 md:px-10">
        {/* 모바일용 뒤로가기 */}
        <Link
          href="/"
          className="mb-6 inline-block font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground md:hidden"
        >
          ← BACK TO BOARD
        </Link>

        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            PHOTOGRAPHY / Filed: 2026.07.19
          </span>
          <h1 className="mt-2 font-sans text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            Playlist
          </h1>

          <div className="relative mt-8 w-full overflow-hidden rounded-lg border border-border bg-white shadow-scrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={wallpaperSrc}
              alt="Playlist wallpaper"
              className="block w-full h-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <PlaylistEmbed className="shadow-2xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}