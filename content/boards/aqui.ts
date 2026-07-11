import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/photography/AQUI/"

export const aquiBoard: BoardSection[] = [
  {
    id: "clockwork-collage",
    title: "Clockwork",
    note: "@aquicoffee",
    columns: 24,
    items: [
      // 1. Pink light window (맨 위 중앙)
      { id: "img-01", src: `${FOLDER}20230606-162125-16.jpg`, alt: "Pink light window", aspectRatio: "4 / 5", colStart: 9, colSpan: 8, rowStart: 1 },
      
      // 2. CDs (좌측 상단)
      { id: "img-02", src: `${FOLDER}20231006-MCG_2941.JPG`, alt: "CDs", aspectRatio: "4 / 5", colStart: 3, colSpan: 7, rowStart: 28 },
      
      // 3. Red leaves (우측 상단, CD보다 아래 배치)
      { id: "img-03", src: `${FOLDER}20221116-161023-15.jpg`, alt: "Red leaves", aspectRatio: "4 / 5", colStart: 14, colSpan: 7, rowStart: 42 },
      
      // 4. Origami crane (좌측 작게)
      { id: "img-04", src: `${FOLDER}20230126-131405-8.jpg`, alt: "Origami crane", aspectRatio: "4 / 5", colStart: 5, colSpan: 3, rowStart: 72 },
      
      // 5. 3 Cups (중앙 좌측)
      { id: "img-05", src: `${FOLDER}20231006_1.JPG`, alt: "3 Cups", aspectRatio: "3 / 2", colStart: 7, colSpan: 5, rowStart: 76 },
      
      // 6. Branch dish (오른쪽 중간)
      { id: "img-06", src: `${FOLDER}20221116-132130-07.jpg`, alt: "Branch dish", aspectRatio: "3 / 2", colStart: 13, colSpan: 6, rowStart: 85 },
      
      // 7. Cafe interior (중앙 넓게 배치)
      { id: "img-07", src: `${FOLDER}20221013-180609-006.jpg`, alt: "Cafe interior", aspectRatio: "3 / 2", colStart: 4, colSpan: 10, rowStart: 105 },
      
      // 8. Brown bag (우측 아래)
      { id: "img-08", src: `${FOLDER}20230615-000713-37.jpg`, alt: "Brown bag", aspectRatio: "3 / 2", colStart: 15, colSpan: 6, rowStart: 122 },
      
      // 9. Dark window reflection (중앙 어두운 창문)
      { id: "img-09", src: `${FOLDER}20231025_9.JPG`, alt: "Dark window reflection", aspectRatio: "4 / 5", colStart: 9, colSpan: 8, rowStart: 142 },
      
      // 10. Coffee gear (좌측 하단)
      { id: "img-10", src: `${FOLDER}20231025.JPG`, alt: "Coffee gear", aspectRatio: "3 / 2", colStart: 4, colSpan: 7, rowStart: 178 },
      
      // 11. Dark room plants (우측 하단)
      { id: "img-11", src: `${FOLDER}20231025_1.JPG`, alt: "Dark room plants", aspectRatio: "3 / 2", colStart: 13, colSpan: 8, rowStart: 188 },
      
      // 12. Snow street (중앙 큰 건물 외관)
      { id: "img-12", src: `${FOLDER}20230126-134049-13.jpg`, alt: "Snow street", aspectRatio: "3 / 2", colStart: 4, colSpan: 12, rowStart: 212 },
      
      // 13. BW street (오른쪽 아래 흑백)
      { id: "img-13", src: `${FOLDER}20221213-165734-84.jpg`, alt: "BW street", aspectRatio: "4 / 5", colStart: 14, colSpan: 7, rowStart: 232 },
      
      // 14. Blue sky text (좌측 작게)
      { id: "img-14", src: `${FOLDER}20230817-IMG_3902.HEIC.jpg`, alt: "Sky text", aspectRatio: "4 / 5", colStart: 8, colSpan: 4, rowStart: 265 },
      
      // 15. Abstract face (중앙 겹침 유도)
      { id: "img-15", src: `${FOLDER}20230817-IMG_3901.HEIC.jpg`, alt: "Abstract face", aspectRatio: "4 / 5", colStart: 12, colSpan: 4, rowStart: 278 },
      
      // 16. Dancing (좌측 인물)
      { id: "img-16", src: `${FOLDER}20230817-IMG_3899.HEIC.jpg`, alt: "Dancing", aspectRatio: "3 / 2", colStart: 6, colSpan: 6, rowStart: 308 },
      
      // 17. Hands up (우측 하늘과 손)
      { id: "img-17", src: `${FOLDER}20230817-IMG_3900.HEIC.jpg`, alt: "Hands up", aspectRatio: "4 / 5", colStart: 14, colSpan: 4, rowStart: 318 },
      
      // 18. Ivy building (좌측 하단 건물)
      { id: "img-18", src: `${FOLDER}20230620-195453-06.jpg`, alt: "Ivy building", aspectRatio: "4 / 5", colStart: 6, colSpan: 5, rowStart: 345 },
      
      // 19. Croissant (우측 빵과 커피)
      { id: "img-19", src: `${FOLDER}20230606-161610-14.jpg`, alt: "Croissant", aspectRatio: "3 / 2", colStart: 12, colSpan: 6, rowStart: 362 },
      
      // 20. Blue v60 (맨 아래 마지막 중앙)
      { id: "img-20", src: `${FOLDER}20221022-114619-005.jpg`, alt: "Blue v60", aspectRatio: "4 / 5", colStart: 9, colSpan: 6, rowStart: 388 }
    ]
  }
]