// /sepa/ 페이지 만들기 — Documents/sepa_agent 의 `sepa ui --demo` 가 만든 정적 HTML(탭 5개 화면 하나)을 public/sepa/index.html 로 옮긴다.
//
//   node scripts/sepa-publish.mjs                 # ../sepa_agent 에서 다시 만들어 옮긴다
//   SEPA_AGENT_DIR=D:/x/sepa_agent node scripts/sepa-publish.mjs
//
// 화면(탭 · 차트 · 표 · 검토 패널)은 전부 sepa_agent/sepa/webui 에서 고친다. 여기서는 손대지 않고,
// 탭 줄 오른쪽의 "peripheral7 홈" 링크만 sepa 의 --link 옵션으로 넣는다.
// 실제 모드(sepa ui, 예시 아님)는 계좌 · 보유가 담기므로 공개 사이트에 올리지 않는다 — 이 스크립트는 --demo 만 쓴다.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const AGENT = resolve(process.env.SEPA_AGENT_DIR || join(ROOT, '..', 'sepa_agent'))
const OUT = join(ROOT, 'public', 'sepa')
const SEPA = join(AGENT, '.venv', process.platform === 'win32' ? 'Scripts/sepa.exe' : 'bin/sepa')
const HOME_LINK = 'peripheral7 홈=/'
// 예전 판(터미널 · 카드 · 일지 3안)이 남긴 파일 — 화면을 하나로 합쳐 지금은 쓰지 않는다
const STALE = ['cards.html', 'journal.html']

const tmp = mkdtempSync(join(tmpdir(), 'sepa-ui-'))
try {
  execFileSync(SEPA, ['ui', '--demo', '--variant', 'terminal', '--out', tmp, '--link', HOME_LINK], { cwd: AGENT, stdio: 'ignore' })
  const html = readFileSync(join(tmp, 'ui_terminal_demo.html'), 'utf8')
  if (!html.includes('t-tabs')) throw new Error('탭 화면(t-tabs)이 아님 — sepa_agent 가 탭 5개 판인지 확인')
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'index.html'), html)
  console.log('public/sepa/index.html ← ui_terminal_demo.html')
  for (const f of STALE) rmSync(join(OUT, f), { force: true })
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
