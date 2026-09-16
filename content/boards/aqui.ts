import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/photography/AQUI/optimized/"
export const aquiMeta = {
  title: "Clockwork",
  eyebrow: "PHOTOGRAPHY / Filed: 2026.07.08",
  intro: "@aquicoffee",
}

// rowStart는 실제 aspectRatio × colSpan으로 계산한 점유 높이 기준 자동 배치입니다.
// 원래 같은 높이에서 나란히 짝지어졌던 4개 그룹(02/03, 10/11, 16/17, 18/19)은
// 계단식으로 세로 오프셋을 줘서 약 70%만 겹치도록(가로 간격은 그대로) 어긋나게 했습니다.
// img-08↔07, img-13↔12는 원래 의도된 "모서리 겹침" 연출 그대로 유지했습니다.
// 04/05/06(종이학·커피잔·나뭇가지 그릇)만 예외적으로 실제 여백(가로 1유닛 간격)을 두고
// 세로도 계단식으로 크게 어긋나게 해, 서로 안 붙어 보이도록 따로 배치했습니다.
export const aquiBoard: BoardSection[] = [
  {
    id: "clockwork-collage",
    columns: 24,
    rows: 151,
    items: [
      // 1. Pink light window
      { id: "img-01", src: `${FOLDER}20230606-162125-16.jpg`, alt: "Pink light window", aspectRatio: "2 / 3", colStart: 8, colSpan: 10, rowStart: 2, pin: "none" },

      // 2. CDs — 그룹 anchor
      { id: "img-02", src: `${FOLDER}20231006-MCG_2941.jpg`, alt: "CDs", aspectRatio: "2 / 3", colStart: 3, colSpan: 9, rowStart: 19, pin: "none" },

      // 3. Red leaves — 02보다 계단식으로 아래로 어긋남 (70%만 겹침)
      { id: "img-03", src: `${FOLDER}20221116-161023-15.jpg`, alt: "Red leaves", aspectRatio: "2 / 3", colStart: 13, colSpan: 9, rowStart: 23, pin: "none" },

      // 4. Origami crane — 그룹 anchor. 05/06과 가로 1유닛씩 띄우고 셋 다 높이를 다르게 줌
      { id: "img-04", src: `${FOLDER}20230126-131405-8.jpg`, alt: "Origami crane", aspectRatio: "3635 / 5453", colStart: 4, colSpan: 3, rowStart: 38, pin: "none" },

      // 5. 3 Cups — 04와 가로 여백, 세로도 계단식으로 어긋남
      { id: "img-05", src: `${FOLDER}20231006_1.jpg`, alt: "3 Cups", aspectRatio: "3 / 2", colStart: 8, colSpan: 5, rowStart: 40, pin: "none" },

      // 6. Branch dish — 05와 가로 여백, 셋 중 가장 크고 가장 아래로 어긋남
      { id: "img-06", src: `${FOLDER}20221116-132130-07.jpg`, alt: "Branch dish", aspectRatio: "5333 / 4000", colStart: 14, colSpan: 8, rowStart: 41, pin: "none" },

      // 7. Cafe interior
      { id: "img-07", src: `${FOLDER}20221013-180609-006.jpg`, alt: "Cafe interior", aspectRatio: "3 / 2", colStart: 3, colSpan: 14, rowStart: 49, pin: "none" },

      // 8. Brown bag — 의도된 연출: img-07 하단 모서리에 살짝 겹침
      { id: "img-08", src: `${FOLDER}20230615-000713-37.jpg`, alt: "Brown bag", aspectRatio: "3 / 2", colStart: 14, colSpan: 7, rowStart: 55, pin: "none", z: 10 },

      // 9. Dark window reflection
      { id: "img-09", src: `${FOLDER}20231025_9.jpg`, alt: "Dark window reflection", aspectRatio: "2 / 3", colStart: 8, colSpan: 9, rowStart: 62, pin: "none" },

      // 10. Coffee gear — 그룹 anchor
      { id: "img-10", src: `${FOLDER}20231025.jpg`, alt: "Coffee gear", aspectRatio: "3 / 2", colStart: 4, colSpan: 8, rowStart: 78, pin: "none" },

      // 11. Dark room plants — 10보다 계단식으로 아래로 어긋남
      { id: "img-11", src: `${FOLDER}20231025_1.jpg`, alt: "Dark room plants", aspectRatio: "3 / 2", colStart: 13, colSpan: 9, rowStart: 79, pin: "none" },

      // 12. Snow street
      { id: "img-12", src: `${FOLDER}20230126-134049-13.jpg`, alt: "Snow street", aspectRatio: "3 / 2", colStart: 3, colSpan: 13, rowStart: 88, pin: "none" },

      // 13. BW street — 의도된 연출: img-12 하단 모서리에 살짝 겹침
      { id: "img-13", src: `${FOLDER}20221213-165734-84.jpg`, alt: "BW street", aspectRatio: "3 / 2", colStart: 15, colSpan: 8, rowStart: 93, pin: "none", z: 10 },

      // 14. Sky text
      { id: "img-14", src: `${FOLDER}20230817-IMG_3902.HEIC.jpg`, alt: "Sky text", aspectRatio: "3 / 4", colStart: 7, colSpan: 5, rowStart: 98, pin: "none" },

      // 15. Abstract face
      { id: "img-15", src: `${FOLDER}20230817-IMG_3901.HEIC.jpg`, alt: "Abstract face", aspectRatio: "3 / 4", colStart: 12, colSpan: 5, rowStart: 100, pin: "none" },

      // 16. Dancing — 그룹 anchor
      { id: "img-16", src: `${FOLDER}20230817-IMG_3899.HEIC.jpg`, alt: "Dancing", aspectRatio: "4 / 3", colStart: 6, colSpan: 8, rowStart: 109, pin: "none" },

      // 17. Hands up — 16보다 계단식으로 아래로 어긋남
      { id: "img-17", src: `${FOLDER}20230817-IMG_3900.HEIC.jpg`, alt: "Hands up", aspectRatio: "3 / 4", colStart: 15, colSpan: 5, rowStart: 111, pin: "none" },

      // 18. Ivy building — 그룹 anchor
      { id: "img-18", src: `${FOLDER}20230620-195453-06.jpg`, alt: "Ivy building", aspectRatio: "3121 / 4682", colStart: 5, colSpan: 7, rowStart: 120, pin: "none" },

      // 19. Croissant — 18보다 계단식으로 아래로 어긋남
      { id: "img-19", src: `${FOLDER}20230606-161610-14.jpg`, alt: "Croissant", aspectRatio: "3 / 2", colStart: 13, colSpan: 7, rowStart: 121, pin: "none" },

      // 20. Blue v60
      { id: "img-20", src: `${FOLDER}20221022-114619-005.jpg`, alt: "Blue v60", aspectRatio: "3879 / 5818", colStart: 8, colSpan: 9, rowStart: 133, pin: "none" }
    ],
  },
]