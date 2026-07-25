import { PostBoard } from "@/components/post-board"
import { cbr650fBoard, cbr650fMeta } from "@/content/boards/cbr650f"

export const metadata = {
  title: `${cbr650fMeta.title}`,
}

export default function Cbr650fBoardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PostBoard
        {...cbr650fMeta}
        backHref="/"
        sections={cbr650fBoard}
      />
    </main>
  )
}