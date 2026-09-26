// 매일 테스트(public/reports/daily-test.html)의 문제 은행을 만든다.
//
// 원본은 이미 있는 두 학습 페이지이고, 이 스크립트는 거기서 문제·모범답안·배점을 읽어 한 파일로 모은다(원본을 고치면 다시 실행):
//   · 법규(행정법)  ← admin-law-basic-problems-25.html — 문제마다 "원문"(사례형 서술 문제)과 원문 배점, 모범답안(구조)
//   · 감정평가실무   ← appraisal-practice-quiz.html(종합문제집) — 주제형 서술 문항 + 핵심 키워드 + 모범답안
//
// 시험은 손으로 푸는 종이 시험이다: 문제지(문제·배점만)를 인쇄하고, 답안은 프롬프트로 채점한 뒤 분석노트를 업로드해 기록한다.
// 그래서 은행에는 "문제지에 찍을 것"(question, points)과 "채점 프롬프트에 넣을 것"(answer, keywords)이 함께 들어 있다.
//
// 회차(session) 구성 — 한 회차는 항상 100점:
//   · 법규: 단원 순서대로 묶되, 원문 배점 합이 100에 가장 가깝도록(5~6문제) 나눈 뒤 5점 단위로 100점에 맞춘다.
//           원문 배점이 없는 문제(1~5, 9, 10번)는 추정 배점을 쓰고, 원문 자체가 없는 2~4번은 모범답안에 맞춰 문제문을 재구성한다.
//   · 실무: 종합문제집 순서대로 5문제씩. 배점은 답안 분량(tall / very_tall)에 따라 5점 단위로 조정한다.
//
// 사용: node scripts/build-daily-test-bank.mjs        → public/reports/daily-test-bank.json 을 다시 쓴다
//       node scripts/build-daily-test-bank.mjs --check → 파일을 쓰지 않고 지금 파일이 원본과 같은지만 확인(다르면 종료코드 1)
// 배포(.github/workflows/deploy.yml)에서도 빌드 전에 실행하므로, 원본만 고쳐도 사이트에는 항상 최신 문제가 올라간다.
// 출력에는 시각 등 매번 달라지는 값을 넣지 않는다(원본이 그대로면 결과 파일도 그대로 — 불필요한 diff 방지).
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPORTS = path.join(ROOT, 'public', 'reports')
const LAW_FILE = 'admin-law-basic-problems-25.html'
const PRACTICE_FILE = 'appraisal-practice-quiz.html'
const OUT = path.join(REPORTS, 'daily-test-bank.json')

const SESSION_POINTS = 100
const POINT_UNIT = 5 // 배점은 5점 단위
const PRACTICE_PER_SESSION = 5
const PRACTICE_SIZE_WEIGHT = { 1: 1, 2: 1.25, 3: 1.5 } // 답안 분량(z)별 가중치
const LAW_GROUP_MIN = 3
const LAW_GROUP_MAX = 6

// 원문 배점이 원본에 없는 문제의 추정 배점(같은 단원군의 비슷한 문제와 실제 시험 관행을 참고한 값 — 상대 비중으로만 쓰인다)
const LAW_POINTS_ESTIMATE = { p01: 20, p02: 15, p03: 20, p04: 20, p05: 10, p09: 10, p10: 15 }

// 원문이 원본에 없는 문제 — 모범답안(구조)에 담긴 사안·쟁점에 맞춰 문제문을 재구성한다(이 표에 있는 문제는 questionSource='재구성').
const LAW_QUESTION_SYNTH = {
  p02: '행정의 자기구속의 원칙에 대하여 설명하시오. (의의 및 근거, 성립요건, 한계를 포함할 것)',
  p03: '을 시장은 주택건설사업계획승인처분을 하면서, 그 주택단지의 진입도로 부지의 소유권을 확보하여 진입도로 등 간선시설을 설치하고 그 부지 소유권을 시(市)에 기부채납하도록 하는 부관을 붙였다. 위 부관의 적법 여부를 검토하시오.',
  p04: '국토교통부장관은 감정평가사 甲에게 관계 법령 [별표3]에 따른 제재적 처분기준을 적용하여 업무정지처분을 하였다. 위 [별표3]은 법규명령의 형식으로 제정되어 있으나 그 실질은 제재적 처분의 사무처리기준이다. 위 제재적 처분기준의 법적 성질을 논하고, 甲에 대한 업무정지처분의 위법성 판단에서 이 기준이 어떤 의미를 갖는지 검토하시오.',
}

const read = (file) => fs.readFileSync(path.join(REPORTS, file), 'utf8').replace(/\r\n/g, '\n')

// `marker` 바로 뒤의 첫 { 또는 [ 부터 짝이 맞는 닫는 괄호까지(문자열 안의 괄호는 무시)를 잘라 값으로 평가한다.
function evalLiteral(source, marker) {
  const at = source.indexOf(marker)
  if (at < 0) throw new Error('원본에서 ' + marker + ' 를 찾지 못했습니다')
  let i = source.indexOf('=', at) + 1
  while (/\s/.test(source[i])) i++
  const open = source[i]
  const close = open === '{' ? '}' : open === '[' ? ']' : null
  if (!close) throw new Error(marker + ' 뒤에 객체/배열 리터럴이 없습니다')
  let depth = 0
  let quote = null
  let j = i
  for (; j < source.length; j++) {
    const c = source[j]
    if (quote) {
      if (c === '\\') j++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue }
    if (c === open) depth++
    else if (c === close && --depth === 0) break
  }
  if (depth !== 0) throw new Error(marker + ' 의 괄호가 닫히지 않았습니다')
  return vm.runInNewContext('(' + source.slice(i, j + 1) + ')', Object.create(null), { timeout: 5000 })
}

// ---------------------------------------------------------------- HTML → 글(마크다운 비슷한 평문)
const ENTITIES = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&middot;': '·', '&times;': '×', '&rarr;': '→' }
const decode = (s) => s.replace(/&(?:lt|gt|amp|quot|#39|nbsp|middot|times|rarr);/g, (m) => ENTITIES[m] || m)
const squash = (s) => s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
const text = (s) => squash(decode(String(s == null ? '' : s).replace(/<[^>]+>/g, ' '))).replace(/\s*\n\s*/g, ' ')

function tableToMd(tableHtml) {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) =>
    [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => text(c[1]).replace(/\|/g, '\\|')))
  if (!rows.length) return ''
  const width = Math.max(...rows.map((r) => r.length))
  const line = (r) => '| ' + Array.from({ length: width }, (_, i) => r[i] || '').join(' | ') + ' |'
  return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n')
}

// 인라인·블록 HTML을 사람이 읽고 AI가 읽기 좋은 마크다운 평문으로: <b>→**, <br>·<p>·<li>→줄바꿈, 표→마크다운 표
export function htmlToMd(html) {
  let s = String(html == null ? '' : html)
  s = s.replace(/<table[\s\S]*?<\/table>/g, (t) => '\n\n' + tableToMd(t) + '\n\n')
  s = s.replace(/<b class="sub">([\s\S]*?)<\/b>/g, '\n**$1** ')
  s = s.replace(/<(b|strong)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g, '**$2**')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<li[^>]*>/gi, '\n- ').replace(/<\/(p|div|ul|ol|li|h\d)>/gi, '\n')
  s = s.replace(/<[^>]+>/g, '')
  return squash(decode(s)).replace(/\*\*\s*\*\*/g, '')
}

// 표시용 HTML(문항 배경자료): 태그는 소수만 남기고 속성·스크립트는 모두 떼어 낸다.
const ALLOWED = new Set(['b', 'strong', 'u', 'i', 'em', 'br', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sub', 'sup', 'span', 'div'])
function safeHtml(html) {
  return String(html == null ? '' : html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (m, tag) => {
      const t = tag.toLowerCase()
      if (!ALLOWED.has(t)) return ''
      return m.startsWith('</') ? '</' + t + '>' : t === 'br' ? '<br>' : '<' + t + '>'
    })
    .trim()
}

// ---------------------------------------------------------------- 행정법(법규)
function buildLaw() {
  const html = read(LAW_FILE)

  // 문제 버튼(.ptab)이 곧 단원 순서다: <div class="ptab active" data-problem="p06">문제06<br>부관</div>
  const units = []
  for (const m of html.matchAll(/<div class="ptab(?: active)?" data-problem="(p\w+)">([\s\S]*?)<\/div>/g)) {
    const [label, ...rest] = m[2].split(/<br\s*\/?>/i).map((x) => text(x))
    units.push({ id: m[1], label, name: rest.join(' ') || label })
  }
  if (units.length < 20) throw new Error('행정법 단원(.ptab)을 충분히 찾지 못했습니다: ' + units.length)

  // 문제 본문 블록의 경계: 각 <div class="problem" id="problem-pXX"> 부터 다음 것(또는 끝)까지
  const starts = [...html.matchAll(/<div class="problem(?: active)?" id="problem-(p\w+)">/g)].map((m) => ({ id: m[1], at: m.index }))
  const blockOf = (id) => {
    const i = starts.findIndex((s) => s.id === id)
    if (i < 0) return null
    return html.slice(starts[i].at, i + 1 < starts.length ? starts[i + 1].at : html.length)
  }

  const problems = []
  units.forEach((unit, idx) => {
    const block = blockOf(unit.id)
    if (!block) throw new Error('문제 본문을 찾지 못했습니다: ' + unit.id)
    const mapStart = block.indexOf('data-view="map"')
    const mapEnd = block.indexOf('<div class="view" data-view="cards">')
    const map = block.slice(mapStart, mapEnd > mapStart ? mapEnd : block.length)

    const title = text((block.match(/<div class="problem-title">([\s\S]*?)<\/div>/) || [])[1] || '').replace(/^문제\s*\d+(?:-\S+)?\s*·\s*/, '') || unit.name
    const topic = text((block.match(/<div class="problem-sub">([\s\S]*?)<\/div>/) || [])[1] || '')

    // 원문 + 배점
    let question = null
    let points = null
    const st = map.match(/<div class="problem-statement">([\s\S]*?)<\/div>\s*<div class="toc">/)
    if (st) {
      const pm = st[1].match(/<div class="ps-label">[\s\S]*?<span>\((\d+)점\)<\/span>/)
      if (pm) points = Number(pm[1])
      const paras = [...st[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => htmlToMd(m[1]))
      question = paras.join('\n')
    }
    const questionSource = question ? '원문' : '재구성'
    if (!question) {
      question = LAW_QUESTION_SYNTH[unit.id]
      if (!question) throw new Error('원문이 없는 문제에 재구성 문제문이 없습니다: ' + unit.id)
    }
    const pointsSource = points != null ? '원문' : '추정'
    if (points == null) {
      points = LAW_POINTS_ESTIMATE[unit.id]
      if (points == null) throw new Error('원문 배점도 추정 배점도 없는 문제: ' + unit.id)
    }
    // 물음별 배점이 원문 안에 적혀 있고 그 합이 문제 배점과 같으면(예: ⑴ 5점 + ⑵ 25점) 이 문제의 배점은 조정하지 않는다
    const inner = [...question.matchAll(/\((\d+)점\)/g)].map((m) => Number(m[1]))
    const locked = inner.length >= 2 && inner.reduce((a, b) => a + b, 0) === points

    // 모범답안(구조): 목차 → 항목별 본문 → Tip(채점 포인트). "관련." 상호참조는 채점과 무관하므로 뺀다.
    const parts = []
    const toc = [...map.matchAll(/<span class="lv([12])">([\s\S]*?)<\/span>/g)].map((m) => (m[1] === '2' ? '  ' : '') + text(m[2]))
    if (toc.length) parts.push('[목차]\n' + toc.join('\n'))
    const tocNote = map.match(/<div class="toc-note">([\s\S]*?)<\/div>/)
    if (tocNote) parts.push('[채점 포인트] ' + htmlToMd(tocNote[1]).replace(/^\*\*Tip\.\*\*\s*/, ''))
    // flowbox 와 note 를 나온 순서대로 훑는다(note 는 바로 앞 flowbox 의 Tip)
    const body = map.slice(map.indexOf('<div class="flowrow">') >= 0 ? map.indexOf('<div class="flowrow">') : map.indexOf('<div class="flowbox">'))
    const seq = [...body.matchAll(/<div class="(flowbox|note)">([\s\S]*?)<\/div>/g)]
    for (const m of seq) {
      if (m[1] === 'flowbox') {
        const num = text((m[2].match(/<span class="num">([\s\S]*?)<\/span>/) || [])[1] || '')
        const h3 = text((m[2].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '')
        const ps = [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => htmlToMd(x[1]))
        parts.push('### ' + [num, h3].filter(Boolean).join('. ') + '\n' + ps.join('\n'))
      } else {
        const tips = [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => htmlToMd(x[1])).filter((t) => !/^\*\*관련\.\*\*/.test(t))
        if (tips.length) parts.push(tips.map((t) => '> ' + t.replace(/^\*\*Tip\.\*\*\s*/, 'Tip: ')).join('\n'))
      }
    }
    const answer = parts.join('\n\n')
    if (answer.length < 80) throw new Error('모범답안(구조)을 충분히 읽지 못했습니다: ' + unit.id)

    problems.push({
      id: 'law:' + unit.id,
      s: 'law',
      order: idx + 1,
      label: unit.label,
      title,
      topic,
      question,
      questionSource,
      points,
      pointsSource,
      locked,
      answer,
    })
  })
  return { problems }
}

// ---------------------------------------------------------------- 감정평가실무(종합문제집)
// 종합문제집의 문항은 "획지와 필지의 개념 차이"처럼 주제만 적힌 명사구가 대부분이라, 시험지에 실을 때 완결된 서술형 지시문이 되도록 다듬는다.
// (이미 "~하시오"·"~는?"으로 끝나는 문항은 그대로 둔다. 원래 주제 표현은 topic 에 남긴다.)
const hasFinalConsonant = (s) => {
  const ch = String(s).trim().replace(/[)\]」』"'”’\s]+$/, '').slice(-1)
  const code = ch.charCodeAt(0)
  return code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false
}
export function completeQuestion(prompt) {
  const q = String(prompt).replace(/\s+/g, ' ').trim()
  if (/하시오|하라|시오|[?？]/.test(q)) return q // 이미 완결된 지시문·물음
  if (/약술$/.test(q)) return q.replace(/\s*약술$/, '') + (hasFinalConsonant(q.replace(/\s*약술$/, '')) ? '을' : '를') + ' 약술하시오.'
  if (/제일은$/.test(q)) return q + ' 언제인가?'
  return q + '에 대하여 서술하시오.'
}

function buildPractice() {
  const html = read(PRACTICE_FILE)
  const structure = evalLiteral(html, 'const structure')
  const dataset = evalLiteral(html, 'const dataset')

  const problems = []
  let order = 0
  for (const chapter of structure) {
    for (const sub of chapter.subs) {
      const list = dataset[sub.id] || []
      if (!sub.active || list.length === 0) continue
      list.forEach((q, i) => {
        if (!q.prompt || !Array.isArray(q.keywords) || q.keywords.length === 0) throw new Error('실무 문항 형식 오류: ' + sub.id + '#' + q.id)
        order++
        const item = {
          id: 'practice:' + sub.id + ':' + q.id,
          s: 'practice',
          order,
          unit: sub.id,
          chapter: chapter.name,
          unitName: sub.name,
          label: sub.name + ' #' + (i + 1),
          topic: htmlToMd(q.prompt).replace(/\s+/g, ' '), // 종합문제집에 적힌 원래 주제 표현(취약 분석·기록 목록에서 짧게 부를 때 쓴다)
          question: completeQuestion(htmlToMd(q.prompt)),
          answer: htmlToMd(q.modelAnswer || ''),
          // 키워드마다 word + alt(동의어) — 하나라도 답에 들어 있으면 그 키워드를 쓴 것으로 본다
          keywords: q.keywords.map((k) => [k.word, ...(k.alt || [])].map((x) => String(x).trim()).filter(Boolean)),
          size: q.very_tall ? 3 : q.tall ? 2 : 1, // 답안 분량(원본의 tall / very_tall 표시)
        }
        if (q.context) item.context = safeHtml(q.context)
        if (q.ref) item.ref = text(q.ref)
        problems.push(item)
      })
    }
  }
  return { problems }
}

// ---------------------------------------------------------------- 배점 · 회차
// weights 를 POINT_UNIT 단위로 나눠 합이 total 이 되게 배분한다(최대잔여법). locked 인 항목은 weights 그대로 고정한다.
export function distribute(weights, locked, total = SESSION_POINTS, unit = POINT_UNIT) {
  const fixed = weights.reduce((a, w, i) => a + (locked[i] ? w : 0), 0)
  const freeIdx = weights.map((_, i) => i).filter((i) => !locked[i])
  const units = Math.round((total - fixed) / unit)
  const out = weights.map((w, i) => (locked[i] ? w : 0))
  if (!freeIdx.length) return out
  const sum = freeIdx.reduce((a, i) => a + weights[i], 0)
  const ideal = freeIdx.map((i) => (units * weights[i]) / sum)
  const base = ideal.map((x) => Math.max(1, Math.floor(x)))
  let left = units - base.reduce((a, b) => a + b, 0)
  const order = ideal.map((x, k) => ({ k, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac || a.k - b.k)
  for (let n = 0; left > 0; n = (n + 1) % order.length) { base[order[n].k]++; left-- }
  for (let n = order.length - 1; left < 0; n = (n - 1 + order.length) % order.length) { if (base[order[n].k] > 1) { base[order[n].k]--; left++ } }
  freeIdx.forEach((i, k) => { out[i] = base[k] * unit })
  return out
}

// 법규: 단원 순서를 지키며 묶음의 원문 배점 합이 100에 가깝도록(크기 3~6) 나눈다 — 동적계획법(최소 오차, 크기는 5개 안팎 선호)
function partitionLaw(problems) {
  const n = problems.length
  const memo = new Map()
  const go = (i) => {
    if (i === n) return { cost: 0, cuts: [] }
    if (memo.has(i)) return memo.get(i)
    let best = { cost: Infinity, cuts: [] }
    let sum = 0
    for (let j = i; j < n && j - i + 1 <= LAW_GROUP_MAX; j++) {
      sum += problems[j].points
      const size = j - i + 1
      if (size < LAW_GROUP_MIN && j < n - 1) continue
      const rest = go(j + 1)
      const cost = Math.abs(sum - SESSION_POINTS) + Math.abs(size - 5) * 3 + rest.cost
      if (cost < best.cost) best = { cost, cuts: [[i, j, sum]].concat(rest.cuts) }
    }
    memo.set(i, best)
    return best
  }
  return go(0).cuts
}

function makeSessions(law, practice) {
  const sessions = []
  partitionLaw(law).forEach(([a, b, raw], k) => {
    const group = law.slice(a, b + 1)
    const pts = distribute(group.map((p) => p.points), group.map((p) => p.locked))
    sessions.push({
      id: 'law-' + (k + 1), s: 'law', n: k + 1, rawSum: raw,
      problems: group.map((p) => p.id),
      points: Object.fromEntries(group.map((p, i) => [p.id, pts[i]])),
    })
  })
  for (let a = 0, k = 0; a < practice.length; a += PRACTICE_PER_SESSION, k++) {
    const group = practice.slice(a, a + PRACTICE_PER_SESSION)
    const pts = distribute(group.map((p) => PRACTICE_SIZE_WEIGHT[p.size] || 1), group.map(() => false))
    sessions.push({
      id: 'practice-' + (k + 1), s: 'practice', n: k + 1,
      problems: group.map((p) => p.id),
      points: Object.fromEntries(group.map((p, i) => [p.id, pts[i]])),
    })
  }
  return sessions
}

// ---------------------------------------------------------------- 조립
function build() {
  const law = buildLaw()
  const practice = buildPractice()
  const problems = [...law.problems, ...practice.problems]
  const ids = new Set()
  for (const p of problems) {
    if (ids.has(p.id)) throw new Error('문항 id 중복: ' + p.id)
    ids.add(p.id)
  }
  const sessions = makeSessions(law.problems, practice.problems)
  for (const s of sessions) {
    const total = Object.values(s.points).reduce((a, b) => a + b, 0)
    if (total !== SESSION_POINTS) throw new Error(s.id + ' 배점 합이 ' + total + ' 입니다(100이어야 함)')
  }
  const sourceHash = crypto.createHash('sha1').update(JSON.stringify([problems, sessions])).digest('hex').slice(0, 12)

  return {
    v: 2,
    sourceHash,
    sources: { law: LAW_FILE, practice: PRACTICE_FILE },
    subjects: {
      law: { name: '감정평가 및 보상법규(행정법)', short: '법규' },
      practice: { name: '감정평가실무', short: '실무' },
    },
    problems,
    sessions,
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const bank = build()
  const json = JSON.stringify(bank) + '\n'

  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : ''
    if (current === json) { console.log('daily-test-bank.json is up to date (' + bank.sourceHash + ')'); process.exit(0) }
    console.log('daily-test-bank.json is OUT OF DATE — run: node scripts/build-daily-test-bank.mjs')
    process.exit(1)
  }

  fs.writeFileSync(OUT, json, 'utf8')
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + (Buffer.byteLength(json) / 1024).toFixed(1) + ' KB, source ' + bank.sourceHash + ')')
  for (const key of ['law', 'practice']) {
    const list = bank.sessions.filter((s) => s.s === key)
    console.log(' ' + bank.subjects[key].short + ': 문제 ' + bank.problems.filter((p) => p.s === key).length + '개 / 회차 ' + list.length + '개')
  }
  bank.sessions.filter((s) => s.s === 'law').forEach((s) => console.log('   ' + s.id + ': ' + s.problems.map((id) => id.replace('law:', '')).join(', ') + ' (원문 합 ' + s.rawSum + ' → 배점 ' + s.problems.map((id) => s.points[id]).join('/') + ')'))
}
