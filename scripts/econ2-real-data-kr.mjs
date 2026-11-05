// Econ2 Interactive 현실 연결 모드 — 한국 사례 데이터. 한국은행 ECOS OpenAPI('sample' 키: 키 없이 한 번에 10행)에서 받아
// public/econ2/graphs/real-data.json 에 kr_* 키로 덧붙인다(FRED 계열은 건드리지 않음).
// 실행: node scripts/econ2-real-data-kr.mjs   (값이 바뀌면 real.js · real-ko.js 의 한국 카드 문장 숫자도 함께 확인)
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/econ2/graphs/real-data.json', import.meta.url);
const ym = (y, m) => y + String(m).padStart(2, '0');
const months = (a, b) => { const out = []; let [y, m] = [+a.slice(0, 4), +a.slice(4)]; for (;;) { const k = ym(y, m); out.push(k); if (k === b) return out; if (++m > 12) { m = 1; y++; } } };
// 월별 계열: 10개월씩 끊어 받는다 → Map('YYYYMM' → 값)
async function series(stat, item1, item2, from, to) {
  const all = months(from, to), out = new Map();
  for (let i = 0; i < all.length; i += 10) {
    const s = all[i], e = all[Math.min(i + 9, all.length - 1)];
    const url = 'https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/10/' + stat + '/M/' + s + '/' + e + '/' + item1 + (item2 ? '/' + item2 : '');
    const j = await (await fetch(url)).json();
    if (!j.StatisticSearch) throw new Error(stat + ' ' + item1 + ' ' + JSON.stringify(j).slice(0, 200));
    j.StatisticSearch.row.forEach((r) => out.set(r.TIME, +r.DATA_VALUE));
  }
  return out;
}
const r1 = (x) => Math.round(x * 10) / 10;
const prevY = (k) => (+k.slice(0, 4) - 1) + k.slice(4);
const key = (k) => k.slice(0, 4) + '-' + k.slice(4);

// 사례 1(Ch30): M2(평잔, 원계열) · 소비자물가지수(2020=100), 전년 같은 달 대비 %
const M2 = await series('161Y006', 'BBHA00', '', '201701', '202312');
const CPI = await series('901Y009', '0', '', '201701', '202312');
const kr_money = months('201801', '202312').map((k) => [key(k), r1((M2.get(k) / M2.get(prevY(k)) - 1) * 100), r1((CPI.get(k) / CPI.get(prevY(k)) - 1) * 100)]);

// 사례 3(Ch28): 경제활동인구조사(원계열, 천 명) — 실업자 · 비경제활동인구(15세 이상 인구 − 경제활동인구), 전년 같은 달 대비 증감
const P15 = await series('901Y027', 'I61A', 'I28A', '201801', '202112');
const LF = await series('901Y027', 'I61B', 'I28A', '201801', '202112');
const UN = await series('901Y027', 'I61BB', 'I28A', '201801', '202112');
const EM = await series('901Y027', 'I61BA', 'I28A', '201801', '202112');
const UR = await series('901Y027', 'I61BC', 'I28A', '201801', '202112');
const NL = new Map([...P15].map(([k, v]) => [k, v - LF.get(k)]));
const kr_jobs = months('201901', '202112').map((k) => [key(k), UN.get(k) - UN.get(prevY(k)), NL.get(k) - NL.get(prevY(k))]);

// 카드 문장 숫자 확인용
const show = (name, m, ks) => console.log(name, ks.map((k) => k + '=' + m.get(k)).join(' '));
show('M2', M2, ['201912', '202012', '202112', '202212']); show('CPI', CPI, ['202012', '202112', '202207', '202212']);
console.log('2020-04 취업자', EM.get('202004'), '전년', EM.get('201904'), '차', EM.get('202004') - EM.get('201904'));
console.log('2020-04 실업률', UR.get('202004'), '전년', UR.get('201904'), ' 실업자 차', UN.get('202004') - UN.get('201904'), ' 비경활', NL.get('202004'), '차', NL.get('202004') - NL.get('201904'));

const out = JSON.parse(readFileSync(FILE, 'utf8'));
Object.assign(out, { fetched_kr: new Date().toISOString().slice(0, 10), kr_money, kr_jobs });
writeFileSync(FILE, JSON.stringify(out));
console.log('kr_money', kr_money.length, 'kr_jobs', kr_jobs.length);
