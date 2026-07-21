// scripts/build-gallery.mjs
//
// AQUI 작업 때 했던 두 단계(① 실제 비율 측정 + 리사이즈/재압축 최적화,
// ② 겹치지 않는 자동 배치)를 하나로 합친 범용 스크립트입니다.
// 새 갤러리를 만들 때마다 이 스크립트 한 번이면 content/boards/<slug>.ts가
// 완성된 상태로 나옵니다 — 저한테 다시 안 물어봐도 됩니다.
//
// ------------------------------------------------------------------
// 준비 (최초 1회):
//   pnpm add -D sharp
//
// 사용법:
//   node scripts/build-gallery.mjs \
//     --slug cbr650f-2016 \
//     --source public/images/motorcycles/CBR650F \
//     --title "CBR650F (2016)" \
//     --mode sequential
//
//   node scripts/build-gallery.mjs \
//     --slug some-new-gallery \
//     --source public/images/photography/some-new-gallery \
//     --title "Some New Gallery" \
//     --mode collage
//
// 옵션:
//   --slug     필수. content/boards/<slug>.ts 파일명이자 board id로 씀
//   --source   필수. public/ 기준 원본 사진이 있는 폴더 경로
//   --title    필수. 페이지 제목 (BoardSection.title)
//   --note     선택. 소개 문구 (BoardSection.note)
//   --mode     선택. "sequential"(기본, 한 줄에 한 장) | "collage"(AQUI처럼
//              사진마다 크기를 다르게 섞어 배치)
//   --columns  선택. 기본 24
//   --maxWidth 선택. 리사이즈 최대 가로 px, 기본 1600
//   --quality  선택. JPEG 품질, 기본 82
// ------------------------------------------------------------------

import fs from "fs"
import path from "path"
import sharp from "sharp"

// ---------- CLI 인자 파싱 ----------
function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2)
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true
      out[key] = value
    }
  }
  return out
}

const opts = parseArgs()
const SLUG = opts.slug
const SOURCE = opts.source
const TITLE = opts.title
const NOTE = opts.note ?? ""
const MODE = opts.mode ?? "sequential"
const COLUMNS = Number(opts.columns ?? 24)
const MAX_WIDTH = Number(opts.maxWidth ?? 1600)
const QUALITY = Number(opts.quality ?? 82)
const GAP = 2.2 // 겹치지 않게 벌려줄 최소 여백 (row 단위)

if (!SLUG || !SOURCE || !TITLE) {
  console.error("필수 옵션 누락: --slug, --source, --title 는 반드시 지정해야 합니다.")
  process.exit(1)
}

const SOURCE_DIR = path.join(process.cwd(), SOURCE)
const OUT_IMG_DIR = path.join(SOURCE_DIR, "optimized")
const BOARDS_DIR = path.join(process.cwd(), "content/boards")
const PUBLIC_PREFIX = "/" + path.relative(path.join(process.cwd(), "public"), SOURCE_DIR).split(path.sep).join("/") + "/optimized/"

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

// ---------- 1단계: 실제 비율 측정 + 리사이즈 최적화 ----------
async function optimizeAndMeasure() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`폴더를 찾을 수 없습니다: ${SOURCE_DIR}`)
    process.exit(1)
  }
  fs.mkdirSync(OUT_IMG_DIR, { recursive: true })

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.(jpe?g|png|heic)$/i.test(f))
    .sort()

  const photos = []

  console.log(`\n${files.length}개 파일 처리 중...\n`)
  console.log("파일명".padEnd(38), "실제 비율".padEnd(16), "크기")
  console.log("-".repeat(70))

  for (const file of files) {
    const inputPath = path.join(SOURCE_DIR, file)
    const image = sharp(inputPath)
    const metadata = await image.metadata()
    const { width, height } = metadata

    const g = gcd(width, height)
    const ratio = `${width / g} / ${height / g}`

    const outName = file.replace(/\.(jpe?g|png|heic)$/i, ".jpg")
    const outPath = path.join(OUT_IMG_DIR, outName)

    await image
      .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(outPath)

    const beforeKB = (fs.statSync(inputPath).size / 1024).toFixed(0)
    const afterKB = (fs.statSync(outPath).size / 1024).toFixed(0)
    console.log(file.padEnd(38), ratio.padEnd(16), `${beforeKB}KB -> ${afterKB}KB`)

    photos.push({
      id: `img-${String(photos.length + 1).padStart(2, "0")}`,
      file: outName,
      ratioW: width / g,
      ratioH: height / g,
    })
  }

  console.log(`\n이미지 ${photos.length}개 최적화 완료 -> ${OUT_IMG_DIR}`)
  return photos
}

// ---------- 2단계: 자동 배치 (겹침 없는 skyline 패킹) ----------
function layoutSequential(photos) {
  // 한 줄에 한 장. 세로형은 좁게, 가로형은 넓게 — 화면에서 너무 안 길어지도록.
  let cursor = 2
  const items = photos.map((p) => {
    const isPortrait = p.ratioH > p.ratioW
    const colSpan = isPortrait ? 14 : 20
    const colStart = Math.floor((COLUMNS - colSpan) / 2) + 1
    const rowHeight = colSpan * (p.ratioH / p.ratioW)
    const rowStart = cursor
    cursor = rowStart + rowHeight + GAP
    return { ...p, colStart, colSpan, rowStart: Math.round(rowStart) }
  })
  return { items, totalRows: Math.ceil(cursor) }
}

function layoutCollage(photos) {
  // AQUI에서 썼던 방식의 일반화 버전: 2장씩 짝지어 좌/우로 나란히 배치하고,
  // 홀수로 남는 사진은 큰 사이즈로 단독 배치. skyline으로 겹침 방지.
  const skyline = new Array(COLUMNS + 2).fill(2)
  const items = []

  for (let i = 0; i < photos.length; i += 2) {
    const a = photos[i]
    const b = photos[i + 1]

    if (b) {
      const colSpan = 10
      const colStartA = 3
      const colStartB = 14
      const rowHeightA = colSpan * (a.ratioH / a.ratioW)
      const rowHeightB = colSpan * (b.ratioH / b.ratioW)

      const startBase = Math.max(
        ...Array.from({ length: colSpan }, (_, k) => skyline[colStartA + k]),
        ...Array.from({ length: colSpan }, (_, k) => skyline[colStartB + k])
      )
      const rowStart = startBase === 2 ? startBase : startBase + GAP

      items.push({ ...a, colStart: colStartA, colSpan, rowStart: Math.round(rowStart) })
      items.push({ ...b, colStart: colStartB, colSpan, rowStart: Math.round(rowStart) })

      const bottomA = rowStart + rowHeightA
      const bottomB = rowStart + rowHeightB
      for (let k = 0; k < colSpan; k++) skyline[colStartA + k] = bottomA
      for (let k = 0; k < colSpan; k++) skyline[colStartB + k] = bottomB
    } else {
      // 마지막 홀수 사진: 큰 사이즈로 단독 배치
      const colSpan = 16
      const colStart = Math.floor((COLUMNS - colSpan) / 2) + 1
      const startBase = Math.max(...Array.from({ length: colSpan }, (_, k) => skyline[colStart + k]))
      const rowStart = startBase === 2 ? startBase : startBase + GAP
      const rowHeight = colSpan * (a.ratioH / a.ratioW)

      items.push({ ...a, colStart, colSpan, rowStart: Math.round(rowStart) })
      for (let k = 0; k < colSpan; k++) skyline[colStart + k] = rowStart + rowHeight
    }
  }

  const totalRows = Math.ceil(Math.max(...skyline))
  return { items, totalRows }
}

// ---------- 3단계: content/boards/<slug>.ts 파일 작성 ----------
function writeBoardFile(items, totalRows) {
  fs.mkdirSync(BOARDS_DIR, { recursive: true })
  const outPath = path.join(BOARDS_DIR, `${SLUG}.ts`)

  const itemLines = items
    .map(
      (it) =>
        `      { id: "${it.id}", src: \`\${FOLDER}${it.file}\`, alt: "${TITLE}", aspectRatio: "${it.ratioW} / ${it.ratioH}", colStart: ${it.colStart}, colSpan: ${it.colSpan}, rowStart: ${it.rowStart}, pin: "none" },`
    )
    .join("\n")

  const content = `import type { BoardSection } from "@/components/post-board"

const FOLDER = "${PUBLIC_PREFIX}"

// scripts/build-gallery.mjs 로 자동 생성됨 — 실제 비율 측정 + 겹침 없는 자동 배치.
// 사진을 더 추가/삭제했다면 스크립트를 다시 돌려서 이 파일을 재생성하세요.
export const ${toCamelCase(SLUG)}Board: BoardSection[] = [
  {
    id: "${SLUG}",
    title: "${TITLE}",
    note: "${NOTE}",
    columns: ${COLUMNS},
    rows: ${totalRows},
    items: [
${itemLines}
    ],
  },
]
`

  fs.writeFileSync(outPath, content, "utf-8")
  console.log(`\n작성 완료: ${outPath}`)
}

function toCamelCase(slug) {
  return slug.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
}

// ---------- 실행 ----------
async function run() {
  const photos = await optimizeAndMeasure()
  const { items, totalRows } =
    MODE === "collage" ? layoutCollage(photos) : layoutSequential(photos)
  writeBoardFile(items, totalRows)

  console.log(`\n다음 할 일:`)
  console.log(`  1) content/boards/${SLUG}.ts 를 열어 마음에 안 드는 배치/캡션만 손으로 다듬기`)
  console.log(`  2) lib/posts.ts 의 BOARD_ROUTES 에 "${SLUG}": "/board/${SLUG}" 추가 (없다면)`)
  console.log(`  3) app/board/${SLUG}/page.tsx 만들기 (기존 app/board/aqui/page.tsx 참고해서 복사)`)
}

run()
