#!/usr/bin/env node
// Econ 2 Exam 3 (Ch35 · Ch31 · Ch32) — 퀴즈를 review-data.json 에서 만든다.
//   node scripts/econ2-exam3/build.mjs
// 산출물
//   public/econ2/exam3/quiz.html  : docs/templates/quiz_template_integrated.html 의 quizData 만 바꾼 퀴즈 (객관식, 영어)
//   public/econ2/exam3/index.html : TA 세션 덱(/slides/econ2-exam3/)으로 넘기는 쪽. 예전 개념 덱 주소를 살려 둔다
// TA 세션 PPT · PDF · 덱은 Exam 2 판과 같은 서식으로 scripts/econ2-exam3/ta/make_ta.py 가 같은 review-data.json 에서 만든다.
// 문제는 문제집(Questions ChXX)과 교재 Problems and Applications 의 유형을 따라 숫자와 상황을 바꿔 새로 만든 것이다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'public', 'econ2', 'exam3');
const { RV } = JSON.parse(fs.readFileSync(path.join(HERE, 'review-data.json'), 'utf8'));

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

/* ───────────── 예전 덱 주소 → TA 세션 덱 ───────────── */
const redirect = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Econ2 Exam3 TA Session</title>
<meta http-equiv="refresh" content="0; url=/slides/econ2-exam3/">
<link rel="canonical" href="/slides/econ2-exam3/">
<!-- scripts/econ2-exam3/build.mjs 가 만든다. Exam 3 복습 슬라이드는 Exam 2 판과 같은 서식의 TA 세션 덱(/slides/econ2-exam3/)으로 옮겼다 -->
<script>location.replace('/slides/econ2-exam3/' + location.hash);</script>
</head>
<body><p><a href="/slides/econ2-exam3/">Econ2 Exam3 TA Session</a></p></body>
</html>
`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), redirect);
fs.writeFileSync(path.join(OUT, 'quiz.html'), quiz);
console.log('quiz MC', (qd.match(/^\*|\|\*/gm) || []).length, '· redirect → /slides/econ2-exam3/', '→', path.relative(ROOT, OUT));
