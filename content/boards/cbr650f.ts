import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"
const f = (name: string) => `${FOLDER}${encodeURIComponent(name)}`

// Figma export index → real file mapping (decoded from the sanitized
// filename pattern: {cleaned-name}-{dup-index}-{layer-index}.png):
//   202602-3-1-2      → 202602 (3).jpg
//   202603-35-13-1-3  → 202603 올림푸스35 (13).jpg
//   202603-35-14-1-4  → 202603 올림푸스35 (14).jpg
//   202603-35-8-1-5   → 202603 올림푸스35 (8).jpg
//   202603-35-23-1-6  → 202603 올림푸스35 (23).jpg
//   202603-35-24-1-7  → 202603 올림푸스35 (24).jpg
//   202603-35-28-1-8  → 202603 올림푸스35 (28).jpg
//   202603-35-27-1-9  → 202603 올림푸스35 (27).jpg
//   202604-05-1-10    → 202604-05.JPEG        (no parens — base file)
//   202604-05-14-1-11 → 202604-05 (14).JPG
//   202604-05-8-1-12  → 202604-05 (8).JPG
//   202604-05-1-1-13  → 202604-05 (1).JPEG
//   202604-05-9-1-14  → 202604-05 (9).JPG
//   202603_-2-1-15    → 202603_경희대도서관(2).jpg
//   202606-17-1-16    → 202606 (17).JPG
//   202606-18-1-17    → 202606 (18).JPEG
//   202606-25-1-18    → 202606 (25).JPEG
//   202606-14-1-19    → 202606 (14).JPG
//   202606-26-1-20    → 202606 (26).JPG
//   202606-29-1-21    → 202606 (29).JPG
//   202606-27-1-22    → 202606 (27).JPG
//   202602-1-1-34     → 202602 (1).jpg
//   202602-2-1-35     → 202602 (2).JPEG
//   202602-2-2-36     → 202602 (2).jpg
//   202603-35-36-1-37 → 202603 올림푸스35 (36).jpg

export const cbr650fBoard: BoardSection[] = [
  {
    id: "touring-log",
    title: "CBR650F",
    note: "Garage log · 여수부터 삼척까지, 한 대의 오토바이로 남긴 기록",
    columns: 24,
    rows: 300,
    items: [
      // ── Cluster A: 여수 / 전주 ────────────────────────────────
      { id: "img-01", src: f("202602 (3).jpg"), alt: "여수", aspectRatio: "4 / 5", colStart: 2, colSpan: 6, rowStart: 12, caption: "여수", captionPlacement: "below" },
      { id: "img-02", src: f("202603 올림푸스35 (13).jpg"), alt: "전주", aspectRatio: "3 / 4", colStart: 9, colSpan: 7, rowStart: 2, caption: "전주", captionPlacement: "right" },
      { id: "img-03", src: f("202603 올림푸스35 (14).jpg"), alt: "202603-35 (14)", aspectRatio: "4 / 3", colStart: 9, colSpan: 6, rowStart: 24 },

      // ── Cluster B: 수원 권선 ──────────────────────────────────
      { id: "img-04", src: f("202603 올림푸스35 (8).jpg"), alt: "202603-35 (8)", aspectRatio: "3 / 4", colStart: 2, colSpan: 6, rowStart: 34 },
      { id: "img-05", src: f("202603 올림푸스35 (23).jpg"), alt: "수원 권선", aspectRatio: "3 / 4", colStart: 9, colSpan: 6, rowStart: 34, caption: "수원 권선", captionPlacement: "right" },

      // ── Hero: 실내 주차장 야간 샷 ─────────────────────────────
      { id: "img-06", src: f("202603 올림푸스35 (24).jpg"), alt: "202603-35 (24)", aspectRatio: "3 / 2", colStart: 3, colSpan: 18, rowStart: 46 },

      // ── Cluster C: 태백 / 영주 ────────────────────────────────
      { id: "img-07", src: f("202603 올림푸스35 (28).jpg"), alt: "태백", aspectRatio: "3 / 2", colStart: 2, colSpan: 9, rowStart: 62, caption: "태백", captionPlacement: "below" },
      { id: "img-08", src: f("202603 올림푸스35 (27).jpg"), alt: "영주", aspectRatio: "3 / 4", colStart: 12, colSpan: 6, rowStart: 62, caption: "영주", captionPlacement: "right" },

      // ── 태백 만항재 ───────────────────────────────────────────
      { id: "img-09", src: f("202604-05.JPEG"), alt: "태백 만항재", aspectRatio: "3 / 4", colStart: 4, colSpan: 7, rowStart: 78, caption: "태백 만항재", captionPlacement: "below" },

      // ── Hero: 눈 덮인 침엽수림 ────────────────────────────────
      { id: "img-10", src: f("202604-05 (14).JPG"), alt: "눈 덮인 숲", aspectRatio: "3 / 4", colStart: 2, colSpan: 18, rowStart: 94 },

      // ── 고립된 작은 사진: 오토바이 + 풍력발전기 ───────────────
      { id: "img-11", src: f("202604-05 (8).JPG"), alt: "202604-05 (8)", aspectRatio: "3 / 2", colStart: 15, colSpan: 7, rowStart: 128 },

      // ── Cluster D: 수원 팔달 / 용인 수지 ──────────────────────
      { id: "img-12", src: f("202604-05 (1).JPEG"), alt: "수원 팔달", aspectRatio: "3 / 4", colStart: 2, colSpan: 8, rowStart: 142, caption: "수원 팔달", captionPlacement: "below" },
      { id: "img-13", src: f("202604-05 (9).JPG"), alt: "용인 수지", aspectRatio: "4 / 3", colStart: 11, colSpan: 8, rowStart: 152, caption: "용인 수지", captionPlacement: "right" },

      // ── 경희대도서관 앞 거리 샷 ───────────────────────────────
      { id: "img-14", src: f("202603_경희대도서관(2).jpg"), alt: "202603 경희대도서관", aspectRatio: "3 / 4", colStart: 5, colSpan: 9, rowStart: 165 },

      // ── Hero: 네온 카페 실내 ──────────────────────────────────
      { id: "img-15", src: f("202606 (17).JPG"), alt: "202606 (17)", aspectRatio: "3 / 2", colStart: 2, colSpan: 18, rowStart: 182 },

      // ── Cluster E: 작은 야간 사진 두 장 ───────────────────────
      { id: "img-16", src: f("202606 (18).JPEG"), alt: "202606 (18)", aspectRatio: "3 / 2", colStart: 3, colSpan: 8, rowStart: 200 },
      { id: "img-17", src: f("202606 (25).JPEG"), alt: "202606 (25)", aspectRatio: "3 / 2", colStart: 13, colSpan: 8, rowStart: 200 },

      // ── Hero: 산길 풍경 ───────────────────────────────────────
      { id: "img-18", src: f("202606 (14).JPG"), alt: "202606 (14)", aspectRatio: "3 / 4", colStart: 4, colSpan: 12, rowStart: 214 },

      // ── Cluster F: 태백(2) 텍스처 / 도로 ──────────────────────
      { id: "img-19", src: f("202606 (26).JPG"), alt: "태백", aspectRatio: "1 / 1", colStart: 17, colSpan: 6, rowStart: 232, caption: "태백", captionPlacement: "below" },
      { id: "img-20", src: f("202606 (29).JPG"), alt: "202606 (29)", aspectRatio: "3 / 4", colStart: 2, colSpan: 9, rowStart: 244 },

      // ── 동해 ─────────────────────────────────────────────────
      { id: "img-21", src: f("202606 (27).JPG"), alt: "동해", aspectRatio: "3 / 2", colStart: 12, colSpan: 11, rowStart: 258, caption: "동해", captionPlacement: "below" },

      // ── 마지막 클러스터: 교량/고가 사진들 ─────────────────────
      { id: "img-22", src: f("202602 (1).jpg"), alt: "202602 (1)", aspectRatio: "3 / 2", colStart: 2, colSpan: 8, rowStart: 276 },
      { id: "img-23", src: f("202602 (2).JPEG"), alt: "202602 (2) JPEG", aspectRatio: "3 / 2", colStart: 11, colSpan: 8, rowStart: 276 },
      { id: "img-24", src: f("202602 (2).jpg"), alt: "202602 (2)", aspectRatio: "3 / 2", colStart: 3, colSpan: 8, rowStart: 288 },
      { id: "img-25", src: f("202603 올림푸스35 (36).jpg"), alt: "삼척", aspectRatio: "3 / 2", colStart: 12, colSpan: 9, rowStart: 288, caption: "삼척", captionPlacement: "right" },
    ],
  },
]