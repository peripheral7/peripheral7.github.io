import { PostBoard } from "@/components/post-board"
import { aquiBoard } from "@/content/boards/aqui"

export const metadata = {
  title: "Clockwork — AQUI",
}

export default function AquiBoardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PostBoard
        title="Clockwork"
        eyebrow="PHOTOGRAPHY / Filed: 2026.07.08"
        intro="A roll of film shot over one year at AQUI — mornings, afternoons, whatever the light was doing."
        backHref="/"
        sections={aquiBoard}
      />
    </main>
  )
}