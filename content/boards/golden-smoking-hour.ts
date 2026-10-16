const FOLDER = "/images/photography/GoldenSmokingHour/optimized/"

export const goldenSmokingHourMeta = {
  title: "Golden Smoking Hour",
  date: "2026.10.16",
}

// 세 장 모두 3:4 세로 사진 — 한 화면에 가로로 나란히 들어가도록 page.tsx 가 높이를 맞춥니다.
export const goldenSmokingHourPhotos = [
  { src: `${FOLDER}golden-01.jpg`, alt: "Golden Smoking Hour 1" },
  { src: `${FOLDER}golden-02.jpg`, alt: "Golden Smoking Hour 2" },
  { src: `${FOLDER}golden-03.jpg`, alt: "Golden Smoking Hour 3" },
]
