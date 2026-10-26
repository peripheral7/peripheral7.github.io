import { PostBoard } from "@/components/post-board"
import { aquiBoard, aquiMeta } from "@/content/boards/aqui"

export const metadata = {
  title: `${aquiMeta.title}`,
}

export default function AquiBoardPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PostBoard
        {...aquiMeta}
        sections={aquiBoard}
        reveal
        dark
      />
    </main>
  )
}