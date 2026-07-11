import { PostBoard } from "@/components/post-board"
import { cbr650fBoard } from "@/content/boards/cbr650f"

export const metadata = {
  title: "CBR650F (2016) — Garage Log",
}

export default function Cbr650fBoardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PostBoard
        title="CBR650F (2016)"
        eyebrow="MOTORCYCLE / Filed: 2026.04.05"
        intro="A running garage log — maintenance, small fixes, and whatever changed since last time."
        backHref="/"
        sections={cbr650fBoard}
      />
    </main>
  )
}