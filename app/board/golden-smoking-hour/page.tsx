import Image from "next/image"
import { goldenSmokingHourMeta, goldenSmokingHourPhotos } from "@/content/boards/golden-smoking-hour"

export const metadata = {
  title: goldenSmokingHourMeta.title,
}

// 3:4 세로 사진 3장을 한 화면에 가로로: 높이는 (화면 높이 - 여백)과 (화면 너비로 3장이 들어가는 높이) 중 작은 쪽.
const GAP = "clamp(0.75rem, 2.5vw, 2.5rem)"
const SIDE = "clamp(0.75rem, 5vw, 4rem)" // 좌우 여백 (넓은 창에서는 왼쪽 목차 자리도 확보)
const PHOTO_H = `min(calc(100svh - 7rem), calc((100vw - 2 * ${SIDE} - 2 * ${GAP}) / 3 * 4 / 3))`

export default function GoldenSmokingHourPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black pt-14 pb-6 text-white lg:pt-6" style={{ paddingInline: SIDE }}>
      <h1 className="sr-only">{goldenSmokingHourMeta.title}</h1>
      <div className="flex items-center justify-center" style={{ gap: GAP }}>
        {goldenSmokingHourPhotos.map((p) => (
          <div key={p.src} className="relative shrink-0 overflow-hidden" style={{ height: PHOTO_H, aspectRatio: "3 / 4" }}>
            <Image src={p.src} alt={p.alt} fill quality={80} sizes="(max-width: 1024px) 33vw, 40vh" className="object-cover" priority />
          </div>
        ))}
      </div>
    </main>
  )
}
