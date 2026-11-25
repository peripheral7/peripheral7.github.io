#!/usr/bin/env node
// Econ 2 Exam 3 (Ch35 · Ch31 · Ch32) — 복습 덱과 퀴즈를 review-data.json 하나에서 만든다.
//   node scripts/econ2-exam3/build.mjs
// 산출물
//   public/econ2/exam3/index.html : 복습 덱 (/slides/deck.js 엔진, 영어 기본 + L 키 한국어, /study/deck-study.css 글꼴)
//                                    챕터마다 표지 → 문제 선별표 → 핵심 개념 → 인터랙티브(임베드) → 유제(→ 로 풀이) → 정답표
//   public/econ2/exam3/quiz.html  : docs/templates/quiz_template_integrated.html 의 quizData 만 바꾼 퀴즈 (객관식, 영어)
// 문제는 문제집(Questions ChXX)과 교재 Problems and Applications 의 유형을 따라 숫자와 상황을 바꿔 새로 만든 것이다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'public', 'econ2', 'exam3');
const { RV, SORT, SORTOPT } = JSON.parse(fs.readFileSync(path.join(HERE, 'review-data.json'), 'utf8'));
const LETTER = 'abcd';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const L = (a, i) => esc(Array.isArray(a) ? a[i] : a);       // i: 0 = 한국어, 1 = English
const EN = 1, KO = 0;
const T = {
  ex: ['유제', 'Practice'], ans: ['정답', 'Answer'], how: ['답안 쓰는 순서', 'How to write it'], trap: ['함정', 'Trap'],
  picked: ['문제 선별', 'Problems picked'], key: ['정답 한눈에', 'Answer key'], type: ['유형', 'Type'], sa: ['서술형', 'Short answer'],
  concepts: ['핵심 개념', 'Key concepts'], tryit: ['인터랙티브', 'Interactive'], tx: ['거래', 'Transaction']
};
const CHN = { 35: ['ch35', 'Phillips curve'], 31: ['ch31', 'Open-economy basics'], 32: ['ch32', 'Open-economy theory'] };

/* ───────────── 덱 ───────────── */
function both(titleKo, titleEn, ko, en, cls, extra) {
  return `<section class="slide d${cls ? ' ' + cls : ''}" data-title="${esc(titleEn)}" data-title-ko="${esc(titleKo)}"${extra || ''}>\n  <div class="lw" data-l="en">\n${en}\n  </div>\n  <div class="lw" data-l="ko" hidden>\n${ko}\n  </div>\n</section>\n`;
}
const picked = (ch, i) => {
  const rows = (a) => a.map(([n, t]) => `<tr><td>${esc(n)}</td><td>${L(t, i)}</td></tr>`).join('');
  return `  <h2>${L(T.picked, i)} · Ch${ch.ch}</h2>
  <div class="cols"><div><h3>Multiple Choice</h3><table class="pick">${rows(ch.pick.mc)}</table></div>
  <div><h3>Short Answer</h3><table class="pick">${rows(ch.pick.sa)}</table></div></div>
  <p class="small muted">${L(ch.pickNote, i)}</p>`;
};
const concept = (c, i) => `  <h2>${L(c.h, i)}</h2>
  ${c.eq ? `<p class="eq">${L(c.eq, i)}</p>` : ''}
  <ul>${c.li.map((x) => `<li>${L(x, i)}</li>`).join('')}</ul>
  ${c.trap ? `<p class="trap"><b>${L(T.trap, i)}</b> ${L(c.trap, i)}</p>` : ''}`;
function problem(p, i) {
  const head = `  <h2><span class="no">${esc(p.id)}</span>${L(p.src, i)}${p.kind !== 'mc' ? ` <small>· ${L(T.sa, i)}</small>` : ''}</h2>\n  <p class="q">${L(p.q, i)}</p>`;
  let body = '';
  if (p.kind === 'mc') body = `  <ol class="opts">${p.opts.map((o, k) => `<li><span class="lt">${LETTER[k]}.</span>${L(o, i)}</li>`).join('')}</ol>`;
  else if (p.kind === 'sa') body = `  <ol class="parts">${p.parts.map((pt, k) => `<li><span class="lt">${LETTER[k]}.</span><span>${L(pt.q, i)}<span class="pa step">→ ${L(pt.a, i)}</span></span></li>`).join('')}</ol>`;
  else body = `  <table class="sortt"><tr><th>${L(T.tx, i)}</th><th>NX / NCO</th></tr>${SORT.map((s, k) => `<tr><td>${k + 1}. ${L(s.t, i)}</td><td class="step"><b>${L(SORTOPT.find((o) => o[0] === s.a)[1], i)}</b> <span class="muted">${L(s.x, i)}</span></td></tr>`).join('')}</table>`;
  const sol = (p.sol || p.trap || p.kind === 'mc') ? `  <div class="sol step">${p.kind === 'mc' ? `<p class="ans">${L(T.ans, i)}: ${LETTER[p.ans]}. ${L(p.opts[p.ans], i)}</p>` : ''}${p.sol ? `<ol class="how">${p.sol.map((s) => `<li>${L(s, i)}</li>`).join('')}</ol>` : ''}${p.trap ? `<p class="trap"><b>${L(T.trap, i)}</b> ${L(p.trap, i)}</p>` : ''}</div>` : '';
  return [head, body, sol].join('\n');
}
const dense = (p) => p.kind === 'sort' || (p.kind === 'sa' && p.parts.length >= 3) || JSON.stringify(p).length > 1900;
const keyTable = (ch, i) => `  <h2>${L(T.key, i)} · Ch${ch.ch}</h2>
  <table class="wide akey"><tr><th>${L(T.ex, i)}</th><th>${L(T.type, i)}</th><th>${L(T.ans, i)}</th></tr>${ch.probs.map((p) => `<tr><td>${esc(p.id)}</td><td>${L(p.src, i)}</td><td>${p.kind === 'mc' ? `<b>${LETTER[p.ans]}</b> · ${L(p.opts[p.ans], i)}` : L(p.key, i)}</td></tr>`).join('')}</table>`;

let slides = '';
slides += `<section class="slide title" data-title="Title" data-title-ko="표지">
  <div class="lw" data-l="en">
  <h1 style="font-size:104px">Econ 2 · Exam 3 Review</h1>
  <p class="sub">Ch35 Phillips curve · Ch31 Open-economy basics · Ch32 Open-economy theory — TA session</p>
  <p class="hint">→ next / reveal the solution step by step &nbsp;·&nbsp; O overview &nbsp;·&nbsp; D black/white &nbsp;·&nbsp; F full screen &nbsp;·&nbsp; L 한국어</p>
  </div>
  <div class="lw" data-l="ko" hidden>
  <h1 style="font-size:104px">Econ 2 · Exam 3 복습</h1>
  <p class="sub">Ch35 필립스곡선 · Ch31 개방경제 기본 개념 · Ch32 개방경제 이론 — TA 세션</p>
  <p class="hint">→ 다음 / 풀이 한 단계씩 &nbsp;·&nbsp; O 목록 &nbsp;·&nbsp; D 흰/검은 바탕 &nbsp;·&nbsp; F 전체 화면 &nbsp;·&nbsp; L English</p>
  </div>
</section>\n`;
const contents = (i) => `  <h2>${i ? 'How this deck works' : '이 덱의 순서'}</h2>
  <table class="wide"><tr><th>Chapter</th><th>${i ? 'Concepts' : '핵심 개념'}</th><th>${i ? 'Practice problems' : '유제'}</th></tr>${RV.map((ch) => `<tr><td><b>Ch${ch.ch}</b> ${L(ch.short, i)}</td><td>${ch.concepts.length}</td><td>${ch.probs.filter((p) => p.kind === 'mc').length} MC · ${ch.probs.filter((p) => p.kind !== 'mc').length} ${i ? 'short answer' : '서술형'}</td></tr>`).join('')}</table>
  <p>${i ? 'Each chapter: problems picked from the problem set → key concepts → the interactive graph → new practice problems of the same types (press → to reveal each step) → answer key.' : '챕터마다: 문제집에서 고른 문제 번호 → 핵심 개념 → 인터랙티브 그래프 → 같은 유형의 새 유제(→ 를 누르면 풀이가 한 단계씩) → 정답표.'}</p>
  <p class="small muted">${i ? 'Quiz (multiple choice, graded at once): /econ2/exam3/quiz.html · Interactive: /econ2/graphs/' : '퀴즈(객관식, 바로 채점): /econ2/exam3/quiz.html · 인터랙티브: /econ2/graphs/'}</p>`;
slides += both('순서', 'Contents', contents(KO), contents(EN));
for (const ch of RV) {
  slides += `<section class="slide section" data-title="Chapter ${ch.ch}" data-title-ko="Chapter ${ch.ch}">
  <div class="lw" data-l="en"><h1>CHAPTER ${ch.ch}</h1><p class="sub">${L(ch.title, EN)}</p></div>
  <div class="lw" data-l="ko" hidden><h1>CHAPTER ${ch.ch}</h1><p class="sub">${L(ch.title, KO)}</p></div>
</section>\n`;
  slides += both(`Ch${ch.ch} 문제 선별`, `Ch${ch.ch} problems picked`, picked(ch, KO), picked(ch, EN), 'fit');
  ch.concepts.forEach((c) => { slides += both(L(c.h, KO), L(c.h, EN), concept(c, KO), concept(c, EN), c.li.length > 4 || JSON.stringify(c).length > 1300 ? 'fit' : ''); });
  slides += `<section class="slide" data-src="/econ2/graphs/#${CHN[ch.ch][0]}" data-title="Interactive · Ch${ch.ch}" data-title-ko="인터랙티브 · Ch${ch.ch}"></section>\n`;
  ch.probs.forEach((p) => { slides += both(`${L(T.ex, KO)} ${p.id}`, `${L(T.ex, EN)} ${p.id}`, problem(p, KO), problem(p, EN), dense(p) ? 'fit' : ''); });
  slides += both(`Ch${ch.ch} 정답표`, `Ch${ch.ch} answer key`, keyTable(ch, KO), keyTable(ch, EN), 'fit');
}

const deck = `<!DOCTYPE html>
<html lang="en" data-langs="en,ko">
<head>
<meta name="pinterest" content="nopin">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Econ 2 Exam 3 Review — Ch35 · Ch31 · Ch32</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M4 4v24h24' fill='none' stroke='%23000' stroke-width='3'/%3E%3Cpath d='M8 8l18 18M8 24L26 8' stroke='%231f6fd1' stroke-width='2.5'/%3E%3C/svg%3E">
<link rel="stylesheet" href="/slides/deck.css">
<link rel="stylesheet" href="/study/deck-study.css">
<!--
  Econ 2 Exam 3 review deck — scripts/econ2-exam3/build.mjs 가 scripts/econ2-exam3/review-data.json 에서 만든다. 이 파일을 직접 고치지 말고 데이터를 고쳐 다시 만든다.
  Exam 2 TA 세션 형식: 챕터마다 문제 선별표(문제집 번호) → 핵심 개념 → 인터랙티브(/econ2/graphs/ 임베드) → 같은 유형의 새 유제(→ 로 풀이) → 정답표. 영어 기본, L 키로 한국어.
-->
<style>
  /* components only — base typography lives in /study/deck-study.css */
  .slide.d .q{font-size:32px;line-height:1.45;margin:0 0 12px}
  .slide.d ol.opts,.slide.d ol.parts,.slide.d ol.how{list-style:none;margin:6px 0 0;padding:0}
  .slide.d ol.opts>li,.slide.d ol.parts>li{display:flex;gap:.4em;padding-left:0;margin:.28em 0}
  .slide.d ol.opts>li::before,.slide.d ol.parts>li::before{content:none}
  .slide.d .lt{flex:none;width:1.4em;font-weight:640;opacity:.55}
  .slide.d .pa{display:block;margin-top:4px;font-weight:600}
  .slide.d .sol{margin-top:20px;padding-left:24px;border-left:2px solid currentColor}
  .slide.d .sol .ans{font-weight:650}
  .slide.d .sol ol.how>li{font-size:26px;line-height:1.45;padding-left:1.4em;counter-increment:hw;position:relative}
  .slide.d .sol ol.how{counter-reset:hw}
  .slide.d .sol ol.how>li::before{content:counter(hw) ".";position:absolute;left:0;top:0;width:auto;height:auto;background:none;opacity:.55;font-weight:640}
  .slide.d .trap{font-size:25px;line-height:1.45;margin-top:12px}
  .slide.d .eq{font-size:34px;font-weight:620;margin:0 0 22px}
  .slide.d table.pick td:first-child{white-space:nowrap;font-weight:640;padding-right:24px}
  .slide.d table.pick{width:100%}
  .slide.d table.sortt{width:100%}
  .slide.d table.sortt td.step .muted{font-size:22px}
  .slide.d table.akey td:first-child{white-space:nowrap}
  .slide.d h2 small{font-size:.55em;font-weight:500;opacity:.6}
</style>
</head>
<body class="study">
<noscript>JavaScript is required.</noscript>

<main id="stage">

${slides}
</main>
<script src="/slides/deck.js"></script>
</body>
</html>
`;

/* ───────────── 퀴즈 (영어, 객관식) ───────────── */
const plain = (s) => String(s).replace(/\s*\|\s*/g, ' / ').replace(/\n/g, ' ');
let qd = `title: Econ 2 Exam 3 Review Quiz — Ch35 · Ch31 · Ch32
sub: Chapters 35, 31, 32 · ${RV.reduce((n, ch) => n + ch.probs.filter((p) => p.kind === 'mc').length, 0)} questions (all MC)
subject: Introduction to Economics II (Macroeconomics) · Exam 3 TA session
textbook: Mankiw, Principles of Economics (8th ed.), Chapters 35, 31, 32 — new problems modelled on the problem-set types
===
`;
for (const ch of RV) {
  qd += `# Chapter ${ch.ch}: ${plain(ch.title[1])}\n===\n`;
  ch.probs.filter((p) => p.kind === 'mc').forEach((p) => {
    const opts = p.opts.map((o, k) => (k === p.ans ? '*' : '') + plain(o[1])).join('|');
    const why = p.sol.map((s) => plain(s[1])).join('; ') + (p.trap ? '; Trap: ' + plain(p.trap[1]) : '');
    qd += `${ch.ch}.${p.id.split('-')[1]} ${plain(p.src[1])}\n${plain(p.q[1])}\n${opts}\n${why}\n===\n`;
  });
}
qd = qd.replace(/===\n$/, '');
const tplPath = path.join(ROOT, 'docs', 'templates', 'quiz_template_integrated.html');
const tpl = fs.readFileSync(tplPath, 'utf8');
const m = /<!--DATA-START-->\r?\n<script type="text\/plain" id="quizData">\r?\n/.exec(tpl);
if (!m) throw new Error('quiz template: data block not found');
const a = m.index + m[0].length, b = tpl.indexOf('</script>', a);
const nl = /\r\n/.test(m[0]) ? '\r\n' : '\n';
// 템플릿 머리 주석 184줄의 "(<!--DATA-START--> 바로 뒤)" 가 주석을 일찍 닫아 페이지 맨 위에 글자가 새어 나온다 → 사본에서만 표기를 바꾼다
const head = tpl.slice(0, a).replace('(<!--DATA-START--> 바로 뒤)', '(DATA-START 표식 바로 뒤)');
const quiz = head + qd.replace(/\n/g, nl) + nl + tpl.slice(b);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), deck);
fs.writeFileSync(path.join(OUT, 'quiz.html'), quiz);
const nSlides = (deck.match(/<section\b/g) || []).length;
console.log('deck slides', nSlides, '· quiz MC', (qd.match(/^\*|\|\*/gm) || []).length, '→', path.relative(ROOT, OUT));
