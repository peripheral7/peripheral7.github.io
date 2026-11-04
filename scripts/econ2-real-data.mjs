// Econ2 Interactive 현실 연결 모드(Real world)용 데이터 받기 — FRED CSV(키 불필요)를 받아 public/econ2/graphs/real-data.json 으로 저장.
// 실행: node scripts/econ2-real-data.mjs   (값이 바뀌면 real.js 의 카드 문장 숫자도 함께 확인)
import { writeFileSync } from 'node:fs';

const get = async (id) => {
  const r = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=' + id);
  if (!r.ok) throw new Error(id + ' ' + r.status);
  return (await r.text()).trim().split('\n').slice(1).map((l) => l.split(',')).filter(([, v]) => v !== '.' && v !== '').map(([d, v]) => [d, +v]);
};
const range = (rows, a, b) => rows.filter(([d]) => d >= a && d <= b);
const r2 = (x) => Math.round(x * 100) / 100;

const [base, m2, wl, cpi, m2v] = await Promise.all(['BOGMBASE', 'M2SL', 'WLCFLPCL', 'CPIAUCSL', 'M2V'].map(get));
const M2 = new Map(m2), CPI = new Map(cpi);
// 통화승수(넓은 뜻) = M2 ÷ 본원통화, 월별
const mult = base.filter(([d]) => d >= '2000-01-01' && M2.has(d)).map(([d, b]) => [d.slice(0, 7), r2(M2.get(d) / b)]);
// QE: 2008-08 = 100 으로 맞춘 본원통화 · M2
const B0 = base.find(([d]) => d === '2008-08-01')[1], Q0 = M2.get('2008-08-01');
const qe = range(base, '2006-01-01', '2016-12-01').map(([d, b]) => [d.slice(0, 7), Math.round(b / B0 * 100), Math.round(M2.get(d) / Q0 * 100)]);
// 재할인 창구(primary credit) 대출, 주별, 십억 달러
const dw = range(wl, '2019-01-01', '2024-06-30').map(([d, v]) => [d, Math.round(v / 100) / 10]);

// Ch30: M2 · CPI 전년 같은 달 대비 %, 월별
const yoy = (m, d) => { const p = (+d.slice(0, 4) - 1) + d.slice(4); return m.has(p) ? Math.round((m.get(d) / m.get(p) - 1) * 1000) / 10 : null; };
const grow = m2.filter(([d]) => d >= '2015-01-01' && CPI.has(d)).map(([d]) => [d.slice(0, 7), yoy(M2, d), yoy(CPI, d)]);
// Ch30: M2 유통속도(명목 GDP ÷ M2), 분기별
const vel = m2v.filter(([d]) => d >= '1960-01-01').map(([d, v]) => [d.slice(0, 7), r2(v)]);

// 두 계열을 같은 날짜로 묶기: [YYYY-MM, f(a), f(b)], from · to 는 'YYYY-MM'
const r1 = (x) => Math.round(x * 10) / 10;
const pair = (a, b, from, to, fa = (m, d) => m.get(d), fb = fa) => {
  const A = new Map(a), B = new Map(b);
  return a.map(([d]) => d).filter((d) => d.slice(0, 7) >= from && d.slice(0, 7) <= to && B.has(d)).map((d) => [d.slice(0, 7), fa(A, d), fb(B, d)]);
};
const since = (d0) => (m, d) => r1(m.get(d) - m.get(d0));   // d0 값에서 몇 포인트 바뀌었나

// Ch28
const [ur, ahe, civ, u6, dur] = await Promise.all(['UNRATE', 'AHETPI', 'CIVPART', 'U6RATE', 'UEMPMED'].map(get));
const out28 = {
  c28_covid: pair(ur, ahe, '2019-01', '2021-12', undefined, yoy),        // 실업률 · 평균 시급 전년비 %
  c28_lfp: pair(civ, ur, '2020-01', '2022-12', since('2020-02-01')),    // 2020-02 대비 변화(%p): 참가율 · 실업률
  c28_u6: pair(ur, u6, '1994-01', '2024-12'),                            // U-3 · U-6
  c28_dur: pair(dur, ur, '2000-01', '2019-12')                           // 실업 기간 중앙값(주) · 실업률
};

// Ch33 — 월·분기 계열을 'YYYY-MM' 지도로. 분기는 첫 달('2000-01' = 1분기)
const [nas, pceq, dspi, pcem, exq, imq, ophn, fdef] = await Promise.all(['NASDAQCOM', 'PCECC96', 'DSPIC96', 'PCEC96', 'EXPGSC1', 'IMPGSC1', 'OPHNFB', 'FDEFX'].map(get));
const ym = (a) => new Map(a.map(([d, v]) => [d.slice(0, 7), v]));
const prevY = (k) => (+k.slice(0, 4) - 1) + k.slice(4);
const prevM = (k) => { const [y, m] = k.split('-').map(Number); return m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0'); };
const pct = (m, k, p) => r1((m.get(k) / m.get(p(k)) - 1) * 100);
const keysIn = (m, a, b) => [...m.keys()].filter((k) => k >= a && k <= b);
const CPIm = ym(cpi), URm = ym(ur);
const out33 = {};
{ // 닷컴 붕괴: 나스닥(분기 평균 종가) · 실질 소비, 2000-01 = 100
  const qk = (d) => d.slice(0, 5) + String(Math.floor((+d.slice(5, 7) - 1) / 3) * 3 + 1).padStart(2, '0'), q = new Map();
  nas.forEach(([d, v]) => { const k = qk(d); q.set(k, (q.get(k) || []).concat(v)); });
  const N = new Map([...q].map(([k, a]) => [k, a.reduce((x, y) => x + y) / a.length])), P = ym(pceq);
  out33.c33_stock = keysIn(P, '1999-01', '2004-10').filter((k) => N.has(k)).map((k) => [k, r1(N.get(k) / N.get('2000-01') * 100), r1(P.get(k) / P.get('2000-01') * 100)]);
}
{ const D = ym(dspi), P = ym(pcem); out33.c33_rebate = keysIn(P, '2007-02', '2009-06').map((k) => [k, pct(D, k, prevM), pct(P, k, prevM)]); }   // 2008 환급: 전월비 %
{ const E = ym(exq), I = ym(imq); out33.c33_nx = keysIn(E, '2012-01', '2017-10').map((k) => [k, pct(E, k, prevY), pct(I, k, prevY)]); }      // 강달러: 실질 수출 · 수입 전년비 %
out33.c33_oil = keysIn(CPIm, '1972-01', '1977-12').map((k) => [k, pct(CPIm, k, prevY), URm.get(k)]);                                       // 오일 쇼크: CPI 전년비 · 실업률
{ // 생산성 붐: 시간당 산출 전년비 · CPI(분기 3개월 평균) 전년비
  const P = ym(ophn), cq = (k) => { const y = +k.slice(0, 4), m = +k.slice(5, 7); return [0, 1, 2].map((i) => CPIm.get(y + '-' + String(m + i).padStart(2, '0'))).reduce((a, b) => a + b) / 3; };
  out33.c33_tech = keysIn(P, '1990-01', '2004-10').map((k) => [k, pct(P, k, prevY), r1((cq(k) / cq(prevY(k)) - 1) * 100)]);
}
{ const F = ym(fdef); out33.c33_gov = keysIn(F, '1963-01', '1971-01').map((k) => [k, pct(F, k, prevY), pct(CPIm, k, prevY)]); }               // 베트남전: 국방 지출 · CPI(분기 첫 달) 전년비

const out = Object.assign({ source: 'FRED, Federal Reserve Bank of St. Louis', fetched: new Date().toISOString().slice(0, 10), mult, qe, dw, grow, vel }, out28, out33);
writeFileSync(new URL('../public/econ2/graphs/real-data.json', import.meta.url), JSON.stringify(out));
console.log(Object.keys(out).filter((k) => Array.isArray(out[k])).map((k) => k + ' ' + out[k].length).join(', '));
