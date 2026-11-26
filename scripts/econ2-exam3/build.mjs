#!/usr/bin/env node
// Econ 2 Exam 3 (Ch35 · Ch31 · Ch32) — 퀴즈 쪽을 review-data.json 에서 만든다.
//   node scripts/econ2-exam3/build.mjs
// 산출물
//   public/econ2/exam3/quiz.html  : 하나로 합친 퀴즈(객관식 26 + NX or NCO 8 + 정책 방향표). 틀 = scripts/econ2-exam3/quiz-page.html, 기본 영어
//   public/econ2/exam3/index.html : TA 세션 덱(/slides/econ2-exam3/)으로 넘기는 쪽(예전 개념 덱 주소)
//   public/econ2/exam3/tools.html : 퀴즈로 넘기는 쪽(예전 계산기 · 정리표 주소)
// TA 세션 PPT · PDF · 덱은 scripts/econ2-exam3/ta/make_ta.py 가 같은 review-data.json 에서 만든다.
// 문제는 문제집(Questions ChXX)과 교재 Problems and Applications 의 유형을 따라 숫자와 상황을 바꿔 새로 만든 것이다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'public', 'econ2', 'exam3');
const { RV, SORT, SORTOPT } = JSON.parse(fs.readFileSync(path.join(HERE, 'review-data.json'), 'utf8'));

// Ch31: 나누기 ÷ 는 분수 표기 / 로(인터랙티브 · 슬라이드 Ch31 과 같게)
const slash = (v) => (typeof v === 'string' ? v.replace(/ ÷ /g, ' / ').replace(/÷/g, '/') : Array.isArray(v) ? v.map(slash) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, slash(x)])) : v);
const data = {
  ch: RV.map((c) => ({
    n: c.ch, short: c.short,
    mc: c.probs.filter((p) => p.kind === 'mc').map((p) => (c.ch === 31 ? slash : (x) => x)({ id: p.id, src: p.src, q: p.q, opts: p.opts, ans: p.ans, sol: p.sol, trap: p.trap || null }))
  })),
  sort: SORT, sortopt: SORTOPT
};
const page = fs.readFileSync(path.join(HERE, 'quiz-page.html'), 'utf8');
if (!page.includes('/*QUIZ-DATA*/null')) throw new Error('quiz-page.html: /*QUIZ-DATA*/null not found');
const quiz = page.replace('/*QUIZ-DATA*/null', JSON.stringify(data).replace(/</g, '\\u003c'));

const redirect = (to, title, why) => `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${title}</title>
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${to}">
<!-- scripts/econ2-exam3/build.mjs 가 만든다. ${why} -->
<script>location.replace('${to}' + location.hash);</script>
</head>
<body><p><a href="${to}">${title}</a></p></body>
</html>
`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'quiz.html'), quiz);
fs.writeFileSync(path.join(OUT, 'index.html'), redirect('/slides/econ2-exam3/', 'Econ2 Exam3 TA Session', 'Exam 3 복습 슬라이드는 Exam 2 판과 같은 서식의 TA 세션 덱(/slides/econ2-exam3/)으로 옮겼다'));
fs.writeFileSync(path.join(OUT, 'tools.html'), redirect('/econ2/exam3/quiz.html', 'Econ 2 Exam 3 Quiz', '계산기 · 정리표는 퀴즈 하나(/econ2/exam3/quiz.html)로 합쳤다'));
const n = data.ch.reduce((a, c) => a + c.mc.length, 0);
console.log('quiz: MC', n, '+ sort', SORT.length, '→', path.relative(ROOT, OUT));
