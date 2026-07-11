import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"

export const cbr650fBoard: BoardSection[] = [
  {
    id: "cbr650f-journal",
    // title과 note 속성을 삭제했습니다.
    columns: 24,
    rows: 165,
    items: [
      { id: "img-01", src: `${FOLDER}202603 올림푸스35 (8).jpg`, alt: "Riding", aspectRatio: "3 / 2", colStart: 3, colSpan: 11, rowStart: 2, pin: "none" },
      { id: "img-02", src: `${FOLDER}202603 올림푸스35 (27).jpg`, alt: "Forest road", aspectRatio: "4 / 5", colStart: 13, colSpan: 9, rowStart: 12, pin: "none", z: 10 },
      { id: "img-03", src: `${FOLDER}202604-05.JPEG`, alt: "Parked bike", aspectRatio: "3 / 2", colStart: 4, colSpan: 8, rowStart: 26, pin: "none" },
      { id: "img-04", src: `${FOLDER}202604-05 (8).JPG`, alt: "Red flowers", aspectRatio: "4 / 5", colStart: 14, colSpan: 6, rowStart: 35, pin: "none" },
      { id: "img-05", src: `${FOLDER}202602 (2).JPEG`, alt: "Road view", aspectRatio: "4 / 5", colStart: 7, colSpan: 7, rowStart: 45, pin: "none", z: 5 },
      { id: "img-06", src: `${FOLDER}202604-05 (14).JPG`, alt: "Coffee break", aspectRatio: "3 / 2", colStart: 13, colSpan: 10, rowStart: 58, pin: "none" },
      { id: "img-07", src: `${FOLDER}202603_경희대도서관(2).jpg`, alt: "Night at library", aspectRatio: "3 / 2", colStart: 3, colSpan: 12, rowStart: 70, pin: "none" },
      { id: "img-08", src: `${FOLDER}202606 (26).JPG`, alt: "Leaves", aspectRatio: "4 / 5", colStart: 16, colSpan: 5, rowStart: 75, pin: "none" },
      { id: "img-09", src: `${FOLDER}202606 (27).JPG`, alt: "Bridge", aspectRatio: "3 / 2", colStart: 8, colSpan: 9, rowStart: 90, pin: "none" },
      { id: "img-10", src: `${FOLDER}202606 (17).JPG`, alt: "Mountain road", aspectRatio: "4 / 5", colStart: 3, colSpan: 6, rowStart: 102, pin: "none" },
      { id: "img-11", src: `${FOLDER}202603 올림푸스35 (28).jpg`, alt: "Helmet on bike", aspectRatio: "4 / 5", colStart: 14, colSpan: 8, rowStart: 108, pin: "none" },
      { id: "img-12", src: `${FOLDER}202606 (32).JPEG`, alt: "Bike parked", aspectRatio: "3 / 2", colStart: 4, colSpan: 10, rowStart: 122, pin: "none", z: 10 },
      { id: "img-13", src: `${FOLDER}202602 (3).jpg`, alt: "Window silhouette", aspectRatio: "4 / 5", colStart: 15, colSpan: 7, rowStart: 130, pin: "none" },
      { id: "img-14", src: `${FOLDER}202606 (29).JPG`, alt: "River landscape", aspectRatio: "4 / 5", colStart: 9, colSpan: 6, rowStart: 142, pin: "none" },
      { id: "img-15", src: `${FOLDER}202606 (35).JPG`, alt: "Rider back view", aspectRatio: "4 / 5", colStart: 5, colSpan: 8, rowStart: 148, pin: "none", z: 5 }
    ],
  },
]