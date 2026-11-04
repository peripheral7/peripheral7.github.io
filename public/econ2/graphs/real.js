/* Econ2 Interactive — Real world 모드
   · 토글 [Basic | Real world] · localStorage 'econ2.mode' · <html class="rw">
   · 카드: 예측 질문 → 실제 데이터 그래프 → 이론 대조 → 뉴스·연구
   · 데이터: real-data.json (FRED, scripts/econ2-real-data.mjs) */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const KEY = 'econ2.mode';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const put = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* no storage */ } };

  /* ───────── 사례 ───────── */
  // m 버튼 · q 질문 · opts/ans 선택 · v 공개 · chart · th · src(k d t s u)
  const FED = 'https://www.federalreserve.gov/';
  const CASES = [
    {
      m: /^Reserve ratio cut/, when: 'March 2020 · United States', title: 'The Fed cut the reserve requirement to 0%',
      q: 'In March 2020 the Fed cut the required reserve ratio to 0%. In the model, the multiplier 1/R would explode. What happened to the money multiplier (M2 ÷ monetary base) over the next month?',
      opts: ['Shot up', 'Rose a little', 'Fell'], ans: 2,
      v: 'It fell — from 4.5 (Feb 2020) to 3.5 (Apr 2020).',
      chart: { k: 'mult', from: '2017-01', to: '2022-12', vline: ['2020-03', '0% requirement'], marks: [['2020-02', 0, '4.5'], ['2020-04', 0, '3.5']], y: 'M2 ÷ monetary base', cap: 'M2SL ÷ BOGMBASE, monthly' },
      th: 'The rule was not binding. In Feb 2020 banks held ==$1.73 trillion of reserves but only $0.21 trillion was required==, so the R that matters — the share of deposits banks choose to hold as reserves — did not move when the rule went to 0%. At the same time the Fed created reserves fast (monetary base +40%, Feb → Apr), and banks kept them.',
      src: [
        { k: 'News', d: 'Mar 15, 2020', by: 'Federal Reserve', t: 'Reserve requirements cut to zero', s: 'The Board set all reserve requirement ratios to 0% from March 26, saying requirements no longer play a significant role now that it runs an "ample reserves" system.', u: FED + 'newsevents/pressreleases/monetary20200315b.htm' },
        { k: 'Research', d: '2020', by: 'Ihrig & Wolla, Federal Reserve Board', t: 'Let\'s close the gap: Revising teaching materials to reflect how the Federal Reserve implements monetary policy', s: 'Textbooks still teach the reserve-requirement and money-multiplier story, but the Fed now steers interest rates mainly through the interest it pays on reserves.', u: FED + 'econres/feds/lets-close-the-gap-revising-teaching-materials-to-reflect-how-the-federal-reserve-implements-monetary-policy.htm' }
      ]
    },
    {
      m: /^Banks hold more excess reserves/, when: '2008–2014 · United States', title: 'Banks piled up excess reserves',
      q: 'After the 2008 crisis, bank reserves grew from $46 billion to $2.8 trillion (Aug 2008 → Aug 2014) — far more than required. What happened to the money multiplier (M2 ÷ monetary base)?',
      opts: ['Rose', 'Stayed near 9', 'Fell'], ans: 2,
      v: 'It fell — from 9.2 to 2.8.',
      chart: { k: 'mult', from: '2000-01', to: '2019-12', band: ['2008-09', '2014-10'], marks: [['2008-08', 0, '9.2'], ['2014-08', 0, '2.8']], y: 'M2 ÷ monetary base', cap: 'M2SL ÷ BOGMBASE, monthly' },
      th: 'Just as the model says: ==when banks hold more reserves, the reserve ratio R rises and the multiplier 1/R falls==. Banks held them because lending looked risky in the crisis and, from October 2008, the Fed paid interest on reserves.',
      src: [
        { k: 'News', d: 'Oct 6, 2008', by: 'Federal Reserve', t: 'The Fed starts paying interest on reserves', s: 'The Board announced it would pay interest on banks\' required and excess reserves — so simply holding reserves at the Fed now earned a return.', u: FED + 'newsevents/pressreleases/monetary20081006a.htm' }
      ]
    },
    {
      m: /^Fed buys/, when: 'Nov 2008 – Oct 2014 · United States', title: 'Quantitative easing: the Fed bought trillions in bonds',
      q: 'Bond purchases (QE) raised the monetary base from $0.85 trillion to $4.08 trillion (Aug 2008 → Aug 2014). With the 2008 multiplier of 9.2, the textbook predicts M2 rises by about $30 trillion. How much did M2 actually rise?',
      opts: ['About +$30 trillion', 'About +$10 trillion', 'About +$3.7 trillion'], ans: 2,
      v: 'About +$3.7 trillion ($7.8T → $11.5T). The base grew ×4.8, M2 only ×1.47.',
      chart: { k: 'qe', from: '2006-01', to: '2016-12', band: ['2008-11', '2014-10'], marks: [['2014-08', 0, '×4.8'], ['2014-08', 1, '×1.47']], names: ['Monetary base', 'M2'], y: 'Index, Aug 2008 = 100', cap: 'BOGMBASE and M2SL, monthly, Aug 2008 = 100' },
      th: 'Step one of the model worked: ==buying bonds added reserves dollar for dollar==. Step two — banks lending the new reserves out again and again — mostly did not happen. The reserves stayed at the Fed as excess reserves (see "Banks hold more excess reserves").',
      src: [
        { k: 'News', d: 'Nov 25, 2008', by: 'Federal Reserve', t: 'The Fed launches large-scale purchases of mortgage-backed securities', s: 'The start of QE1: the Fed said it would buy debt issued by Fannie Mae, Freddie Mac and the Federal Home Loan Banks, plus mortgage-backed securities they guarantee.', u: FED + 'newsevents/pressreleases/monetary20081125b.htm' },
        { k: 'Research', d: '2009', by: 'Keister & McAndrews, New York Fed Staff Report 380', t: 'Why are banks holding so many excess reserves?', s: 'The total amount of reserves is set by the Fed\'s own actions; banks as a group cannot lend it away. A huge stock of reserves does not by itself mean banks stopped lending.', u: 'https://www.newyorkfed.org/research/staff_reports/sr380.html' }
      ]
    },
    {
      m: /^Fed lends/, when: 'March 2023 · United States', title: 'Silicon Valley Bank run: banks borrow from the Fed',
      q: 'Silicon Valley Bank failed on March 10, 2023 after depositors rushed to pull their money. Discount-window loans to banks were $4.6 billion in the week of March 8. What were they one week later?',
      opts: ['About $10 billion', 'About $50 billion', 'About $153 billion'], ans: 2,
      v: '$152.9 billion — a record, above the 2008 crisis peak of $110.7 billion.',
      chart: { k: 'dw', from: '2019-01-01', to: '2024-06-30', marks: [['2020-03-25', 0, 'COVID $51B'], ['2023-03-15', 0, 'SVB $153B']], y: 'Discount-window loans, $ billion', cap: 'WLCFLPCL (primary credit), weekly' },
      th: 'As in the model, ==loans from the Fed add reserves and raise the monetary base==. But banks borrowed to pay depositors who were leaving, not to make new loans: the Fed acted as lender of last resort, keeping deposits — and the money supply — from collapsing rather than expanding them.',
      src: [
        { k: 'News', d: 'Mar 12, 2023', by: 'Treasury, Federal Reserve and FDIC', t: 'Joint statement on Silicon Valley Bank and Signature Bank', s: 'All depositors of the two failed banks would be protected, and the Fed opened a new Bank Term Funding Program lending to banks for up to one year.', u: FED + 'newsevents/pressreleases/monetary20230312a.htm' }
      ]
    }
  ];

  /* ───────── 선그래프 ───────── */
  const W = 640, H = 290, L = 52, R = 18, T = 30, B = 30;
  const COL = ['#1f6fd1', '#1f2537'];
  const yr = (d) => { const p = d.split('-').map(Number); return p[0] + (p[1] - 1) / 12 + ((p[2] || 1) - 1) / 365; };
  function nice(max) { const s = Math.pow(10, Math.floor(Math.log10(max / 4))); return [1, 2, 2.5, 5, 10].map((k) => k * s).find((k) => max / k <= 5); }
  function chart(c, data) {
    const rows = data[c.k].filter((r) => r[0] >= c.from && r[0] <= c.to);
    const n = rows[0].length - 1, xs = rows.map((r) => yr(r[0]));
    let ymax = 0; rows.forEach((r) => { for (let j = 1; j <= n; j++) ymax = Math.max(ymax, r[j]); });
    const step = nice(ymax * 1.08), top = Math.ceil(ymax * 1.08 / step) * step;
    const x0 = xs[0], x1 = xs[xs.length - 1];
    const X = (x) => L + (x - x0) / (x1 - x0) * (W - L - R), Y = (y) => T + (1 - y / top) * (H - T - B);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(c.y) + '">';
    if (c.band) s += '<rect x="' + X(yr(c.band[0])) + '" y="' + T + '" width="' + (X(yr(c.band[1])) - X(yr(c.band[0]))) + '" height="' + (H - T - B) + '" fill="#fff3b0" opacity=".7"/>';
    for (let v = 0; v <= top + 1e-9; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#e3e6ea"/><text x="' + (L - 8) + '" y="' + (Y(v) + 6) + '" text-anchor="end" class="ax">' + (+v.toFixed(2)) + '</text>';
    const span = x1 - x0, ys = span > 12 ? 4 : span > 6 ? 2 : 1;
    for (let y = Math.ceil(x0); y <= x1; y++) if (y % ys === 0) s += '<line x1="' + X(y) + '" x2="' + X(y) + '" y1="' + (H - B) + '" y2="' + (H - B + 5) + '" stroke="#8d93a0"/><text x="' + X(y) + '" y="' + (H - 6) + '" text-anchor="middle" class="ax">' + y + '</text>';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="#1f2537" stroke-width="1.5"/>';
    if (c.vline) { const vx = X(yr(c.vline[0])); s += '<line x1="' + vx + '" x2="' + vx + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#c8352e" stroke-width="2" stroke-dasharray="5 4"/><text x="' + (vx + 6) + '" y="' + (T + 14) + '" class="vl">' + esc(c.vline[1]) + '</text>'; }
    for (let j = 1; j <= n; j++) s += '<polyline fill="none" stroke="' + COL[j - 1] + '" stroke-width="' + (j === 1 ? 3 : 2.5) + '" stroke-linejoin="round" points="' + rows.map((r, i) => X(xs[i]).toFixed(1) + ',' + Y(r[j]).toFixed(1)).join(' ') + '"/>';
    if (c.names) s += c.names.map((nm, j) => '<line x1="' + (L + 10 + j * 200) + '" x2="' + (L + 34 + j * 200) + '" y1="' + (T - 12) + '" y2="' + (T - 12) + '" stroke="' + COL[j] + '" stroke-width="3"/><text x="' + (L + 40 + j * 200) + '" y="' + (T - 6) + '" class="lg">' + esc(nm) + '</text>').join('');
    else s += '<text x="' + L + '" y="' + (T - 10) + '" class="lg">' + esc(c.y) + '</text>';
    (c.marks || []).forEach((mk) => {
      const r = rows.find((q) => q[0].indexOf(mk[0]) === 0); if (!r) return;
      const px = X(yr(r[0])), py = Y(r[mk[1] + 1]), right = px > W - 120;
      s += '<circle cx="' + px + '" cy="' + py + '" r="6" fill="#fff" stroke="' + COL[mk[1]] + '" stroke-width="3"/><text x="' + (px + (right ? -10 : 10)) + '" y="' + (py - 10) + '" text-anchor="' + (right ? 'end' : 'start') + '" class="mk">' + esc(mk[2]) + '</text>';
    });
    return s + '</svg>';
  }

  /* ───────── 카드 ───────── */
  let data = null, cur = null;
  const fmtT = (s) => esc(s).replace(/==(.+?)==/g, '<mark>$1</mark>');
  function render(card) {
    const c = cur;
    if (!c) { card.innerHTML = '<p class="rwnote"><span class="rwtag">Real world</span>Pick an event marked <b class="rwchip">REAL</b> to test the model against U.S. data.</p>'; return; }
    if (c === 'none') { card.innerHTML = '<p class="rwnote"><span class="rwtag">Real world</span>No real-world case for this event yet — try one marked <b class="rwchip">REAL</b>.</p>'; return; }
    card.innerHTML =
      '<div class="rwhd"><span class="rwtag">Real world</span><span class="rwwhen">' + esc(c.when) + '</span></div>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p class="rwq"><b>Predict first.</b> ' + esc(c.q) + '</p>' +
      '<div class="rwopts">' + c.opts.map((o, i) => '<button type="button" data-i="' + i + '">' + esc(o) + '</button>').join('') + '<button type="button" class="rwskip" data-i="-1">Just show me</button></div>' +
      '<div class="rwans" hidden>' +
      '<p class="rwv"></p>' +
      '<figure class="rwfig">' + (data ? chart(c.chart, data) : '<p class="rwnote">Data could not be loaded.</p>') + '<figcaption>Source: FRED — ' + esc(c.chart.cap) + (data ? ' · retrieved ' + esc(data.fetched) : '') + (c.chart.band ? ' · shaded: event period' : '') + '</figcaption></figure>' +
      '<p class="rwth"><span class="lb">Theory vs reality</span>' + fmtT(c.th) + '</p>' +
      '<ul class="rwsrc">' + c.src.map((x) => '<li><span class="lb">' + x.k + '</span><div><a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a><small>' + esc(x.by) + ' · ' + esc(x.d) + '</small><p>' + esc(x.s) + '</p></div></li>').join('') + '</ul>' +
      '</div>';
    card.querySelectorAll('.rwopts button').forEach((b) => b.addEventListener('click', () => {
      const i = +b.getAttribute('data-i');
      card.querySelectorAll('.rwopts button').forEach((x) => { const k = +x.getAttribute('data-i'); x.disabled = true; x.classList.toggle('ok', k === c.ans); x.classList.toggle('no', k === i && i !== c.ans); });
      $('.rwv', card).innerHTML = (i < 0 ? '' : i === c.ans ? '<b class="ok">✓ Right.</b> ' : '<b class="no">✗ Not quite.</b> ') + esc(c.v);
      $('.rwans', card).hidden = false;
    }));
  }

  /* ───────── 붙이기 ───────── */
  function init() {
    const sec = $('#c29'), fig = sec && $('.fig', sec), ul = $('#o29 ul');
    if (!fig || !ul) return;
    const card = document.createElement('div'); card.className = 'rwcard'; card.id = 'rw29'; card.setAttribute('aria-live', 'polite');
    fig.appendChild(card);
    const caseOf = (b) => CASES.find((c) => c.m.test(b.textContent.trim())) || null;
    ul.querySelectorAll('li button').forEach((b) => { if (caseOf(b)) b.parentNode.classList.add('hasrw'); });
    // 클릭된 사건 읽기
    ul.addEventListener('click', () => {
      const b = $('button[aria-pressed="true"]', ul);
      cur = b ? caseOf(b) || 'none' : null;
      render(card);
    });
    render(card);
    fetch('/econ2/graphs/real-data.json').then((r) => r.json()).then((d) => { data = d; if (cur && cur !== 'none' && $('.rwans', card).hidden) render(card); }).catch(() => {});

    // 모드 토글
    const links = $('.top .links'), tg = document.createElement('div');
    tg.className = 'rwtog'; tg.setAttribute('role', 'group'); tg.setAttribute('aria-label', 'Mode');
    tg.innerHTML = '<button type="button" data-m="basic">Basic</button><button type="button" data-m="rw">Real world</button>';
    links.parentNode.insertBefore(tg, links);
    const set = (m) => {
      document.documentElement.classList.toggle('rw', m === 'rw');
      tg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)));
    };
    tg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const m = b.getAttribute('data-m'); put(m); set(m); });
    set(get() === 'rw' ? 'rw' : 'basic');
  }
  init();
})();
