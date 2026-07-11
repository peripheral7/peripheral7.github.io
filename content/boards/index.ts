import type { BoardSection } from "@/components/post-board"
import { aquiBoard } from "./aqui"

/**
 * Maps a post's `id` (== its JSON filename without extension) to a
 * mood-board layout. Any post id listed here opens the PostBoard layout
 * instead of the default GalleryClient masonry when its card is clicked.
 *
 * To give a new post the board layout:
 *   1. Create content/boards/<name>.ts exporting a BoardSection[]
 *   2. Import it above and add an entry here keyed by the post's id
 * Posts NOT listed here keep using GalleryClient — no other file changes.
 */
export const boardsByPostId: Record<string, BoardSection[]> = {
  "03_aqui": aquiBoard,
}