/* Econ2 핵심 그래프 페이지 — index.html 과 짝. 슬라이드 덱(/slides/econ2/graphs.js)과는 따로 쓴 작은 그래프 엔진 + 챕터별 사건.
   · 사건은 늘 처음 상태 A 에서 시작한다. 고른 줄을 한 번 더 누르면 풀리고 A 로 돌아간다.
   · 사건을 고르면 전체 걸음(beat)이 목록으로 보이고 하나씩 활성화된다: 단계마다 원인 → 이동 → 새 균형 세 걸음.
     Player 가 단계 목록 · 조작 줄(‹ 이전 · 자동 · 다음 › · 속도)을 맡는다. 모든 챕터가 같은 Player 를 쓴다.
   · 그래프 사건의 걸음은 stage.why 를 ' → ' 로 잘라, 곡선이 움직이는 조각(곡선 이름 + 화살표, 못 찾으면 stage.at) 앞은 '원인' 한 걸음,
     그 조각은 '이동', 뒤는 '새 균형' 한 걸음으로 합친다. stage.from 을 주면 그 단계에서 갈라진다(2단계 ⓐ / ⓑ).
   · 방향은 ▲ 상승 빨강 · ▼ 하락 파랑. 그래프 사건은 새 균형점의 x · y 축 이름 옆에 삼각형을 붙이고(앞 균형과 비교) 굵게 두며,
     새 균형 걸음에서 움직인 곡선 → x → y 순서로 잠깐 강조(plot.seq)한다. 지표 상자(Keys)는 그래프가 없는 Ch29 · 실업률 탭에만 쓴다.
   · 교재의 기본 곡선만 쓴다: AD · SRAS 직선, LRAS · MS 수직선, MD 는 1/P = k / M(직각쌍곡선), 노동 수요 · 공급 직선.
   · 라벨의 '_' 뒤는 아래 첨자(P_1, AD_2, L_E). 좌표: 곡선은 데이터 단위(dom = [x0, x1, y0, y1]), 글자는 SVG 픽셀(640 × 520). */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1f2537', blue: '#1f6fd1', ghost: '#b3b8c2', guide: '#8d93a0', red: '#c8352e', soft: '#5b6170', up: '#d6322b', down: '#1f6fd1' };
  const LET = 'ABCDEFGH';
  const EASE = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  /* ───────── 도우미 ───────── */
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function label(parent, x, y, s, o) {         // 'P_1' → P 와 아래 첨자 1
    o = o || {};
    const t = el('text', { x, y, 'text-anchor': o.anchor || 'start', 'font-size': o.size || 17, fill: o.color || C.ink, 'font-weight': o.weight || 500 }, parent);
    String(s).split(/(_[^\s·:,()→/]+)/).forEach((part) => {
      if (!part) return;
      if (part[0] === '_') {
        el('tspan', { dy: 5, 'font-size': '0.72em' }, t).textContent = part.slice(1);
        el('tspan', { dy: -5 }, t).textContent = '​';
      } else el('tspan', {}, t).textContent = part;
    });
    return t;
  }
  const tri = (parent, x, y, dir, anchor) => (dir ? label(parent, x, y, dir > 0 ? '▲' : '▼', { size: 18, weight: 800, anchor: anchor || 'start', color: dir > 0 ? C.up : C.down }) : null);
  function head(parent, x, y, ang, color, s) {
    s = s || 10;
    const a1 = ang + 2.6, a2 = ang - 2.6;
    el('path', { d: 'M' + x + ' ' + y + 'L' + (x + s * Math.cos(a1)) + ' ' + (y + s * Math.sin(a1)) + 'L' + (x + s * Math.cos(a2)) + ' ' + (y + s * Math.sin(a2)) + 'Z', fill: color }, parent);
  }
  function arrow(parent, x1, y1, x2, y2, color, both) {
    el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 2.4 }, parent);
    const a = Math.atan2(y2 - y1, x2 - x1);
    head(parent, x2, y2, a, color);
    if (both) head(parent, x1, y1, a + Math.PI, color);
  }
  const fmt = (v, d) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const same = (a, b) => Math.abs(a - b) < 1e-6;
  const sign = (a, b, tol) => (Math.abs(b - a) < tol ? '=' : b > a ? '↑' : '↓');
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const arrows = (s) => esc(s).replace(/↑/g, '<span class="up">▲</span>').replace(/↓/g, '<span class="dn">▼</span>').replace(/_([A-Z0-9])/g, '<sub>$1</sub>').replace(/\^([a-z])/g, '<sup>$1</sup>');
  const dirOf = (a, b, tol) => (Math.abs(b - a) < (tol || 1e-6) ? 0 : b > a ? 1 : -1);
  const dirW = (a, b, tol) => ['↓', '그대로', '↑'][dirOf(a, b, tol) + 1];
  function textW(s, size) {
    let w = 0, sub = false;
    for (const ch of String(s)) { if (ch === '_') { sub = true; continue; } if (ch === ' ') sub = false; w += sub ? 0.42 : /[ㄱ-힝]/.test(ch) ? 1 : 0.58; }
    return w * (size || 17);
  }
  function place(boxes, s, cands) {            // 이미 놓인 이름과 겹치지 않는 첫 후보 자리
    const w = textW(s), h = 19;
    const bx = (c) => { const x = c[2] === 'middle' ? c[0] - w / 2 : c[2] === 'end' ? c[0] - w : c[0]; return [x - 2, c[1] - h + 4, w + 4, h]; };
    const hit = (a) => boxes.some((q) => a[0] < q[0] + q[2] && q[0] < a[0] + a[2] && a[1] < q[1] + q[3] && q[1] < a[1] + a[3]);
    const pick = cands.find((c) => !hit(bx(c))) || cands[0];
    boxes.push(bx(pick));
    return pick;
  }

  /* ───────── 곡선 ───────── */
  // line: (x + o, y) 를 지나는 기울기 m 직선 · vert: x = x + o · horiz: y = y + o · hyper: y = k (1 + o) / x
  function fy(c, o, x) {
    if (c.kind === 'line') return c.y + c.m * (x - (c.x + o));
    if (c.kind === 'hyper') return x > 1e-9 ? c.k * (1 + o) / x : Infinity;
    if (c.kind === 'horiz') return c.y + o;
    return NaN;
  }
  function fx(c, o, y) {
    if (c.kind === 'vert') return c.x + o;
    if (c.kind === 'line') return (y - c.y) / c.m + c.x + o;
    if (c.kind === 'hyper') return c.k * (1 + o) / y;
    return NaN;
  }
  function meet(c1, o1, c2, o2, dom) {
    if (c2.kind === 'vert') { const t = c1; c1 = c2; c2 = t; const u = o1; o1 = o2; o2 = u; }
    if (c1.kind === 'vert') { if (c2.kind === 'vert') return null; const x = c1.x + o1; return { x, y: fy(c2, o2, x) }; }
    const g = (x) => fy(c1, o1, x) - fy(c2, o2, x), n = 300, a = dom[0], b = dom[1];
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

  /* ───────── 그래프 ───────── */
  function Plot(host, cfg) {
    const W = 640, H = 520, p = Object.assign({ l: 74, r: 118, t: 44, b: 66 }, cfg.pad || {});
    const svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'plot', role: 'img', 'aria-label': cfg.aria || '' }, host);
    const box = [p.l, p.t, W - p.l - p.r, H - p.t - p.b], d = cfg.dom;
    const X = (x) => box[0] + (x - d[0]) / (d[1] - d[0]) * box[2];
    const Y = (y) => box[1] + box[3] - (y - d[2]) / (d[3] - d[2]) * box[3];
    const byId = {};
    cfg.curves.forEach((c) => { byId[c.id] = c; });
    const baseVis = {};
    cfg.curves.forEach((c) => { baseVis[c.id] = !c.hidden; });
    const offOf = (c, off) => (c.calc ? c.calc(off) : off[c.id] || 0);
    const base = () => ({ off: Object.assign({}, cfg.start || {}), vis: Object.assign({}, baseVis) });
    let S = [base()], disp = Object.assign({}, S[0].off), anim = 0, hideNow = false, moving = false, hl = null;
    const self = { X, Y, box, dom: d, byId, offOf, base, on: null, extra: cfg.extra || null, states: () => S, hidden: () => hideNow };

    function pointsOf(off, vis) {
      const out = [];
      (cfg.eqs || []).forEach((q) => {
        const a = byId[q[0]], b = byId[q[1]];
        if (!vis[a.id] || !vis[b.id]) return;
        const m = meet(a, offOf(a, off), b, offOf(b, off), d);
        if (m && m.y > d[2] && m.y < d[3] && m.x > d[0] && m.x < d[1]) out.push({ x: m.x, y: m.y, o: q[2] || {} });
      });
      return out;
    }
    self.pointsOf = pointsOf;
    function path(c, o) {
      if (c.kind === 'vert') { const x = c.x + o; return [[X(x), Y(c.y0 != null ? c.y0 : d[2])], [X(x), Y(c.y1 != null ? c.y1 : d[3])]]; }
      if (c.kind === 'horiz') return [[X(c.x0 != null ? c.x0 : d[0]), Y(c.y + o)], [X(c.x1 != null ? c.x1 : d[1]), Y(c.y + o)]];
      let a, b;
      if (c.kind === 'line') { a = c.x + o - c.span; b = c.x + o + c.span; } else { a = c.k * (1 + o) / c.ylim; b = c.xmax; }
      a = Math.max(a, d[0] + (d[1] - d[0]) * 0.02); b = Math.min(b, d[1] - (d[1] - d[0]) * 0.02);
      const pts = [], n = c.kind === 'line' ? 30 : 70;
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * i / n, y = fy(c, o, x);
        if (y >= d[2] + (d[3] - d[2]) * 0.03 && y <= d[3]) pts.push([X(x), Y(y)]);
      }
      return pts;
    }
    const dstr = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const n = S.length, cur = S[n - 1], tgt = cur.off, boxes = [];
      const offs = S.map((s, i) => (i === n - 1 ? disp : s.off));
      const g = el('g', {}, svg);
      el('path', { d: 'M' + box[0] + ' ' + (box[1] - 14) + 'V' + (box[1] + box[3]) + 'H' + (box[0] + box[2] + 14), fill: 'none', stroke: C.ink, 'stroke-width': 2 }, g);
      head(g, box[0], box[1] - 20, -Math.PI / 2, C.ink, 9); head(g, box[0] + box[2] + 20, box[1] + box[3], 0, C.ink, 9);
      label(g, box[0] - 10, box[1] - 26, cfg.yTitle, { size: 16, color: C.soft, weight: 600 });
      label(g, box[0] + box[2] + 20, box[1] + box[3] + 50, cfg.xTitle, { anchor: 'end', size: 16, color: C.soft, weight: 600 });

      // 균형점: 상태마다(곡선이 움직이는 걸음에서는 새 점을 아직 숨김). 뒤 상태와 같은 자리면 앞 것은 생략
      const P = S.map((s, i) => (hideNow && i === n - 1 ? [] : pointsOf(offs[i], s.vis)));
      const lr = byId.LRAS, sx = (d[1] - d[0]) * 0.012;
      const xName = (pt, off, i) => {
        if (pt.o.xl) return pt.o.xl + (i > 0 && P[0][0] && Math.abs(P[0][0].x - pt.x) > 1e-6 ? "'" : '');
        if (cfg.star && lr && Math.abs(lr.x + offOf(lr, off) - pt.x) < sx) return same(offOf(lr, off), 0) ? cfg.xName + '*' : cfg.xName + '*_2';
        return cfg.xName + '_' + (i + 1);
      };
      const shown = P.map((pts, i) => pts.filter((a) => !P.slice(i + 1).some((later) => later.some((b) => Math.abs(X(a.x) - X(b.x)) < 3 && Math.abs(Y(a.y) - Y(b.y)) < 3))));
      shown.forEach((pts, i) => pts.forEach((pt) => {
        if (pt.o.guide === false) return;
        const em = hl && hl.axis && i === n - 1 && !hideNow;   // 결론 마디: 새 균형 점선 강조
        el('path', { d: 'M' + box[0] + ' ' + Y(pt.y) + 'H' + X(pt.x) + 'V' + (box[1] + box[3]), fill: 'none', stroke: em ? C.blue : i === n - 1 ? C.guide : C.ghost, 'stroke-width': em ? 2.6 : 1.4, 'stroke-dasharray': em ? '7 5' : '5 5' }, g);
      }));
      // 새 균형점(지금 상태)은 축 이름을 굵게, 바로 앞 균형과 견준 방향 삼각형을 옆에 둔다(강조가 끝나도 남는다)
      let prevPt = null;
      if (cfg.cmp0) prevPt = n > 1 && P[0][0] ? P[0][0] : null;   // 처음 균형과 견줌(노동시장: 1단계 수요 이동 뒤 점은 임금이 묶여 거래되지 않는 자리)
      else for (let i = n - 2; i >= 0; i--) if (P[i][0]) { prevPt = P[i][0]; break; }
      const tolX = (d[1] - d[0]) * 0.006, tolY = (d[3] - d[2]) * 0.006;
      const usedY = [], usedX = [], usedT = [];     // 지금 것부터: 같은 자리 · 같은 이름(W_E 등 고정 이름)은 한 번만
      for (let i = n - 1; i >= 0; i--) shown[i].forEach((pt) => {
        if (pt.o.guide === false) return;
        const moved0 = i > 0 && P[0][0] && (Math.abs(P[0][0].x - pt.x) > 1e-6 || Math.abs(P[0][0].y - pt.y) > 1e-6);   // 고정 이름(W_E)도 처음과 다른 자리면 ' 를 붙인다
        const now = i === n - 1 && !hideNow, col = i === n - 1 ? C.ink : C.soft, yl = pt.o.yl ? pt.o.yl + (moved0 ? "'" : '') : cfg.yName + '_' + (i + 1), xl = xName(pt, offs[i], i);
        const dx = now && prevPt ? dirOf(prevPt.x, pt.x, tolX) : 0, dy = now && prevPt ? dirOf(prevPt.y, pt.y, tolY) : 0;
        const wt = (dd) => (now && dd ? 800 : 500), dc = (dd) => (now && dd ? (dd > 0 ? C.up : C.down) : col);
        const big = (ax, dd) => !!(now && dd && hl && hl.axis && hl.axis.indexOf(ax) >= 0);   // 결론 마디: 바뀐 축 값 크게
        const pop = () => {};
        if (!usedY.some((v) => Math.abs(v - Y(pt.y)) < 15) && usedT.indexOf('y' + yl) < 0) {
          usedY.push(Y(pt.y)); usedT.push('y' + yl);
          const gy = el('g', {}, g);   // 축 값 + 삼각형을 한 묶음으로(같이 커진다)
          label(gy, box[0] - 8, Y(pt.y) + 7, yl, { anchor: 'end', size: big('y', dy) ? 22 : 17, color: dc(dy), weight: wt(dy) });
          tri(gy, box[0] - 12 - textW(yl, big('y', dy) ? 22 : 17), Y(pt.y) + 6, dy, 'end');   // 커진 글자 폭에 맞춰
          pop(gy, 'y', dy);
        }
        if (!usedX.some((v) => Math.abs(v - X(pt.x)) < 28) && usedT.indexOf('x' + xl) < 0) {
          usedX.push(X(pt.x)); usedT.push('x' + xl);
          const gx = el('g', {}, g);
          label(gx, X(pt.x), box[1] + box[3] + 25, xl, { anchor: 'middle', size: big('x', dx) ? 22 : 17, color: dc(dx), weight: wt(dx) });
          const xw = textW(xl, big('x', dx) ? 22 : 17) / 2 + 5;
          if (dx > 0) tri(gx, X(pt.x) + xw, box[1] + box[3] + 24, dx);
          else tri(gx, X(pt.x) - xw, box[1] + box[3] + 24, dx, 'end');
          pop(gx, 'x', dx);
        }
      });

      // 곡선: 지나온 위치들 중 지금과 다른 것은 흐리게(이름에 아래 첨자), 지금 위치는 진하게(처음 자리에서 옮겨졌으면 파랑)
      cfg.curves.forEach((c) => {
        const pos = [];
        S.forEach((s) => { if (!s.vis[c.id]) return; const v = offOf(c, s.off); if (!pos.some((u) => same(u, v))) pos.push(v); });
        const lab = (v) => (c.plain || pos.length < 2 ? c.lab : c.lab + '_' + (pos.findIndex((u) => same(u, v)) + 1));
        const drawLab = (pts, s, col) => {
          const e = pts[pts.length - 1];
          if (c.axisLab) { label(g, box[0] + 8, e[1] - 8, s, { size: 18, color: col, weight: 800 }); return; }   // 축 이름(W_E 등)과 겹치지 않게 선 바로 위 왼쪽
          const dn = c.m < 0 || c.kind === 'hyper';
          const at = place(boxes, s, c.kind === 'vert'
            ? [[e[0], e[1] - 10, 'middle'], [e[0] - 4, e[1] - 10, 'end'], [e[0] + 4, e[1] - 10, 'start'], [e[0], e[1] - 30, 'middle']]
            : [[e[0] + 7, e[1] + (dn ? 14 : 2), 'start'], [e[0] - 4, e[1] + (dn ? 28 : -12), 'end'], [e[0] + 7, e[1] + (dn ? 32 : -18), 'start']]);
          label(g, at[0], at[1], s, { anchor: at[2], size: 17, color: col, weight: 600 });
        };
        const now = cur.vis[c.id] ? offOf(c, tgt) : null;
        if (c.ghost !== false) pos.forEach((v) => {
          if (now != null && same(v, now)) return;
          const pts = path(c, v);
          if (pts.length > 1) { el('path', { d: dstr(pts), fill: 'none', stroke: C.ghost, 'stroke-width': 2.2 }, g); drawLab(pts, lab(v), C.ghost); }
        });
        if (now == null) return;
        const pts = path(c, offOf(c, disp));
        if (pts.length < 2) return;
        const moved = !S[0].vis[c.id] || !same(offOf(c, S[0].off), now);
        const col = c.color || (moved ? C.blue : C.ink);
        el('path', { d: dstr(pts), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        drawLab(pts, lab(now), col);
      });

      // 이동 화살표: 바로 앞 상태 → 지금. 곡선이 다 움직인 뒤에 나온다
      if (n > 1 && !moving) cfg.curves.forEach((c) => {
        const a = S[n - 2];
        if (!a.vis[c.id] || !cur.vis[c.id]) return;
        const oa = offOf(c, a.off), oz = offOf(c, tgt);
        if (same(oa, oz)) return;
        if (c.kind === 'horiz') {
          const x = X(d[0] + (d[1] - d[0]) * 0.9), y1 = Y(c.y + oa), y2 = Y(c.y + oz);
          if (Math.abs(y2 - y1) > 20) arrow(g, x, y1 + Math.sign(y2 - y1) * 6, x, y2 - Math.sign(y2 - y1) * 8, C.blue);
          return;
        }
        const yy = c.kind === 'vert' ? (c.y1 != null ? c.y1 : d[3]) - (d[3] - d[2]) * 0.08 : c.kind === 'line' ? c.y + Math.abs(c.m) * c.span * 0.78 : d[2] + (d[3] - d[2]) * 0.72;
        const x1 = X(fx(c, oa, yy)), x2 = X(fx(c, oz, yy)), yp = Y(yy);
        if (Math.abs(x2 - x1) > 22) arrow(g, x1 + Math.sign(x2 - x1) * 8, yp, x2 - Math.sign(x2 - x1) * 10, yp, C.blue);
      });

      // 균형점 글자: 앞 상태는 검정, 지금은 파랑
      const lrX = lr ? X(lr.x + offOf(lr, disp)) : null;
      shown.forEach((pts, i) => pts.forEach((pt, j) => {
        const isNow = i === n - 1, col = isNow ? C.blue : C.ink, px = X(pt.x), py = Y(pt.y);
        el('circle', { cx: px, cy: py, r: isNow ? 7 : 5.5, fill: col, stroke: '#fff', 'stroke-width': 2 }, g);
        if (j || pt.o.lab === false) return;
        const dd = cfg.ptD || (lrX != null && px < lrX - 3 ? [-28, 7] : [15, 7]);
        label(g, px + dd[0], py + dd[1], S[i].letter || LET[i], { size: 19, weight: 800, color: col });
      }));

      const ctx = { g, S, P, off: disp, X, Y, box, dom: d, hide: hideNow };
      if (self.extra) self.extra(ctx);
      if (self.on) self.on(ctx);
    }
    self.render = render;
    let hlT = [];
    self.hilite = (h) => { hlT.forEach(clearTimeout); hlT = []; hl = h; render(); };
    // items(축 'x' · 'y' · 'xy')를 곡선이 멈춘 뒤 차례로: 새 균형의 축 이름이 한 번 커졌다 작아진다(.pop). 색 · 굵기는 계속 남는다
    // items(축 'x' · 'y' · 'xy') 를 한 번에, 다음 걸음으로 넘어갈 때까지 강조(quiet 가 지운다)
    self.seq = (items) => { const ax = items.map((it) => it.axis || '').join(''); self.hilite(ax ? { axis: ax } : null); };
    // 상태 줄을 통째로 바꾸고 지금(마지막) 상태로 움직인다. o.hide: 새 균형점은 아직 숨김, o.dur: 애니메이션 길이(ms)
    self.show = (states, o) => {
      o = o || {};
      S = states; hideNow = !!o.hide;
      const to = Object.assign({}, S[S.length - 1].off), from = Object.assign({}, disp);
      cancelAnimationFrame(anim); moving = false;
      if (o.instant || reduce) { disp = to; render(); return; }
      moving = true;
      const ids = Object.keys(Object.assign({}, from, to)), t0 = performance.now(), dur = o.dur || 750;
      const tick = (t1) => {
        const t = Math.min(1, (t1 - t0) / dur), e = EASE(t), m = {};
        ids.forEach((k) => { m[k] = (from[k] || 0) + ((to[k] || 0) - (from[k] || 0)) * e; });
        if (t >= 1) moving = false;
        disp = m; render();
        if (t < 1) anim = requestAnimationFrame(tick);
      };
      anim = requestAnimationFrame(tick);
    };
    render();
    return self;
  }

  /* ───────── 결과 문장 ───────── */
  // COND: 조건절 · rs: 결과 마디 글
  const COND = {
    '지급준비율 인상 10% → 20%': 'Fed 가 지급준비율을 10% 에서 20% 로 올리면',
    '지급준비율 인하 10% → 5%': 'Fed 가 지급준비율을 10% 에서 5% 로 내리면',
    '은행이 초과지준을 더 보유': '은행이 초과지준을 더 쌓으면',
    '예금 $100 증가': '사람들이 현금 $100 을 예금하면',
    '예금 $50 인출': '사람들이 예금 $50 을 현금으로 찾으면',
    'Fed 채권 매입 $100': 'Fed 가 채권 $100 을 사면',
    'Fed 채권 매각 $50': 'Fed 가 채권 $50 을 팔면',
    'Fed 가 은행에 $100 대출 (재할인율 인하)': 'Fed 가 재할인율을 내려 은행에 $100 을 빌려주면',
    '대출 부실 → 은행 자본 감소': '은행 대출 $50 이 부실해지면',
    'Fed 통화량 2배': 'Fed 가 통화량을 2배로 늘리면',
    'Fed 통화량 감소': 'Fed 가 통화량을 줄이면',
    '신용카드 보급 → 현금 덜 보유': '신용카드가 퍼져 사람들이 돈을 덜 들고 있으면',
    '실질 GDP 증가 → 거래용 돈 더 필요': '실질 GDP 가 늘어 거래에 돈이 더 필요하면',
    '주가 급등': '주가가 급등하면',
    '주가 폭락': '주가가 폭락하면',
    '소득세 인하': '소득세를 내리면',
    '통화량 증가': '통화량이 늘면',
    '기업 낙관 · 투자 붐': '기업이 낙관해 투자가 늘면',
    '투자세액공제': '투자세액공제를 도입하면',
    '정부 구매 증가': '정부 구매가 늘면',
    '해외 경기 침체': '해외 경기가 침체하면',
    '해외 정치 불안 → 원화 절상': '해외 정치 불안으로 원화가 절상되면',
    '기대물가 상승': '기대물가가 오르면',
    '유가 급등': '유가가 급등하면',
    '명목임금 상승': '명목임금이 오르면',
    '기술 진보': '기술이 진보하면',
    '자본 · 인적자본 증가': '자본 · 인적자본이 늘면',
    '이민 → 노동 증가': '이민으로 노동이 늘면',
    '자연재해 · 자원 감소': '자연재해로 자원이 줄면',
    '자연실업률 상승': '자연실업률이 오르면',
    '임금이 균형보다 높게': '임금이 균형보다 높게 묶이면',
    '노동 수요 감소': '노동 수요가 줄면'
  };
  const rsTok = (s) => String(s).split(' · ').map((x) => { const m = /^(.+?) (↑|↓|▲|▼|unchanged|그대로|back)(?: (.+))?$/.exec(x.trim()); return m ? { n: m[1], d: /[↑▲]/.test(m[2]) ? 1 : /[↓▼]/.test(m[2]) ? -1 : 0, back: m[2] === 'back', x: m[3] || '' } : { n: x.trim(), d: null }; });
  // parts: [{ g 단계, rs, on, b }]
  function rsHTML(cond, parts) {
    const multi = new Set(parts.map((p) => p.g)).size > 1, when = { '단기': '단기에는 ', '장기': '장기에는 ' };
    const lead = (p, pi) => p.sw || (multi ? (p.adj && p.g === '장기' ? '장기에는 임금 · 기대물가 P<sup>e</sup> 가 조정되어 ' : when[p.g] || (pi ? '이어서 ' : '')) : '');
    const toks = [];
    parts.forEach((p, pi) => rsTok(p.rs).forEach((t, ti, all) => toks.push(Object.assign({ pre: ti ? '' : lead(p, pi), on: p.on, b: p.b, partEnd: multi && ti === all.length - 1 }, t))));
    // 받침이 있으면 '은', 없으면 '는'. 영문 기호는 읽는 소리로(L 엘 · M 엠 · N 엔 · R 알 → 은)
    const josa = (n) => { const c = n.replace(/[\s*′']+$/, '').slice(-1), h = c.charCodeAt(0) - 0xac00; return h >= 0 && h < 11172 ? (h % 28 ? '은' : '는') : /[LMNR]/.test(c) ? '은' : '는'; };
    const qty = (n) => /^(Y|L|U|실업|통화량|자산|자본|대출|예금)/.test(n);
    const slot = (t, k) => {
      const last = k === toks.length - 1, end = last ? '다.' : t.partEnd ? '며,' : '고';
      if (!t.on) return '<b class="slot q" data-b="' + t.b + '"></b>' + (last ? '.' : t.partEnd ? ',' : '');
      if (t.d == null) return '<b class="slot same" data-b="' + t.b + '">' + esc(t.n) + '</b>' + (last ? '.' : '');
      if (t.back) return '<b class="slot same" data-b="' + t.b + '">' + (t.n === 'Y' ? 'Y* 로 ' : '제자리로 ') + (last ? '돌아온다.' : t.partEnd ? '돌아오며,' : '돌아오고') + '</b>';
      const v = t.d ? (t.d > 0 ? (qty(t.n) ? '증가' : '상승') : (qty(t.n) ? '감소' : '하락')) + (last ? '한' : '하') : '그대로' + (last ? '이' : '이');
      return '<b class="slot ' + (t.d > 0 ? 'up' : t.d < 0 ? 'dn' : 'same') + '" data-b="' + t.b + '">' + (t.d > 0 ? '▲ ' : t.d < 0 ? '▼ ' : '') + (t.x ? esc(t.x) + ' ' : '') + v + end + '</b>';
    };
    return esc(cond || '') + ' ' + toks.map((t, k) => (k ? ' ' : '') + t.pre + (t.d == null && t.on ? '' : arrows(t.n) + (/[가-힣]$/.test(t.n) ? '' : ' ') + josa(t.n) + ' ') + slot(t, k)).join('');
  }
  const YBACK = 'Y back';   // Y = Y* 복귀
  const sitHTML = (x) => (x ? '<span class="lb">상황</span><span class="st">' + String(x).split(' — ').map(arrows).join('<br>') + '</span>' : '');
  /* ───────── 재생기: 단계 목록(전체 걸음이 한눈에, 지금 걸음만 크게) · 조작 줄(‹ 이전 · 자동 · 다음 › · 속도) ───────── */
  // beat = { g: 묶음 이름(1단계 단기 …), alts: [{ t, on, pick }](갈라지는 단계일 때), k: 꼬리표(원인 · 이동 · 균형 …), t: 글자, run(anim), wait: 머무는 시간 배율 }
  // 사건을 고르기 전에는 안내 한 줄만 보이고 조작 줄은 숨는다(.idle)
  const SPEEDS = [['보통', 1], ['빠름', 2]];
  let SPEED = 2;   // 기본 '빠름'
  const players = [];
  function Player(host) {
    host.innerHTML =
      '<ol class="steps" aria-live="polite"></ol>' +
      '<div class="pbar"><span class="cnt"></span><span class="seg"><button type="button" data-a="prev">‹ 이전</button>' +
      '<button type="button" data-a="play" class="pp"></button><button type="button" data-a="next">다음 ›</button></span>' +
      '<button type="button" data-a="spd" class="spdb"></button></div>';
    const ol = $('.steps', host), pp = $('.pp', host), cnt = $('.cnt', host), spd = $('[data-a="spd"]', host);
    let beats = [], i = -1, playing = false, timer = 0, fin = false;
    const self = { onGo: null };
    function draw() {
      host.classList.toggle('idle', !beats.length);
      $$('li[data-i]', ol).forEach((li) => { const k = +li.getAttribute('data-i'); li.className = k === i ? 'cur' : k < i ? 'done' : 'todo'; });
      $$('.stg', ol).forEach((st) => st.classList.toggle('cur', !!$('li.cur', st)));
      $$('.gl', ol).forEach((x) => x.classList.toggle('cur', !!beats[i] && beats[i].g === x.getAttribute('data-g')));
      host.classList.toggle('end', fin);   // 끝 원
      const end = i >= beats.length - 1;
      pp.textContent = playing ? '❚❚ 멈춤' : end ? '↻ 다시' : '▶ 자동';
      pp.classList.toggle('on', playing);
      cnt.textContent = beats.length ? (i + 1) + ' / ' + beats.length : '';
      spd.innerHTML = SPEEDS.map((x) => '<span' + (x[1] === SPEED ? '' : ' class="spg" aria-hidden="true"') + '>속도 ' + x[0] + '</span>').join('');   // 안 보이는 다른 글자도 같은 칸에 겹쳐 두어 눌러도 단추 폭이 그대로
      $('[data-a="prev"]', host).disabled = i <= 0; $('[data-a="next"]', host).disabled = end;
    }
    function idle() { ol.innerHTML = ''; setSit(''); sentence(); draw(); }
    function schedule() {
      clearTimeout(timer);
      const last = i >= beats.length - 1;
      if (!beats.length || (!playing && !last)) return;
      timer = setTimeout(() => { if (last) { fin = true; playing = false; draw(); } else go(i + 1, true); }, 1500 * (beats[i].wait || 1) / SPEED);
    }
    const sitEl = () => { const r = host.closest('.panel') || host.closest('.ch'); return r && $('.sitline', r); };
    const setSit = (x) => { const el = sitEl(); if (el) el.innerHTML = sitHTML(x); };
    // 결과 문장 채우기
    const rsEl = () => { const s = sitEl(), n = s && s.nextElementSibling; return n && n.classList.contains('auto') ? n : null; };
    let rsT = 0;
    function sentence(anim) {
      const el = rsEl(); if (!el) return;
      const parts = beats.map((b, k) => ({ g: b.g, rs: b.rs, adj: b.adj, sw: b.sw, on: k <= i, b: k })).filter((p) => p.rs);
      el.innerHTML = parts.length && i >= 0 ? rsHTML(COND[beats[0].ev], parts) : '';
      clearTimeout(rsT);
      if (anim && beats[i] && beats[i].rs) { const hs = $$('[data-b="' + i + '"]', el); hs.forEach((h) => h.classList.add('pulse')); rsT = setTimeout(() => hs.forEach((h) => h.classList.remove('pulse')), 1000); }
    }
    function go(k, anim) {
      i = Math.max(0, Math.min(beats.length - 1, k)); fin = false;
      setSit(beats[0].sit); sentence(anim !== false);   // Situation 은 처음 고른 사건 그대로
      beats[i].run(anim !== false);
      draw(); schedule();
      if (self.onGo) self.onGo(i);
    }
    // 단계(묶음)마다 li.stg = 한 줄: 단계 이름(.gh, 갈래 ⓐ ⓑ 포함) + 마디 목록(ol.rows: 선 위의 점 · [제목] · 글)
    function build() {
      ol.innerHTML = '';
      // 단계 이름(.gl) · 갈래 버튼
      const lab = new Set(beats.map((b) => b.g)).size > 1 || beats.some((b) => b.alts);
      ol.classList.add('solo');
      const st = document.createElement('li'), rows = document.createElement('ol');
      st.className = 'stg'; rows.className = lab ? 'rows lab' : 'rows';
      st.appendChild(rows); ol.appendChild(st);
      let g = null, gStart = 0;
      beats.forEach((b, k) => {
        const li = document.createElement('li'), btn = document.createElement('button');
        li.setAttribute('data-i', k);
        if (b.g !== g) {
          g = b.g; gStart = k;
          if (lab) {
            const gl = document.createElement('div'), nm = document.createElement('span');
            gl.className = k ? 'gl sep' : 'gl'; gl.setAttribute('data-g', b.g); nm.textContent = b.g; gl.appendChild(nm);
            if (b.alts) b.alts.forEach((a) => { const x = document.createElement('button'); x.type = 'button'; x.className = a.on ? 'alt on' : 'alt'; x.textContent = a.t; x.addEventListener('click', a.pick); gl.appendChild(x); });
            li.appendChild(gl);
          }
        }
        btn.type = 'button';
        // 글은 ' — ' 에서 줄을 바꾸고, ' → ' 로 나뉜 조각(.u, inline-block)은 통째로 다음 줄로 — 조각이 칸보다 길 때만 그 안에서 줄바꿈. b.s 는 작은 숫자 줄
        const unit = (x) => x.split(' → ').map((u, k) => '<span class="u">' + (k ? '→ ' : '') + arrows(u) + '</span>').join(' ');   // 화살표 줄바꿈
        btn.innerHTML = '<span class="dot"></span><span class="k">' + (/[←→]/.test(b.k || '') ? '[' + arrows(b.k) + ']' : arrows(b.k || '')) + '</span><span class="tx">' + String(b.t || '').split(' — ').map(unit).join('<br>') + '</span>' + (b.s ? '<span class="sm">' + arrows(b.s) + '</span>' : '');
        const from = k === gStart ? k - 1 : gStart;   // pre 가 없으면: 단계 첫 마디는 앞 단계 끝에서, 나머지는 그 단계 첫 마디에서
        btn.addEventListener('click', () => { playing = false; if (b.pre) b.pre(false); else if (from >= 0) beats[from].run(false); go(k, true); });
        li.appendChild(btn); rows.appendChild(li);
      });
    }
    self.load = (list, o) => {
      o = o || {};
      clearTimeout(timer);
      beats = list; i = -1; fin = false;
      build();
      playing = o.play !== false && !reduce;
      if (list.length) go(o.at || 0, o.anim !== false); else idle();
    };
    self.clear = () => { clearTimeout(timer); playing = false; fin = false; beats = []; i = -1; idle(); };
    self.index = () => i;
    self.redrawSpeed = () => { draw(); if (playing) schedule(); };
    const step = (dk) => { if (!beats.length) return; playing = false; go(i + dk, true); };
    $('[data-a="prev"]', host).addEventListener('click', () => step(-1));
    $('[data-a="next"]', host).addEventListener('click', () => step(1));
    // 휴대폰: 목록을 옆으로 밀어 넘긴다. 키보드: 재생기 안에서 ← →
    let tx = null, ty = 0;
    ol.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    ol.addEventListener('touchend', (e) => {
      if (tx == null) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      tx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    });
    host.addEventListener('keydown', (e) => {
      if (!beats.length || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1);
    });
    pp.addEventListener('click', () => {
      if (playing) { playing = false; clearTimeout(timer); draw(); return; }
      playing = true;
      if (i >= beats.length - 1) go(0, true); else { draw(); schedule(); }
    });
    spd.addEventListener('click', () => {   // 속도 전환
      const k = SPEEDS.findIndex((x) => x[1] === SPEED);
      SPEED = SPEEDS[(k + 1) % SPEEDS.length][1];
      players.forEach((q) => q.redrawSpeed());
    });
    idle();
    players.push(self);
    return self;
  }
  const dur = () => 750 / SPEED;

  /* ───────── 지표 상자: 이름 · 방향(▲ 증가 빨강 / ▼ 감소 파랑 / 그대로). seq 로 순서대로 하나씩 잠깐 강조 ───────── */
  // defs = [{ k, t: 이름, s: 기호, w: [증가 말, 감소 말], tol: 같다고 볼 차이, f: 값 → 글자(있으면 값도 보여 줌, Ch29) }], ops: 상자 사이 기호(× = 등)
  const DIR = (d, w) => { w = w || ['증가', '감소']; return d > 0 ? '<span class="kdir up">▲ ' + w[0] + '</span>' : d < 0 ? '<span class="kdir dn">▼ ' + w[1] + '</span>' : '<span class="kdir same">— 그대로</span>'; };
  function Keys(host, defs, ops) {
    host.innerHTML = defs.map((d, i) => (i && ops ? '<span class="kop">' + ops[i - 1] + '</span>' : '') +
      '<div class="key" data-k="' + d.k + '"><div class="kh"><span>' + esc(d.t) + '</span><i>' + esc(d.s || '') + '</i></div><div class="kv"></div><div class="kd"></div></div>').join('');
    if (ops) host.classList.add('ops');
    let timers = [];
    const mark = (k) => $$('.key', host).forEach((b) => b.classList.toggle('pulse', b.getAttribute('data-k') === k));
    const self = {
      // vals[k] = { d: 방향(+1 · −1 · 0) } 또는 { b: 처음 값, a: 지금 값 }(방향은 비교로) 또는 { txt: 글자, on: 강조 }, note: 아래 작은 글
      set(vals) {
        defs.forEach((d) => {
          const v = vals[d.k] || {}, bx = $('[data-k="' + d.k + '"]', host);
          const dir = v.d != null ? v.d : v.a != null && v.b != null ? dirOf(v.b, v.a, d.tol) : 0;
          let html;
          if (v.txt != null) html = '<span class="kt' + (v.on ? ' on' : '') + '">' + esc(v.txt) + '</span>';
          else if (d.f && v.a != null) html = '<span class="ka' + (dir > 0 ? ' up' : dir < 0 ? ' dn' : '') + '">' + esc(d.f(v.a)) + '</span>' + (dir ? '<span class="kdir ' + (dir > 0 ? 'up' : 'dn') + '">' + (dir > 0 ? '▲' : '▼') + '</span>' : '');
          else html = DIR(dir, d.w);
          $('.kv', bx).innerHTML = html;
          bx.classList.toggle('chg', v.txt != null ? !!v.on : dir !== 0);
          $('.kd', bx).innerHTML = v.note ? arrows(v.note) : '';
        });
      },
      // ks 순서대로 하나씩 .pulse, 매번 cb(k) → 끝나면 cb(null)
      seq(ks, cb) {
        self.stop();
        const step = 700 / SPEED;
        ks.forEach((k, i) => timers.push(setTimeout(() => { mark(k); if (cb) cb(k); }, i * step)));
        timers.push(setTimeout(() => { mark(null); if (cb) cb(null); }, ks.length * step + 300));
      },
      stop() { timers.forEach(clearTimeout); timers = []; mark(null); }
    };
    return self;
  }
  // 그래프에서 지금 보이는 마지막 균형점(곡선이 움직이는 걸음에서는 그 앞 점)


  /* ───────── 그래프 사건 → 걸음 ───────── */
  // stage.ch = { add: {id: 더할 양}, abs: {id: 값} 또는 (앞 상태 off) => {…}, vis: {id: bool} }
  function apply(st, ch, letter) {
    const off = Object.assign({}, st.off);
    if (ch.add) for (const k in ch.add) off[k] = (off[k] || 0) + ch.add[k];
    if (ch.abs) Object.assign(off, typeof ch.abs === 'function' ? ch.abs(off) : ch.abs);   // add 를 적용한 뒤의 off 로
    return { off, vis: Object.assign({}, st.vis, ch.vis || {}), letter };
  }
  // 'A → B → C' 를 걸음으로. 'SRAS → → Y' 처럼 화살표가 겹치면 앞 조각에 붙인다
  function pieces(s) {
    const out = [];
    String(s).split(' → ').forEach((t) => {
      t = t.trim();
      while (t.indexOf('→ ') === 0 && out.length) { out[out.length - 1] += ' →'; t = t.slice(2).trim(); }
      if (t) out.push(t);
    });
    return out;
  }
  const MOVE = /(AD|SRAS|LRAS|MS|MD)( 가 더| further)?\s*[←→]/;
  // 사건(sc)의 갈래(branch: 갈라지는 단계 번호)를 따라 걸음을 만든다. o.start: A 설명, o.result(앞 상태, 새 상태, 글자): 새 균형 설명
  // 결과 제목과 같은 말(1/P ↓, P ↑ 와 [1/P ↓ · P ↑])이면 세부 줄은 생략
  const same0 = (a, b) => { const n = (x) => String(x).replace(/[\s,·\[\]]/g, '').replace(/▲/g, '↑').replace(/▼/g, '↓'); return n(a) === n(b); };
  function beatsFor(plot, sc, branch, o, rebuild) {
    const alts = sc.stages.map((s, i) => i).filter((i) => i > 0 && (sc.stages[i].from != null || sc.stages.some((x) => x.from != null)));
    let ids;
    if (alts.length) ids = [0, branch != null ? branch : alts[0]];
    else ids = sc.stages.map((s, i) => i);
    const out = [];
    let S = [plot.base()];
    const snap = (states, hide) => (anim) => { if (o.quiet) o.quiet(); plot.show(states, { hide, dur: dur(), instant: !anim }); };
    let num = 0;
    ids.forEach((id) => {
      const st = sc.stages[id], prevS = S, next = apply(S[S.length - 1], st.ch, st.letter);
      const why = typeof st.why === 'function' ? st.why(S) : st.why;
      const ps = st.chain || pieces(why), at = st.at != null ? st.at : Math.max(0, ps.findIndex((t) => MOVE.test(t)));
      const withNew = S.concat([next]), letter = next.letter || LET[withNew.length - 1];
      num++;
      const isAlt = alts.length && id !== 0;
      const stp = st.step || '', g = st.label || (/장기/.test(stp) ? '장기' : /단기/.test(stp) ? '단기' : isAlt ? '장기' : num + '단계');
      const altList = isAlt ? alts.map((a, k) => ({ t: sc.stages[a].short || sc.stages[a].name, on: a === id, pick: () => rebuild(a) })) : null;
      const cause = ps.slice(0, at), after = ps.slice(at + 1).join(' → ');
      // 상황(그래프 아래 줄): 1단계는 사건 이름(또는 sc.sit), 다음 단계는 원인의 첫 조각(또는 st.sit)
      const sit = id === 0 ? sc.sit || sc.t : st.sit || (cause.length ? cause.shift() : st.name);
      // 결론 제목: result 의 ' — ' 앞(Y ↓ · P ↑ 등), 설명: 사슬의 뒤쪽 또는 result 의 ' — ' 뒤
      const res = o.result(prevS[prevS.length - 1], next, letter).split(' — '), pre = snap(prevS, false);
      out.push({ g, ev: sc.t, alts: altList, sit, pre, k: ps[at], t: cause.join(' → '), run: snap(withNew, true), wait: 1.25 });
      out.push({ g, ev: sc.t, sw: st.sw, adj: /adjust|조정/.test(why || ''), rs: st.rs || (num > 1 && /Y = Y\*/.test(res[1] || '') ? res[0].replace(/^Y [↑↓]/, YBACK) : res[0]), alts: altList, sit, pre: snap(withNew, true), k: res[0], t: (after && !same0(after, res[0]) ? after : '') || res.slice(1).join(' — '),
        run: () => { snap(withNew, false)(false); if (o.after) o.after(prevS[prevS.length - 1], next); }, wait: 1.8 });
      S = withNew;
    });
    return out;
  }
  // 글자 목록: items = [{ t, q, dir }] → 누르면 onPick(i, 줄), 고른 줄을 다시 누르면 onPick(-1) 로 풀림
  // 주요 요인 점 · 범례
  const KEY = new Set(['지급준비율 인상 10% → 20%', '예금 $100 증가', 'Fed 채권 매입 $100', '대출 부실 → 은행 자본 감소',
    'Fed 통화량 2배', '신용카드 보급 → 현금 덜 보유',
    '주가 폭락', '통화량 증가', '정부 구매 증가', '기대물가 상승', '유가 급등', '기술 진보',
    '임금이 균형보다 높게', '실직 후 구직 포기']);
  const keyFit = (lg) => { lg.hidden = false; if (lg.offsetTop > lg.parentNode.firstChild.offsetTop + 4 || !lg.offsetParent) lg.hidden = true; };
  function keyLegend(host) {
    const box = host.closest('.panel') || host.closest('.ch') || host.parentNode, h3 = $('h3', host);
    if (!h3 || $('.keylg', box)) return;
    const lg = document.createElement('span'); lg.className = 'keylg'; lg.innerHTML = '<i></i>주요 요인';
    const tt = document.createElement('span'); while (h3.firstChild) tt.appendChild(h3.firstChild);
    h3.classList.add('haslg'); h3.appendChild(tt); h3.appendChild(lg);
    if (window.ResizeObserver) new ResizeObserver(() => keyFit(lg)).observe(h3); else keyFit(lg);
  }
  // 검색(search.js)용 글: 사건 객체 안의 글자를 모두 모은다(함수 · 정규식 · 숫자 제외)
  const flatText = (o) => { const out = []; (function walk(v) { if (typeof v === 'string') { if (v.length > 1) out.push(v); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.keys(v).forEach((k) => walk(v[k])); })(o); return out.join(' '); };
  function list(host, items, onPick, scope) {
    const ul = $('ul', host);
    const tri = host.id === 'o29';   // Ch29 는 곡선이 없어 이동 화살표 대신 통화량 방향 ▲ ▼(it.dl: 다른 값이면 그 이름, 대출 부실 = 자본) (이름 속 '10% → 20%' 화살표와 섞이지 않게)
    if (items.some((it) => KEY.has(it.t))) keyLegend(host);
    items.forEach((it, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      if (KEY.has(it.t)) li.className = 'imp';
      b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-s', flatText(it));
      b.innerHTML = arrows(it.t) + (it.dir ? '<span class="dir' + (it.dir === 'l' ? ' l' : '') + '"' + (tri ? ' title="' + (it.dl || '통화량') + ' ' + (it.dir === 'l' ? '▼' : '▲') + '"' : '') + '>' + (tri ? (it.dir === 'l' ? '▼' : '▲') : it.dir === 'l' ? '←' : '→') + '</span>' : '') + (it.q ? '<span class="q">' + esc(it.q) + '</span>' : '');
      b.addEventListener('click', () => {
        const was = b.getAttribute('aria-pressed') === 'true';
        unpress(scope || host);
        if (was) { onPick(-1, b); return; }
        b.setAttribute('aria-pressed', 'true');
        onPick(i, b);
        bringFig(b);
      });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  // 휴대폰(한 줄 배치)에서는 목록이 그래프 아래에 있으므로, 사건을 고르면 그 그림 · 카드가 보이게 올린다
  // 데스크톱(두 칸 따로 스크롤)은 오른쪽 칸을 맨 위로 올려 그래프 · 결과 문장이 보이게 한다
  function bringFig(from) {
    if (!window.matchMedia('(max-width:900px)').matches) {   // 데스크톱: 오른쪽 칸(그래프 · 해설)을 맨 위로
      const f = (from.closest('.panel') || from.closest('.ch')).querySelector('.fig');
      if (f && f.scrollTop > 0) f.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      if (window.scrollY > 0) window.scrollTo({ top: 0 });
      return;
    }
    const root = from.closest('.panel') || from.closest('.ch'), t = root && $('.fig', root);
    if (!t) return;
    const top = t.getBoundingClientRect().top - $('.top').offsetHeight - 8;
    if (top < 0) window.scrollTo({ top: window.scrollY + top, behavior: reduce ? 'auto' : 'smooth' });
  }
  const unpress = (scope) => $$('.opts button[aria-pressed="true"]', scope).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  // 그래프 하나 + 재생기 + 목록 묶음
  function runner(plot, player, o) {
    let sc = null, beats = [], at = 0;
    player.onGo = (i) => { at = i; };
    function load(branch, start, play) {
      beats = beatsFor(plot, sc, branch, o, (b) => { const k = beats.findIndex((x) => x.g !== beats[0].g); load(b, k, true); });
      player.load(beats, { at: start || 0, play });
    }
    return {
      pick(s) { if (o.quiet) o.quiet(); if (!s) { sc = null; player.clear(); plot.show([plot.base()], { dur: dur() }); return; } sc = s; load(null, 0, true); },
      resume() { if (sc) player.load(beats, { at, play: false, anim: false }); else { player.clear(); plot.show([plot.base()], { instant: true }); } },
      cur: () => sc
    };
  }

  /* ───────── Ch29 은행 T계정 ───────── */
  // 처음: 지준 $100, R 10% → 예금 $1,000 · 대출 $900 · 통화량 $1,000(현금 보유 없음). 사건마다 걸음별 값(R · 지준 · 대출 · 예금)을 차례로 보여 준다
  function ch29() {
    // 통화승수 사건: T계정 · 시간선 없이 변화량 식 하나 — ΔReserves × 승수 = ΔMoney supply (숫자는 증가분 중심), 아래 작은 글에 세부(본원통화 등).
    // 대출 부실 사건만: 맨큐의 레버리지 예처럼 은행 한 곳의 T계정 + 두 마디 시간선
    const EN = document.documentElement.lang === 'en';
    const R0 = 0.1, RES0 = 100;
    const player = Player($('#pl29'));
    const row = (k, nm, id) => '<div class="r" data-k="' + k + '"><span>' + nm + '</span><b id="t' + id + '"></b><i id="d' + id + '"></i></div>';
    $('#bank').innerHTML =
      '<div class="eqrow" id="k29">' +
      '<div class="term" data-k="res"><i>Reserves</i><span>지급준비금</span></div><span class="kop">×</span>' +
      '<div class="term" data-k="R"><i>Money multiplier</i><span>통화승수</span></div><span class="kop">=</span>' +
      '<div class="term" data-k="M"><i id="mLabEn">Money supply</i><span id="mLab">통화량</span></div>' +
      '<b class="num" data-k="res" id="nRes"></b><span class="kop2">×</span><b class="num" data-k="R" id="nR"></b><span class="kop2">=</span><b class="num" data-k="M" id="nM"></b></div>' +
      '<p class="eqdetail" id="k29d"></p>' +
      '<div class="tacct" id="tacct" hidden><h3>은행 T계정</h3><div class="tt">' +
      '<div><span class="h">ASSETS 자산</span>' + row('res', '지급준비금', 'Res') + row('L', '대출', 'Loan') + row('S', '증권', 'Sec') + '</div>' +
      '<div><span class="h">LIABILITIES · CAPITAL 부채 · 자본</span>' + row('D', '예금', 'Dep') + row('Db', '부채', 'Debt') + row('K', '자본', 'Cap') + '</div></div>' +
      '<p class="tnote" id="tNote">※ 레버리지 비율 = 자산 ÷ 자본</p></div>';
    const money = (v) => (v == null ? '—' : '$' + fmt(v));
    const sgn = (v) => (v > 0 ? '+' : '−') + '$' + fmt(Math.abs(v));
    let kt = [];
    const pulse = (ks) => { kt.forEach(clearTimeout); kt = []; const mark = (k) => $$('#k29 [data-k]').forEach((x) => x.classList.toggle('pulse', x.getAttribute('data-k') === k)); mark(null); ks.forEach((k, i) => kt.push(setTimeout(() => mark(k), i * 600 / SPEED))); kt.push(setTimeout(() => mark(null), ks.length * 600 / SPEED + 400)); };
    // 식 숫자: 지준(변화분 또는 수준) × 승수(바뀌면 '10 → 5') = 통화량 변화분 ▲▼. ev 가 없으면 처음 수준 $100 × 10 = $1,000
    function formula(ev) {
      const nRes = $('#nRes'), nR = $('#nR'), nM = $('#nM');
      // 식 사건 결과 문장
      const sl = $('#c29 .sitline'), rsx = sl && sl.nextElementSibling, ans = ev && /\*\*([+−-])(\$[\d,]+)\*\*/.exec(ev.d);
      if (sl) sl.innerHTML = ev ? sitHTML(ev.t) : '';
      if (rsx) rsx.innerHTML = ans ? rsHTML(COND[ev.t], [{ g: '', rs: '통화량 ' + (ans[1] === '+' ? '↑' : '↓') + ' ' + ans[2], on: true, b: -1 }]) : '';
      $('#mLab').textContent = ev && ev.dep ? '예금' : '통화량'; $('#mLabEn').textContent = ev && ev.dep ? 'Deposits' : 'Money supply';
      $('#k29d').innerHTML = ev ? ev.d.split(' ¶ ').map((p) => '<span class="dp">' + p.split(' — ').map((x) => '<span class="dl">' + x.split(' → ').map((u, k) => '<span class="u">' + (k ? '→ ' : '') + arrows(u).replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</span>').join(' ') + '</span>').join('') + '</span>').join('') : '';
      if (!ev) { nRes.className = nR.className = nM.className = 'num'; nRes.textContent = money(RES0); nR.textContent = fmt(1 / R0); nM.textContent = money(RES0 / R0); return; }
      const R1 = ev.R || R0, dRes = ev.dRes || 0, dM = (RES0 + dRes) / R1 - RES0 / R0;
      nRes.className = 'num' + (dRes > 0 ? ' up' : dRes < 0 ? ' dn' : ''); nRes.textContent = dRes ? sgn(dRes) : money(RES0);
      nR.className = 'num' + (R1 !== R0 ? (R1 < R0 ? ' up' : ' dn') : ''); nR.innerHTML = R1 !== R0 ? '<span class="old">' + fmt(1 / R0) + ' →</span> ' + fmt(1 / R1) : fmt(1 / R0);
      nM.className = 'num' + (dM > 0 ? ' up' : ' dn'); nM.textContent = sgn(dM) + (dM > 0 ? ' ▲' : ' ▼');
      pulse(R1 !== R0 ? ['R', 'M'] : ['res', 'M']);
    }
    // 대출 부실(맨큐 레버리지 예): 지급준비금 $200 · 대출 $700 · 증권 $100 | 예금 $800 · 부채 $150 · 자본 $50
    const CB = { res: 200, L: 700, S: 100, D: 800, Db: 150, K: 50 };
    const cell = (id, base, v) => {
      $('#t' + id).textContent = money(v);
      const x = $('#d' + id), dv = v - base;
      x.className = dv < -0.5 ? 'dn' : dv > 0.5 ? 'up' : ''; x.textContent = Math.abs(dv) < 0.5 ? '' : (dv > 0 ? '▲ +' : '▼ −') + money(Math.abs(dv));
    };
    function tshow(st, hi) {
      cell('Res', CB.res, st.res); cell('Loan', CB.L, st.L); cell('Sec', CB.S, st.S); cell('Dep', CB.D, st.D); cell('Debt', CB.Db, st.Db); cell('Cap', CB.K, st.K);
      $$('#bank .tt [data-k]').forEach((x) => x.classList.toggle('hi', (hi || []).indexOf(x.getAttribute('data-k')) >= 0));
    }
    const mode = (cap) => { $('#k29').hidden = cap; $('#k29d').hidden = cap; $('#tacct').hidden = !cap; };
    // d: 식 아래 작은 글(세부). dRes: 지준 변화분, R: 새 지급준비율, dep: 결과 항을 '예금'으로
    // d 표기: ¶ 문단 · — 줄바꿈 · ==형광펜== · **굵게**
    const EV = [
      { t: '지급준비율 인상 10% → 20%', q: 'SA 10', dir: 'l', R: 0.2, d: 'R 10% → 20% → 승수 1/R 10 → 5 — 통화량 = $100 × 5 = $500 → **−$500**' },
      { t: '지급준비율 인하 10% → 5%', dir: 'r', R: 0.05, d: 'R 10% → 5% → 승수 1/R 10 → 20 — 통화량 = $100 × 20 = $2,000 → **+$1,000**' },
      { t: '은행이 초과지준을 더 보유', dir: 'l', R: 0.2, d: '은행이 필요지준보다 더 쌓음 — → 지급준비율 R 10% → 20% → 승수 10 → 5 — 통화량 → **−$500**' },
      { t: '예금 $100 증가', dir: 'r', dRes: 100, dep: true, d: '이 $100 은 ==사람들이 이미 들고 있던 현금== = ==본원통화의 일부== — → 이미 통화량에 들어 있다 ¶ 예금: 현금 −$100 → 지준 +$100 (본원통화 그대로) — → 예금 +$1,000 ¶ 통화량 = 예금 +$1,000 − 현금 $100 = **+$900**' },
      { t: '예금 $50 인출', dir: 'l', dRes: -50, dep: true, d: '이 $50 은 ==본원통화 안에 그대로== — 지준에서 현금으로 자리만 옮긴다 ¶ 인출: 지준 −$50 → 예금 −$500 ¶ 통화량 = 예금 −$500 + 현금 $50 = **−$450**' },
      { t: 'Fed 채권 매입 $100', q: 'SA 11', dir: 'r', dRes: 100, d: 'Fed 가 새 돈으로 지불 → ==본원통화 +$100== → 은행 지준 +$100 — 줄어든 현금이 없으므로 통화량 = **+$1,000**' },
      { t: 'Fed 채권 매각 $50', dir: 'l', dRes: -50, d: 'Fed 가 돈을 거둬들임 → ==본원통화 −$50== → 은행 지준 −$50 — 통화량 = **−$500**' },
      { t: 'Fed 가 은행에 $100 대출 (재할인율 인하)', dir: 'r', dRes: 100, d: '재할인율 ↓ → 은행이 Fed 에서 $100 차입 — → ==본원통화 +$100== → 은행 지준 +$100 — 통화량 = **+$1,000**' },
      { t: '대출 부실 → 은행 자본 감소', dir: 'l', cap: true, dl: '자본' }
    ];
    const CAP = EV.find((e) => e.cap);
    const capBeats = () => [
      { g: CAP.t, ev: CAP.t, rs: '자산 ↓ 5%', sit: '대출 부실', k: '대출 ↓ $50', t: '자산 감소율 = $50 ÷ $1,000 = 5%', run: () => tshow(Object.assign({}, CB, { L: 650 }), ['L']), wait: 1.4 },
      { g: CAP.t, ev: CAP.t, rs: '자본 ↓ 100%', sit: '대출 부실', k: '자본 ▼ 100%', t: '자본 감소율 = 자산 감소율 × 레버리지 = 5% × 20', run: () => tshow(Object.assign({}, CB, { L: 650, K: 0 }), ['K']), wait: 1.4 }
    ];
    list($('#o29'), EV, (i) => {
      const ev = i < 0 ? null : EV[i];
      if (ev && ev.cap) { mode(true); tshow(CB, []); player.load(capBeats()); }
      else { mode(false); player.clear(); formula(ev); }
      alignBank();
    });
    mode(false); formula(null);
  }



  /* ───────── Ch30 화폐시장: 화폐가치 1/P ───────── */
  // MS: M = 5 + MS. MD: 1/P = 25 × s / M, s = (1 + Yg)/(1 + Vg) — 실질 GDP(Yg) ↑ 이면 돈이 더 필요, 유통속도(Vg) ↑ 이면 덜 필요
  const mdScale = (off) => (1 + (off.Yg || 0)) / (1 + (off.Vg || 0)) - 1;
  function ch30() {
    const plot = Plot($('#plot30'), {
      aria: '화폐시장 그래프', dom: [0, 12, 0, 10], xName: 'M', yName: '1/P', xTitle: '화폐량 M', yTitle: '화폐가치 1/P', ptD: [12, -12],
      curves: [
        { id: 'MS', kind: 'vert', x: 5, y0: 0.4, y1: 9.6, lab: 'MS' },
        { id: 'MD', kind: 'hyper', k: 25, ylim: 9.5, xmax: 11.6, lab: 'MD', calc: mdScale }
      ],
      eqs: [['MS', 'MD']]
    });
    const player = Player($('#pl30'));
    const idx = (s) => {
      const m = plot.pointsOf(s.off, s.vis)[0];
      const M = 100 * (5 + (s.off.MS || 0)) / 5, P = m ? 100 * 5 / m.y : NaN, Y = 100 * (1 + (s.off.Yg || 0));
      return { M, P, Y, V: P * Y / M / 100, v: m ? m.y : NaN };
    };
    const r = runner(plot, player, {
      start: 'A : MS = MD',
      result: (a, b) => { const x = idx(a), y = idx(b); return '1/P ' + dirW(x.v, y.v, 0.02) + ' · P ' + dirW(x.P, y.P, 0.5); },   // 1/P 와 P 는 같은 것 — 쉼표 · 가운뎃점으로
      quiet: () => plot.hilite(null),
      // 새 균형에서: 바뀐 축 값(M · 1/P)을 한 번에 강조
      after: (a, b) => {
        const x = idx(a), y = idx(b), items = [];
        const ax = (dirOf(x.M, y.M, 0.5) ? 'x' : '') + (dirOf(x.v, y.v, 0.02) ? 'y' : '');
        if (ax) items.push({ axis: ax });
        plot.seq(items);
      }
    });
    const keep = (why) => ({ name: 'Fed 가 MS 를 옮겨 물가 유지', label: 'Fed 가 물가를 지키려면', sw: '물가를 지키려면 Fed 가 M 을 줄이고, 그러면 ', rs: 'P back', ch: { abs: (o) => ({ MS: 5 * (1 + mdScale(o)) - 5 }) }, why });
    const EV = [
      { t: 'Fed 통화량 2배', dir: 'r', stages: [{ name: 'MS →', at: 0, ch: { add: { MS: 5 } }, why: 'MS → → 1/P 절반, P 2배' }] },
      { t: 'Fed 통화량 감소', dir: 'l', stages: [{ name: 'MS ←', at: 0, ch: { add: { MS: -1.5 } }, why: 'MS ← → 1/P ↑, P ↓' }] },
      { t: '신용카드 보급 → 현금 덜 보유', q: 'SA 2', dir: 'l', stages: [
        { name: '화폐 수요 감소', label: '화폐 수요 감소', ch: { add: { Vg: 0.5 } }, why: '카드 결제 → 돈 보유 ↓ → MD ← → 1/P ↓, P ↑' },
        keep('Fed 가 M ↓ → MS ← → 1/P, P 회복')] },
      { t: '실질 GDP 증가 → 거래용 돈 더 필요', dir: 'r', stages: [
        { name: '화폐 수요 증가', ch: { add: { Yg: 0.3 } }, why: 'Y ↑ → 돈 수요 ↑ → MD → → 1/P ↑, P ↓' }] }
    ];
    list($('#o30'), EV, (i) => r.pick(i < 0 ? null : EV[i]));
    return plot;
  }

  /* ───────── Ch33 AD–AS ───────── */
  const adasCurves = () => [
    { id: 'LRAS', kind: 'vert', x: 5, y0: 0.8, y1: 9.6, lab: 'LRAS' },
    { id: 'SRAS', kind: 'line', x: 5, y: 5, m: 0.85, span: 3.8, lab: 'SRAS' },
    { id: 'AD', kind: 'line', x: 5, y: 5, m: -0.85, span: 3.8, lab: 'AD' }
  ];
  // 교점이 LRAS 위에 오도록 SRAS 를 옮기거나(장기 자동 조정) AD 를 옮긴다(정책 수용)
  const lrSRAS = (off) => { const L = 5 + (off.LRAS || 0), yA = 5 - 0.85 * (L - 5 - (off.AD || 0)); return { SRAS: L - 5 - (yA - 5) / 0.85 }; };
  const lrAD = (off) => { const L = 5 + (off.LRAS || 0), yS = 5 + 0.85 * (L - 5 - (off.SRAS || 0)); return { AD: L - 5 + (yS - 5) / 0.85 }; };
  const eqX = (off) => 5 + ((off.AD || 0) + (off.SRAS || 0)) / 2;   // AD · SRAS 교점의 Y (기울기가 ±0.85 로 같아서)
  function longRun(S) {                        // 2단계 설명: 1단계 끝 상태가 Y* 보다 큰지 작은지
    const b = S[S.length - 1].off, L = 5 + (b.LRAS || 0);
    return eqX(b) > L + 0.03
      ? 'Y > Y* → 임금 · P^e 조정 ↑ → SRAS ← → Y* 회복, P ↑'
      : 'Y < Y* → 임금 · P^e 조정 ↓ → SRAS → → Y* 회복, P ↓';
  }
  function gap(off, pt) {
    const L = 5 + (off.LRAS || 0);
    return Math.abs(pt.x - L) < 0.03 ? 'Y = Y* 장기균형' : pt.x > L ? 'Y > Y* 단기 경기 과열' : 'Y < Y* 단기 경기 침체';
  }
  function ch33() {
    const mk = (host) => Plot(host, { aria: '총수요 총공급 그래프', dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: '실질 GDP Y', yTitle: '물가 P', star: true, curves: adasCurves(), eqs: [['AD', 'SRAS']] });
    const ad = mk($('#plot33ad')), as = mk($('#plot33as')), player = Player($('#pl33'));
    const CV = ['AD', 'SRAS', 'LRAS'];
    const opt = (plot) => ({
      start: 'A : Y = Y*',
      result: (a, b) => { const x = plot.pointsOf(a.off, a.vis)[0], y = plot.pointsOf(b.off, b.vis)[0]; if (!x || !y) return ''; let s = 'Y ' + dirW(x.x, y.x, 0.03) + ' · P ' + dirW(x.y, y.y, 0.03) + ' — ' + gap(b.off, y); if (y.x < x.x - 0.03 && y.y > x.y + 0.03 && Math.abs(x.x - 5 - (a.off.LRAS || 0)) < 0.03) s += ' (스태그플레이션)'; return s; },
      quiet: () => plot.hilite(null),
      // 새 균형에서: 바뀐 축 값(Y · P)을 한 번에 강조
      after: (a, b) => {
        const x = plot.pointsOf(a.off, a.vis)[0], y = plot.pointsOf(b.off, b.vis)[0];
        if (!x || !y) return;
        const items = [];
        const ax = (dirOf(x.x, y.x, 0.03) ? 'x' : '') + (dirOf(x.y, y.y, 0.03) ? 'y' : '');   // Y · P 변화는 한 번에
        if (ax) items.push({ axis: ax });
        plot.seq(items);
      }
    });
    const rad = runner(ad, player, opt(ad)), ras = runner(as, player, opt(as));
    let curName = 'ad';
    const R = 1.4;
    const adEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'AD ' + (dir === 'r' ? '→' : '←'), step: '1단계 단기', ch: { add: { AD: dir === 'r' ? R : -R } }, why },
      { name: 'SRAS 조정 → Y*', step: '2단계 장기', ch: { abs: lrSRAS }, why: longRun }] });
    const AD = {
      C: [adEv('주가 급등', 'r', '주가 ↑ → 부 ↑ → C ↑ → AD →'), adEv('주가 폭락', 'l', '주가 ↓ → 부 ↓ → C ↓ → AD ←', 'SA 4a'), adEv('소득세 인하', 'r', '소득세 ↓ → 가처분소득 ↑ → C ↑ → AD →')],
      I: [adEv('통화량 증가', 'r', 'M ↑ → r ↓ → I ↑ → AD →'), adEv('기업 낙관 · 투자 붐', 'r', '미래 사업 전망 ↑ → 새 설비 투자 I ↑ → AD →', 'SA 5'), adEv('투자세액공제', 'r', '투자하면 세금 감면 → I ↑ → AD →')],
      G: [adEv('정부 구매 증가', 'r', '정부 구매 G ↑ → AD →', 'SA 4b')],
      NX: [adEv('해외 경기 침체', 'l', '외국 소득 ↓ → 우리 수출 ↓ → NX ↓ → AD ←', 'SA 4d'), adEv('해외 정치 불안 → 원화 절상', 'l', '원화 ↑ → 수출 ↓ · 수입 ↑ → NX ↓ → AD ←', 'MC 7')]
    };
    const srEv = (t, why, q) => ({ t, q, dir: 'l', stages: [
      { name: 'SRAS ←', step: '1단계 단기', ch: { add: { SRAS: -R } }, why },
      { name: '그대로 두면 SRAS 복귀', short: '그대로', ch: { abs: { SRAS: 0 } }, letter: 'A', at: 2, why: 'Y < Y* → 임금 · P^e 조정 ↓ → SRAS → → Y* 회복, P 회복 (오래 걸림)' },
      { name: '정책으로 수용 AD →', short: '정책', sit: 'Y < Y* : 정책으로 수용', from: 0, ch: { abs: lrAD }, chain: ['M ↑ · G ↑', 'AD →', 'Y* 회복, P 더 ↑'], at: 1 }] });
    // LRAS 가 움직이면 SRAS 도 같이 움직여 새 균형은 새 Y* 위(장기균형). AD 그대로면 P 는 반대로
    const lrEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'LRAS · SRAS ' + (dir === 'r' ? '→' : '←'), ch: { add: { LRAS: dir === 'r' ? 1 : -1 }, abs: lrSRAS }, why }] });
    const AS = {
      SR: [srEv('기대물가 상승', 'P^e ↑ → 임금 · 가격 ↑ → SRAS ←', 'MC 11'), srEv('유가 급등', '유가 ↑ → 생산 비용 ↑ → SRAS ←'), srEv('명목임금 상승', '명목임금 ↑ → 비용 ↑ → SRAS ←')],
      LR: [lrEv('기술 진보', 'r', '기술 ↑ → 생산성 ↑ → Y* ↑ → LRAS · SRAS →', 'SA 4c'), lrEv('자본 · 인적자본 증가', 'r', '자본 K · 인적자본 H ↑ → Y* ↑ → LRAS · SRAS →', 'SA 5c'), lrEv('이민 → 노동 증가', 'r', '노동 L ↑ → Y* ↑ → LRAS · SRAS →', 'SA 1'), lrEv('자연재해 · 자원 감소', 'l', '자원 N · 자본 ↓ → Y* ↓ → LRAS · SRAS ←', 'SA 1'), lrEv('자연실업률 상승', 'l', '최저임금 ↑ → 자연실업률 ↑ — → 취업자 L ↓ → Y* ↓ → LRAS · SRAS ←')]
    };
    // 어느 목록에서 골라도 그 탭의 줄 표시를 모두 지우고 새 사건을 처음 상태 A 에서 시작한다(앞 사건의 LRAS 이동 등은 풀린다). 같은 줄을 다시 누르면 풀림
    $$('#side33ad [data-o]').forEach((h) => { const L = AD[h.getAttribute('data-o')]; list(h, L, (i) => rad.pick(i < 0 ? null : L[i]), $('#side33ad')); });
    $$('#side33as [data-o]').forEach((h) => { const L = AS[h.getAttribute('data-o')]; list(h, L, (i) => ras.pick(i < 0 ? null : L[i]), $('#side33as')); });
    function showSub(which, push) {
      curName = which;
      $$('#c33 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === which)));
      $('#plot33ad').hidden = which !== 'ad'; $('#plot33as').hidden = which !== 'as';
      $('#side33ad').hidden = which !== 'ad'; $('#side33as').hidden = which !== 'as';
      (which === 'as' ? ras : rad).resume();     // 탭을 오가면 그 탭에서 보던 걸음에서 멈춘 채로
      if (push) history.replaceState(null, '', which === 'as' ? '#ch33-as' : '#ch33');
    }
    $$('#c33 .sub button').forEach((b) => b.addEventListener('click', () => showSub(b.getAttribute('data-sub'), true)));
    return { showSub, current: () => curName };
  }

  /* ───────── Ch28 노동시장 ───────── */
  function ch28() {
    let info = '';
    const plot = Plot($('#plot28'), {
      aria: '노동시장 그래프', dom: [0, 10, 0, 10], xName: 'L', yName: 'W', xTitle: '노동량 L', yTitle: '임금 W', pad: { r: 130 },
      curves: [
        { id: 'S', kind: 'line', x: 5, y: 5, m: 0.9, span: 4.3, lab: '공급 S' },
        { id: 'D', kind: 'line', x: 5, y: 5, m: -0.9, span: 4.3, lab: '수요 D' },
        { id: 'W', kind: 'horiz', y: 7, x0: 0, x1: 9.6, lab: 'W', hidden: true, color: C.red, ghost: false, plain: true, axisLab: true }
      ],
      eqs: [['S', 'D', { xl: 'L_E', yl: 'W_E', lab: false }]], cmp0: true,
      extra(ctx) {
        info = '';
        const cur = ctx.S[ctx.S.length - 1];
        if (!cur.vis.W) return;
        const W = this.byId.W, S = this.byId.S, D = this.byId.D, off = ctx.off, X = ctx.X, Y = ctx.Y, b = ctx.box, g = ctx.g;
        const e = meet(S, off.S || 0, D, off.D || 0, ctx.dom), w = W.y + (off.W || 0), ex = X(W.x1) + 8;
        if (!e || w <= e.y + 0.05) {
          label(g, ex, Y(w) - 2, '균형보다 낮음', { size: 14, color: C.red, weight: 700 });
          label(g, ex, Y(w) + 16, '→ 구속력 없음', { size: 14, color: C.red, weight: 700 });
          info = 'W ≤ W_E : 시장 임금 W_E 로 거래 → 실업 없음';
          return;
        }
        if (ctx.hide) return;
        const ld = meet(W, off.W || 0, D, off.D || 0, ctx.dom), ls = meet(W, off.W || 0, S, off.S || 0, ctx.dom);
        tri(g, b[0] + 8 + textW('W', 18) + 4, Y(w) - 9, 1);                   // W > W_E
        [[ld, 'L_D', -1], [ls, 'L_S', 1]].forEach(([q, lab, dd]) => {           // 기업이 원하는 사람 ▼ · 일하려는 사람 ▲ (L_E 와 견줌)
          if (!q) return;
          el('path', { d: 'M' + X(q.x) + ' ' + Y(q.y) + 'V' + (b[1] + b[3]), stroke: C.guide, 'stroke-width': 1.4, 'stroke-dasharray': '5 5', fill: 'none' }, g);
          el('circle', { cx: X(q.x), cy: Y(q.y), r: 5, fill: C.red }, g);
          label(g, X(q.x), b[1] + b[3] + 24, lab, { anchor: 'middle', size: 17, weight: 800 });
          tri(g, X(q.x) + textW(lab, 17) / 2 + 4, b[1] + b[3] + 23, dd);
        });
        if (ld && ls && X(ls.x) - X(ld.x) > 40) {
          const y = Y(w) - 22;
          arrow(g, X(ld.x) + 4, y, X(ls.x) - 4, y, C.red, true);
          label(g, (X(ld.x) + X(ls.x)) / 2, y - 12, '실업 = L_S − L_D', { anchor: 'middle', size: 15, color: C.red, weight: 700 });
        }
        label(g, ex, Y(w) - 2, '균형보다', { size: 14, color: C.red, weight: 700 });
        label(g, ex, Y(w) + 16, '높은 임금', { size: 14, color: C.red, weight: 700 });
        info = 'W > W_E : 일하려는 사람 L_S > 기업이 원하는 사람 L_D → 그 차이만큼 실업';
      }
    });
    const player = Player($('#pl28'));
    const r = runner(plot, player, {
      start: 'A : W = W_E, L = L_E',
      result: (a, b) => (b.vis.W ? (b.off.W || 0) + 7 > eqW(b.off) + 0.05 ? 'U ↑' : '변화 없음' : 'W ↓ · L ↓ — 실업 없음'),
      quiet: () => plot.hilite(null),
      // 새 균형에서: W 선, 또는 W · L(x · y 축 한 번에)
      after: (a, b) => plot.seq(b.vis.W ? [] : [{ axis: 'xy' }])
    });
    function eqW(off) { const m = meet(plot.byId.S, off.S || 0, plot.byId.D, off.D || 0, plot.dom); return m ? m.y : 5; }
    const EV = [
      { t: '임금이 균형보다 높게', q: 'MC 10 · 14', dir: 'r',
        sit: '최저임금 : 법으로 정함 — 노동조합 : 단체교섭 — 효율임금 : 기업이 스스로 (노력 ↑ · 이직 ↓)',
        stages: [{ name: 'W > W_E', at: 0, ch: { vis: { W: true }, abs: { W: 0 } }, chain: ['W > W_E', 'L_S ↑ · L_D ↓ → 실업'] }] },
      { t: '노동 수요 감소', q: 'SA 4', dir: 'l', stages: [
        { name: '수요 D ←, 임금 그대로', step: '1단계 단기', at: 2, ch: { add: { D: -1.4 }, vis: { W: true }, abs: { W: -2 } }, why: '수입 ↑ → 국내 산업 쇠퇴 → D ← → W 는 W_E 에 묶임 → 실업' },
        { name: '임금 ↓ → 새 균형', step: '2단계 장기', at: 0, ch: { vis: { W: false } }, why: 'W ↓ → 실업 없음 (다른 산업으로 이동)' }] }
    ];
    list($('#o28'), EV, (i) => r.pick(i < 0 ? null : EV[i]));

    // 실업 지표: 숫자 대신 단어 + 방향. 걸음: 처음 → 옮긴 무리 → 실업률(분자 → 분모 → 결과) → 참가율(분자 → 분모 → 결과). 방향은 실제 수(2009년 6월, SA 1)로 계산
    const B = { E: 140.196, U: 14.729, N: 80.729 };
    const NM = { E: '취업자', U: '실업자', N: '비경제활동인구' };
    const SIT = [
      { t: '실직 후 구직 중', c: '실직한 사람이 일자리를 찾으면', ce: 'If a laid-off worker looks for a job,', m: { E: -1, U: 1 } },
      { t: '실직 후 구직 포기', q: 'MC 1', c: '실직한 사람이 구직을 포기하면', ce: 'If a laid-off worker gives up looking,', m: { E: -1, N: 1 } },
      { t: '구직 시늉만 하던 사람을 비경제활동인구로', q: 'MC 5', c: '구직 시늉만 하던 사람을 비경제활동인구로 다시 세면', ce: 'If token job-seekers are recounted as not in the labor force,', m: { U: -1, N: 1 } },
      { t: '실업자가 취업', c: '실업자가 취업하면', ce: 'If an unemployed person finds a job,', m: { U: -1, E: 1 } },
      { t: '처음으로 구직 시작', c: '처음으로 일자리를 찾기 시작하면', ce: 'If someone starts looking for a first job,', m: { N: -1, U: 1 } }
    ];
    const pl2 = Player($('#pl28s'));
    // 결과 문장(방향 색 · ?)
    const EN = document.documentElement.lang === 'en';
    let rkt = [], sit = null, rv = {};
    const KO_V = { 1: ['상승하고', '상승한다'], '-1': ['하락하고', '하락한다'], 0: ['그대로이고', '그대로이다'] };
    const EN_V = { 1: 'rises', '-1': 'falls', 0: 'stays the same' };
    const slot = (k, x, last) => {
      if (x == null || x.d == null) return '<b class="slot q" data-k="' + k + '"></b>' + (EN ? '' : last ? '.' : '');
      const c = x.d > 0 ? 'up' : x.d < 0 ? 'dn' : 'same', tr = x.d > 0 ? '▲ ' : x.d < 0 ? '▼ ' : '';
      return '<b class="slot ' + c + '" data-k="' + k + '">' + tr + (EN ? EN_V[x.d] : KO_V[x.d][last ? 1 : 0]) + '</b>' + (EN ? '' : last ? '.' : '');
    };
    const sentence = () => {
      const el = $('#k28s');
      if (!sit) { el.innerHTML = ''; return; }
      el.innerHTML = EN
        ? esc(sit.ce) + ' the unemployment rate ' + slot('UR', rv.UR) + ' and the participation rate ' + slot('LF', rv.LF, true) + '.'
        : esc(sit.c) + ' 실업률이 ' + slot('UR', rv.UR) + ' 경제활동참가율은 ' + slot('LF', rv.LF, true);
    };
    const rk = {
      set(v) { rv = { UR: v.UR && v.UR.d != null ? v.UR : null, LF: v.LF && v.LF.d != null ? v.LF : null }; sentence(); },
      seq(ks) { rk.stop(); ks.forEach((k) => { const e = $('#k28s [data-k="' + k + '"]'); if (!e) return; e.classList.add('pulse'); rkt.push(setTimeout(() => e.classList.remove('pulse'), 1000)); }); },
      stop() { rkt.forEach(clearTimeout); rkt = []; $$('#k28s .slot').forEach((e) => e.classList.remove('pulse')); }
    };
    const tri = (d) => (d > 0 ? '<b class="up">▲</b>' : d < 0 ? '<b class="dn">▼</b>' : '');
    const wordOf = (d, w) => { w = w || ['증가', '감소']; return d > 0 ? '<span class="t up">▲ ' + w[0] + '</span>' : d < 0 ? '<span class="t dn">▼ ' + w[1] + '</span>' : '<span class="t same">그대로</span>'; };
    const ur = (x) => x.U / (x.E + x.U), lf = (x) => (x.E + x.U) / (x.E + x.U + x.N);
    // lv: 0 처음 · 1 무리 옮김 · 2 실업률 분자 · 3 분모 · 4 결과 · 5 참가율 분자 · 6 분모 · 7 결과
    function rates(m, lv) {
      const v = { E: B.E + (m.E || 0), U: B.U + (m.U || 0), N: B.N + (m.N || 0) };
      const d = (k) => (lv >= 1 ? m[k] || 0 : 0), dLF = d('E') + d('U'), dPop = dLF + d('N');
      const dUR = dirOf(ur(B), ur(v), 1e-9), dLFr = dirOf(lf(B), lf(v), 1e-9);
      rk.set({ UR: lv >= 4 ? { d: dUR } : { txt: '· · ·' }, LF: lv >= 7 ? { d: dLFr } : { txt: '· · ·' } });
      // lv: 0 처음 · 1 무리 옮김 · 3 실업률 분자 · 분모(한 번에) · 4 결과 · 6 참가율 분자 · 분모(한 번에) · 7 결과
      const hi = (n) => (lv === n ? ' hi' : '');
      const chip = (k) => '<span class="grp">' + NM[k] + tri(d(k)) + '</span>';
      const part = (ks, dd, on) => ks.map((k) => NM[k] + (ks.length > 1 ? tri(d(k)) : '')).join(' + ') + (on && dd ? ' ' + wordOf(dd) : '');   // 여러 항이면 바뀐 무리마다 ▲▼ · 안 바뀌면 아무것도
      const one = (name, dd, on) => name + (on && dd ? ' ' + wordOf(dd) : '');
      const res = (dd, on) => (on ? wordOf(dd, ['상승', '하락']) : '<span class="q">?</span>');
      $('#rates').innerHTML =
        '<div class="who' + hi(1) + '"><span class="lb">인구</span>' + chip('E') + chip('U') + chip('N') + '</div>' +
        '<div class="rate"><span class="nm">실업률</span><span class="frac"><span class="' + hi(3) + '">' + part(['U'], d('U'), lv >= 3) + '</span><span class="' + hi(3) + '">' + part(['E', 'U'], dLF, lv >= 3) + '</span></span><span class="out"><span class="eqs">=</span><span class="res' + hi(4) + '">' + res(dUR, lv >= 4) + '</span></span></div>' +
        '<div class="rate"><span class="nm">경제활동참가율</span><span class="frac"><span class="' + hi(6) + '">' + part(['E', 'U'], dLF, lv >= 6) + '</span><span class="' + hi(6) + '">' + one('성인 인구', dPop, lv >= 6) + '</span></span><span class="out"><span class="eqs">=</span><span class="res' + hi(7) + '">' + res(dLFr, lv >= 7) + '</span></span></div>';
    }
    let rt = [];
    const stopR = () => { rt.forEach(clearTimeout); rt = []; rk.stop(); };
    // 한 걸음 안에서 lvs 를 차례로(분자 · 분모 함께 → 결과). 마지막 결과에서 결과 항을 짚는다
    const KEY = { 4: 'UR', 7: 'LF' };   // 그 단계에서 결과가 나오는 자리
    const stage = (m, lvs) => (anim) => {
      stopR();
      if (!anim || reduce) { rates(m, lvs[lvs.length - 1]); rk.seq(lvs.map((lv) => KEY[lv]).filter(Boolean)); return; }
      lvs.forEach((lv, i) => rt.push(setTimeout(() => { rates(m, lv); if (KEY[lv]) rk.seq([KEY[lv]]); }, i * 700 / SPEED)));
    };
    const arrow = (dd) => (dd > 0 ? '↑' : dd < 0 ? '↓' : '그대로');
    function beats(s) {
      const m = s.m, v = { E: B.E + (m.E || 0), U: B.U + (m.U || 0), N: B.N + (m.N || 0) };
      const dLF = (m.E || 0) + (m.U || 0), dPop = dLF + (m.N || 0);
      const moved = Object.keys(m).map((k) => NM[k] + ' ' + (m[k] > 0 ? '↑' : '↓')).join(' · ');
      return [
        { g: s.t, sit: moved, k: '실업률 ' + arrow(dirOf(ur(B), ur(v), 1e-9)),
          t: '실업자 ' + arrow(m.U || 0) + ' · 경제활동인구 ' + arrow(dLF), run: stage(m, [1, 3, 4]), wait: 2.2 },
        { g: s.t, sit: moved, k: '참가율 ' + arrow(dirOf(lf(B), lf(v), 1e-9)),
          t: '경제활동인구 ' + arrow(dLF) + ' · 성인 인구 ' + arrow(dPop), run: stage(m, [6, 7]), wait: 2.2 }
      ];
    }
    list($('#o28s'), SIT, (i) => { sit = i < 0 ? null : SIT[i]; if (i < 0) { pl2.clear(); stopR(); rates({}, 0); } else pl2.load(beats(SIT[i])); });
    rates({}, 0);

    // 균형임금 · 실업률 탭: 한 번에 하나만
    let cur28 = 'w';
    function showSub(which, push) {
      cur28 = which;
      $$('#c28 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === which)));
      $('#p28w').hidden = which !== 'w'; $('#p28u').hidden = which !== 'u';
      if (which === 'w') plot.render();
      if (push) history.replaceState(null, '', which === 'u' ? '#ch28-u' : '#ch28');
      if (push) alignTabs();
    }
    $$('#c28 .sub button').forEach((b) => b.addEventListener('click', () => showSub(b.getAttribute('data-sub'), true)));
    return { showSub, current: () => cur28 };
  }

  /* ───────── 탭 줄을 그래프 y 축에 맞춤: 그려진 SVG 폭(높이 제한이면 가운데 정렬) × 축 위치(74/640) ───────── */
  function alignTabs() {
    $$('.ch.on.tabbed').forEach((sec) => {
      const svg = $$('.fig .stage:not([hidden]) svg.plot', sec)[0], sub = $('.sub', sec);
      if (!svg || !sub) return;
      const r = svg.getBoundingClientRect(), f = { left: sub.getBoundingClientRect().left - (parseFloat(sub.style.marginLeft) || 0) };   // 탭 칸의 왼쪽 기준
      if (!r.width) return;
      const dw = Math.min(r.width, r.height * 640 / 520), x = r.left + (r.width - dw) / 2 + dw * 74 / 640 - f.left;
      sub.style.marginLeft = window.matchMedia('(max-width:900px)').matches ? '' : Math.max(0, Math.round(x) - 1) + 'px';
    });
  }
  window.addEventListener('resize', alignTabs);
  function alignBank() {
    const eq = $('#c29 .side .eq'), bk = $('#bank');
    if (!eq || !bk || !$('#c29').classList.contains('on')) return;
    if (window.matchMedia('(max-width:900px)').matches) { bk.style.paddingTop = ''; return; }
    bk.style.paddingTop = '0px';
    bk.style.paddingTop = Math.max(0, Math.round(eq.getBoundingClientRect().top - bk.getBoundingClientRect().top)) + 'px';
  }
  window.addEventListener('resize', alignBank);
  // 스크롤바를 숨겼으므로, 아래에 더 있으면 칸 아래쪽을 흐리게 해 더 내릴 수 있음을 보인다
  function markMore() { $$('.side, .fig').forEach((e) => e.classList.toggle('more', e.scrollHeight - e.scrollTop - e.clientHeight > 4)); }
  document.addEventListener('scroll', markMore, true);
  window.addEventListener('resize', markMore);
  // 머리줄 높이(검색 줄이 열리면 커진다) → --toph: 데스크톱 두 칸의 높이 계산에 쓴다
  const setTop = () => document.documentElement.style.setProperty('--toph', $('.top').offsetHeight + 'px');
  setTop(); if (window.ResizeObserver) new ResizeObserver(() => { setTop(); markMore(); }).observe($('.top'));
  document.addEventListener('click', () => setTimeout(markMore, 50));

  /* ───────── 챕터 탭 ───────── */
  ch29();
  const p30 = ch30(), c33 = ch33(), c28 = ch28();
  const plots = { ch30: [p30] };
  function show(id, sub) {
    $$('.ch').forEach((s) => s.classList.toggle('on', s.id === id.replace('ch', 'c')));   // 구역 id(c29)를 주소(#ch29)와 다르게: 같으면 브라우저가 그 구역으로 내려가 고정 머리줄 밑에 가린다
    $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-ch') === id)));
    if (id === 'ch33') c33.showSub(sub === 'as' || sub === 'ad' ? sub : c33.current(), false);
    if (id === 'ch28') c28.showSub(sub === 'u' || sub === 'w' ? sub : c28.current(), false);
    alignTabs(); alignBank(); markMore();
    (plots[id] || []).forEach((p) => p.render());
  }
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => { show(b.getAttribute('data-ch')); history.replaceState(null, '', '#' + b.getAttribute('data-ch')); }));
  function fromHash() {
    const m = /^(ch29|ch30|ch33|ch28)(?:-(as|ad|u|w))?$/.exec(location.hash.slice(1));
    show(m ? m[1] : 'ch29', m && m[2]);
  }
  window.addEventListener('hashchange', fromHash);
  $$('.links a').forEach((a) => { if (/\/econ2\/graphs\//.test(a.getAttribute('href'))) a.addEventListener('click', () => { a.href = a.getAttribute('href').split('#')[0] + location.hash; }); });
  fromHash();
})();
