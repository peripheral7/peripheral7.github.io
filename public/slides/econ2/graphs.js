/* Econ2 덱 그래프 — 원본 장 그림 위의 그래프 자리(<div class="g" data-g="이름">)를 움직이는 SVG 그래프로 덮는다.
   · 장마다 SCN[이름] 의 states 가 단계다. 시작 상태(start) 뒤의 상태 수 = 그 슬라이드 안 빈 <i class="step"> 개수.
     → 키로 단계가 하나 나타날 때마다 곡선이 다음 상태로 움직인다(← 는 되돌림, 앞 장에서 돌아오면 마지막 상태로 바로).
   · drag 가 있는 곡선은 마우스·손가락으로 끌 수 있다 — 끌면 지금 상태를 흐리게 남기고 새 균형점을 보여 준다. ↺ 로 되돌린다.
   · 「원본」 단추는 덮개를 걷어 PDF 원래 그림을 보여 준다.
   좌표: 곡선·점은 각 판(panel)의 데이터 단위(dom = [x0, x1, y0, y1]), 글자 위치·여백은 SVG 픽셀(= 무대 픽셀).
   글자의 '_' 뒤는 아래 첨자(P_1, AD_2, L_E). */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1f2537', blue: '#1f6fd1', ghost: '#b3b8c2', guide: '#8d93a0', red: '#c8352e', soft: '#5b6170' };
  const LETTERS = 'ABCDEFGH';
  const EASE = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ───────── 장별 그래프 ───────── */
  // AD–AS 공통: LRAS x=5, AD·SRAS 는 (5,5)를 지나는 기울기 ∓0.85 직선. 좌우 1.6 이동이면 새 SRAS 가 새 AD 와 LRAS 위에서 만난다.
  const EQ = [['AD', 'SRAS']];
  function adas(o) {
    return {
      panels: [{
        dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: o.xTitle || 'Y', yTitle: o.yTitle || 'P', star: o.star,
        curves: [
          { id: 'LRAS', kind: 'vert', x: 5, y0: 1.2, y1: 9.4, lab: 'LRAS', drag: o.dragLRAS ? 'x' : null },
          { id: 'SRAS', kind: 'line', x: 5, y: 5, m: 0.85, span: 3.6, lab: 'SRAS', drag: 'x' },
          { id: 'AD', kind: 'line', x: 5, y: 5, m: -0.85, span: 3.6, lab: 'AD', drag: 'x' }
        ]
      }],
      states: o.states, start: o.start || 0
    };
  }
  function sticky(n) {
    const s = [{ off: {}, pts: EQ }, { off: { AD: 1.6 }, pts: EQ, say: ['통화량 5% ↑ → AD → : 단기 Y ↑ · P ↑', 'Money +5% → AD → : short-run Y ↑ · P ↑'] }];
    if (n > 1) s.push({ off: { AD: 1.6, SRAS: -1.6 }, pts: EQ, say: ['명목임금 조정 → SRAS ← : Y 원래대로, P 만 ↑', 'Nominal wages adjust → SRAS ← : Y back, only P ↑'] });
    return s;
  }
  const SCN = {
    // 11 — Figure 30-2: MS = 5,000, MD_1(1/P = 0.5) · MD_2(1/P = 0.875). 2009 = MD_2, 2010 = MD_1
    p11: {
      panels: [{
        dom: [0, 9000, 0, 1.25], xName: 'M', yName: '1/P', xTitle: 'M', yTitle: '1/P',
        yTicks: [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.125],
        curves: [
          { id: 'MS', kind: 'vert', x: 5000, y0: 0, y1: 1.18, lab: 'MS', drag: 'x', range: [-2500, 2500] },
          { id: 'MD', kind: 'hyper', k: 2500, ylim: 1.2, xmax: 8600, lab: 'MD', subs: [2, 1], drag: 'x', range: [-1500, 3500] }
        ]
      }],
      states: [
        { off: { MD: 2143 }, pts: [['MS', 'MD', '2009', { yl: ' ', xv: true, d: [12, -12] }]], say: '2009: MD_2 → 1/P = 0.875' },
        { off: { MD: 0 }, pts: [['MS', 'MD', '2010', { yl: ' ', xv: true, d: [-58, 26] }]], say: '2010: MD_1 → 1/P = 0.5' }
      ],
      read(ctx) {
        const p = ctx.cur[0]; if (!p) return [];
        const P = 1 / p.y, V = P * 30000 / p.x;
        const l1 = '1/P = ' + fmt(p.y, 3) + ' → P = ' + fmt(P, 3) + ' · V = PY/M = ' + fmt(V, 1);
        const q = ctx.prev[0];
        return [l1, q && !ctx.free ? tr(['물가상승률 = ', 'Inflation = ']) + fmt(q.y, 3) + ' / ' + fmt(p.y, 3) + ' − 1 = ' + fmt((q.y / p.y - 1) * 100, 0) + '%' : ctx.say];
      },
      pad: { l: 66, r: 70 }
    },
    // 15 — 신용카드 확대 → MD ← → 1/P ↓(P ↑). 물가를 지키려면 Fed 가 MS ←
    p15: {
      panels: [{
        dom: [0, 10, 0, 10], xName: 'M', yName: '1/P', xTitle: 'M', yTitle: 'Value of Money  1/P', invY: true, ptD: [12, -12],
        curves: [
          { id: 'MS', kind: 'vert', x: 6, y0: 0.6, y1: 9.4, lab: 'MS', drag: 'x' },
          { id: 'MD', kind: 'hyper', k: 30, ylim: 9.2, xmax: 9.6, lab: 'MD', drag: 'x', range: [-3, 2] }
        ]
      }],
      states: [
        { off: {}, pts: [['MS', 'MD']] },
        { off: { MD: -1.6 }, pts: [['MS', 'MD']], say: ['카드 확대 → MD ← : 1/P ↓, P ↑', 'More credit cards → MD ← : 1/P ↓, P ↑'] },
        { off: { MD: -1.6, MS: -1.6 }, pts: [['MS', 'MD']], say: ['Fed 가 MS ← : 1/P 회복, P 안정', 'Fed cuts MS ← : 1/P restored, P stable'] }
      ],
      pad: { l: 70 }
    },
    p17: adas({ star: true, states: [{ off: {}, pts: EQ }, { off: { AD: 1.6 }, pts: EQ, say: 'C · I · G · NX ↑ → AD →' }] }),
    p18: adas({
      star: true,
      states: [
        { off: {}, pts: EQ, say: ['장기: P = Pe, Y = Y* · 단기: Y = Y* + α(P − Pe)', 'Long run: P = Pe, Y = Y* · Short run: Y = Y* + α(P − Pe)'] },
        { off: { SRAS: -1.6 }, pts: EQ, say: ['Pe · 임금 · 원가 ↑ → SRAS ← : 스태그플레이션', 'Pe · wages · costs ↑ → SRAS ← : stagflation'] }
      ]
    }),
    p19: adas({ star: true, states: [{ off: {}, pts: EQ }, { off: { SRAS: -1.6 }, pts: EQ, say: ['Pe ↑ → SRAS ← (LRAS 그대로)', 'Pe ↑ → SRAS ← (LRAS unchanged)'] }] }),
    p22: adas({ xTitle: 'Real GDP', yTitle: 'Price level', states: sticky(1) }),
    p24: adas({ xTitle: 'Real GDP', yTitle: 'Price level', states: sticky(2), start: 1 }),
    // 25 — 경직적 임금: A → B(명목임금 W 그대로, P ↑ → 실질임금 ↓) → C(W 가 P 만큼 올라 실질임금 원래대로). 아래 표가 A · B · C 의 W · P · W/P
    p25: Object.assign(adas({
      xTitle: 'Real GDP', yTitle: 'Price level',
      states: [
        { off: {}, pts: EQ, say: ['장기균형 A: W = P = 100 (지수) → 실질임금 100', 'Long-run equilibrium A: W = P = 100 (index) → real wage 100'] },
        { off: { AD: 1.6 }, pts: EQ, say: ['명목임금 W 고정 · P ↑ → 실질임금 ↓ → 고용 · Y ↑', 'W fixed · P ↑ → real wage ↓ → hiring · Y ↑'] },
        { off: { AD: 1.6, SRAS: -1.6 }, pts: EQ, say: ['명목임금이 P 만큼 오름 → 실질임금 A 수준 · Y = Y*', 'W rises as much as P → real wage back to A · Y = Y*'] }
      ]
    }), { extra: wageTable, pad: { l: 60, r: 92, b: 196 } }),
    // 26 — 투자 붐: AD → (B) → 임금·물가 기대 조정으로 SRAS ← (C) → 자본이 늘면 LRAS·SRAS → (D)
    p26: adas({
      xTitle: 'Real GDP', yTitle: 'Price level', dragLRAS: true,
      states: [
        { off: {}, pts: EQ },
        { off: { AD: 1.6 }, pts: EQ, say: ['투자 ↑ → AD → : Y ↑ · P ↑', 'Investment ↑ → AD → : Y ↑ · P ↑'] },
        { off: { AD: 1.6, SRAS: -1.6 }, pts: EQ, say: ['임금 · 물가 기대 조정 → SRAS ←', 'Wage and price expectations adjust → SRAS ←'] },
        { off: { AD: 1.6, SRAS: -0.4, LRAS: 1 }, pts: EQ, say: ['자본 ↑ → LRAS · SRAS → : 장기 Y ↑', 'Capital ↑ → LRAS · SRAS → : long-run Y ↑'] }
      ]
    }),
    // 23 — 화폐시장(MS → r ↓ → I ↑)과 AD–AS(AD →)를 이어 둠: AD 이동 = MS 이동 × 0.9
    p23: {
      panels: [
        {
          title: 'Money market (given P)', dom: [0, 10, 0, 10], xName: 'M', yName: 'r', xTitle: 'M', yTitle: 'r', ptD: [12, -12],
          curves: [
            { id: 'MS', kind: 'vert', x: 4, y0: 0.6, y1: 9.4, lab: 'MS', drag: 'x', range: [-2.5, 3.5] },
            { id: 'MD', kind: 'line', x: 4, y: 6, m: -0.9, span: 4.6, lab: 'MD', drag: 'x', range: [-2, 2] }
          ],
          pts: [['MS', 'MD']]
        },
        {
          title: 'Aggregate demand–aggregate supply', dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: 'Y', yTitle: 'P', star: true,
          curves: [
            { id: 'LRAS', kind: 'vert', x: 5, y0: 1.2, y1: 9.4, lab: 'LRAS' },
            { id: 'SRAS', kind: 'line', x: 5, y: 5, m: 0.85, span: 3.6, lab: 'SRAS', drag: 'x' },
            { id: 'AD', kind: 'line', x: 5, y: 5, m: -0.85, span: 3.6, lab: 'AD', follow: { id: 'MS', k: 0.9 } }
          ],
          pts: EQ
        }
      ],
      states: [{ off: {} }, { off: { MS: 1.8 }, say: ['MS ↑ → r ↓ → I ↑ → AD → : 단기 Y ↑ · P ↑', 'MS ↑ → r ↓ → I ↑ → AD → : short-run Y ↑ · P ↑'] }],
      pad: { l: 56, r: 80, t: 132, gap: 40 }
    },
    // 29 — 균형보다 높은 임금(노조 · 효율임금 · 최저임금) → 노동 공급 > 수요 = 실업. 균형보다 낮은 최저임금은 효과 없음
    p29: {
      panels: [{
        dom: [0, 10, 0, 10], xName: 'L', yName: 'W', xTitle: 'Quantity of labor', yTitle: 'Wage',
        curves: [
          { id: 'S', kind: 'line', x: 5, y: 5, m: 0.9, span: 4.3, lab: 'Supply', drag: 'x', range: [-1.5, 1.5] },
          { id: 'D', kind: 'line', x: 5, y: 5, m: -0.9, span: 4.3, lab: 'Demand', drag: 'x', range: [-1.5, 1.5] },
          { id: 'W', kind: 'horiz', y: 7, x0: 0, x1: 9.6, lab: 'W', from: 1, drag: 'y', range: [-6, 2.4], color: C.red, ghost: false, plain: true, axisLab: true }
        ],
        pts: [['S', 'D', '', { xl: 'L_E', yl: 'W_E' }]]
      }],
      states: [
        { off: {} },
        { off: { W: 0 }, say: ['노조 · 효율임금 · 최저임금 → W > W_E → 실업', 'Unions · efficiency wages · minimum wage → W > W_E → unemployment'] },
        { off: { W: -3.4 }, say: ['최저임금 < W_E → 구속력 없음(W_E · L_E 그대로)', 'Minimum wage < W_E → not binding (W_E · L_E unchanged)'] }
      ],
      read(ctx) { return [ctx.labor || '', ctx.free ? '' : ctx.say]; },
      extra: laborExtra,
      pad: { r: 150 }
    }
  };

  // 경직적 임금 표(25쪽): 명목임금 W 는 기대물가 Pe 에 맞춰 정해진다고 보고 = SRAS 가 Y*(LRAS) 에서 갖는 높이,
  // 물가 P = 균형점 높이. 둘 다 A 를 100 으로 한 지수, 실질임금 = W / P × 100. 지금 열(글자 파랑)은 애니메이션·끌기에 따라 값이 움직인다
  function wageTable(g, pn, st, ctx, shown, P) {
    const S = pn.curves.find((c) => c.id === 'SRAS'), base = S.y;
    const rows = [];
    shown.forEach((s, i) => {
      const p = (P[i] || [])[0];
      if (!p) return;
      const W = 100 * fy(S, offOf(S, s.off), 5) / base, Pi = 100 * p.y / base;
      rows.push({ lab: p.lab, W, P: Pi, R: W / Pi * 100, now: i === shown.length - 1 });
    });
    // A · B · C 를 가로로 나란히, 각 열은 분수 W / P = 실질임금. 바로 앞 열보다 오르면 ↑(파랑), 내리면 ↓(빨강), 그대로면 =(회색)
    const top = this.H - 128, x0 = 14, lx = 150, colW = Math.min(110, (this.W - lx - 14) / Math.max(3, rows.length));
    const cx = (i) => lx + colW * (i + 0.5), yW = top + 40, yBar = top + 50, yP = top + 74, yR = top + 106;
    svg('line', { x1: x0, x2: this.W - 14, y1: top - 8, y2: top - 8, stroke: C.ghost, 'stroke-width': 1 }, g);
    label(g, x0, yW, tr(['명목임금 W', 'Nominal wage W']), { size: 16, color: C.soft, weight: 600 });
    label(g, x0, yP, tr(['물가 P', 'Price level P']), { size: 16, color: C.soft, weight: 600 });
    label(g, x0, yR, tr(['= 실질임금 W/P', '= Real wage W/P']), { size: 16, color: C.ink, weight: 700 });
    svg('line', { x1: x0, x2: lx - 18, y1: yBar, y2: yBar, stroke: C.soft, 'stroke-width': 1.5 }, g);
    const mark = (a, b) => (Math.abs(b - a) < 0.5 ? ['=', C.ghost] : b > a ? ['↑', C.blue] : ['↓', C.red]);
    rows.forEach((r, i) => {
      const x = cx(i), prev = rows[i - 1];
      label(g, x, top + 12, r.lab, { anchor: 'middle', size: 19, weight: 700, color: r.now ? C.blue : C.ink });
      svg('line', { x1: x - 30, x2: x + 30, y1: yBar, y2: yBar, stroke: C.ink, 'stroke-width': 1.8 }, g);
      [['W', yW, 500], ['P', yP, 500], ['R', yR, 700]].forEach(([k, y, w]) => {
        const t = svg('text', { x: x + 6, y, 'text-anchor': 'end', 'font-size': 18, 'font-weight': w, fill: C.ink }, g);
        t.textContent = fmt(r[k], 0);
        if (prev) {
          const m = mark(prev[k], r[k]);
          const u = svg('text', { x: x + 10, y, 'font-size': 18, 'font-weight': 700, fill: m[1] }, g);
          u.textContent = m[0];
        }
      });
    });
  }

  // 노동시장: W 가 균형보다 높으면 L_D · L_S 와 실업(공급 − 수요) 화살표, 낮으면 "효과 없음"
  function laborExtra(g, pn, st, ctx) {
    const W = pn.curves.find((c) => c.id === 'W');
    if (!this.visible(W, st.j)) return;
    const S = pn.curves.find((c) => c.id === 'S'), D = pn.curves.find((c) => c.id === 'D');
    const e = meet(S, offOf(S, st.off), D, offOf(D, st.off), pn.dom);
    const w = W.y + offOf(W, st.off), X = (x) => this.X(pn, x), Y = (y) => this.Y(pn, y), b = pn.box;
    const endX = X(W.x1) + 8;
    if (!e || w <= e.y + 0.05) {
      label(g, endX, Y(w) - 4, 'Below-', { size: 15, color: C.red });
      label(g, endX, Y(w) + 14, 'equilibrium wage', { size: 15, color: C.red });
      label(g, endX, Y(w) + 32, tr(['→ 효과 없음', '→ no effect']), { size: 15, color: C.red, weight: 700 });
      ctx.labor = tr(['W < W_E : 시장 임금 W_E 그대로 → 실업 없음', 'W < W_E : market wage stays at W_E → no unemployment']);
      return;
    }
    const ld = meet(W, offOf(W, st.off), D, offOf(D, st.off), pn.dom), ls = meet(W, offOf(W, st.off), S, offOf(S, st.off), pn.dom);
    [[ld, 'L_D'], [ls, 'L_S']].forEach(([p, lab]) => {
      if (!p) return;
      svg('path', { d: 'M' + X(p.x) + ' ' + Y(p.y) + 'V' + (b[1] + b[3]), stroke: C.guide, 'stroke-width': 1.4, 'stroke-dasharray': '5 5', fill: 'none' }, g);
      svg('circle', { cx: X(p.x), cy: Y(p.y), r: 4.5, fill: C.red }, g);
      label(g, X(p.x), b[1] + b[3] + 24, lab, { anchor: 'middle', size: 18 });
    });
    if (ld && ls && X(ls.x) - X(ld.x) > 40) {
      const y = Y(w) - 22;
      arrow(g, X(ld.x) + 4, y, X(ls.x) - 4, y, C.red, true);
      label(g, (X(ld.x) + X(ls.x)) / 2, y - 12, 'Surplus of labor (unemployment)', { anchor: 'middle', size: 15, color: C.red });
    }
    label(g, endX, Y(w) - 4, 'Above-', { size: 15, color: C.red });
    label(g, endX, Y(w) + 14, 'equilibrium wage', { size: 15, color: C.red });
    if (ld && ls) ctx.labor = tr(['실업 = L_S − L_D = ', 'Unemployment = L_S − L_D = ']) + fmt((ls.x - ld.x) * 10, 0) + tr([' (그래프 단위)', ' (graph units)']);
  }

  /* ───────── 곡선 계산 ───────── */
  function offOf(c, off) {
    let v = off[c.id] || 0;
    if (c.follow) v += (off[c.follow.id] || 0) * c.follow.k;
    return v;
  }
  function fy(c, o, x) {                       // 곡선 c(이동량 o)의 x 에서의 높이
    if (c.kind === 'line') return c.y + c.m * (x - (c.x + o));
    if (c.kind === 'hyper') return x - o > 1e-9 ? c.k / (x - o) : Infinity;
    if (c.kind === 'horiz') return c.y + o;
    return NaN;
  }
  function meet(c1, o1, c2, o2, dom) {        // 두 곡선의 교점 {x, y} 또는 null
    if (c2.kind === 'vert') { const t = c1; c1 = c2; c2 = t; const u = o1; o1 = o2; o2 = u; }
    if (c1.kind === 'vert') { if (c2.kind === 'vert') return null; const x = c1.x + o1; return { x, y: fy(c2, o2, x) }; }
    const g = (x) => fy(c1, o1, x) - fy(c2, o2, x);
    const n = 240, a = dom[0], b = dom[1];
    let px = a + (b - a) / n, pg = g(px);
    for (let i = 2; i <= n; i++) {
      const x = a + (b - a) * i / n, v = g(x);
      if (isFinite(v) && isFinite(pg) && (v === 0 || (v > 0) !== (pg > 0))) {
        let lo = px, hi = x;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if ((g(m) > 0) === (g(lo) > 0)) lo = m; else hi = m; }
        const xm = (lo + hi) / 2;
        return { x: xm, y: fy(c1, o1, xm) };
      }
      px = x; pg = v;
    }
    return null;
  }

  /* ───────── SVG 도우미 ───────── */
  function svg(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function label(parent, x, y, s, o) {        // 'P_1' → P 와 아래 첨자 1
    o = o || {};
    const t = svg('text', { x, y, 'text-anchor': o.anchor || 'start', 'font-size': o.size || 19, fill: o.color || C.ink, 'font-weight': o.weight || 500 }, parent);
    String(s).split(/(_[^\s·:,()→/]+)/).forEach((part) => {
      if (!part) return;
      if (part[0] === '_') {
        svg('tspan', { dy: 5, 'font-size': '0.72em' }, t).textContent = part.slice(1);
        svg('tspan', { dy: -5 }, t).textContent = '​';
      } else svg('tspan', {}, t).textContent = part;
    });
    return t;
  }
  function arrowHead(parent, x, y, ang, color, size) {
    const s = size || 10, a1 = ang + 2.6, a2 = ang - 2.6;
    svg('path', { d: 'M' + x + ' ' + y + 'L' + (x + s * Math.cos(a1)) + ' ' + (y + s * Math.sin(a1)) + 'L' + (x + s * Math.cos(a2)) + ' ' + (y + s * Math.sin(a2)) + 'Z', fill: color }, parent);
  }
  function arrow(parent, x1, y1, x2, y2, color, both) {
    svg('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 2.4 }, parent);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    arrowHead(parent, x2, y2, ang, color);
    if (both) arrowHead(parent, x1, y1, ang + Math.PI, color);
  }
  // 덱 언어(영어면 [한국어, 영어] 짝의 둘째). 덱이 'deck:lang' 을 보내면 모든 그래프를 다시 그린다
  function tr(v) { return Array.isArray(v) ? v[window.Deck && Deck.lang && Deck.lang() === 'en' ? 1 : 0] : v; }
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function same(a, b) { return Math.abs(a - b) < 1e-6; }
  // 글자 폭 어림(18px 기준): 한글 1em, 그 밖 0.58em, 아래 첨자 0.42em
  function textW(s, size) {
    let w = 0, sub = false;
    for (const ch of String(s)) { if (ch === '_') { sub = true; continue; } if (ch === ' ') sub = false; w += sub ? 0.42 : /[ㄱ-힝]/.test(ch) ? 1 : 0.58; }
    return w * (size || 18);
  }
  // 후보 자리 [x, y, anchor] 중 이미 놓인 이름과 겹치지 않는 첫 자리(모두 겹치면 첫 자리)
  function place(boxes, s, cands) {
    const w = textW(s), h = 20;
    const box = (c) => { const x = c[2] === 'middle' ? c[0] - w / 2 : c[2] === 'end' ? c[0] - w : c[0]; return [x - 2, c[1] - h + 4, w + 4, h]; };
    const hit = (a) => boxes.some((q) => a[0] < q[0] + q[2] && q[0] < a[0] + a[2] && a[1] < q[1] + q[3] && q[1] < a[1] + a[3]);
    const pick = cands.find((c) => !hit(box(c))) || cands[0];
    boxes.push(box(pick));
    return pick;
  }
  function segDist(x, y, pts) {
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1], dx = pts[i][0] - ax, dy = pts[i][1] - ay, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return best;
  }

  /* ───────── 그래프 하나 ───────── */
  function Graph(box, sc) {
    this.box = box; this.sc = sc; this.slide = box.closest('.slide');
    this.k = sc.start || 0; this.free = null; this.anim = 0;
    this.W = parseFloat(box.style.width); this.H = parseFloat(box.style.height);
    this.svg = svg('svg', { viewBox: '0 0 ' + this.W + ' ' + this.H, class: 'gsvg', 'aria-hidden': 'true' }, box);
    this.layout();
    this.disp = this.target();
    this.tools();
    this.bindDrag();
    this.render();
  }
  Graph.prototype.layout = function () {
    const p = Object.assign({ l: 62, r: 96, t: 104, b: 64, gap: 60 }, this.sc.pad || {}), ps = this.sc.panels, h = this.H - p.t - p.b;
    if (ps.length === 1) { ps[0].box = [p.l, p.t, this.W - p.l - p.r, h]; return; }
    const w = (this.W - 2 * p.l - 2 * p.r - p.gap) / 2;          // 두 판: 각 판 왼쪽 여백(축 이름) · 오른쪽 여백(곡선 이름)이 같게
    ps[0].box = [p.l, p.t, w, h];
    ps[1].box = [p.l + w + p.r + p.gap + p.l, p.t, w, h];
  };
  Graph.prototype.target = function () { return Object.assign({}, this.free ? this.free.off : this.sc.states[this.k].off); };
  Graph.prototype.X = function (pn, x) { const b = pn.box, d = pn.dom; return b[0] + (x - d[0]) / (d[1] - d[0]) * b[2]; };
  Graph.prototype.Y = function (pn, y) { const b = pn.box, d = pn.dom; return b[1] + b[3] - (y - d[2]) / (d[3] - d[2]) * b[3]; };
  Graph.prototype.visible = function (c, j) { return c.from == null || j >= c.from; };

  // 곡선의 그릴 점들(픽셀)
  Graph.prototype.path = function (pn, c, o) {
    const d = pn.dom, X = (x) => this.X(pn, x), Y = (y) => this.Y(pn, y);
    if (c.kind === 'vert') { const x = c.x + o; return [[X(x), Y(c.y0 != null ? c.y0 : d[2])], [X(x), Y(c.y1 != null ? c.y1 : d[3])]]; }
    if (c.kind === 'horiz') return [[X(c.x0 != null ? c.x0 : d[0]), Y(c.y + o)], [X(c.x1 != null ? c.x1 : d[1]), Y(c.y + o)]];
    let a, b;
    if (c.kind === 'line') { a = c.x + o - c.span; b = c.x + o + c.span; } else { a = o + c.k / c.ylim; b = c.xmax != null ? c.xmax + Math.max(0, o) * 0.4 : d[1]; }
    a = Math.max(a, d[0] + (d[1] - d[0]) * 0.02); b = Math.min(b, d[1] - (d[1] - d[0]) * 0.02);
    const pts = [], n = c.kind === 'line' ? 40 : 60;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n, y = fy(c, o, x);
      if (y >= d[2] + (d[3] - d[2]) * 0.03 && y <= d[3]) pts.push([X(x), Y(y)]);
    }
    return pts;
  };
  Graph.prototype.d = function (pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(''); };

  // 곡선 이름의 아래 첨자: 모든 상태에서의 서로 다른 위치를 나타난 순서대로 1, 2, 3 … (subs 로 바꿔 붙일 수 있음)
  Graph.prototype.positions = function (c) {
    if (c._pos) return c._pos;
    const list = [];
    this.sc.states.forEach((st, j) => {
      if (!this.visible(c, j)) return;
      const o = offOf(c, st.off);
      if (!list.some((v) => same(v, o))) list.push(o);
    });
    return (c._pos = list);
  };
  Graph.prototype.curveLab = function (c, o, shownOffs) {
    if (c.plain) return c.lab;
    const pos = this.positions(c);
    if (pos.length < 2 && !shownOffs.some((v) => !same(v, shownOffs[0]))) return c.lab;
    const i = pos.findIndex((v) => same(v, o));
    const before = shownOffs.slice(0, -1).filter((v, j, a) => a.findIndex((u) => same(u, v)) === j).length;   // 끌어서 새로 만든 자리 = 앞에 보이는 자리 수 + 1
    const n = i < 0 ? before + 1 : i + 1;
    return c.lab + '_' + (c.subs && c.subs[n - 1] ? c.subs[n - 1] : n);
  };

  // 상태의 균형점들
  Graph.prototype.points = function (pn, st) {
    const list = pn.pts || this.sc.states[st.j].pts || [], out = [];
    list.forEach((q) => {
      const c1 = pn.curves.find((c) => c.id === q[0]), c2 = pn.curves.find((c) => c.id === q[1]);
      if (!c1 || !c2 || !this.visible(c1, st.j) || !this.visible(c2, st.j)) return;
      const m = meet(c1, offOf(c1, st.off), c2, offOf(c2, st.off), pn.dom);
      if (m) out.push({ x: m.x, y: m.y, lab: q[2] != null ? q[2] : st.letter, o: q[3] || {} });
    });
    return out;
  };

  /* ───────── 그리기 ───────── */
  Graph.prototype.render = function () {
    const s = this.svg, sc = this.sc, k = this.k, free = this.free;
    while (s.firstChild) s.removeChild(s.firstChild);
    svg('rect', { x: 0, y: 0, width: this.W, height: this.H, fill: '#fff' }, s);
    // 보이는 상태: 0..k (앞의 것은 흐리게) + 끌고 있으면 그 상태. 맨 끝이 "지금"이고 지금 위치는 애니메이션 중의 값(disp)
    const shown = [];
    for (let j = 0; j <= k; j++) shown.push({ j, off: sc.states[j].off, letter: LETTERS[j] });
    if (free) shown.push({ j: k, off: this.disp, letter: LETTERS[k + 1], free: true });
    else shown[k] = Object.assign({}, shown[k], { off: this.disp });
    const now = shown.length - 1, labelOff = this.target();
    const ctx = { cur: [], prev: [], free: !!free, k, say: tr(sc.states[k].say || '') };

    sc.panels.forEach((pn) => {
      const g = svg('g', {}, s), b = pn.box, X = (x) => this.X(pn, x), Y = (y) => this.Y(pn, y);
      if (pn.title) label(g, b[0] + b[2] / 2, b[1] - 52, pn.title, { anchor: 'middle', size: 18, color: C.soft, weight: 600 });
      // 축
      svg('path', { d: 'M' + b[0] + ' ' + (b[1] - 14) + 'V' + (b[1] + b[3]) + 'H' + (b[0] + b[2] + 14), fill: 'none', stroke: C.ink, 'stroke-width': 2 }, g);
      arrowHead(g, b[0], b[1] - 20, -Math.PI / 2, C.ink, 9); arrowHead(g, b[0] + b[2] + 20, b[1] + b[3], 0, C.ink, 9);
      label(g, b[0] + (pn.yTitle.length > 3 ? -8 : -12), b[1] - 26, pn.yTitle, { anchor: pn.yTitle.length > 3 ? 'start' : 'end', size: 18, color: C.soft });
      label(g, b[0] + b[2] + 18, b[1] + b[3] + 48, pn.xTitle, { anchor: 'end', size: 18, color: C.soft });
      (pn.yTicks || []).forEach((v) => {
        svg('line', { x1: b[0] - 5, x2: b[0], y1: Y(v), y2: Y(v), stroke: C.ink, 'stroke-width': 1.5 }, g);
        label(g, b[0] - 8, Y(v) + 5, String(v), { anchor: 'end', size: 14, color: C.soft });
      });

      const P = shown.map((st) => this.points(pn, st));
      pn._now = P[now] || []; pn._prev = now > 0 ? P[now - 1] : [];
      ctx.cur = ctx.cur.concat(pn._now); ctx.prev = ctx.prev.concat(pn._prev);

      // 축 위 이름: 나타난 순서대로 P_1, P_2 … · Y 는 처음 LRAS 위면 Y*
      const lr = pn.curves.find((c) => c.id === 'LRAS'), ys = [], xs = [];
      const name = (list, v, tol, base, from) => {
        let i = list.findIndex((u) => Math.abs(u - v) < tol);
        if (i < 0) { list.push(v); i = list.length - 1; }
        return base + '_' + (i + from);
      };
      P.forEach((pts, si) => pts.forEach((p) => {
        if (p.o.guide === false) return;
        const sx = (pn.dom[1] - pn.dom[0]) * 0.01, sy = (pn.dom[3] - pn.dom[2]) * 0.01;
        p._yl = p.o.yl || name(ys, p.y, sy, pn.yName, 1);
        p._xl = p.o.xl || (p.o.xv ? fmt(p.x, 0)
          : pn.star && lr && Math.abs(lr.x - p.x) < sx * 2 ? pn.xName + '*' : name(xs, p.x, sx, pn.xName, pn.star ? 2 : 1));
        const col = si === now ? C.guide : C.ghost;
        svg('path', { d: 'M' + b[0] + ' ' + Y(p.y) + 'H' + X(p.x) + 'V' + (b[1] + b[3]), fill: 'none', stroke: col, 'stroke-width': 1.4, 'stroke-dasharray': '5 5' }, g);
      }));
      const usedY = [], usedX = [];                                    // 겹치는 이름은 지금 것을 먼저
      [now].concat(P.map((_, i) => i).filter((i) => i !== now)).forEach((si) => (P[si] || []).forEach((p) => {
        if (p.o.guide === false) return;
        const col = si === now ? C.ink : C.soft;
        if (p._yl.trim() && !usedY.some((v) => Math.abs(v - Y(p.y)) < 15)) { usedY.push(Y(p.y)); label(g, b[0] - 8, Y(p.y) + 6, p._yl, { anchor: 'end', size: 18, color: col }); }
        if (!usedX.some((v) => Math.abs(v - X(p.x)) < 26)) { usedX.push(X(p.x)); label(g, X(p.x), b[1] + b[3] + 24, p._xl, { anchor: 'middle', size: 18, color: col }); }
      }));

      // 곡선: 앞 상태 위치는 흐리게, 지금 위치는 진하게(처음 자리에서 옮겨졌으면 파랑). 이름은 서로 겹치지 않는 자리에
      const boxes = [];
      pn.curves.forEach((c) => {
        c._hit = null;
        if (!this.visible(c, shown[now].j)) return;
        const offs = shown.filter((st) => this.visible(c, st.j)).map((st) => offOf(c, st.off));
        const oNow = offOf(c, shown[now].off), drawn = [];
        shown.forEach((st, si) => {
          if (!this.visible(c, st.j)) return;
          const o = offOf(c, st.off), isNow = si === now;
          if (!isNow && (c.ghost === false || same(o, oNow) || drawn.some((v) => same(v, o)))) return;
          drawn.push(o);
          const pts = this.path(pn, c, o);
          if (pts.length < 2) return;
          const moved = isNow && !same(o, offs[0]);
          const col = isNow ? (c.color || (moved ? C.blue : C.ink)) : C.ghost;
          svg('path', { d: this.d(pts), fill: 'none', stroke: col, 'stroke-width': isNow ? 3 : 2.2, 'stroke-linecap': 'round' }, g);
          const lab = this.curveLab(c, isNow ? offOf(c, labelOff) : o, offs), e = pts[pts.length - 1];
          if (c.axisLab) { label(g, b[0] - 8, e[1] + 6, lab, { anchor: 'end', size: 19, color: col, weight: 700 }); }
          else {
            const dn = c.m < 0 || c.kind === 'hyper';
            const at = place(boxes, lab, c.kind === 'vert'
              ? [[e[0], e[1] - 10, 'middle'], [e[0] - 4, e[1] - 10, 'end'], [e[0] + 4, e[1] - 10, 'start'], [e[0], e[1] - 30, 'middle']]
              : [[e[0] + 7, e[1] + (dn ? 14 : 2), 'start'], [e[0] - 4, e[1] + (dn ? 28 : -12), 'end'], [e[0] + 7, e[1] + (dn ? 32 : -18), 'start']]);
            label(g, at[0], at[1], lab, { anchor: at[2], size: 18, color: col });
          }
          if (isNow && c.drag) c._hit = pts;
        });
      });

      // 이동 화살표: 바로 앞 상태 → 지금
      if (now > 0) {
        const A = shown[now - 1], Z = shown[now];
        pn.curves.forEach((c) => {
          if (!this.visible(c, A.j) || !this.visible(c, Z.j) || c.ghost === false && c.kind !== 'horiz') return;
          const oa = offOf(c, A.off), oz = offOf(c, Z.off);
          if (same(oa, oz)) return;
          if (c.kind === 'horiz') {
            const x = X(pn.dom[0] + (pn.dom[1] - pn.dom[0]) * 0.9), y1 = Y(c.y + oa), y2 = Y(c.y + oz);
            if (Math.abs(y2 - y1) > 20) arrow(g, x, y1 + Math.sign(y2 - y1) * 6, x, y2 - Math.sign(y2 - y1) * 8, C.blue);
            return;
          }
          const yy = c.kind === 'vert' ? (c.y1 != null ? c.y1 : pn.dom[3]) - (pn.dom[3] - pn.dom[2]) * 0.08
            : c.kind === 'line' ? c.y + Math.abs(c.m) * c.span * 0.78 : pn.dom[2] + (pn.dom[3] - pn.dom[2]) * 0.62;
          const inv = (o) => (c.kind === 'vert' ? c.x + o : c.kind === 'line' ? (yy - c.y) / c.m + c.x + o : c.k / yy + o);
          const x1 = X(inv(oa)), x2 = X(inv(oz)), yp = Y(yy);
          if (Math.abs(x2 - x1) > 22) arrow(g, x1 + Math.sign(x2 - x1) * 8, yp, x2 - Math.sign(x2 - x1) * 10, yp, C.blue);
        });
      }

      // 균형점
      P.forEach((pts, si) => pts.forEach((p) => {
        const isNow = si === now, px = X(p.x), py = Y(p.y);
        svg('circle', { cx: px, cy: py, r: isNow ? 7 : 5.5, fill: isNow ? C.blue : C.ink, stroke: '#fff', 'stroke-width': 2 }, g);
        const lr = pn.curves.find((c) => c.id === 'LRAS');                    // LRAS 왼쪽 점은 왼쪽 빈 쐐기에
        const d = p.o.d || pn.ptD || (lr && p.x < lr.x - 0.05 ? [-30, 7] : [16, 7]);
        if (p.lab) label(g, px + d[0], py + d[1], p.lab, { size: p.lab.length > 2 ? 16 : 20, weight: 700, color: isNow ? C.blue : C.ink });
      }));
      if (sc.extra) sc.extra.call(this, g, pn, shown[now], ctx, shown, P);
    });

    // 설명 두 줄(위 띠): 기본은 "앞 → 지금 : Y ↑ · P ↑" 와 상태 설명
    const lines = sc.read ? sc.read(ctx) : [this.cmp(), free ? '' : ctx.say];
    lines.filter(Boolean).slice(0, 2).forEach((t, i) => label(s, 12, 28 + i * 25, t, { size: 17, color: i ? C.ink : C.blue, weight: i ? 500 : 700 }));
    this.resetBtn.hidden = !free;
  };
  // 기본 설명: 판마다 "A → B : Y ↑ · P ↑"
  Graph.prototype.cmp = function () {
    const parts = [];
    this.sc.panels.forEach((pn) => {
      const a = pn._prev[0], z = pn._now[0];
      if (!a || !z) return;
      const sg = (u, v, span) => (Math.abs(v - u) < span * 0.004 ? '=' : v > u ? '↑' : '↓');
      const dy = sg(a.y, z.y, pn.dom[3] - pn.dom[2]), dx = sg(a.x, z.x, pn.dom[1] - pn.dom[0]);
      let t = (a.lab && z.lab ? a.lab + ' → ' + z.lab + ' : ' : '') + pn.xName + ' ' + dx + ' · ' + pn.yName + ' ' + dy;
      if (pn.invY && dy !== '=') t += ' (P ' + (dy === '↑' ? '↓' : '↑') + ')';
      parts.push(t);
    });
    return parts.join('  │  ');
  };

  /* ───────── 단추·끌기 ───────── */
  Graph.prototype.tools = function () {
    const bar = document.createElement('div');
    bar.className = 'gtools';
    const mk = (txt, title, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = txt; b.title = title;
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); b.blur(); });
      bar.appendChild(b);
      return b;
    };
    this.resetBtn = mk('↺', '', () => { this.free = null; this.go(); });
    this.origBtn = mk('', '', () => this.box.classList.toggle('orig'));
    this.toolText();
    this.box.appendChild(bar);
    // 덱의 쓸어 넘기기(touchend)가 곡선 끌기에 끼어들지 않게
    ['touchstart', 'touchend'].forEach((t) => this.box.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  };
  Graph.prototype.toolText = function () {     // 단추 글자도 언어 따라
    this.resetBtn.title = tr(['되돌리기', 'Reset']);
    this.origBtn.textContent = tr(['원본', 'Original']); this.origBtn.title = tr(['PDF 원래 그림 보기', 'Show the original figure from the PDF']);
  };
  Graph.prototype.bindDrag = function () {
    const s = this.svg;
    let drag = null;
    const toData = (e, pn) => {
      const m = s.getScreenCTM(); if (!m) return null;
      const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const q = pt.matrixTransform(m.inverse()), b = pn.box, d = pn.dom;
      return { x: d[0] + (q.x - b[0]) / b[2] * (d[1] - d[0]), y: d[2] + (b[1] + b[3] - q.y) / b[3] * (d[3] - d[2]), px: q.x, py: q.y };
    };
    const pick = (e) => {                       // 누른 자리에서 가장 가까운(22px 이내) 끌 수 있는 곡선
      let best = null;
      this.sc.panels.forEach((pn) => pn.curves.forEach((c) => {
        if (!c._hit) return;
        const q = toData(e, pn); if (!q) return;
        const dist = segDist(q.px, q.py, c._hit);
        if (dist < 22 && (!best || dist < best.dist)) best = { c, pn, dist };
      }));
      return best;
    };
    s.addEventListener('pointerdown', (e) => {
      const h = pick(e);
      if (!h) return;
      e.preventDefault(); e.stopPropagation();
      cancelAnimationFrame(this.anim);
      if (!this.free) this.free = { off: Object.assign({}, this.disp) };
      const q = toData(e, h.pn);
      drag = { c: h.c, pn: h.pn, x: q.x, y: q.y, o: this.free.off[h.c.id] || 0 };
      try { s.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      this.box.classList.add('dragging');
      this.disp = Object.assign({}, this.free.off);
      this.render();
    });
    s.addEventListener('pointermove', (e) => {
      if (!drag) { const h = pick(e); s.style.cursor = h ? (h.c.drag === 'y' ? 'ns-resize' : 'ew-resize') : ''; return; }
      const q = toData(e, drag.pn), c = drag.c, d = drag.pn.dom;
      if (!q) return;
      const span = c.drag === 'y' ? d[3] - d[2] : d[1] - d[0], r = c.range || [-span * 0.32, span * 0.32];
      this.free.off[c.id] = Math.max(r[0], Math.min(r[1], drag.o + (c.drag === 'y' ? q.y - drag.y : q.x - drag.x)));
      this.disp = Object.assign({}, this.free.off);
      this.render();
    });
    const end = () => { if (drag) { drag = null; this.box.classList.remove('dragging'); } };
    s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end);
  };

  /* ───────── 단계 이동(애니메이션) ───────── */
  Graph.prototype.go = function (instant) {
    const to = this.target(), from = Object.assign({}, this.disp);
    cancelAnimationFrame(this.anim);
    if (instant || reduce) { this.disp = to; this.render(); return; }
    const ids = Object.keys(Object.assign({}, from, to)), t0 = performance.now(), dur = 750;
    const tick = (t1) => {
      const t = Math.min(1, (t1 - t0) / dur), e = EASE(t), d = {};
      ids.forEach((id) => { d[id] = (from[id] || 0) + ((to[id] || 0) - (from[id] || 0)) * e; });
      this.disp = d; this.render();
      if (t < 1) this.anim = requestAnimationFrame(tick);
    };
    this.anim = requestAnimationFrame(tick);
  };
  Graph.prototype.sync = function (enter) {   // 슬라이드에 나타난 단계 수 → 상태
    const n = this.slide.querySelectorAll('.step.shown').length;
    const k = Math.min(this.sc.states.length - 1, (this.sc.start || 0) + n);
    if (k === this.k && !enter) return;
    this.k = k; this.free = null;
    if (enter) this.box.classList.remove('orig');
    this.go(enter);
  };

  /* ───────── 시작 ───────── */
  const all = [];
  window.addEventListener('deck:lang', () => all.forEach((g) => { g.toolText(); g.render(); }));
  document.querySelectorAll('.g[data-g]').forEach((box) => {
    const sc = SCN[box.getAttribute('data-g')];
    if (!sc) return;
    const g = new Graph(box, sc);
    all.push(g);
    let wasActive = g.slide.classList.contains('active');
    g.sync(true);
    new MutationObserver(() => {
      const active = g.slide.classList.contains('active'), enter = active && !wasActive;
      wasActive = active;
      g.sync(enter);
    }).observe(g.slide, { attributes: true, attributeFilter: ['class'], subtree: true });
  });
})();
