function PlaylistEmbed({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full max-w-[420px] overflow-hidden rounded-xl ${className}`}>
      <iframe
        title="Spotify playlist embed"
        style={{ borderRadius: "12px", border: 0 }}
        src="https://open.spotify.com/embed/playlist/4RuCo76AS11MiS9cpbnEqP?utm_source=generator&theme=0&si=38fb8c4cc6f04b79"
        width="100%"
        height={352}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        allowFullScreen
      />
    </div>
  )
}

export default function SpotifyPlaylistPage() {
  // NOTE: 실제 배경 이미지 파일을 public/images/spotify/playlist_wallpaper.JPG
  // 경로에 넣어주세요. 파일명 대소문자까지 정확히 일치해야 합니다.
  const wallpaperSrc = "/images/spotify/playlist_wallpaper.JPG"

  return (
    <main className="min-h-screen bg-black">
      {/* 데스크톱(lg 이상): 배경이 화면 전체를 꽉 채우고(cover), 플레이리스트는 정중앙 */}
      <div className="relative hidden min-h-screen lg:block">
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${wallpaperSrc}')` }}
          aria-hidden
        />
        <div className="flex min-h-screen items-center justify-center p-6">
          <PlaylistEmbed className="shadow-2xl" />
        </div>
      </div>

      {/* 태블릿 / 모바일 (웹 반쪽 크기 포함): 이미지가 폭 전체를 채우는 일반 이미지로,
          그 아래에 플레이리스트가 이어지는 구조 */}
      <div className="lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wallpaperSrc} alt="Playlist wallpaper" className="block w-full" />
        <div className="p-5">
          <PlaylistEmbed />
        </div>
      </div>
    </main>
  )
}
