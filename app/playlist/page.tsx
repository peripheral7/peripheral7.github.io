function PlaylistEmbed({ className }: { className?: string }) {
  return (
    <div className={`w-full max-w-[420px] overflow-hidden rounded-xl ${className ?? ""}`}>
      <iframe
        title="Playlist embed"
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

export default function PlaylistPage() {
  // public/images/playlist/playlist_wallpaper.JPG
  const wallpaperSrc = "/images/playlist/playlist_wallpaper.JPG"

  return (
    <main className="min-h-screen bg-white text-foreground">
      <div className="mx-auto w-full px-0 py-10 sm:py-14 lg:py-20">
        <div className="relative w-full">
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
  )
}