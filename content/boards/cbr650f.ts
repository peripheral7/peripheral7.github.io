import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"
const f = (name: string) => `${FOLDER}${encodeURIComponent(name)}`

// 파일명-실사진 매칭은 100% 확정할 수 없습니다 (썸네일을 볼 수 없어
// Figma 내보내기 순서 기반 추정입니다). 사진이 잘못 연결된 곳이 있으면
// img-XX 번호만 알려주시면 src만 바로 교체합니다.

export const cbr650fBoard: BoardSection[] = [
  {
    id: "touring-log",
    title: "CBR650F",
    note: "Garage log · 여수부터 삼척까지",
    columns: 24,
    rows: 210,
    items: [
      { id: "img-01", src: f("202602 (3).jpg"), alt: "여수", aspectRatio: "4 / 5", colStart: 2, colSpan: 7, rowStart: 8, caption: "여수", captionPlacement: "below" },
      { id: "img-02", src: f("202603 올림푸스35 (13).jpg"), alt: "전주", aspectRatio: "3 / 2", colStart: 11, colSpan: 12, rowStart: 2, caption: "전주", captionPlacement: "right" },
      { id: "img-03", src: f("202603 올림푸스35 (14).jpg"), alt: "202603-35 (14)", aspectRatio: "4 / 5", colStart: 11, colSpan: 7, rowStart: 12 },
      { id: "img-04", src: f("202603 올림푸스35 (8).jpg"), alt: "202603-35 (8)", aspectRatio: "3 / 4", colStart: 19, colSpan: 5, rowStart: 20 },
      { id: "img-05", src: f("202603 올림푸스35 (23).jpg"), alt: "202603-35 (23)", aspectRatio: "3 / 2", colStart: 2, colSpan: 8, rowStart: 24 },
      { id: "img-06", src: f("202603 올림푸스35 (24).jpg"), alt: "수원 권선", aspectRatio: "3 / 4", colStart: 12, colSpan: 6, rowStart: 24, caption: "수원 권선", captionPlacement: "right" },
      { id: "img-07", src: f("202603 올림푸스35 (28).jpg"), alt: "202603-35 (28)", aspectRatio: "16 / 9", colStart: 3, colSpan: 19, rowStart: 34 },
      { id: "img-08", src: f("202603 올림푸스35 (27).jpg"), alt: "태백", aspectRatio: "3 / 2", colStart: 2, colSpan: 9, rowStart: 48, caption: "태백", captionPlacement: "below" },
      { id: "img-09", src: f("202604-05.JPEG"), alt: "영주", aspectRatio: "3 / 2", colStart: 13, colSpan: 9, rowStart: 48, caption: "영주", captionPlacement: "below" },
      { id: "img-10", src: f("202604-05 (14).JPG"), alt: "태백 만항재", aspectRatio: "4 / 3", colStart: 4, colSpan: 8, rowStart: 58, caption: "태백 만항재", captionPlacement: "below" },
      { id: "img-11", src: f("202604-05 (8).JPG"), alt: "202604-05 (8)", aspectRatio: "3 / 4", colStart: 5, colSpan: 14, rowStart: 68 },
      { id: "img-12", src: f("202604-05 (1).JPEG"), alt: "202604-05 (1)", aspectRatio: "3 / 4", colStart: 17, colSpan: 6, rowStart: 90 },
      { id: "img-13", src: f("202604-05 (9).JPG"), alt: "수원 팔달", aspectRatio: "3 / 4", colStart: 2, colSpan: 8, rowStart: 100, caption: "수원 팔달", captionPlacement: "above" },
      { id: "img-14", src: f("202603_경희대도서관(2).jpg"), alt: "용인 수지", aspectRatio: "4 / 3", colStart: 12, colSpan: 8, rowStart: 100, caption: "용인 수지", captionPlacement: "above" },
      { id: "img-15", src: f("202606 (17).JPG"), alt: "202606 (17)", aspectRatio: "3 / 4", colStart: 8, colSpan: 8, rowStart: 112 },
      { id: "img-16", src: f("202606 (18).JPEG"), alt: "202606 (18)", aspectRatio: "16 / 9", colStart: 3, colSpan: 18, rowStart: 126 },
      { id: "img-17", src: f("202606 (25).JPEG"), alt: "202606 (25)", aspectRatio: "3 / 4", colStart: 2, colSpan: 7, rowStart: 139 },
      { id: "img-18", src: f("202606 (14).JPG"), alt: "202606 (14)", aspectRatio: "3 / 2", colStart: 11, colSpan: 10, rowStart: 139 },
      { id: "img-19", src: f("202606 (26).JPG"), alt: "202606 (26)", aspectRatio: "3 / 4", colStart: 5, colSpan: 12, rowStart: 151 },
      { id: "img-20", src: f("202606 (29).JPG"), alt: "202606 (29)", aspectRatio: "3 / 2", colStart: 2, colSpan: 12, rowStart: 168 },
      { id: "img-21", src: f("202606 (27).JPG"), alt: "태백", aspectRatio: "3 / 4", colStart: 15, colSpan: 7, rowStart: 168, caption: "태백", captionPlacement: "below" },
      { id: "img-22", src: f("202602 (1).jpg"), alt: "202602 (1)", aspectRatio: "3 / 4", colStart: 3, colSpan: 10, rowStart: 180 },
      { id: "img-23", src: f("202602 (2).JPEG"), alt: "동해", aspectRatio: "3 / 4", colStart: 14, colSpan: 8, rowStart: 180, caption: "동해", captionPlacement: "below" },
      { id: "img-24", src: f("202602 (2).jpg"), alt: "202602 (2)", aspectRatio: "3 / 4", colStart: 3, colSpan: 8, rowStart: 196 },
      { id: "img-25", src: f("202603 올림푸스35 (36).jpg"), alt: "삼척", aspectRatio: "3 / 4", colStart: 12, colSpan: 9, rowStart: 196, caption: "삼척", captionPlacement: "below" },
    ],
  },
]