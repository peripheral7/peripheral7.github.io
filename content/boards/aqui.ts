import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/photography/AQUI/"

export const aquiBoard: BoardSection[] = [
  {
    id: "clockwork-collage",
    title: "Clockwork",
    note: "One roll of film, shot over a year at the same café.",
    columns: 24, // 정밀 배치를 위한 24칸 그리드
    rows: 275,   // 비율 기반 반응형 스크롤 길이를 위한 275열
    items: [
      {
        id: "img-01",
        src: `${FOLDER}20230606-162125-16.jpg`,
        alt: "Pink light window",
        aspectRatio: "4 / 5",
        colStart: 10, colSpan: 10, rowStart: 1
      },
      {
        id: "img-02",
        src: `${FOLDER}20231006-MCG_2941.JPG`,
        alt: "CDs",
        aspectRatio: "4 / 5",
        colStart: 4, colSpan: 8, rowStart: 18
      },
      {
        id: "img-03",
        src: `${FOLDER}20221116-161023-15.jpg`,
        alt: "Red leaves",
        aspectRatio: "4 / 5",
        colStart: 14, colSpan: 8, rowStart: 32
      },
      {
        id: "img-04",
        src: `${FOLDER}20230126-131405-8.jpg`,
        alt: "Origami crane",
        aspectRatio: "4 / 5",
        colStart: 5, colSpan: 3, rowStart: 51
      },
      {
        id: "img-05",
        src: `${FOLDER}20231006_1.JPG`,
        alt: "3 Cups",
        aspectRatio: "3 / 2",
        colStart: 7, colSpan: 5, rowStart: 54
      },
      {
        id: "img-06",
        src: `${FOLDER}20221116-132130-07.jpg`,
        alt: "Branch dish",
        aspectRatio: "3 / 2",
        colStart: 12, colSpan: 6, rowStart: 60
      },
      {
        id: "img-07",
        src: `${FOLDER}20221013-180609-006.jpg`,
        alt: "Cafe interior",
        aspectRatio: "3 / 2",
        colStart: 3, colSpan: 12, rowStart: 74
      },
      {
        id: "img-08",
        src: `${FOLDER}20230615-000713-37.jpg`,
        alt: "Brown bag",
        aspectRatio: "3 / 2",
        colStart: 14, colSpan: 7, rowStart: 88
      },
      {
        id: "img-09",
        src: `${FOLDER}20231025_9.JPG`,
        alt: "Dark window reflection",
        aspectRatio: "4 / 5",
        colStart: 8, colSpan: 8, rowStart: 105
      },
      {
        id: "img-10",
        src: `${FOLDER}20231025.JPG`,
        alt: "Coffee gear",
        aspectRatio: "3 / 2",
        colStart: 3, colSpan: 8, rowStart: 126
      },
      {
        id: "img-11",
        src: `${FOLDER}20231025_1.JPG`,
        alt: "Dark room plants",
        aspectRatio: "3 / 2",
        colStart: 12, colSpan: 9, rowStart: 136
      },
      {
        id: "img-12",
        src: `${FOLDER}20230126-134049-13.jpg`,
        alt: "Snow street",
        aspectRatio: "3 / 2",
        colStart: 4, colSpan: 13, rowStart: 150
      },
      {
        id: "img-13",
        src: `${FOLDER}20221213-165734-84.jpg`,
        alt: "BW street",
        aspectRatio: "3 / 2",
        colStart: 15, colSpan: 7, rowStart: 168
      },
      {
        id: "img-14",
        src: `${FOLDER}20230817-IMG_3902.HEIC.jpg`,
        alt: "Sky text",
        aspectRatio: "4 / 5",
        colStart: 7, colSpan: 4, rowStart: 185
      },
      {
        id: "img-15",
        src: `${FOLDER}20230817-IMG_3901.HEIC.jpg`,
        alt: "Abstract face",
        aspectRatio: "4 / 5",
        colStart: 12, colSpan: 4, rowStart: 195
      },
      {
        id: "img-16",
        src: `${FOLDER}20230817-IMG_3899.HEIC.jpg`,
        alt: "Dancing",
        aspectRatio: "3 / 2",
        colStart: 6, colSpan: 7, rowStart: 202
      },
      {
        id: "img-17",
        src: `${FOLDER}20230817-IMG_3900.HEIC.jpg`,
        alt: "Hands up",
        aspectRatio: "4 / 5",
        colStart: 14, colSpan: 4, rowStart: 212
      },
      {
        id: "img-18",
        src: `${FOLDER}20230620-195453-06.jpg`,
        alt: "Ivy building",
        aspectRatio: "4 / 5",
        colStart: 5, colSpan: 6, rowStart: 224
      },
      {
        id: "img-19",
        src: `${FOLDER}20230606-161610-14.jpg`,
        alt: "Croissant",
        aspectRatio: "3 / 2",
        colStart: 12, colSpan: 6, rowStart: 238
      },
      {
        id: "img-20",
        src: `${FOLDER}20221022-114619-005.jpg`,
        alt: "Blue v60",
        aspectRatio: "4 / 5",
        colStart: 9, colSpan: 5, rowStart: 252
      }
    ],
  },
]