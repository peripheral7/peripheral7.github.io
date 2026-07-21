import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/photography/AQUI/optimized/"

// rowStart 값은 각 사진의 실제 aspectRatio × colSpan으로 계산한 점유 높이를 기준으로
// 자동 재배치한 값입니다 (겹침 없음). 단, img-08↔img-07 / img-13↔img-12는
// 원래 의도된 "모서리 살짝 겹침" 연출이라 일부러 살짝 겹치게 뒀습니다 (z로 위에 표시).
export const aquiBoard: BoardSection[] = [
  {
    id: "clockwork-collage",
    title: "AQUI",
    note: "@aquicoffee",
    columns: 24,
    rows: 140,
    items: [
      // 1. Pink light window — 실제 비율 2/3
      { id: "img-01", src: `${FOLDER}20230606-162125-16.jpg`, alt: "Pink light window", aspectRatio: "2 / 3", colStart: 8, colSpan: 10, rowStart: 2, pin: "none" },

      // 2. CDs — 실제 비율 2/3
      { id: "img-02", src: `${FOLDER}20231006-MCG_2941.jpg`, alt: "CDs", aspectRatio: "2 / 3", colStart: 3, colSpan: 9, rowStart: 19, pin: "none" },

      // 3. Red leaves — 실제 비율 2/3 (2번과 나란히, 컬럼 안 겹침)
      { id: "img-03", src: `${FOLDER}20221116-161023-15.jpg`, alt: "Red leaves", aspectRatio: "2 / 3", colStart: 13, colSpan: 9, rowStart: 19, pin: "none" },

      // 4. Origami crane — 실제 비율 3635/5453 (≈2/3)
      { id: "img-04", src: `${FOLDER}20230126-131405-8.jpg`, alt: "Origami crane", aspectRatio: "3635 / 5453", colStart: 5, colSpan: 3, rowStart: 35, pin: "none" },

      // 5. 3 Cups — 실제 비율 3/2
      { id: "img-05", src: `${FOLDER}20231006_1.jpg`, alt: "3 Cups", aspectRatio: "3 / 2", colStart: 8, colSpan: 6, rowStart: 35, pin: "none" },

      // 6. Branch dish — 실제 비율 5333/4000 (≈4/3)
      { id: "img-06", src: `${FOLDER}20221116-132130-07.jpg`, alt: "Branch dish", aspectRatio: "5333 / 4000", colStart: 14, colSpan: 7, rowStart: 35, pin: "none" },

      // 7. Cafe interior — 실제 비율 3/2
      { id: "img-07", src: `${FOLDER}20221013-180609-006.jpg`, alt: "Cafe interior", aspectRatio: "3 / 2", colStart: 3, colSpan: 14, rowStart: 42, pin: "none" },

      // 8. Brown bag — 의도된 연출: img-07 하단 모서리에 살짝 겹침 (z-index로 위에 표시)
      { id: "img-08", src: `${FOLDER}20230615-000713-37.jpg`, alt: "Brown bag", aspectRatio: "3 / 2", colStart: 14, colSpan: 7, rowStart: 48, pin: "none", z: 10 },

      // 9. Dark window reflection — 실제 비율 2/3
      { id: "img-09", src: `${FOLDER}20231025_9.jpg`, alt: "Dark window reflection", aspectRatio: "2 / 3", colStart: 8, colSpan: 9, rowStart: 55, pin: "none" },

      // 10. Coffee gear — 실제 비율 3/2
      { id: "img-10", src: `${FOLDER}20231025.jpg`, alt: "Coffee gear", aspectRatio: "3 / 2", colStart: 4, colSpan: 8, rowStart: 71, pin: "none" },

      // 11. Dark room plants — 실제 비율 3/2 (10번과 나란히, 컬럼 안 겹침)
      { id: "img-11", src: `${FOLDER}20231025_1.jpg`, alt: "Dark room plants", aspectRatio: "3 / 2", colStart: 13, colSpan: 9, rowStart: 71, pin: "none" },

      // 12. Snow street — 실제 비율 3/2
      { id: "img-12", src: `${FOLDER}20230126-134049-13.jpg`, alt: "Snow street", aspectRatio: "3 / 2", colStart: 3, colSpan: 13, rowStart: 79, pin: "none" },

      // 13. BW street — 의도된 연출: img-12 하단 모서리에 살짝 겹침 (z-index로 위에 표시)
      { id: "img-13", src: `${FOLDER}20221213-165734-84.jpg`, alt: "BW street", aspectRatio: "3 / 2", colStart: 15, colSpan: 8, rowStart: 84, pin: "none", z: 10 },

      // 14. Sky text — 실제 비율 3/4
      { id: "img-14", src: `${FOLDER}20230817-IMG_3902.HEIC.jpg`, alt: "Sky text", aspectRatio: "3 / 4", colStart: 7, colSpan: 5, rowStart: 90, pin: "none" },

      // 15. Abstract face — 실제 비율 3/4
      { id: "img-15", src: `${FOLDER}20230817-IMG_3901.HEIC.jpg`, alt: "Abstract face", aspectRatio: "3 / 4", colStart: 12, colSpan: 5, rowStart: 92, pin: "none" },

      // 16. Dancing — 실제 비율 4/3
      { id: "img-16", src: `${FOLDER}20230817-IMG_3899.HEIC.jpg`, alt: "Dancing", aspectRatio: "4 / 3", colStart: 6, colSpan: 8, rowStart: 101, pin: "none" },

      // 17. Hands up — 실제 비율 3/4 (16번과 나란히, 컬럼 안 겹침)
      { id: "img-17", src: `${FOLDER}20230817-IMG_3900.HEIC.jpg`, alt: "Hands up", aspectRatio: "3 / 4", colStart: 15, colSpan: 5, rowStart: 101, pin: "none" },

      // 18. Ivy building — 실제 비율 3121/4682 (≈2/3)
      { id: "img-18", src: `${FOLDER}20230620-195453-06.jpg`, alt: "Ivy building", aspectRatio: "3121 / 4682", colStart: 5, colSpan: 7, rowStart: 109, pin: "none" },

      // 19. Croissant — 실제 비율 3/2 (18번과 나란히, 컬럼 안 겹침)
      { id: "img-19", src: `${FOLDER}20230606-161610-14.jpg`, alt: "Croissant", aspectRatio: "3 / 2", colStart: 13, colSpan: 7, rowStart: 109, pin: "none" },

      // 20. Blue v60 — 실제 비율 3879/5818 (≈2/3)
      { id: "img-20", src: `${FOLDER}20221022-114619-005.jpg`, alt: "Blue v60", aspectRatio: "3879 / 5818", colStart: 8, colSpan: 9, rowStart: 121, pin: "none" }
    ],
  },
]