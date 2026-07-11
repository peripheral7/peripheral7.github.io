import { PostBoard } from "@/components/post-board"
import { cbr650fBoard } from "@/content/boards/cbr650f"

export default function CBR650FBoardPage() {
  return (
    <PostBoard
      title="CBR650F Journal"
      sections={cbr650fBoard}
    />
  )
}