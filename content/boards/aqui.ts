import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/photography/AQUI/"

export const aquiBoard: BoardSection[] = [
  {
    id: "clockwork-collage",
    title: "Clockwork",
    note: "One roll of film, shot over a year at the same café.",
    columns: 24, // 정밀 가로 그리드
    rows: 160,   // 전체 보드의 세로 비율(길이)
    items: [
      // 1. Pink light window
      { id: "img-01", src: `${FOLDER}20230606-162125-16.jpg`, alt: "Pink light window", aspectRatio: "4 / 5", colStart: 8, colSpan: 10, rowStart: 2, pin: "tape" },
      // 2. CDs
      { id: "img-02", src: `${FOLDER}20231006-MCG_2941.JPG`, alt: "CDs", aspectRatio: "4 / 5", colStart: 3, colSpan: 9, rowStart: 14, pin: "none" },
      // 3. Red leaves
      { id: "img-03", src: `${FOLDER}20221116-161023-15.jpg`, alt: "Red leaves", aspectRatio: "4 / 5", colStart: 13, colSpan: 9, rowStart: 24, pin: "none" },
      // 4. Origami crane
      { id: "img-04", src: `${FOLDER}20230126-131405-8.jpg`, alt: "Origami crane", aspectRatio: "4 / 5", colStart: 5, colSpan: 3, rowStart: 36, pin: "none" },
      // 5. 3 Cups
      { id: "img-05", src: `${FOLDER}20231006_1.JPG`, alt: "3 Cups", aspectRatio: "3 / 2", colStart: 8, colSpan: 6, rowStart: 38, pin: "none" },
      // 6. Branch dish
      { id: "img-06", src: `${FOLDER}20221116-132130-07.jpg`, alt: "Branch dish", aspectRatio: "3 / 2", colStart: 14, colSpan: 7, rowStart: 41, pin: "none" },
      // 7. Cafe interior
      { id: "img-07", src: `${FOLDER}20221013-180609-006.jpg`, alt: "Cafe interior", aspectRatio: "3 / 2", colStart: 3, colSpan: 14, rowStart: 49, pin: "none" },
      // 8. Brown bag (Cafe interior 위에 살짝 겹침)
      { id: "img-08", src: `${FOLDER}20230615-000713-37.jpg`, alt: "Brown bag", aspectRatio: "3 / 2", colStart: 14, colSpan: 7, rowStart: 57, pin: "none", z: 10 },
      // 9. Dark window reflection
      { id: "img-09", src: `${FOLDER}20231025_9.JPG`, alt: "Dark window reflection", aspectRatio: "4 / 5", colStart: 8, colSpan: 9, rowStart: 65, pin: "none" },
      // 10. Coffee gear
      { id: "img-10", src: `${FOLDER}20231025.JPG`, alt: "Coffee gear", aspectRatio: "3 / 2", colStart: 4, colSpan: 8, rowStart: 78, pin: "none" },
      // 11. Dark room plants
      { id: "img-11", src: `${FOLDER}20231025_1.JPG`, alt: "Dark room plants", aspectRatio: "3 / 2", colStart: 13, colSpan: 9, rowStart: 82, pin: "none" },
      // 12. Snow street
      { id: "img-12", src: `${FOLDER}20230126-134049-13.jpg`, alt: "Snow street", aspectRatio: "3 / 2", colStart: 3, colSpan: 13, rowStart: 90, pin: "none" },
      // 13. BW street (Snow street과 모서리 겹침)
      { id: "img-13", src: `${FOLDER}20221213-165734-84.jpg`, alt: "BW street", aspectRatio: "3 / 2", colStart: 15, colSpan: 8, rowStart: 98, pin: "none", z: 10 },
      // 14. Sky text
      { id: "img-14", src: `${FOLDER}20230817-IMG_3902.HEIC.jpg`, alt: "Sky text", aspectRatio: "4 / 5", colStart: 7, colSpan: 5, rowStart: 107, pin: "none" },
      // 15. Abstract face
      { id: "img-15", src: `${FOLDER}20230817-IMG_3901.HEIC.jpg`, alt: "Abstract face", aspectRatio: "4 / 5", colStart: 12, colSpan: 5, rowStart: 111, pin: "none" },
      // 16. Dancing
      { id: "img-16", src: `${FOLDER}20230817-IMG_3899.HEIC.jpg`, alt: "Dancing", aspectRatio: "3 / 2", colStart: 6, colSpan: 8, rowStart: 120, pin: "none" },
      // 17. Hands up
      { id: "img-17", src: `${FOLDER}20230817-IMG_3900.HEIC.jpg`, alt: "Hands up", aspectRatio: "4 / 5", colStart: 15, colSpan: 5, rowStart: 124, pin: "none" },
      // 18. Ivy building
      { id: "img-18", src: `${FOLDER}20230620-195453-06.jpg`, alt: "Ivy building", aspectRatio: "4 / 5", colStart: 5, colSpan: 7, rowStart: 129, pin: "none" },
      // 19. Croissant
      { id: "img-19", src: `${FOLDER}20230606-161610-14.jpg`, alt: "Croissant", aspectRatio: "3 / 2", colStart: 13, colSpan: 7, rowStart: 135, pin: "none" },
      // 20. Blue v60
      { id: "img-20", src: `${FOLDER}20221022-114619-005.jpg`, alt: "Blue v60", aspectRatio: "4 / 5", colStart: 8, colSpan: 9, rowStart: 142, pin: "none" }
    ],
  },
]