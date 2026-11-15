// /sepa/ 페이지 만들기 — Documents/sepa_agent 의 `sepa ui --demo --variant all` 이 만든 정적 HTML 3안을 public/sepa/ 로 옮긴다.
//
//   node scripts/sepa-publish.mjs                 # ../sepa_agent 에서 다시 만들어 옮긴다
//   SEPA_AGENT_DIR=D:/x/sepa_agent node scripts/sepa-publish.mjs
//
// 화면(머리줄 · 차트 · 표 · 검토 패널)은 전부 sepa_agent/sepa/webui 에서 고친다. 여기서는 사이트에 맞게
//  ① 파일 이름(ui_terminal_demo.html → index.html 등)과 머리줄의 화면 바꾸기 주소를 바꾸고 ② 머리줄 맨 앞에 "peripheral7 홈" 링크만 더한다.
// 실제 모드(sepa ui, 예시 아님)는 계좌 · 보유가 담기므로 공개 사이트에 올리지 않는다 — 이 스크립트는 --demo 만 쓴다.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const AGENT = resolve(process.env.SEPA_AGENT_DIR || join(ROOT, '..', 'sepa_agent'))
const OUT = join(ROOT, 'public', 'sepa')
const SEPA = join(AGENT, '.venv', process.platform === 'win32' ? 'Scripts/sepa.exe' : 'bin/sepa')

// 생성 파일 → 사이트 주소. 터미널형이 기본(index).
const PAGES = [
  { src: 'ui_terminal_demo.html', file: 'index.html', href: '/sepa/' },
  { src: 'ui_cards_demo.html', file: 'cards.html', href: '/sepa/cards.html' },
  { src: 'ui_journal_demo.html', file: 'journal.html', href: '/sepa/journal.html' },
]

const HOME_CSS =
  '.vbar-home{color:var(--sub);text-decoration:none;font-size:12.5px;white-space:nowrap;padding:6px 0}' +
  '.vbar-home:hover{color:var(--text);text-decoration:underline;text-underline-offset:3px}'

function adapt(html) {
  if (!html.includes('class="vbar"')) throw new Error('머리줄(.vbar)이 없음 — sepa_agent 가 머리줄을 넣기 전 판인지 확인')
  for (const p of PAGES) html = html.replaceAll(`href="${p.src}"`, `href="${p.href}"`)
  html = html.replace('<div class="vbar-what">', '<div class="vbar-what"><a class="vbar-home" href="/">peripheral7 홈</a>')
  return html.replace('</style>', HOME_CSS + '</style>')
}

const tmp = mkdtempSync(join(tmpdir(), 'sepa-ui-'))
try {
  execFileSync(SEPA, ['ui', '--demo', '--variant', 'all', '--out', tmp], { cwd: AGENT, stdio: 'ignore' })
  mkdirSync(OUT, { recursive: true })
  for (const p of PAGES) {
    writeFileSync(join(OUT, p.file), adapt(readFileSync(join(tmp, p.src), 'utf8')))
    console.log(`public/sepa/${p.file} ← ${p.src}`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
