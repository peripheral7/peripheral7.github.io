import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/photography/AQUI/"

export const aquiBoard: BoardSection[] = [
  {
    id: "clockwork-collage",
    title: "",
    columns: 12, // 12칸 그리드
    gap: 16,     // 이미지 간 여백
    items: [
      // 1. Dark window reflection (맨 위 중앙)
      { id: "img-1", src: `${FOLDER}20231025_9.JPG`, alt: "Dark window", aspectRatio: "4 / 5", colStart: 5, colSpan: 3, rowStart: 1 },
      
      // 2. Coffee gear (우측)
      { id: "img-2", src: `${FOLDER}20231025.JPG`, alt: "Coffee gear", aspectRatio: "3 / 2", colStart: 7, colSpan: 3, rowStart: 18 },
      
      // 3. Dark room plants (중앙 좌측)
      { id: "img-3", src: `${FOLDER}20231025_1.JPG`, alt: "Plants", aspectRatio: "3 / 2", colStart: 4, colSpan: 4, rowStart: 27 },
      
      // 4. Pink light person (우측 하단으로 뻗어남)
      { id: "img-4", src: `${FOLDER}20230606-162125-16.jpg`, alt: "Pink light", aspectRatio: "4 / 5", colStart: 7, colSpan: 3, rowStart: 45 },
      
      // 5. CDs (좌측)
      { id: "img-5", src: `${FOLDER}20231006-MCG_2941.JPG`, alt: "CDs", aspectRatio: "4 / 5", colStart: 3, colSpan: 3, rowStart: 55 },
      
      // 6. Red leaves (중앙 우측)
      { id: "img-6", src: `${FOLDER}20221116-161023-15.jpg`, alt: "Red leaves", aspectRatio: "4 / 5", colStart: 6, colSpan: 3, rowStart: 68 },
      
      // 7. Origami crane (좌측 작게)
      { id: "img-7", src: `${FOLDER}20230126-131405-8.jpg`, alt: "Origami crane", aspectRatio: "4 / 5", colStart: 2, colSpan: 2, rowStart: 85 },
      
      // 8. 3 Cups (중앙 좌측)
      { id: "img-8", src: `${FOLDER}20231006_1.JPG`, alt: "3 Cups", aspectRatio: "3 / 2", colStart: 4, colSpan: 3, rowStart: 92 },
      
      // 9. Brown bag (우측 작게)
      { id: "img-9", src: `${FOLDER}20230615-000713-37.jpg`, alt: "Brown bag", aspectRatio: "3 / 2", colStart: 8, colSpan: 2, rowStart: 98 },
      
      // 10. Interior wide/night (중앙 크게)
      { id: "img-10", src: `${FOLDER}20221013-180609-006.jpg`, alt: "Interior", aspectRatio: "4 / 5", colStart: 4, colSpan: 4, rowStart: 108 },
      
      // 11. White origami on branch (중앙 겹침 작게)
      { id: "img-11", src: `${FOLDER}20221116-132130-07.jpg`, alt: "Branch", aspectRatio: "3 / 2", colStart: 6, colSpan: 2, rowStart: 125 },
      
      // 12. Snow street (좌측 눈길)
      { id: "img-12", src: `${FOLDER}20230126-134049-13.jpg`, alt: "Snow street", aspectRatio: "4 / 5", colStart: 3, colSpan: 3, rowStart: 135 },
      
      // 13. BW street (우측 흑백)
      { id: "img-13", src: `${FOLDER}20221213-165734-84.jpg`, alt: "BW street", aspectRatio: "4 / 5", colStart: 7, colSpan: 3, rowStart: 145 },
      
      // 14. Blue sky text (좌측 텍스트)
      { id: "img-14", src: `${FOLDER}20230817-IMG_3902.HEIC.jpg`, alt: "Sky text", aspectRatio: "4 / 5", colStart: 4, colSpan: 3, rowStart: 165 },
      
      // 15. Abstract face (중앙)
      { id: "img-15", src: `${FOLDER}20230817-IMG_3901.HEIC.jpg`, alt: "Face", aspectRatio: "4 / 5", colStart: 6, colSpan: 3, rowStart: 172 },
      
      // 16. Dancing (좌측 댄스)
      { id: "img-16", src: `${FOLDER}20230817-IMG_3899.HEIC.jpg`, alt: "Dancing", aspectRatio: "3 / 2", colStart: 3, colSpan: 4, rowStart: 195 },
      
      // 17. Hands up swirl (우측 하늘)
      { id: "img-17", src: `${FOLDER}20230817-IMG_3900.HEIC.jpg`, alt: "Swirl", aspectRatio: "4 / 5", colStart: 8, colSpan: 3, rowStart: 205 },
      
      // 18. Ivy building (좌측 덩굴)
      { id: "img-18", src: `${FOLDER}20230620-195453-06.jpg`, alt: "Ivy building", aspectRatio: "4 / 5", colStart: 3, colSpan: 3, rowStart: 218 },
      
      // 19. Croissant (우측 크루아상)
      { id: "img-19", src: `${FOLDER}20230606-161610-14.jpg`, alt: "Croissant", aspectRatio: "3 / 2", colStart: 6, colSpan: 4, rowStart: 235 },
      
      // 20. Blue v60 (맨 아래 중앙)
      { id: "img-20", src: `${FOLDER}20221022-114619-005.jpg`, alt: "V60", aspectRatio: "4 / 5", colStart: 5, colSpan: 3, rowStart: 250 },
    ],
  },
]