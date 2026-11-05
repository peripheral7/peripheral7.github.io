// Econ2 현실 연결 — 최근 사례(2021~) 데이터만 받아 real-data.json 에 덧붙인다(기존 키는 그대로).
// 2026-11-06: 옛 사례(1965 베트남전·1973 오일쇼크·2000 닷컴·1995 생산성·2008 환급)를 최근 현상으로 바꾸며 추가.
// 실행: node scripts/econ2-real-data-recent.mjs   (econ2-real-data.mjs 는 다시 돌리지 말 것 — 다른 카드 숫자가 바뀔 수 있다)
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/econ2/graphs/real-data.json', import.meta.url);
const get = async (id) => {
  const r = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + id);
  if (!r.ok) throw new Error(id + ' ' + r.status);
  return (await r.text()).trim().split('\n').slice(1).map((l) => l.split(',')).filter(([, v]) => v !== '.' && v !== '').map(([d, v]) => [d, +v]);
};
const r1 = (x) => Math.round(x * 10) / 10;
const ym = (a) => new Map(a.map(([d, v]) => [d.slice(0, 7), v]));
const prevY = (k) => (+k.slice(0, 4) - 1) + k.slice(4);
const prevM = (k) => { const [y, m] = k.split('-').map(Number); return m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0'); };
const pct = (m, k, p) => r1((m.get(k) / m.get(p(k)) - 1) * 100);
const keysIn = (m, a, b) => [...m.keys()].filter((k) => k >= a && k <= b);

const [nas, pce, dspi, gov, gdp, cpi, ur, ophn] = await Promise.all(['NASDAQCOM', 'PCEC96', 'DSPIC96', 'GCEC1', 'GDPC1', 'CPIAUCSL', 'UNRATE', 'OPHNFB'].map(get));
const CPI = ym(cpi), UR = ym(ur), P = ym(pce);
const out = {};
{ // 2022 주가 하락: 나스닥(월 평균 종가) · 실질 소비, 2021-11 = 100
  const q = new Map(); nas.forEach(([d, v]) => { const k = d.slice(0, 7); q.set(k, (q.get(k) || []).concat(v)); });
  const N = new Map([...q].map(([k, a]) => [k, a.reduce((x, y) => x + y) / a.length]));
  out.c33_stock22 = keysIn(P, '2021-01', '2023-12').map((k) => [k, r1(N.get(k) / N.get('2021-11') * 100), r1(P.get(k) / P.get('2021-11') * 100)]);
}
{ const D = ym(dspi); out.c33_check21 = keysIn(P, '2020-07', '2021-12').map((k) => [k, pct(D, k, prevM), pct(P, k, prevM)]); }   // 2021 지원금: 전월비 %
{ const G = ym(gov), Y = ym(gdp); out.c33_gov23 = keysIn(Y, '2022-01', '2025-10').map((k) => [k, pct(G, k, prevY), pct(Y, k, prevY)]); }   // 정부 구매 · 실질 GDP 전년비 %
out.c33_oil22 = keysIn(CPI, '2021-01', '2024-12').map((k) => [k, pct(CPI, k, prevY), UR.get(k)]);                                          // CPI 전년비 · 실업률
{ // 생산성: 시간당 산출 전년비 · CPI(분기 3개월 평균) 전년비
  const O = ym(ophn), cq = (k) => { const y = +k.slice(0, 4), m = +k.slice(5, 7); return [0, 1, 2].map((i) => CPI.get(y + '-' + String(m + i).padStart(2, '0'))).reduce((a, b) => a + b) / 3; };
  out.c33_tech23 = keysIn(O, '2021-01', '2026-04').filter((k) => cq(k) && cq(prevY(k))).map((k) => [k, pct(O, k, prevY), r1((cq(k) / cq(prevY(k)) - 1) * 100)]);
}
const all = JSON.parse(readFileSync(FILE, 'utf8'));
Object.assign(all, out, { fetched_recent: new Date().toISOString().slice(0, 10) });
writeFileSync(FILE, JSON.stringify(all));
for (const k in out) console.log(k, JSON.stringify(out[k]));
// 문장 숫자 확인용
const O = ym(ophn), cagr = (a, b, yrs) => r1((Math.pow(O.get(b) / O.get(a), 1 / yrs) - 1) * 100);
console.log('productivity 2007Q4-2019Q4', cagr('2007-10', '2019-10', 12), '2022Q4-2025Q4', cagr('2022-10', '2025-10', 3), '2019Q4-2025Q4', cagr('2019-10', '2025-10', 6));
console.log('CPI yoy 2022-12', pct(CPI, '2022-12', prevY), '2023-12', pct(CPI, '2023-12', prevY), '2024-12', pct(CPI, '2024-12', prevY), '2025-12', pct(CPI, '2025-12', prevY), '2026-09', pct(CPI, '2026-09', prevY));
