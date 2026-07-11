import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"

export const cbr650fBoard: BoardSection[] = [
  {
    id: "cbr650f-journal",
    title: "Honda CBR650F",
    note: "Riiiiiide or Die",
    columns: 24,
    rows: 165,
    items: [
      // 1. 달리는 바이크 (좌측 상단)
      { id: "img-01", src: `${FOLDER}202603 올림푸스35 (8).jpg`, alt: "Riding", aspectRatio: "3 / 2", colStart: 3, colSpan: 11, rowStart: 2, pin: "none" },
      
      // 2. 숲길 (우측 상단 겹침)
      { id: "img-02", src: `${FOLDER}202603 올림푸스35 (27).jpg`, alt: "Forest road", aspectRatio: "4 / 5", colStart: 13, colSpan: 9, rowStart: 12, pin: "none", z: 10 },
      
      // 3. 정차된 바이크 (좌측)
      { id: "img-03", src: `${FOLDER}202604-05.JPEG`, alt: "Parked bike", aspectRatio: "3 / 2", colStart: 4, colSpan: 8, rowStart: 26, pin: "none" },
      
      // 4. 붉은 꽃 (우측 중단)
      { id: "img-04", src: `${FOLDER}202604-05 (8).JPG`, alt: "Red flowers", aspectRatio: "4 / 5", colStart: 14, colSpan: 6, rowStart: 35, pin: "none" },
      
      // 5. 도로 풍경 (중앙 겹침)
      { id: "img-05", src: `${FOLDER}202602 (2).JPEG`, alt: "Road view", aspectRatio: "4 / 5", colStart: 7, colSpan: 7, rowStart: 45, pin: "none", z: 5 },
      
      // 6. 커피와 디저트 (우측)
      { id: "img-06", src: `${FOLDER}202604-05 (14).JPG`, alt: "Coffee break", aspectRatio: "3 / 2", colStart: 13, colSpan: 10, rowStart: 58, pin: "none" },
      
      // 7. 밤의 도서관 앞 바이크 (좌측 크게)
      { id: "img-07", src: `${FOLDER}202603_경희대도서관(2).jpg`, alt: "Night at library", aspectRatio: "3 / 2", colStart: 3, colSpan: 12, rowStart: 70, pin: "none" },
      
      // 8. 잎사귀 텍스처 (우측 작게)
      { id: "img-08", src: `${FOLDER}202606 (26).JPG`, alt: "Leaves", aspectRatio: "4 / 5", colStart: 16, colSpan: 5, rowStart: 75, pin: "none" },
      
      // 9. 교각 (중앙)
      { id: "img-09", src: `${FOLDER}202606 (27).JPG`, alt: "Bridge", aspectRatio: "3 / 2", colStart: 8, colSpan: 9, rowStart: 90, pin: "none" },
      
      // 10. 산길 흑백 (좌측)
      { id: "img-10", src: `${FOLDER}202606 (17).JPG`, alt: "Mountain road", aspectRatio: "4 / 5", colStart: 3, colSpan: 6, rowStart: 102, pin: "none" },
      
      // 11. 헬멧과 바이크 (우측)
      { id: "img-11", src: `${FOLDER}202603 올림푸스35 (28).jpg`, alt: "Helmet on bike", aspectRatio: "4 / 5", colStart: 14, colSpan: 8, rowStart: 108, pin: "none" },
      
      // 12. 공터 바이크 (좌측 하단)
      { id: "img-12", src: `${FOLDER}202606 (32).JPEG`, alt: "Bike parked", aspectRatio: "3 / 2", colStart: 4, colSpan: 10, rowStart: 122, pin: "none", z: 10 },
      
      // 13. 창밖 실루엣 (우측)
      { id: "img-13", src: `${FOLDER}202602 (3).jpg`, alt: "Window silhouette", aspectRatio: "4 / 5", colStart: 15, colSpan: 7, rowStart: 130, pin: "none" },
      
      // 14. 하천 풍경 (중앙)
      { id: "img-14", src: `${FOLDER}202606 (29).JPG`, alt: "River landscape", aspectRatio: "4 / 5", colStart: 9, colSpan: 6, rowStart: 142, pin: "none" },
      
      // 15. 라이딩 뒷모습 (마지막 장식)
      { id: "img-15", src: `${FOLDER}202606 (35).JPG`, alt: "Rider back view", aspectRatio: "4 / 5", colStart: 5, colSpan: 8, rowStart: 148, pin: "none", z: 5 }
    ],
  },
]