import { GoldenStage } from "@/components/golden-stage"
import { goldenSmokingHourMeta, goldenSmokingHourPhotos } from "@/content/boards/golden-smoking-hour"

export const metadata = {
  title: goldenSmokingHourMeta.title,
}

export default function GoldenSmokingHourPage() {
  return (
    <main className="bg-black">
      <GoldenStage title={goldenSmokingHourMeta.title} date={goldenSmokingHourMeta.date} photos={goldenSmokingHourPhotos} />
    </main>
  )
}
