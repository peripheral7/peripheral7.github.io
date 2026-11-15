#!/usr/bin/env node
// Merge an English deck and a Korean deck (same slides, same order) into one bilingual deck:
// English by default, Korean on the toolbar button / L key (deck.js: <html data-langs="en,ko">, [data-l]).
//
//   node scripts/deck-bilingual.mjs <en.html> <ko.html> <out.html>
//
// · Head (title, comments) comes from the English file; the <style> block comes from the Korean file
//   (edit components there or in the merged output — the two must not disagree).
// · Each <section class="slide"> keeps the English opening tag; the Korean data-title goes to data-title-ko.
//   Its content becomes <div class="lw" data-l="en">…</div><div class="lw" data-l="ko" hidden>…</div>
//   (.lw is display:contents in /study/deck-study.css, so layout is unchanged).
// · Headings like "11.1 Title" / "Q2 · Title" / "Problem 4 · Title" get the number wrapped in <span class="no">.
// · Adds /study/deck-study.css and <body class="study">.
// New decks: write them in English first; a Korean version is optional (a deck with only English needs no merge —
// just link deck-study.css and add class="study").
import fs from 'node:fs';

const [enPath, koPath, outPath] = process.argv.slice(2);
if (!outPath) { console.error('usage: node scripts/deck-bilingual.mjs <en.html> <ko.html> <out.html>'); process.exit(1); }
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const en = read(enPath), ko = read(koPath);

const SEC = /<section\b[^>]*>[\s\S]*?<\/section>/g;
function split(src, name) {
  const secs = src.match(SEC) || [];
  if (!secs.length) throw new Error(name + ': no <section>');
  const a = src.indexOf(secs[0]), last = secs[secs.length - 1], b = src.lastIndexOf(last) + last.length;
  for (const s of secs) if ((s.slice(1).match(/<section\b/g) || []).length) throw new Error(name + ': nested <section> not supported');
  return { head: src.slice(0, a), secs, tail: src.slice(b) };
}
const E = split(en, 'en'), K = split(ko, 'ko');
if (E.secs.length !== K.secs.length) throw new Error(`slide count differs: en ${E.secs.length} vs ko ${K.secs.length}`);

const attr = (tag, n) => { const m = new RegExp('\\s' + n + '="([^"]*)"').exec(tag); return m ? m[1] : null; };
const parts = (sec) => { const m = /^(<section\b[^>]*>)([\s\S]*)<\/section>$/.exec(sec); return { open: m[1], body: m[2] }; };
const count = (s, re) => (s.match(re) || []).length;

function numberHeadings(html) {
  return html
    .replace(/<h2>(\d+(?:\.\d+)*)\s+(?!·)/g, '<h2><span class="no">$1</span>')
    .replace(/<h2>((?:Q|Problem |문제 )\d+[a-z]?)\s*·\s*/g, '<h2><span class="no">$1</span>');
}

const out = E.secs.map((es, i) => {
  const e = parts(es), k = parts(K.secs[i]);
  for (const [n, re] of [['step', /class="[^"]*\bstep\b/g], ['table', /<table\b/g], ['li', /<li\b/g], ['svg', /<svg\b/g]]) {
    if (count(e.body, re) !== count(k.body, re)) throw new Error(`slide ${i + 1}: ${n} count differs (en ${count(e.body, re)}, ko ${count(k.body, re)})`);
  }
  let open = e.open.replace(/\sdata-title-ko="[^"]*"/, '');
  const kt = attr(k.open, 'data-title');
  if (kt) open = open.replace(/>$/, ` data-title-ko="${kt}">`);
  let kb = k.body.replace(/(<p class="hint">[\s\S]*?)(<\/p>)/, (m, a, b) => a.includes('L English') ? m : a + ' &nbsp;·&nbsp; L English' + b);
  const ind = (/\n([ \t]*)\S/.exec(e.body) || [, ''])[1];
  return `${open}\n${ind}<div class="lw" data-l="en">${numberHeadings(e.body).replace(/\s+$/, '')}\n${ind}</div>\n${ind}<div class="lw" data-l="ko" hidden>${numberHeadings(kb).replace(/\s+$/, '')}\n${ind}</div>\n${ind.slice(2)}</section>`;
});

const style = (/<style>[\s\S]*?<\/style>/.exec(K.head) || [''])[0];
let head = E.head;
if (style) head = head.replace(/<style>[\s\S]*?<\/style>/, style);
head = head
  .replace(/<html\b[^>]*>/, '<html lang="en" data-langs="en,ko">')
  .replace(/(<link rel="stylesheet" href="\/slides\/deck\.css">)(?!\s*<link rel="stylesheet" href="\/study\/deck-study\.css">)/, '$1\n<link rel="stylesheet" href="/study/deck-study.css">')
  .replace(/<body(?![^>]*class=)([^>]*)>/, '<body class="study"$1>');

fs.writeFileSync(outPath, head + out.join('\n\n') + E.tail);
console.log(`${outPath}: ${out.length} slides merged (en + ko)`);
