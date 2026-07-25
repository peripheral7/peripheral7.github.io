import { PostBoard } from "@/components/post-board"
import { aquiBoard, aquiMeta } from "@/content/boards/aqui"

export const metadata = {
  title: `${aquiMeta.title}`,
}

export default function AquiBoardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PostBoard
        {...aquiMeta}
        backHref="/"
        sections={aquiBoard}
      />
    </main>
  )
}