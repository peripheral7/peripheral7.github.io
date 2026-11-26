/* Econ2 Exam 3 덱 그래프 — Exam 2 덱의 graphs.js(/slides/econ2/graphs.js)와 같은 엔진. 장별 그래프 데이터만 scn.js 에서 읽는다.
   · PPT 의 흑백 그래프 자리(<div class="g" data-g="pNN">)를 움직이는 SVG 그래프로 덮는다. 시작 상태 뒤의 상태 수 = 그 장의 빈 <i class="step"> 개수.
   · Exam 2 엔진에 더한 것: 판 3개(대부자금 · NCO · 외환시장) 나란히, 보이지 않는 곡선(hidden: 점 위치만 정함),
     starId(u* 처럼 별표를 붙일 수직선), 판마다 같은 자리의 점은 하나로(A · B · C 는 판마다 차례로), sayOnly(위 띠에 설명만, 두 줄이면 줄바꿈 문자로 나눔).
   · 모양은 PPT 그림(make_ta.py 의 StaticGraph)과 같은 규칙: 이동한 곡선 · 화살표 · 지금 점 = 빨강, 곡선 이름은 위쪽 끝 바로 위,
     점 이름은 언제나 점 오른쪽, 화살표는 곡선 아래쪽, 축 위 이름은 한 줄 · 한 열에 두고 겹치면 사이를 벌린다.
   좌표: 곡선·점은 각 판의 데이터 단위(dom = [x0, x1, y0, y1]), 글자 위치·여백은 SVG 픽셀(= 무대 픽셀). 글자의 '_' 뒤는 아래 첨자. */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1f2537', blue: '#1f6fd1', ghost: '#b3b8c2', guide: '#8d93a0', red: '#c8352e', soft: '#5b6170' };
  const LETTERS = 'ABCDEFGH';
  const EASE = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ───────── 장별 그래프 ───────── */
  // scn.js(make_ta.py 가 만든다)의 window.E3_SCN: 장 번호(pNN) → { panels, states, pad?, sayOnly? }
  const SCN = window.E3_SCN || {};

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
  // 직선 곡선 이름 자리 [x, 기준선 y, anchor]. t = 위쪽 끝(우하향은 왼쪽 끝, 우상향은 오른쪽 끝)
  //   mode 0: 끝과 같은 높이로 끝 바깥쪽 · mode 1: 끝 바로 위
  function lcand(c, mode, t) {
    if (c.m < 0) return mode === 0 ? [t[0] - 6, t[1] + 6, 'end'] : [t[0] - 2, t[1] - 10, 'start'];
    return mode === 0 ? [t[0] + 6, t[1] + 6, 'start'] : [t[0] + 2, t[1] - 10, 'end'];
  }
  // 축 위 이름 벌리기: 원래 자리(at) · 폭(size)을 가진 이름들이 한 줄에서 겹치지 않게 서로 밀어낸다(겹친 쌍은 양쪽으로 반씩)
  function spread(items, gap) {
    const a = items.slice().sort((p, q) => p.at - q.at);
    a.forEach((v) => { v.pos = v.at; });
    for (let it = 0; it < 40; it++) {
      let moved = false;
      for (let i = 1; i < a.length; i++) {
        const need = (a[i - 1].size + a[i].size) / 2 + gap, d = a[i].pos - a[i - 1].pos;
        if (d < need - 0.01) { const s = (need - d) / 2; a[i - 1].pos -= s; a[i].pos += s; moved = true; }
      }
      if (!moved) break;
    }
    return a;
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
    const n = ps.length, w = (this.W - n * p.l - n * p.r - (n - 1) * p.gap) / n;   // 판 n 개: 각 판 왼쪽 여백(축 이름) · 오른쪽 여백(곡선 이름)이 같게
    ps.forEach((pn, i) => { pn.box = [p.l + i * (w + p.r + p.gap + p.l), p.t, w, h]; });
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
      if (m) out.push({ x: m.x, y: m.y, lab: q[2] != null ? q[2] : st.letter, auto: q[2] == null, o: q[3] || {} });
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
      const rp = pn.rightP, xR = b[0] + b[2];
      svg('path', { d: 'M' + b[0] + ' ' + (b[1] - 14) + 'V' + (b[1] + b[3]) + 'H' + (rp ? xR : b[0] + b[2] + 14), fill: 'none', stroke: C.ink, 'stroke-width': 2 }, g);
      arrowHead(g, b[0], b[1] - 20, -Math.PI / 2, C.ink, 9);
      if (!rp) arrowHead(g, b[0] + b[2] + 20, b[1] + b[3], 0, C.ink, 9);
      if (rp) {
        // 오른쪽 P 축(교재 그림처럼 거꾸로: 위가 낮은 물가, 아래가 높은 물가). P = 1 / (1/P)
        svg('path', { d: 'M' + xR + ' ' + (b[1] + b[3]) + 'V' + (b[1] - 14), fill: 'none', stroke: C.ink, 'stroke-width': 2 }, g);
        label(g, xR + 8, b[1] - 26, tr(['물가 P', 'Price level P']), { size: 18, color: C.soft });
        (rp.ticks || []).forEach(([y, t]) => {
          svg('line', { x1: xR, x2: xR + 5, y1: Y(y), y2: Y(y), stroke: C.ink, 'stroke-width': 1.5 }, g);
          label(g, xR + 9, Y(y) + 5, t, { size: 14, color: C.soft });
        });
        if (!rp.ticks) {
          label(g, xR + 9, b[1] + 6, tr(['낮음', 'Low']), { size: 14, color: C.soft });
          label(g, xR + 9, b[1] + b[3] - 4, tr(['높음', 'High']), { size: 14, color: C.soft });
        }
      }
      label(g, b[0] + (pn.yTitle.length > 3 ? -8 : -12), b[1] - 26, pn.yTitle, { anchor: pn.yTitle.length > 3 ? 'start' : 'end', size: 18, color: C.soft });
      label(g, b[0] + b[2] + 18, b[1] + b[3] + 48, pn.xTitle, { anchor: 'end', size: 18, color: C.soft });
      (pn.yTicks || []).forEach((v) => {
        svg('line', { x1: b[0] - 5, x2: b[0], y1: Y(v), y2: Y(v), stroke: C.ink, 'stroke-width': 1.5 }, g);
        label(g, b[0] - 8, Y(v) + 5, String(v), { anchor: 'end', size: 14, color: C.soft });
      });

      const P = shown.map((st) => this.points(pn, st));
      // 판마다: 바로 앞 상태와 같은 자리의 점은 하나로(앞 것을 지우고 이름을 물려받음), 자동 이름은 A · B · C … 차례로
      let li = 0;
      P.forEach((pts, si) => pts.forEach((p, qi) => {
        const q = si > 0 ? (P[si - 1] || [])[qi] : null;
        if (q && Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6) { q.skip = true; if (p.auto) p.lab = q.lab; }
        else if (p.auto) p.lab = LETTERS[li++];
      }));
      pn._now = P[now] || []; pn._prev = now > 0 ? P[now - 1] : [];
      ctx.cur = ctx.cur.concat(pn._now); ctx.prev = ctx.prev.concat(pn._prev);

      // 축 위 이름: 나타난 순서대로 P_1, P_2 … · Y 는 처음 LRAS 위면 Y*
      const lr = pn.curves.find((c) => c.id === (pn.starId || 'LRAS')), ys = [], xs = [];
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
        if (p.skip) return;
        const col = si === now ? C.guide : C.ghost;
        svg('path', { d: 'M' + b[0] + ' ' + Y(p.y) + 'H' + X(p.x) + 'V' + (b[1] + b[3]), fill: 'none', stroke: col, 'stroke-width': 1.4, 'stroke-dasharray': '5 5' }, g);
        if (rp) svg('path', { d: 'M' + X(p.x) + ' ' + Y(p.y) + 'H' + xR, fill: 'none', stroke: col, 'stroke-width': 1.4, 'stroke-dasharray': '2 5' }, g);
      }));
      // 축 위 이름: 같은 이름은 한 번(지금 것의 색), 모두 한 줄(가로축) · 한 열(세로축)에 두고 겹치면 사이를 벌린다
      const ax = { x: new Map(), y: new Map() };
      P.forEach((pts, si) => pts.forEach((p) => {
        if (p.o.guide === false || p.skip) return;
        const isNow = si === now;
        if (p._yl.trim() && (!ax.y.has(p._yl) || isNow)) ax.y.set(p._yl, { at: Y(p.y), now: isNow, size: 18 });
        if (!ax.x.has(p._xl) || isNow) ax.x.set(p._xl, { at: X(p.x), now: isNow, size: Math.max(22, textW(p._xl, 18)) });
      }));
      spread([...ax.y].map(([t, v]) => Object.assign(v, { t })), 4).forEach((v) => label(g, b[0] - 8, v.pos + 6, v.t, { anchor: 'end', size: 18, color: v.now ? C.ink : C.soft }));
      spread([...ax.x].map(([t, v]) => Object.assign(v, { t })), 12).forEach((v) => label(g, v.pos, b[1] + b[3] + 24, v.t, { anchor: 'middle', size: 18, color: v.now ? C.ink : C.soft }));
      if (rp) {
        const usedR = [];
        P.forEach((pts, si) => pts.forEach((p) => {
          if (p.o.guide === false || p.skip || usedR.some((v) => Math.abs(v - Y(p.y)) < 15)) return;
          usedR.push(Y(p.y));
          if (rp.num) label(g, xR + 44, Y(p.y) + 6, 'P = ' + fmt(1 / p.y, 2), { size: 15, color: si === now ? C.red : C.soft, weight: 700 });
          else label(g, xR + 9, Y(p.y) + 6, String(p._yl).replace('1/P', 'P'), { size: 18, color: si === now ? C.ink : C.soft });
        }));
      }

      // 곡선: 앞 상태 위치는 흐리게, 지금 위치는 진하게(처음 자리에서 옮겨졌으면 파랑). 이름은 서로 겹치지 않는 자리에
      const boxes = [];
      pn.curves.forEach((c) => {
        c._hit = null;
        if (c.hidden || !this.visible(c, shown[now].j)) return;
        const offs = shown.filter((st) => this.visible(c, st.j)).map((st) => offOf(c, st.off));
        const oNow = offOf(c, shown[now].off), drawn = [];
        // 곡선 이름 방식: 단계 자리(애니메이션 중간값이 아닌 states 의 자리)에서 모두 들어가는 첫 방식
        let lmode = 0;
        if (c.kind === 'line') {
          const fam = [];
          for (let j = 0; j <= k; j++) { const o = offOf(c, sc.states[j].off); if (this.visible(c, j) && !fam.some((v) => same(v, o))) fam.push(o); }
          const vx = pn.curves.filter((v) => v.kind === 'vert' && !v.hidden).flatMap((v) => sc.states.slice(0, k + 1).map((st) => X(v.x + offOf(v, st.off))));
          const w = textW(c.lab + '_1', 18) + 6;
          const ok = (md) => {
            const bx = [];
            return fam.every((o) => {
              const p = this.path(pn, c, o); if (p.length < 2) return true;
              const cd = lcand(c, md, c.m < 0 ? p[0] : p[p.length - 1]), l = cd[2] === 'end' ? cd[0] - w : cd[0], q = [l, cd[1] - 16, l + w, cd[1] + 4];
              const good = l >= b[0] + 4 && !vx.some((v) => v > l - 3 && v < l + w + 3) && !bx.some((z) => q[0] < z[2] + 3 && z[0] < q[2] + 3 && q[1] < z[3] + 2 && z[1] < q[3] + 2);
              bx.push(q); return good;
            });
          };
          lmode = ok(0) ? 0 : ok(1) ? 1 : 0;
        }
        shown.forEach((st, si) => {
          if (!this.visible(c, st.j)) return;
          const o = offOf(c, st.off), isNow = si === now;
          if (!isNow && (c.ghost === false || same(o, oNow) || drawn.some((v) => same(v, o)))) return;
          drawn.push(o);
          const pts = this.path(pn, c, o);
          if (pts.length < 2) return;
          const moved = isNow && !same(o, offs[0]);
          const col = isNow ? (c.color || (moved ? C.red : C.ink)) : C.ghost;      // 이동한 결과 = 빨간 선
          svg('path', { d: this.d(pts), fill: 'none', stroke: col, 'stroke-width': isNow ? 3 : 2.2, 'stroke-linecap': 'round' }, g);
          const lab = this.curveLab(c, isNow ? offOf(c, labelOff) : o, offs), e = pts[pts.length - 1];
          if (c.axisLab) { label(g, b[0] - 8, e[1] + 6, lab, { anchor: 'end', size: 19, color: col, weight: 700 }); }
          else {
            // 이름: 곡선 위쪽 끝과 같은 높이로 끝 바깥쪽(우하향은 왼쪽, 우상향은 오른쪽) — PPT 그림과 같은 자리.
            // 한 곡선의 모든 자리가 같은 방식(lmode: 0 = 끝 바깥쪽, 1 = 끝 바로 위)이라 평행이동한 이름끼리 늘 같은 높이
            const t0 = c.kind === 'line' && c.m < 0 ? pts[0] : e;
            const cands = c.kind === 'vert'
              ? [[e[0], e[1] - 10, 'middle'], [e[0] - 4, e[1] - 10, 'end'], [e[0] + 4, e[1] - 10, 'start'], [e[0], e[1] - 30, 'middle']]
              : c.kind === 'line' ? [lcand(c, lmode, t0), lcand(c, 1 - lmode, t0), [t0[0], t0[1] - 30, c.m < 0 ? 'start' : 'end']]
              : [[e[0] + 7, e[1] + 14, 'start'], [e[0] - 4, e[1] + 28, 'end'], [e[0] + 7, e[1] + 32, 'start']];
            const at = place(boxes, lab, cands);
            label(g, at[0], at[1], lab, { anchor: at[2], size: 18, color: col });
          }
          if (isNow && c.drag) c._hit = pts;
        });
      });

      // 이동 화살표: 바로 앞 상태 → 지금
      if (now > 0) {
        const A = shown[now - 1], Z = shown[now];
        pn.curves.forEach((c) => {
          if (c.hidden || !this.visible(c, A.j) || !this.visible(c, Z.j) || c.ghost === false && c.kind !== 'horiz') return;
          const oa = offOf(c, A.off), oz = offOf(c, Z.off);
          if (same(oa, oz)) return;
          if (c.kind === 'horiz') {
            const x = X(pn.dom[0] + (pn.dom[1] - pn.dom[0]) * 0.9), y1 = Y(c.y + oa), y2 = Y(c.y + oz);
            if (Math.abs(y2 - y1) > 20) arrow(g, x, y1 + Math.sign(y2 - y1) * 6, x, y2 - Math.sign(y2 - y1) * 8, C.red);
            return;
          }
          // 화살표 높이: 곡선 위쪽 · 아래쪽 중 지금까지 나온 점에서 먼 쪽(PPT 그림과 같은 규칙)
          const allP = [].concat(...P).filter((p) => !p.skip), far = (v) => Math.min(9, ...allP.map((p) => Math.abs(p.y - v)));
          const ud = c.kind === 'line' ? [c.y - Math.abs(c.m) * c.span * 0.6, c.y + Math.abs(c.m) * c.span * 0.6] : [];
          const yy = c.kind === 'vert' ? (c.y1 != null ? c.y1 : pn.dom[3]) - (pn.dom[3] - pn.dom[2]) * 0.08
            : c.kind === 'line' ? (far(ud[0]) >= far(ud[1]) ? ud[0] : ud[1]) : pn.dom[2] + (pn.dom[3] - pn.dom[2]) * 0.62;
          const inv = (o) => (c.kind === 'vert' ? c.x + o : c.kind === 'line' ? (yy - c.y) / c.m + c.x + o : c.k / yy + o);
          const x1 = X(inv(oa)), x2 = X(inv(oz)), yp = Y(yy);
          if (Math.abs(x2 - x1) > 22) arrow(g, x1 + Math.sign(x2 - x1) * 8, yp, x2 - Math.sign(x2 - x1) * 10, yp, C.red);
        });
      }

      // 균형점
      P.forEach((pts, si) => pts.forEach((p) => {
        if (p.skip) return;
        const isNow = si === now, px = X(p.x), py = Y(p.y);
        svg('circle', { cx: px, cy: py, r: isNow ? 7 : 5.5, fill: isNow ? C.red : C.ink, stroke: '#fff', 'stroke-width': 2 }, g);
        const d = p.o.d || pn.ptD || [13, 7];                                  // 점 이름은 언제나 점 오른쪽 같은 자리
        if (p.lab) label(g, px + d[0], py + d[1], p.lab, { size: p.lab.length > 2 ? 16 : 20, weight: 700, color: isNow ? C.red : C.ink });
      }));
      if (sc.extra) sc.extra.call(this, g, pn, shown[now], ctx, shown, P);
    });

    // 설명 두 줄(위 띠): 기본은 "앞 → 지금 : Y ↑ · P ↑" 와 상태 설명
    const lines = sc.read ? sc.read(ctx) : sc.sayOnly ? String(free ? '' : ctx.say).split(/\r?\n|\\n/) : [this.cmp(), free ? '' : ctx.say];
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
    this.origBtn.textContent = tr(['원본', 'Original']); this.origBtn.title = tr(['PPT 원래 그림 보기', 'Show the original figure from the slides']);
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
    const raw = SCN[box.getAttribute('data-g')];
    if (!raw) return;
    const sc = JSON.parse(JSON.stringify(raw));                 // 장마다 따로(판 자리 · 곡선 캐시를 나눠 쓰지 않게)
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
