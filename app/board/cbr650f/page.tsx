import { PostBoard } from "@/components/post-board"
import { cbr650fBoard, cbr650fMeta } from "@/content/boards/cbr650f"

export const metadata = {
  title: `${cbr650fMeta.title}`,
}

export default function Cbr650fBoardPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PostBoard
        {...cbr650fMeta}
        sections={cbr650fBoard}
        reveal
        dark
      />
    </main>
  )
}