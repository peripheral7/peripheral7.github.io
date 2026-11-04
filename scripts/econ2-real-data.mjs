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

const [base, m2, wl] = await Promise.all(['BOGMBASE', 'M2SL', 'WLCFLPCL'].map(get));
const M2 = new Map(m2);
// 통화승수(넓은 뜻) = M2 ÷ 본원통화, 월별
const mult = base.filter(([d]) => d >= '2000-01-01' && M2.has(d)).map(([d, b]) => [d.slice(0, 7), r2(M2.get(d) / b)]);
// QE: 2008-08 = 100 으로 맞춘 본원통화 · M2
const B0 = base.find(([d]) => d === '2008-08-01')[1], Q0 = M2.get('2008-08-01');
const qe = range(base, '2006-01-01', '2016-12-01').map(([d, b]) => [d.slice(0, 7), Math.round(b / B0 * 100), Math.round(M2.get(d) / Q0 * 100)]);
// 재할인 창구(primary credit) 대출, 주별, 십억 달러
const dw = range(wl, '2019-01-01', '2024-06-30').map(([d, v]) => [d, Math.round(v / 100) / 10]);

const out = { source: 'FRED, Federal Reserve Bank of St. Louis', fetched: new Date().toISOString().slice(0, 10), mult, qe, dw };
writeFileSync(new URL('../public/econ2/graphs/real-data.json', import.meta.url), JSON.stringify(out));
console.log('mult', mult.length, 'qe', qe.length, 'dw', dw.length);
