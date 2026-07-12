import type { BoardSection } from "@/components/post-board"

const FOLDER = "/images/motorcycles/CBR650F/"
const f = (name: string) => `${FOLDER}${encodeURIComponent(name)}`

// aspectRatio 값은 scripts/measure-images.mjs로 실측한 실제 픽셀 크기입니다
// (content/boards/_manifests/cbr650f.json 참고). 더 이상 추측값이 아닙니다.
//
// 이 보드는 정사각형 격자 단위를 사용하므로, 사진이 차지하는 세로 칸 수는
// 아래 공식으로 정확히 계산됩니다:
//
//   세로 칸 수 = colSpan × (실제 height / 실제 width)
//
// 사진을 추가/이동할 때는 이 공식으로 다음 rowStart를 계산해서 넣으면
// 겹침 없이 정확하게 배치됩니다. (예: colSpan 8, 비율 3637/2433인 사진 →
// 8 × (2433/3637) = 8 × 0.669 ≈ 5.35 칸 차지)

export const cbr650fBoard: BoardSection[] = [
  {
    id: "touring-log",
    title: "CBR650F",
    note: "Garage log · 여수부터 삼척까지, 한 대의 오토바이로 남긴 기록",
    columns: 24,
    rows: 205,
    items: [
      // ── Cluster A: 여수 / 전주 ────────────────────────────────
      {
        id: "img-01",
        src: f("202602 (3).jpg"),
        alt: "여수",
        aspectRatio: "2304 / 1535",
        colStart: 2,
        colSpan: 6,
        rowStart: 12,
        caption: "여수",
        captionPlacement: "below",
      },
      {
        id: "img-02",
        src: f("202603 올림푸스35 (13).jpg"),
        alt: "전주",
        aspectRatio: "3089 / 2048",
        colStart: 9,
        colSpan: 7,
        rowStart: 2,
        caption: "전주",
        captionPlacement: "right",
      },
      {
        id: "img-03",
        src: f("202603 올림푸스35 (14).jpg"),
        alt: "202603-35 (14)",
        aspectRatio: "3089 / 2048",
        colStart: 9,
        colSpan: 6,
        rowStart: 10,
      },

      // ── Cluster B: 수원 권선 ──────────────────────────────────
      {
        id: "img-04",
        src: f("202603 올림푸스35 (8).jpg"),
        alt: "202603-35 (8)",
        aspectRatio: "2986 / 1980",
        colStart: 2,
        colSpan: 6,
        rowStart: 21,
      },
      {
        id: "img-05",
        src: f("202603 올림푸스35 (23).jpg"),
        alt: "수원 권선",
        aspectRatio: "3089 / 2048",
        colStart: 9,
        colSpan: 6,
        rowStart: 17,
        caption: "수원 권선",
        captionPlacement: "right",
      },

      // ── Hero: 실내 주차장 야간 샷 ─────────────────────────────
      {
        id: "img-06",
        src: f("202603 올림푸스35 (24).jpg"),
        alt: "202603-35 (24)",
        aspectRatio: "3089 / 2048",
        colStart: 3,
        colSpan: 18,
        rowStart: 28,
      },

      // ── Cluster C: 태백 / 영주 ────────────────────────────────
      {
        id: "img-07",
        src: f("202603 올림푸스35 (28).jpg"),
        alt: "태백",
        aspectRatio: "3089 / 2048",
        colStart: 2,
        colSpan: 9,
        rowStart: 43,
        caption: "태백",
        captionPlacement: "below",
      },
      {
        id: "img-08",
        src: f("202603 올림푸스35 (27).jpg"),
        alt: "영주",
        aspectRatio: "3089 / 2048",
        colStart: 12,
        colSpan: 6,
        rowStart: 43,
        caption: "영주",
        captionPlacement: "right",
      },

      // ── 태백 만항재: 실측 결과 세로로 매우 긴 사진(2195×3281) ──
      // 이전에 가로형으로 잘못 추측해 겹침이 발생했던 지점.
      // 실측 비율(h/w ≈ 1.5)을 반영해 폭을 좁히고 아래 여백을 충분히 확보.
      {
        id: "img-09",
        src: f("202604-05.JPEG"),
        alt: "태백 만항재",
        aspectRatio: "2195 / 3281",
        colStart: 4,
        colSpan: 7,
        rowStart: 54,
        caption: "태백 만항재",
        captionPlacement: "below",
      },

      // ── Hero: 눈 덮인 침엽수림 ────────────────────────────────
      {
        id: "img-10",
        src: f("202604-05 (14).JPG"),
        alt: "눈 덮인 숲",
        aspectRatio: "3637 / 2433",
        colStart: 2,
        colSpan: 18,
        rowStart: 69,
      },

      // ── 고립된 작은 사진 ──────────────────────────────────────
      {
        id: "img-11",
        src: f("202604-05 (8).JPG"),
        alt: "202604-05 (8)",
        aspectRatio: "3637 / 2433",
        colStart: 15,
        colSpan: 7,
        rowStart: 84,
      },

      // ── Cluster D: 수원 팔달 / 용인 수지 ──────────────────────
      {
        id: "img-12",
        src: f("202604-05 (1).JPEG"),
        alt: "수원 팔달",
        aspectRatio: "3637 / 2433",
        colStart: 2,
        colSpan: 8,
        rowStart: 84,
        caption: "수원 팔달",
        captionPlacement: "below",
      },
      {
        id: "img-13",
        src: f("202604-05 (9).JPG"),
        alt: "용인 수지",
        aspectRatio: "3637 / 2433",
        colStart: 11,
        colSpan: 8,
        rowStart: 92,
        caption: "용인 수지",
        captionPlacement: "right",
      },

      // ── 경희대도서관 앞 거리 샷 ───────────────────────────────
      {
        id: "img-14",
        src: f("202603_경희대도서관(2).jpg"),
        alt: "202603 경희대도서관",
        aspectRatio: "3000 / 2000",
        colStart: 5,
        colSpan: 9,
        rowStart: 100,
      },

      // ── Hero: 네온 카페 실내 ──────────────────────────────────
      {
        id: "img-15",
        src: f("202606 (17).JPG"),
        alt: "202606 (17)",
        aspectRatio: "3637 / 2433",
        colStart: 2,
        colSpan: 18,
        rowStart: 109,
      },

      // ── Cluster E: 세로로 긴 사진 두 장 (1613×2412, 2294×3430) ─
      {
        id: "img-16",
        src: f("202606 (18).JPEG"),
        alt: "202606 (18)",
        aspectRatio: "1613 / 2412",
        colStart: 3,
        colSpan: 8,
        rowStart: 124,
      },
      {
        id: "img-17",
        src: f("202606 (25).JPEG"),
        alt: "202606 (25)",
        aspectRatio: "2294 / 3430",
        colStart: 13,
        colSpan: 8,
        rowStart: 124,
      },

      // ── Hero: 산길 풍경 ───────────────────────────────────────
      {
        id: "img-18",
        src: f("202606 (14).JPG"),
        alt: "202606 (14)",
        aspectRatio: "3637 / 2433",
        colStart: 4,
        colSpan: 12,
        rowStart: 139,
      },

      // ── Cluster F: 태백(2) / 도로 ─────────────────────────────
      {
        id: "img-19",
        src: f("202606 (26).JPG"),
        alt: "태백",
        aspectRatio: "3637 / 2433",
        colStart: 17,
        colSpan: 6,
        rowStart: 150,
        caption: "태백",
        captionPlacement: "below",
      },
      {
        id: "img-20",
        src: f("202606 (29).JPG"),
        alt: "202606 (29)",
        aspectRatio: "3637 / 2433",
        colStart: 2,
        colSpan: 9,
        rowStart: 150,
      },

      // ── 동해 ─────────────────────────────────────────────────
      {
        id: "img-21",
        src: f("202606 (27).JPG"),
        alt: "동해",
        aspectRatio: "3637 / 2433",
        colStart: 12,
        colSpan: 11,
        rowStart: 159,
        caption: "동해",
        captionPlacement: "below",
      },

      // ── 마지막 클러스터: 교량/고가 사진들 ─────────────────────
      {
        id: "img-22",
        src: f("202602 (1).jpg"),
        alt: "202602 (1)",
        aspectRatio: "2304 / 1535",
        colStart: 2,
        colSpan: 8,
        rowStart: 172,
      },
      // 실측 결과 세로로 매우 긴 사진(863×1535, h/w≈1.78) — 폭을 좁게 배치
      {
        id: "img-23",
        src: f("202602 (2).JPEG"),
        alt: "202602 (2) JPEG",
        aspectRatio: "863 / 1535",
        colStart: 11,
        colSpan: 8,
        rowStart: 172,
      },
      {
        id: "img-24",
        src: f("202602 (2).jpg"),
        alt: "202602 (2)",
        aspectRatio: "2304 / 1535",
        colStart: 3,
        colSpan: 8,
        rowStart: 180,
      },
      {
        id: "img-25",
        src: f("202603 올림푸스35 (36).jpg"),
        alt: "삼척",
        aspectRatio: "3089 / 2048",
        colStart: 12,
        colSpan: 9,
        rowStart: 189,
        caption: "삼척",
        captionPlacement: "right",
      },
    ],
  },
]