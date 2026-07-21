// scripts/optimize-aqui.mjs
//
// 사용법:
//   1) 프로젝트 루트에서 한 번만: pnpm add -D sharp
//   2) 실행: node scripts/optimize-aqui.mjs
//
// 하는 일:
//   - public/images/photography/AQUI 안의 모든 사진을 읽어서
//   - 원본 비율을 유지한 채 최대 가로 1600px로 리사이즈 (고품질 리샘플링 -> 그레인 완화)
//   - JPEG 품질 82로 재압축 (용량 대폭 감소 -> 로딩 속도 개선)
//   - public/images/photography/AQUI/optimized/ 에 결과 저장 (원본은 안 건드림)
//   - 각 사진의 "실제" 가로세로 비율을 콘솔에 출력 -> aqui.ts의 aspectRatio 값에
//     그대로 복사해 넣으면 비율 어긋남 문제가 해결됩니다.

import fs from "fs"
import path from "path"
import sharp from "sharp"

const SOURCE_DIR = path.join(process.cwd(), "public/images/photography/AQUI")
const OUT_DIR = path.join(SOURCE_DIR, "optimized")
const MAX_WIDTH = 1600 // 화면에 실제로 이 정도보다 크게 표시될 일이 거의 없어서 이 이상은 낭비입니다.
const JPEG_QUALITY = 82

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

async function run() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`폴더를 찾을 수 없습니다: ${SOURCE_DIR}`)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.(jpe?g|png|heic)$/i.test(f))

  console.log(`\n${files.length}개 파일 처리 중...\n`)
  console.log(
    "파일명".padEnd(38),
    "실제 비율".padEnd(12),
    "원본 크기".padEnd(14),
    "결과 파일 크기"
  )
  console.log("-".repeat(90))

  for (const file of files) {
    const inputPath = path.join(SOURCE_DIR, file)
    const image = sharp(inputPath)
    const metadata = await image.metadata()
    const { width, height } = metadata

    const g = gcd(width, height)
    const ratioLabel = `${width / g} / ${height / g}`
    const decimal = (width / height).toFixed(3)

    const outName = file.replace(/\.(jpe?g|png|heic)$/i, ".jpg")
    const outPath = path.join(OUT_DIR, outName)

    await image
      .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true }) // 원본 비율 유지, 확대는 안 함
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(outPath)

    const beforeKB = (fs.statSync(inputPath).size / 1024).toFixed(0)
    const afterKB = (fs.statSync(outPath).size / 1024).toFixed(0)

    console.log(
      file.padEnd(38),
      `${ratioLabel} (${decimal})`.padEnd(12),
      `${width}x${height}`.padEnd(14),
      `${beforeKB}KB -> ${afterKB}KB`
    )
  }

  console.log(`\n완료. 결과물: ${OUT_DIR}`)
  console.log(
    `위 "실제 비율" 값을 aqui.ts의 각 사진 aspectRatio에 그대로 넣어주세요 (예: "4 / 5").`
  )
  console.log(
    `그리고 aqui.ts의 FOLDER 상수를 "/images/photography/AQUI/optimized/"로 바꾸고,`
  )
  console.log(`각 src 확장자를 전부 .jpg로 통일해주세요 (heic/png도 jpg로 변환됨).`)
}

run()
