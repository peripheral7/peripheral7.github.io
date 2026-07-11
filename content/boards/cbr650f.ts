import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"

// Filenames contain spaces, parentheses, and Korean characters — these
// must be percent-encoded or the URLs break on static hosting (GitHub
// Pages). This helper does that consistently for every item below.
const f = (name: string) => `${FOLDER}${encodeURIComponent(name)}`

// Row units and column units are the same physical size in this layout
// (a photo's height in "rows" = colSpan × its height/width ratio), so
// when eyeballing spacing: a wider item at the same aspect ratio takes
// up proportionally more vertical room too — not just horizontal.

export const cbr650fBoard: BoardSection[] = [
  {
    id: "garage-log",
    title: "CBR650F",
    note: "Garage log — Feb through June, 2026",
    columns: 24,
    rows: 246,
    items: [
      // ── Feb 2026 ──────────────────────────────────────────────
      { id: "img-01", src: f("202602 (1).jpg"), alt: "202602 (1)", aspectRatio: "4 / 5", colStart: 2, colSpan: 10, rowStart: 2 },
      { id: "img-02", src: f("202602 (2).JPEG"), alt: "202602 (2) JPEG", aspectRatio: "3 / 2", colStart: 13, colSpan: 10, rowStart: 2 },
      { id: "img-03", src: f("202602 (2).jpg"), alt: "202602 (2)", aspectRatio: "1 / 1", colStart: 4, colSpan: 7, rowStart: 19 },
      { id: "img-04", src: f("202602 (3).jpg"), alt: "202602 (3)", aspectRatio: "4 / 5", colStart: 13, colSpan: 8, rowStart: 19 },

      // ── Mar 2026 — 올림푸스35 (film camera roll) ─────────────
      { id: "img-05", src: f("202603 올림푸스35 (8).jpg"), alt: "올림푸스35 (8)", aspectRatio: "3 / 2", colStart: 2, colSpan: 16, rowStart: 33 },
      { id: "img-06", src: f("202603 올림푸스35 (13).jpg"), alt: "올림푸스35 (13)", aspectRatio: "4 / 5", colStart: 3, colSpan: 8, rowStart: 48 },
      { id: "img-07", src: f("202603 올림푸스35 (14).jpg"), alt: "올림푸스35 (14)", aspectRatio: "3 / 4", colStart: 13, colSpan: 6, rowStart: 48 },
      { id: "img-08", src: f("202603 올림푸스35 (23).jpg"), alt: "올림푸스35 (23)", aspectRatio: "1 / 1", colStart: 2, colSpan: 6, rowStart: 62 },
      { id: "img-09", src: f("202603 올림푸스35 (24).jpg"), alt: "올림푸스35 (24)", aspectRatio: "4 / 5", colStart: 9, colSpan: 6, rowStart: 62 },
      { id: "img-10", src: f("202603 올림푸스35 (25).jpg"), alt: "올림푸스35 (25)", aspectRatio: "3 / 2", colStart: 16, colSpan: 8, rowStart: 62 },
      { id: "img-11", src: f("202603 올림푸스35 (27).jpg"), alt: "올림푸스35 (27)", aspectRatio: "16 / 9", colStart: 2, colSpan: 18, rowStart: 74 },
      { id: "img-12", src: f("202603 올림푸스35 (28).jpg"), alt: "올림푸스35 (28)", aspectRatio: "4 / 5", colStart: 3, colSpan: 7, rowStart: 88 },
      { id: "img-13", src: f("202603 올림푸스35 (36).jpg"), alt: "올림푸스35 (36)", aspectRatio: "3 / 2", colStart: 12, colSpan: 10, rowStart: 88 },
      { id: "img-14", src: f("202603_경희대도서관(2).jpg"), alt: "경희대도서관", aspectRatio: "3 / 4", colStart: 4, colSpan: 9, rowStart: 101 },

      // ── Apr–May 2026 ──────────────────────────────────────────
      { id: "img-15", src: f("202604-05 (1).JPEG"), alt: "202604-05 (1)", aspectRatio: "4 / 5", colStart: 2, colSpan: 8, rowStart: 117 },
      { id: "img-16", src: f("202604-05 (8).JPG"), alt: "202604-05 (8)", aspectRatio: "3 / 2", colStart: 13, colSpan: 9, rowStart: 117 },
      { id: "img-17", src: f("202604-05 (9).JPG"), alt: "202604-05 (9)", aspectRatio: "1 / 1", colStart: 3, colSpan: 7, rowStart: 131 },
      { id: "img-18", src: f("202604-05 (14).JPG"), alt: "202604-05 (14)", aspectRatio: "3 / 2", colStart: 12, colSpan: 11, rowStart: 131 },

      // 이전에 16:9 가로 + 폭 18칸으로 잘못 지정해 실제 렌더 높이가
      // 예상보다 커지면서 바로 아래 두 사진이 겹쳐 올라갔던 항목.
      // 세로 사진(4:5)으로 정정 + 폭을 줄이고, 아래 여백을 넉넉히 늘림.
      { id: "img-19", src: f("202604-05.JPEG"), alt: "202604-05", aspectRatio: "4 / 5", colStart: 7, colSpan: 10, rowStart: 143 },

      // ── Jun 2026 ──────────────────────────────────────────────
      { id: "img-20", src: f("202606 (14).JPG"), alt: "202606 (14)", aspectRatio: "4 / 5", colStart: 2, colSpan: 8, rowStart: 161 },
      { id: "img-21", src: f("202606 (17).JPG"), alt: "202606 (17)", aspectRatio: "3 / 2", colStart: 12, colSpan: 10, rowStart: 161 },
      { id: "img-22", src: f("202606 (18).JPEG"), alt: "202606 (18)", aspectRatio: "1 / 1", colStart: 3, colSpan: 9, rowStart: 175 },
      // 의도적 겹침: (25)가 (18) 위로 살짝 걸쳐 올라오도록 z를 높게 설정
      { id: "img-23", src: f("202606 (25).JPEG"), alt: "202606 (25)", aspectRatio: "4 / 5", colStart: 9, colSpan: 6, rowStart: 181, z: 10 },
      // 폴더 화면에서 선택 표시되어 있던 파일 — 히어로급으로 크게 배치
      { id: "img-24", src: f("202606 (26).JPG"), alt: "202606 (26)", aspectRatio: "3 / 4", colStart: 5, colSpan: 13, rowStart: 194 },
      { id: "img-25", src: f("202606 (27).JPG"), alt: "202606 (27)", aspectRatio: "3 / 2", colStart: 2, colSpan: 10, rowStart: 216 },
      { id: "img-26", src: f("202606 (29).JPG"), alt: "202606 (29)", aspectRatio: "16 / 9", colStart: 13, colSpan: 10, rowStart: 216 },
      { id: "img-27", src: f("202606 (32).JPEG"), alt: "202606 (32)", aspectRatio: "4 / 5", colStart: 3, colSpan: 8, rowStart: 227 },
      // 의도적 겹침: (35)가 (32) 위로 살짝 걸쳐 올라오도록 z를 높게 설정
      { id: "img-28", src: f("202606 (35).JPG"), alt: "202606 (35)", aspectRatio: "3 / 2", colStart: 9, colSpan: 9, rowStart: 232, z: 5 },
    ],
  },
]