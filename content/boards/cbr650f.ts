import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"

// Filenames contain spaces, parentheses, and Korean characters — these
// must be percent-encoded or the URLs break on static hosting (GitHub
// Pages). This helper does that consistently for every item below.
const f = (name: string) => `${FOLDER}${encodeURIComponent(name)}`

// NOTE on aspectRatio: file-explorer thumbnails render everything as a
// square crop regardless of the photo's real shape, so the values below
// are an aesthetic best guess to create rhythm — not measured. If a
// specific photo looks stretched or squashed once live, just correct
// its aspectRatio string; nothing else needs to change.

export const cbr650fBoard: BoardSection[] = [
  {
    id: "garage-log",
    title: "CBR650F",
    note: "Garage log — Feb through June, 2026",
    columns: 24,
    rows: 234,
    items: [
      // ── Feb 2026 ──────────────────────────────────────────────
      { id: "img-01", src: f("202602(1).jpg"), alt: "202602 (1)", aspectRatio: "4 / 5", colStart: 2, colSpan: 10, rowStart: 2 },
      { id: "img-02", src: f("202602(2).JPEG"), alt: "202602 (2) JPEG", aspectRatio: "3 / 2", colStart: 13, colSpan: 10, rowStart: 2 },
      { id: "img-03", src: f("202602(2).jpg"), alt: "202602 (2)", aspectRatio: "1 / 1", colStart: 4, colSpan: 7, rowStart: 19 },
      { id: "img-04", src: f("202602(3).jpg"), alt: "202602 (3)", aspectRatio: "4 / 5", colStart: 13, colSpan: 8, rowStart: 19 },

      // ── Mar 2026 — 올림푸스35 (film camera roll) ─────────────
      { id: "img-05", src: f("202603 올림푸스35(8).jpg"), alt: "올림푸스35 (8)", aspectRatio: "3 / 2", colStart: 2, colSpan: 16, rowStart: 33 },
      { id: "img-06", src: f("202603 올림푸스35(13).jpg"), alt: "올림푸스35 (13)", aspectRatio: "4 / 5", colStart: 3, colSpan: 8, rowStart: 48 },
      { id: "img-07", src: f("202603 올림푸스35(14).jpg"), alt: "올림푸스35 (14)", aspectRatio: "3 / 4", colStart: 13, colSpan: 6, rowStart: 48 },
      { id: "img-08", src: f("202603 올림푸스35(23).jpg"), alt: "올림푸스35 (23)", aspectRatio: "1 / 1", colStart: 2, colSpan: 6, rowStart: 62 },
      { id: "img-09", src: f("202603 올림푸스35(24).jpg"), alt: "올림푸스35 (24)", aspectRatio: "4 / 5", colStart: 9, colSpan: 6, rowStart: 62 },
      { id: "img-10", src: f("202603 올림푸스35(25).jpg"), alt: "올림푸스35 (25)", aspectRatio: "3 / 2", colStart: 16, colSpan: 8, rowStart: 62 },
      { id: "img-11", src: f("202603 올림푸스35(27).jpg"), alt: "올림푸스35 (27)", aspectRatio: "16 / 9", colStart: 2, colSpan: 18, rowStart: 74 },
      { id: "img-12", src: f("202603 올림푸스35(28).jpg"), alt: "올림푸스35 (28)", aspectRatio: "4 / 5", colStart: 3, colSpan: 7, rowStart: 88 },
      { id: "img-13", src: f("202603 올림푸스35(36).jpg"), alt: "올림푸스35 (36)", aspectRatio: "3 / 2", colStart: 12, colSpan: 10, rowStart: 88 },
      { id: "img-14", src: f("202603_경희대도서관(2).jpg"), alt: "경희대도서관", aspectRatio: "3 / 4", colStart: 4, colSpan: 9, rowStart: 101 },

      // ── Apr–May 2026 ──────────────────────────────────────────
      { id: "img-15", src: f("202604-05(1).JPEG"), alt: "202604-05 (1)", aspectRatio: "4 / 5", colStart: 2, colSpan: 8, rowStart: 117 },
      { id: "img-16", src: f("202604-05(8).JPG"), alt: "202604-05 (8)", aspectRatio: "3 / 2", colStart: 13, colSpan: 9, rowStart: 117 },
      { id: "img-17", src: f("202604-05(9).JPG"), alt: "202604-05 (9)", aspectRatio: "1 / 1", colStart: 3, colSpan: 7, rowStart: 131 },
      { id: "img-18", src: f("202604-05(14).JPG"), alt: "202604-05 (14)", aspectRatio: "3 / 2", colStart: 12, colSpan: 11, rowStart: 131 },
      { id: "img-19", src: f("202604-05.JPEG"), alt: "202604-05", aspectRatio: "16 / 9", colStart: 2, colSpan: 18, rowStart: 142 },

      // ── Jun 2026 ──────────────────────────────────────────────
      { id: "img-20", src: f("202606(14).JPG"), alt: "202606 (14)", aspectRatio: "4 / 5", colStart: 2, colSpan: 8, rowStart: 156 },
      { id: "img-21", src: f("202606(17).JPG"), alt: "202606 (17)", aspectRatio: "3 / 2", colStart: 12, colSpan: 10, rowStart: 156 },
      { id: "img-22", src: f("202606(18).JPEG"), alt: "202606 (18)", aspectRatio: "1 / 1", colStart: 3, colSpan: 9, rowStart: 170 },
      // intentional overlap: (25) sits slightly lower and on top of (18)
      { id: "img-23", src: f("202606(25).JPEG"), alt: "202606 (25)", aspectRatio: "4 / 5", colStart: 13, colSpan: 6, rowStart: 175, z: 10 },
      // the file highlighted in the folder view — given hero prominence
      { id: "img-24", src: f("202606(26).JPG"), alt: "202606 (26)", aspectRatio: "3 / 4", colStart: 5, colSpan: 12, rowStart: 187 },
      { id: "img-25", src: f("202606(27).JPG"), alt: "202606 (27)", aspectRatio: "3 / 2", colStart: 2, colSpan: 10, rowStart: 207 },
      { id: "img-26", src: f("202606(29).JPG"), alt: "202606 (29)", aspectRatio: "16 / 9", colStart: 13, colSpan: 10, rowStart: 207 },
      { id: "img-27", src: f("202606(32).JPEG"), alt: "202606 (32)", aspectRatio: "4 / 5", colStart: 3, colSpan: 8, rowStart: 218 },
      // intentional overlap: (35) closes the board, slightly on top of (32)
      { id: "img-28", src: f("202606(35).JPG"), alt: "202606 (35)", aspectRatio: "3 / 2", colStart: 12, colSpan: 10, rowStart: 221, z: 5 },
    ],
  },
]