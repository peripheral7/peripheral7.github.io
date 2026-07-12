import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { imageSize } from "image-size"

const TARGET_DIR = process.argv[2]
const OUT_FILE = process.argv[3]

if (!TARGET_DIR || !OUT_FILE) {
  console.error("사용법: node scripts/measure-images.mjs <이미지폴더> <출력json경로>")
  process.exit(1)
}

const files = readdirSync(TARGET_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))

const manifest = {}
const failed = []

for (const file of files) {
  try {
    // image-size v2+는 파일 경로가 아니라 파일 내용(Buffer)을 요구합니다.
    const buffer = readFileSync(join(TARGET_DIR, file))
    const { width, height } = imageSize(buffer)
    manifest[file] = { width, height, aspectRatio: `${width} / ${height}` }
  } catch (err) {
    failed.push({ file, reason: err.message })
  }
}

mkdirSync(dirname(OUT_FILE), { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2))

console.log(`성공: ${Object.keys(manifest).length}개 / 전체: ${files.length}개`)

if (failed.length > 0) {
  console.log("\n--- 크기를 읽지 못한 파일 목록 ---")
  for (const f of failed) {
    console.log(`  ${f.file}  (${f.reason})`)
  }
  console.log("\n위 파일들은 실제로는 HEIC 포맷이거나 손상됐을 가능성이 있습니다.")
}