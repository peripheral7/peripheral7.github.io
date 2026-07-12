import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"
const f = (name: string) => `${FOLDER}${encodeURIComponent(name)}`

export const cbr650fBoard: BoardSection[] = [
  {
    id: "touring-log",
    title: "CBR650F",
    note: "Fast days",
    columns: 24,
    rows: 236,
    items: [
      // { id: "img-01", src: f("202602 (2).JPEG"), alt: "여수", aspectRatio: "863 / 1535", colStart: 9, colSpan: 10, rowStart: 3, caption: "여수", captionAlign: "left" },
      { id: "img-02", src: f("202602 (1).jpg"), alt: "전주", aspectRatio: "2304 / 1535", colStart: 8, colSpan: 12, rowStart: 2},
      { id: "img-03", src: f("202602 (2).jpg"), alt: "202602 (2)", aspectRatio: "2304 / 1535", colStart: 5, colSpan: 9, rowStart: 11 },
      { id: "img-04", src: f("202602 (3).jpg"), alt: "202602 (3)", aspectRatio: "2304 / 1535", colStart: 11, colSpan: 9, rowStart: 17.5 , caption: "전주", captionAlign: "right" },

      { id: "img-05", src: f("202603 올림푸스35 (8).jpg"), alt: "202603-35 (8)", aspectRatio: "2986 / 1980", colStart: 2, colSpan: 20, rowStart: 26 },
      { id: "img-06", src: f("202603 올림푸스35 (14).jpg"), alt: "202603-35 (14)", aspectRatio: "3089 / 2048", colStart: 4, colSpan: 9, rowStart: 41 },
      { id: "img-07", src: f("202603 올림푸스35 (13).jpg"), alt: "수원 권선", aspectRatio: "3089 / 2048", colStart: 14, colSpan: 7, rowStart: 46, caption: "수원 권선", captionAlign: "right" },
      
      // ── 태백 / 영주 / 태백 만항재 
      { id: "img-08", src: f("202603 올림푸스35 (23).jpg"), alt: "태백", aspectRatio: "3089 / 2048", colStart: 2, colSpan: 11, rowStart: 54, caption: "태백", captionAlign: "left" },
      { id: "img-09", src: f("202603 올림푸스35 (36).jpg"), alt: "영주", aspectRatio: "3089 / 2048", colStart: 14, colSpan: 9, rowStart: 58, caption: "영주", captionAlign: "right" },
      { id: "img-10", src: f("202603 올림푸스35 (24).jpg"), alt: "태백 만항재", aspectRatio: "3089 / 2048", colStart: 6, colSpan: 8, rowStart: 69, caption: "태백 만항재", captionAlign: "left" },

      // ── 눈 덮인 숲 + 풍력발전기 + 송전탑 ───────────────
      { id: "img-11", src: f("202603 올림푸스35 (27).jpg"), alt: "202603-35 (27)", aspectRatio: "3089 / 2048", colStart: 1, colSpan: 24, rowStart: 76 },
      { id: "img-13", src: f("202603 올림푸스35 (28).jpg"), alt: "202603-35 (28)", aspectRatio: "2048 / 3089", colStart: 10, colSpan: 10, rowStart: 94 },

      // ── 경희대도서관 / 네온카페 / 수원팔달 / 용인수지 ─────────
      { id: "img-14", src: f("202603_경희대도서관(2).jpg"), alt: "202603 경희대도서관", aspectRatio: "3000 / 2000", colStart: 4, colSpan: 9, rowStart: 112 },
      { id: "img-15", src: f("202604-05 (1).JPEG"), alt: "202604-05 (1)", aspectRatio: "3637 / 2433", colStart: 11, colSpan: 13, rowStart: 117 },
      { id: "img-16", src: f("202604-05 (8).JPG"), alt: "수원 팔달", aspectRatio: "2433 / 3637", colStart: 4, colSpan: 8, rowStart: 128, caption: "수원 팔달", captionAlign: "left" },
      { id: "img-17", src: f("202604-05 (14).JPG"), alt: "용인 수지", aspectRatio: "3637 / 2433", colStart: 14, colSpan: 9, rowStart: 136, caption: "용인 수지", captionAlign: "right" },

      // ── 이끼 낀 나뭇가지 텍스처 + CBR 거리 사진 ───────────────
      { id: "img-19", src: f("202604-05.JPEG"), alt: "202604-05", aspectRatio: "2195 / 3281", colStart: 7, colSpan: 10, rowStart: 144 },
      { id: "img-18", src: f("202604-05 (9).JPG"), alt: "202604-05 (9)", aspectRatio: "3637 / 2433", colStart: 16, colSpan: 6, rowStart: 156 },


      // ── 태백(2번째, 철도 건널목) / 강변 세로 풍경 ─────────────
      { id: "img-20", src: f("202606 (14).JPG"), alt: "태백", aspectRatio: "3637 / 2433", colStart: 1, colSpan: 13, rowStart: 167, caption: "태백", captionAlign: "left" },
      { id: "img-21", src: f("202606 (17).JPG"), alt: "202606 (17)", aspectRatio: "2433 / 3637", colStart: 14.5, colSpan: 7, rowStart: 162 },

      // ── 동해 / 폐역 실내 / 덩굴 텍스처 ─────────────────────────
      { id: "img-22", src: f("202606 (18).JPEG"), alt: "동해", aspectRatio: "1613 / 2412", colStart: 14.5, colSpan: 5, rowStart: 173, },
      { id: "img-23", src: f("202606 (25).JPEG"), alt: "202606 (25)", aspectRatio: "2294 / 3430", colStart: 3, colSpan: 11, rowStart: 182, caption: "동해", captionAlign: "left" },
      { id: "img-24", src: f("202606 (26).JPG"), alt: "202606 (26)", aspectRatio: "2433 / 3637", colStart: 14.5, colSpan: 8, rowStart: 189 },

      // ── 삼척 (교량) / 또다른 교량 사진 ─────────────────────────
      { id: "img-25", src: f("202606 (27).JPG"), alt: "삼척", aspectRatio: "3637 / 2433", colStart: 1, colSpan: 16, rowStart: 205, caption: "삼척", captionAlign: "right" },
      { id: "img-26", src: f("202606 (29).JPG"), alt: "202606 (29)", aspectRatio: "2433 / 3637", colStart: 17.5, colSpan: 7.15, rowStart: 205 },

      // ── 마지막: KORAIL 열차+바이크 / 거리 사진 ─────────────────
      { id: "img-27", src: f("202606 (32).JPEG"), alt: "202606 (32)", aspectRatio: "3635 / 2045", colStart: 13, colSpan: 11, rowStart: 218 },
      { id: "img-28", src: f("202606 (35).JPG"), alt: "202606 (35)", aspectRatio: "2433 / 3637", colStart: 5, colSpan: 10, rowStart: 223 },
    ],
  },
]