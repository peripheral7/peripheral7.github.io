// 퀴즈 HTML(quiz_template_case / quiz_template_written 계열)을 "Print with solution" 상태 그대로 PDF 로 저장한다.
// 화면의 [Print with solution] 버튼과 같은 순서: 전체 챕터 보기 → body.print-solution → beforeprint(인쇄용 시트 생성) → 인쇄 매체로 PDF.
//
// 사용법:  node scripts/quiz-to-pdf.mjs <입력.html> <출력.pdf> [<입력2.html> <출력2.pdf> ...]
// 예:      node scripts/quiz-to-pdf.mjs public/reports/midterm/quiz/BF_ShortAnswer.html public/reports/midterm/BF_Midterm_ShortAnswer_Ch2-7_with_answers.pdf
//
// playwright 가 필요하다(프로젝트 의존성 아님). 전역 설치본을 쓰려면 PLAYWRIGHT_MODULE 에 index.mjs 경로를 준다.
// 출력 줄의 n(전체 문항)과 q(PDF에 들어간 문항)가 다르면 실패로 끝낸다.
import path from "node:path"
import { pathToFileURL } from "node:url"

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright")

const args = process.argv.slice(2)
if (args.length === 0 || args.length % 2 !== 0) {
  console.error("사용법: node scripts/quiz-to-pdf.mjs <입력.html> <출력.pdf> [...]")
  process.exit(2)
}

const browser = await chromium.launch()
let failed = false
for (let i = 0; i < args.length; i += 2) {
  const [src, dst] = [path.resolve(args[i]), path.resolve(args[i + 1])]
  const page = await browser.newPage()
  page.on("pageerror", (e) => console.error(`페이지 오류 ${src}: ${e.message}`))
  page.on("dialog", (d) => d.dismiss())
  await page.goto(pathToFileURL(src).href, { waitUntil: "networkidle" })
  const info = await page.evaluate(() => {
    const all = document.getElementById("allChBtn")
    // eslint-disable-next-line no-undef
    if (all && !viewAll) all.click()
    document.body.classList.add("print-solution")
    window.dispatchEvent(new Event("beforeprint"))
    // eslint-disable-next-line no-undef
    return { n: QUESTIONS.length, q: document.querySelectorAll("#printSheet .p-q").length }
  })
  await page.emulateMedia({ media: "print" })
  await page.pdf({ path: dst, preferCSSPageSize: true, printBackground: true })
  console.log(`${path.basename(dst)}  n=${info.n} q=${info.q}`)
  if (info.n !== info.q) failed = true
  await page.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
