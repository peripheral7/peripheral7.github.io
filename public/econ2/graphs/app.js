/* Econ2 핵심 그래프 페이지 — index.html 과 짝. 슬라이드 덱(/slides/econ2/graphs.js)과는 따로 쓴 작은 그래프 엔진 + 챕터별 사건.
   · Plot: 곡선(line · vert · horiz · hyper)을 이동량(off)으로 움직인다. 사건마다 상태를 하나 쌓고(push), 바로 앞 상태는 흐리게 남겨
     A → B 를 보여 준다. 곡선은 끌 수 있고(끄는 동안 새 상태 하나), 처음으로(reset) 돌아갈 수 있다.
   · 라벨의 '_' 뒤는 아래 첨자(P_1, AD_2, L_E). 좌표: 곡선은 데이터 단위(dom = [x0, x1, y0, y1]), 글자는 SVG 픽셀(640 × 520). */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1f2537', blue: '#1f6fd1', ghost: '#b3b8c2', guide: '#8d93a0', red: '#c8352e', soft: '#5b6170' };
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
  // '↑' 파랑, '↓' 빨강으로 감싼 HTML. 그 밖의 글자는 그대로(이스케이프)
  const arrows = (s) => esc(s).replace(/↓/g, '<span class="dn">↓</span>');
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
  function segDist(x, y, pts) {
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1], dx = pts[i][0] - ax, dy = pts[i][1] - ay, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    return best;
  }

  /* ───────── 곡선 ───────── */
  // line: (x + o, y) 를 지나는 기울기 m 직선 · vert: x = x + o · horiz: y = y + o · hyper: y = k (1 + o) / x (o 는 배율 변화)
  function fy(c, o, x) {
    if (c.kind === 'line') return c.y + c.m * (x - (c.x + o));
    if (c.kind === 'hyper') return x > 1e-9 ? c.k * (1 + o) / x : Infinity;
    if (c.kind === 'horiz') return c.y + o;
    return NaN;
  }
  function fx(c, o, y) {                        // 높이 y 에서의 x
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
    let hist, disp, anim = 0, hits = [];
    const self = { svg, X, Y, box, dom: d, byId, offOf, hist: () => hist, last: () => hist[hist.length - 1], on: null, extra: cfg.extra || null };

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
    // 곡선 이름 아래 첨자: 쌓인 상태들에서의 서로 다른 위치를 나타난 순서대로
    function sub(c, o) {
      if (c.plain) return c.lab;
      const list = [];
      hist.forEach((s) => { if (!s.vis[c.id]) return; const v = offOf(c, s.off); if (!list.some((u) => same(u, v))) list.push(v); });
      if (list.length < 2) return c.lab;
      const i = list.findIndex((u) => same(u, o));
      return c.lab + '_' + (i < 0 ? list.length + 1 : i + 1);
    }

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const n = hist.length, cur = hist[n - 1], prev = n > 1 ? hist[n - 2] : null, tgt = cur.off, boxes = [];
      const g = el('g', {}, svg);
      // 축
      el('path', { d: 'M' + box[0] + ' ' + (box[1] - 14) + 'V' + (box[1] + box[3]) + 'H' + (box[0] + box[2] + 14), fill: 'none', stroke: C.ink, 'stroke-width': 2 }, g);
      head(g, box[0], box[1] - 20, -Math.PI / 2, C.ink, 9); head(g, box[0] + box[2] + 20, box[1] + box[3], 0, C.ink, 9);
      label(g, box[0] - 10, box[1] - 26, cfg.yTitle, { size: 16, color: C.soft, weight: 600 });
      label(g, box[0] + box[2] + 20, box[1] + box[3] + 50, cfg.xTitle, { anchor: 'end', size: 16, color: C.soft, weight: 600 });

      const P0 = prev ? pointsOf(prev.off, prev.vis) : [], P1 = pointsOf(disp, cur.vis);
      const lr = byId.LRAS, sx = (d[1] - d[0]) * 0.012, sy = (d[3] - d[2]) * 0.012;
      const xName = (pt, off, k) => pt.o.xl || (cfg.star && lr && Math.abs(lr.x - pt.x) < sx && same(offOf(lr, off), 0) ? cfg.xName + '*' : cfg.xName + '_' + (k + 1));
      const yName = (pt, k) => pt.o.yl || cfg.yName + '_' + (k + 1);
      // 보조선과 축 위 이름(같은 높이 · 자리면 앞 것만)
      const guides = (pts, col, k, off) => pts.forEach((pt) => {
        if (pt.o.guide === false) return;
        el('path', { d: 'M' + box[0] + ' ' + Y(pt.y) + 'H' + X(pt.x) + 'V' + (box[1] + box[3]), fill: 'none', stroke: col, 'stroke-width': 1.4, 'stroke-dasharray': '5 5' }, g);
      });
      guides(P0, C.ghost, n - 2, prev && prev.off); guides(P1, C.guide, n - 1, disp);
      const usedY = [], usedX = [];
      [[P1, n - 1, disp, C.ink], [P0, n - 2, prev && prev.off, C.soft]].forEach(([pts, k, off, col]) => pts.forEach((pt) => {
        if (pt.o.guide === false) return;
        if (!usedY.some((v) => Math.abs(v - Y(pt.y)) < 15)) { usedY.push(Y(pt.y)); label(g, box[0] - 8, Y(pt.y) + 6, yName(pt, k), { anchor: 'end', size: 17, color: col }); }
        if (!usedX.some((v) => Math.abs(v - X(pt.x)) < 28)) { usedX.push(X(pt.x)); label(g, X(pt.x), box[1] + box[3] + 24, xName(pt, off, k), { anchor: 'middle', size: 17, color: col }); }
      }));

      // 곡선: 앞 상태 자리(달라진 것만)는 흐리게, 지금은 진하게(옮겨졌으면 파랑)
      hits = [];
      cfg.curves.forEach((c) => {
        const drawLab = (pts, lab, col) => {
          const e = pts[pts.length - 1];
          if (c.axisLab) { label(g, box[0] - 8, e[1] + 6, lab, { anchor: 'end', size: 18, color: col, weight: 800 }); return; }
          const dn = c.m < 0 || c.kind === 'hyper';
          const at = place(boxes, lab, c.kind === 'vert'
            ? [[e[0], e[1] - 10, 'middle'], [e[0] - 4, e[1] - 10, 'end'], [e[0] + 4, e[1] - 10, 'start'], [e[0], e[1] - 30, 'middle']]
            : [[e[0] + 7, e[1] + (dn ? 14 : 2), 'start'], [e[0] - 4, e[1] + (dn ? 28 : -12), 'end'], [e[0] + 7, e[1] + (dn ? 32 : -18), 'start']]);
          label(g, at[0], at[1], lab, { anchor: at[2], size: 17, color: col, weight: 600 });
        };
        const moved = prev && prev.vis[c.id] && (!cur.vis[c.id] || !same(offOf(c, prev.off), offOf(c, tgt)));
        if (moved && c.ghost !== false) {
          const pts = path(c, offOf(c, prev.off));
          if (pts.length > 1) { el('path', { d: dstr(pts), fill: 'none', stroke: C.ghost, 'stroke-width': 2.2 }, g); drawLab(pts, sub(c, offOf(c, prev.off)), C.ghost); }
        }
        if (!cur.vis[c.id]) return;
        const pts = path(c, offOf(c, disp));
        if (pts.length < 2) return;
        const col = c.color || (moved || (prev && !prev.vis[c.id]) ? C.blue : C.ink);
        el('path', { d: dstr(pts), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        drawLab(pts, sub(c, offOf(c, tgt)), col);
        if (c.drag) hits.push({ c, pts });
      });

      // 이동 화살표(앞 → 지금)
      if (prev) cfg.curves.forEach((c) => {
        if (!prev.vis[c.id] || !cur.vis[c.id]) return;
        const oa = offOf(c, prev.off), oz = offOf(c, tgt);
        if (same(oa, oz)) return;
        if (c.kind === 'horiz') {
          const x = X(d[0] + (d[1] - d[0]) * 0.9), y1 = Y(c.y + oa), y2 = Y(c.y + oz);
          if (Math.abs(y2 - y1) > 20) arrow(g, x, y1 + Math.sign(y2 - y1) * 6, x, y2 - Math.sign(y2 - y1) * 8, C.blue);
          return;
        }
        const yy = c.arrowY != null ? c.arrowY : c.kind === 'vert' ? (c.y1 != null ? c.y1 : d[3]) - (d[3] - d[2]) * 0.08 : c.kind === 'line' ? c.y + Math.abs(c.m) * c.span * 0.78 : d[2] + (d[3] - d[2]) * 0.72;
        const x1 = X(fx(c, oa, yy)), x2 = X(fx(c, oz, yy)), yp = Y(yy);
        if (Math.abs(x2 - x1) > 22) arrow(g, x1 + Math.sign(x2 - x1) * 8, yp, x2 - Math.sign(x2 - x1) * 10, yp, C.blue);
      });

      // 균형점: 앞 상태 글자는 검정, 지금은 파랑
      const lrX = lr ? X(lr.x + offOf(lr, disp)) : null;
      const P0s = P0.filter((a) => !P1.some((b) => Math.abs(X(a.x) - X(b.x)) < 3 && Math.abs(Y(a.y) - Y(b.y)) < 3));   // 같은 자리면 앞 점은 생략
      [[P0s, n - 2, C.ink, 5.5], [P1, n - 1, C.blue, 7]].forEach(([pts, k, col, r]) => pts.forEach((pt, i) => {
        if (pt.o.dot === false) return;
        const px = X(pt.x), py = Y(pt.y);
        el('circle', { cx: px, cy: py, r, fill: col, stroke: '#fff', 'stroke-width': 2 }, g);
        if (i || pt.o.lab === false) return;
        const dd = pt.o.d || cfg.ptD || (lrX != null && px < lrX - 3 ? [-28, 7] : [15, 7]);
        label(g, px + dd[0], py + dd[1], LET[k % 26], { size: 19, weight: 800, color: col });
      }));

      const ctx = { g, prev, cur, P0, P1, off: disp, X, Y, box, dom: d };
      if (self.extra) self.extra(ctx);
      if (self.on) self.on(ctx);
    }
    self.render = () => render();

    function go(instant) {
      const to = Object.assign({}, hist[hist.length - 1].off), from = Object.assign({}, disp);
      cancelAnimationFrame(anim);
      if (instant || reduce) { disp = to; render(); return; }
      const ids = Object.keys(Object.assign({}, from, to)), t0 = performance.now(), dur = 750;
      const tick = (t1) => {
        const t = Math.min(1, (t1 - t0) / dur), e = EASE(t), m = {};
        ids.forEach((k) => { m[k] = (from[k] || 0) + ((to[k] || 0) - (from[k] || 0)) * e; });
        disp = m; render();
        if (t < 1) anim = requestAnimationFrame(tick);
      };
      anim = requestAnimationFrame(tick);
    }
    // ch: { add: {id: 더할 이동량}, abs: {id: 이동량}, vis: {id: true/false} }, meta: 설명({ why, ev })
    self.push = (ch, meta) => {
      const last = hist[hist.length - 1], off = Object.assign({}, last.off);
      if (ch.add) for (const k in ch.add) off[k] = (off[k] || 0) + ch.add[k];
      if (ch.abs) Object.assign(off, ch.abs);
      cfg.curves.forEach((c) => { if (c.range && off[c.id] != null) off[c.id] = Math.max(c.range[0], Math.min(c.range[1], off[c.id])); });
      hist.push({ off, vis: Object.assign({}, last.vis, ch.vis || {}), meta: meta || {} });
      go();
    };
    self.reset = (instant) => { hist = [{ off: Object.assign({}, cfg.start || {}), vis: Object.assign({}, baseVis), meta: {} }]; go(instant); };
    hist = [{ off: Object.assign({}, cfg.start || {}), vis: Object.assign({}, baseVis), meta: {} }];
    disp = Object.assign({}, hist[0].off);

    // 끌기: 누른 자리에서 22px 안의 끌 수 있는 곡선 → 새 상태를 하나 쌓고 그 곡선만 움직인다
    let drag = null;
    const toData = (e) => {
      const m = svg.getScreenCTM(); if (!m) return null;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const q = pt.matrixTransform(m.inverse());
      return { x: d[0] + (q.x - box[0]) / box[2] * (d[1] - d[0]), y: d[2] + (box[1] + box[3] - q.y) / box[3] * (d[3] - d[2]), px: q.x, py: q.y };
    };
    const pick = (q) => {
      let best = null;
      hits.forEach((h) => { const dist = segDist(q.px, q.py, h.pts); if (dist < 22 && (!best || dist < best.dist)) best = { c: h.c, dist }; });
      return best;
    };
    svg.addEventListener('pointerdown', (e) => {
      const q = toData(e); if (!q) return;
      const h = pick(q); if (!h) return;
      e.preventDefault();
      cancelAnimationFrame(anim);
      const last = hist[hist.length - 1];
      hist.push({ off: Object.assign({}, disp), vis: Object.assign({}, last.vis), meta: { drag: h.c.lab } });
      drag = { c: h.c, q, o: hist[hist.length - 1].off[h.c.id] || 0 };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      render();
    });
    svg.addEventListener('pointermove', (e) => {
      const q = toData(e); if (!q) return;
      if (!drag) { const h = pick(q); svg.style.cursor = h ? (h.c.drag === 'y' ? 'ns-resize' : 'ew-resize') : ''; return; }
      const c = drag.c, st = hist[hist.length - 1];
      let o = drag.o + (c.drag === 'y' ? q.y - drag.q.y : q.x - drag.q.x);
      if (c.drag === 'scale') o = (1 + drag.o) * (q.x / drag.q.x) - 1;
      if (c.range) o = Math.max(c.range[0], Math.min(c.range[1], o));
      st.off[c.id] = o;
      disp = Object.assign({}, st.off);
      render();
    });
    const end = () => { drag = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.style.touchAction = 'none';

    render();
    return self;
  }

  // 사건 단추 만들기: list = [{ t: 글자, q: 문제 번호, dir: 'r'|'l'|'lr', ch, why, run }]
  function buttons(host, list, plot, onPress) {
    list.forEach((ev) => {
      const b = document.createElement('button');
      b.type = 'button';
      if (ev.dir) b.className = ev.dir;
      b.innerHTML = esc(ev.t) + (ev.q ? '<span class="q">' + esc(ev.q) + '</span>' : '');
      b.addEventListener('click', () => {
        if (ev.run) ev.run(ev); else plot.push(ev.ch, { why: ev.why, ev: ev.t });
        $$('button.on', b.closest('.side') || document).forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        if (onPress) onPress(ev);
      });
      host.appendChild(b);
    });
  }
  function readHTML(lines) { return lines.filter(Boolean).map((l) => '<div class="' + l[0] + '">' + l[1] + '</div>').join(''); }

  /* ───────── Ch30 화폐시장: 화폐가치 1/P ───────── */
  // MS: x = 5 + MS. MD: 1/P = 25 × s / M, s = (1 + Yg)/(1 + Vg) × (1 + MD) — 실질 GDP(Yg) ↑ 이면 돈이 더 필요, 유통속도(Vg) ↑ 이면 덜 필요
  const mdScale = (off) => (1 + (off.Yg || 0)) / (1 + (off.Vg || 0)) * (1 + (off.MD || 0)) - 1;
  function ch30() {
    const plot = Plot($('#plot30'), {
      aria: '화폐시장 그래프', dom: [0, 12, 0, 10], xName: 'M', yName: '1/P', xTitle: '화폐량 M', yTitle: '화폐가치 1/P', ptD: [12, -12],
      curves: [
        { id: 'MS', kind: 'vert', x: 5, y0: 0.4, y1: 9.6, lab: 'MS', drag: 'x', range: [-3.5, 6] },
        { id: 'MD', kind: 'hyper', k: 25, ylim: 9.5, xmax: 11.6, lab: 'MD', drag: 'scale', calc: mdScale, range: [-0.6, 2] }
      ],
      eqs: [['MS', 'MD']]
    });
    const idx = (st, off) => {
      const m = plot.pointsOf(off, st.vis)[0];
      const M = 100 * (5 + (off.MS || 0)) / 5, P = m ? 100 * 5 / m.y : NaN, Yr = 100 * (1 + (off.Yg || 0));
      return { M, P, Y: Yr, V: P * Yr / M / 100, v: m ? m.y : NaN };
    };
    plot.on = (ctx) => {
      const n = idx(ctx.cur, ctx.off), lines = [];
      if (ctx.prev) {
        const a = idx(ctx.prev, ctx.prev.off), pct = (b, c) => (c >= b ? '+' : '') + fmt((c / b - 1) * 100, 0) + '%';
        lines.push(['chg', arrows('1/P ' + sign(a.v, n.v, 0.02) + ' → 물가 P ' + fmt(a.P) + ' → ' + fmt(n.P) + ' (' + pct(a.P, n.P) + ') · 화폐량 M ' + fmt(a.M) + ' → ' + fmt(n.M) + ' (' + pct(a.M, n.M) + ')')]);
      } else lines.push(['chg', '처음: M = 100, P = 100 (지수)']);
      lines.push(['why', esc('M × V = P × Y : ' + fmt(n.M) + ' × ' + fmt(n.V, 2) + ' = ' + fmt(n.P) + ' × ' + fmt(n.Y / 100, 2) + ' (Y 는 실질 GDP 지수 ÷ 100)')]);
      const why = ctx.cur.meta.why || (ctx.cur.meta.drag ? ctx.cur.meta.drag + ' 를 끌어 옮김' : '');
      lines.push(why ? ['why', esc(why)] : ['hint', '사건 단추를 누르거나 MS · MD 곡선을 끌어 보세요.']);
      $('#read30').innerHTML = readHTML(lines);
    };
    buttons($('#ev30s'), [
      { t: 'Fed 통화량 2배', dir: 'r', ch: { add: { MS: 5 } }, why: 'MS 2배 → 화폐가치 1/P 절반 → 물가 P 2배. V · Y 그대로라 M 증가율 = 물가상승률(화폐 수량설)' },
      { t: 'Fed 통화량 10% 증가', dir: 'r', q: 'SA 1', ch: { add: { MS: 0.5 } }, why: '통화량 10% ↑ → 물가 약 10% ↑' },
      { t: 'Fed 통화량 감소', dir: 'l', ch: { add: { MS: -1 } }, why: 'MS ← → 1/P ↑ → 물가 P ↓(디플레이션)' },
      { t: '물가 안정: Fed 가 MS 를 맞춤', dir: 'lr', q: 'SA 2c', run: () => { const o = plot.last().off; plot.push({ abs: { MS: 5 * (1 + mdScale(o)) - 5 } }, { why: 'Fed 가 MS 를 MD 변화만큼 옮겨 1/P 를 처음 높이로 → 물가 그대로' }); } }
    ], plot);
    buttons($('#ev30d'), [
      { t: '신용카드 보급 → 현금 덜 보유', dir: 'l', q: 'SA 2', ch: { add: { Vg: 0.5 } }, why: '같은 물가에서 들고 있을 돈 ↓(V ↑) → MD ← → 1/P ↓ → P ↑ (Fed 가 가만히 있으면)' },
      { t: '실질 GDP 증가 → 거래용 돈 더 필요', dir: 'r', ch: { add: { Yg: 0.3 } }, why: 'Y ↑ → MD → → 1/P ↑ → P ↓ (같은 M 으로 더 많은 거래)' },
      { t: 'MD 원래대로', dir: 'lr', ch: { abs: { Vg: 0, Yg: 0, MD: 0 } }, why: '화폐 수요를 처음 상태로' }
    ], plot);
    $('[data-reset="30"]').addEventListener('click', () => { plot.reset(); $$('#c30 .ev button.on').forEach((b) => b.classList.remove('on')); });
    return plot;
  }

  /* ───────── Ch33 AD–AS ───────── */
  const adasCurves = (lrDrag) => [
    { id: 'LRAS', kind: 'vert', x: 5, y0: 0.8, y1: 9.6, lab: 'LRAS', drag: lrDrag ? 'x' : null, range: [-2.5, 2.5] },
    { id: 'SRAS', kind: 'line', x: 5, y: 5, m: 0.85, span: 3.8, lab: 'SRAS', drag: 'x', range: [-3, 3] },
    { id: 'AD', kind: 'line', x: 5, y: 5, m: -0.85, span: 3.8, lab: 'AD', drag: 'x', range: [-3, 3] }
  ];
  // 지금 상태에서 AD · SRAS 교점이 LRAS 위에 오도록: SRAS 를 옮기거나(자동 조정) AD 를 옮긴다(정책)
  function lrSRAS(off) {
    const L = 5 + (off.LRAS || 0), a = off.AD || 0, yA = 5 - 0.85 * (L - 5 - a);
    return L - 5 - (yA - 5) / 0.85;
  }
  function lrAD(off) {
    const L = 5 + (off.LRAS || 0), s = off.SRAS || 0, yS = 5 + 0.85 * (L - 5 - s);
    return L - 5 + (yS - 5) / 0.85;
  }
  function gapText(pt, off) {
    if (!pt) return '';
    const L = 5 + (off.LRAS || 0);
    if (Math.abs(pt.x - L) < 0.03) return 'Y = Y* : 장기균형';
    return pt.x > L ? 'Y > Y* : 경기 과열(실업률 < 자연실업률)' : 'Y < Y* : 경기 침체(실업률 > 자연실업률)';
  }
  function ch33() {
    const mk = (host, lrDrag) => Plot(host, {
      aria: '총수요 총공급 그래프', dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: '실질 GDP Y', yTitle: '물가 P', star: true,
      curves: adasCurves(lrDrag), eqs: [['AD', 'SRAS']]
    });
    const ad = mk($('#plot33ad'), false), as = mk($('#plot33as'), true);
    const pm = $('#pmove'), pmv = $('#pmovev');
    const read = (plot, extraLine) => (ctx) => {
      if (plot !== cur) return;
      const a = ctx.P0[0], z = ctx.P1[0], lines = [];
      if (a && z) {
        let s = LET[ctx.prev ? plot.hist().length - 2 : 0] + ' → ' + LET[plot.hist().length - 1] + ' : Y ' + sign(a.x, z.x, 0.03) + ' · P ' + sign(a.y, z.y, 0.03);
        if (z.x < a.x - 0.03 && z.y > a.y + 0.03 && Math.abs(a.x - 5 - (ctx.prev.off.LRAS || 0)) < 0.03) s += ' — 스태그플레이션';   // 장기균형에서 Y ↓ · P ↑ 일 때만
        lines.push(['chg', arrows(s)]);
      } else lines.push(['chg', 'A : 장기균형(Y = Y*)']);
      const why = ctx.cur.meta.why || (ctx.cur.meta.drag ? ctx.cur.meta.drag + ' 를 끌어 옮김' : '');
      lines.push(why ? ['why', esc(why)] : ['hint', '사건 단추를 누르거나 곡선을 끌어 보세요.']);
      if (z) lines.push(['hint', esc(gapText(z, ctx.off))]);
      if (extraLine) { const x = extraLine(ctx); if (x) lines.push(x); }
      $('#read33').innerHTML = readHTML(lines);
    };
    // AD 탭: P 만 바꾸면 AD 곡선 위를 움직인다(이동 아님)
    ad.extra = (ctx) => {
      const v = +pm.value, z = ctx.P1[0];
      if (!v || !z) return;
      const c = ad.byId.AD, o = ad.offOf(c, ctx.off), y = z.y + v / 100 * 2.2, x = fx(c, o, y);
      const g = ctx.g, X = ctx.X, Y = ctx.Y;
      el('path', { d: 'M' + X(z.x) + ' ' + Y(z.y) + 'L' + X(x) + ' ' + Y(y), stroke: C.red, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.35, fill: 'none' }, g);
      el('circle', { cx: X(x), cy: Y(y), r: 7, fill: C.red, stroke: '#fff', 'stroke-width': 2 }, g);
      label(g, X(x) + (v < 0 ? 12 : -12), Y(y) + (v < 0 ? 20 : -12), '곡선 위 이동', { anchor: v < 0 ? 'start' : 'end', size: 15, color: C.red, weight: 700 });
    };
    const pLine = () => {
      const v = +pm.value;
      if (!v) return null;
      return ['why', arrows(v < 0 ? 'P ↓ → 실질 부 ↑(C ↑) · MD ↓ → r ↓(I ↑) · 원화 ↓(NX ↑) → Y ↑ : AD 곡선 위에서 아래로 이동' : 'P ↑ → 실질 부 ↓(C ↓) · r ↑(I ↓) · 원화 ↑(NX ↓) → Y ↓ : AD 곡선 위에서 위로 이동')];
    };
    ad.on = read(ad, pLine); as.on = read(as);
    pm.addEventListener('input', () => { pmv.textContent = +pm.value ? (+pm.value < 0 ? 'P ↓' : 'P ↑') : '—'; ad.render(); });
    const clearP = () => { pm.value = 0; pmv.textContent = '—'; };
    const R = 1.4;
    const evs = {
      C: [
        { t: '주가 급등 → 부 ↑', dir: 'r', ch: { add: { AD: R } }, why: '주식 부자 → 소비 C ↑ → AD →' },
        { t: '주가 폭락', dir: 'l', q: 'SA 4a', ch: { add: { AD: -R } }, why: '부 ↓ → 소비 C ↓ → AD ←' },
        { t: '소득세 인하', dir: 'r', ch: { add: { AD: R } }, why: '가처분소득 ↑ → C ↑ → AD →' },
        { t: '소비자 비관', dir: 'l', ch: { add: { AD: -R } }, why: '미래 걱정 → 저축 ↑ · C ↓ → AD ←' }
      ],
      I: [
        { t: '통화량 증가 (M ↑ → r ↓)', dir: 'r', ch: { add: { AD: R } }, why: 'M ↑ → 이자율 r ↓ → 투자 I ↑ (r ↓ → 원화 ↓ → NX ↑ 도) → AD →' },
        { t: '통화량 감소 (금리 인상)', dir: 'l', ch: { add: { AD: -R } }, why: 'M ↓ → r ↑ → I ↓ → AD ←' },
        { t: '투자세액공제', dir: 'r', ch: { add: { AD: R } }, why: '투자하면 세금 감면 → I ↑ → AD →' },
        { t: '기업 낙관 · 투자 붐', dir: 'r', q: 'SA 5', ch: { add: { AD: R } }, why: '미래 사업 전망 ↑ → 새 설비 투자 I ↑ → AD →' }
      ],
      G: [
        { t: '정부 구매 증가', dir: 'r', q: 'SA 4b', ch: { add: { AD: R } }, why: 'G ↑ → AD →' },
        { t: '정부 구매 감소', dir: 'l', ch: { add: { AD: -R } }, why: 'G ↓ → AD ←' }
      ],
      NX: [
        { t: '해외 경기 호황', dir: 'r', ch: { add: { AD: R } }, why: '외국 소득 ↑ → 우리 수출 ↑ → NX ↑ → AD →' },
        { t: '해외 경기 침체', dir: 'l', q: 'SA 4d', ch: { add: { AD: -R } }, why: '외국이 덜 삼 → 수출 ↓ → NX ↓ → AD ←' },
        { t: '해외 정치 불안 → 원화 절상', dir: 'l', q: 'MC 7', ch: { add: { AD: -R } }, why: '한국 자산 수요 ↑ → 원화 가치 ↑ → 수출 ↓ 수입 ↑ → NX ↓ → AD ← (P 때문이 아닌 환율 변화라 이동)' }
      ],
      LRad: [
        { t: '시간이 지나면(자동 조정)', dir: 'lr', run: () => autoLR(ad) }
      ],
      SR: [
        { t: '기대물가 상승', dir: 'l', q: 'MC 11', ch: { add: { SRAS: -R } }, why: 'Pe ↑ → 명목임금 계약 ↑ · 가격 미리 ↑ → 같은 P 에서 생산 ↓ → SRAS ← (LRAS 그대로)' },
        { t: '유가 급등(원자재 비용 ↑)', dir: 'l', ch: { add: { SRAS: -R } }, why: '생산 비용 ↑ → SRAS ← → 스태그플레이션' },
        { t: '명목임금 상승', dir: 'l', ch: { add: { SRAS: -R } }, why: '비용 ↑ → SRAS ←' },
        { t: '기대물가 하락', dir: 'r', ch: { add: { SRAS: R } }, why: 'Pe ↓ → 임금 · 가격 ↓ → SRAS →' }
      ],
      LR: [
        { t: '기술 진보', dir: 'r', q: 'SA 4c', ch: { add: { LRAS: 1, SRAS: 1 } }, why: '같은 노동 · 자본으로 더 생산 → Y* ↑ → LRAS · SRAS →' },
        { t: '자본 · 인적자본 증가', dir: 'r', q: 'SA 5c', ch: { add: { LRAS: 1, SRAS: 1 } }, why: 'K · H ↑ → Y* ↑ → LRAS · SRAS →' },
        { t: '이민 → 노동 증가', dir: 'r', q: 'SA 1', ch: { add: { LRAS: 1, SRAS: 1 } }, why: 'L ↑ → Y* ↑ → LRAS · SRAS →' },
        { t: '자연재해 · 자원 감소', dir: 'l', q: 'SA 1', ch: { add: { LRAS: -1, SRAS: -1 } }, why: '자원 N · 자본 ↓ → Y* ↓ → LRAS · SRAS ←' }
      ],
      NO: [
        { t: '통화량만 증가', dir: 'r', ch: { add: { AD: R } }, why: '돈은 장기에 중립: LRAS 그대로, AD 만 → (단기 Y ↑ · P ↑, 장기엔 P 만 ↑)' },
        { t: '기대물가만 변화', dir: 'l', ch: { add: { SRAS: -R } }, why: 'Pe 는 SRAS 만 옮기고 LRAS 는 그대로' }
      ],
      LRas: [
        { t: '시간이 지나면(자동 조정)', dir: 'lr', run: () => autoLR(as) },
        { t: '정책으로 AD 맞추기(수용)', dir: 'lr', run: () => policyLR(as) }
      ]
    };
    function autoLR(plot) {
      const o = plot.last().off, pt = plot.pointsOf(o, plot.last().vis)[0], L = 5 + (o.LRAS || 0);
      if (!pt || Math.abs(pt.x - L) < 0.03) { plot.push({}, { why: '이미 장기균형(Y = Y*)이라 더 움직이지 않음' }); return; }
      plot.push({ abs: { SRAS: lrSRAS(o) } }, { why: pt.x > L
        ? 'Y > Y* → 일손 부족 · 임금 ↑ · 기대물가 ↑ → SRAS ← → Y 는 Y* 로, P 는 더 ↑'
        : 'Y < Y* → 실업 ↑ → 임금 ↓ · 기대물가 ↓ → SRAS → → Y 는 Y* 로, P ↓' });
    }
    function policyLR(plot) {
      const o = plot.last().off, pt = plot.pointsOf(o, plot.last().vis)[0], L = 5 + (o.LRAS || 0);
      if (!pt || Math.abs(pt.x - L) < 0.03) { plot.push({}, { why: '이미 장기균형(Y = Y*)이라 정책이 필요 없음' }); return; }
      plot.push({ abs: { AD: lrAD(o) } }, { why: pt.x < L
        ? 'Fed · 정부가 AD → (통화량 ↑ · G ↑) → Y 는 바로 Y* 로, 대신 P 는 더 ↑ (공급충격 수용)'
        : '긴축으로 AD ← → Y 를 Y* 로, P ↓' });
    }
    $$('#side33ad [data-ev], #side33as [data-ev]').forEach((h) => buttons(h, evs[h.getAttribute('data-ev')], h.closest('#side33as') ? as : ad, clearP));
    let cur = ad, curName = 'ad';
    function showSub(which, push) {
      curName = which;
      cur = which === 'as' ? as : ad;
      $$('#c33 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === which)));
      $('#plot33ad').hidden = which !== 'ad'; $('#plot33as').hidden = which !== 'as';
      $('#side33ad').hidden = which !== 'ad'; $('#side33as').hidden = which !== 'as';
      cur.render();
      if (push) history.replaceState(null, '', which === 'as' ? '#ch33-as' : '#ch33');
    }
    $$('#c33 .sub button').forEach((b) => b.addEventListener('click', () => showSub(b.getAttribute('data-sub'), true)));
    $('[data-reset="33"]').addEventListener('click', () => { clearP(); cur.reset(); $$('#c33 .ev button.on').forEach((b) => b.classList.remove('on')); });
    return { showSub, current: () => curName };
  }

  /* ───────── Ch28 노동시장 ───────── */
  function ch28() {
    let info = '';
    const plot = Plot($('#plot28'), {
      aria: '노동시장 그래프', dom: [0, 10, 0, 10], xName: 'L', yName: 'W', xTitle: '노동량 L', yTitle: '임금 W', pad: { r: 140 },
      curves: [
        { id: 'S', kind: 'line', x: 5, y: 5, m: 0.9, span: 4.3, lab: '공급 S', drag: 'x', range: [-2, 2] },
        { id: 'D', kind: 'line', x: 5, y: 5, m: -0.9, span: 4.3, lab: '수요 D', drag: 'x', range: [-2, 2] },
        { id: 'W', kind: 'horiz', y: 7, x0: 0, x1: 9.6, lab: 'W', hidden: true, drag: 'y', range: [-6, 2.4], color: C.red, ghost: false, plain: true, axisLab: true }
      ],
      eqs: [['S', 'D', { xl: 'L_E', yl: 'W_E', lab: false }]],
      extra(ctx) {
        info = '';
        const W = this.byId.W;
        if (!ctx.cur.vis.W) return;
        const S = this.byId.S, D = this.byId.D, off = ctx.off, X = ctx.X, Y = ctx.Y, b = ctx.box, g = ctx.g;
        const e = meet(S, off.S || 0, D, off.D || 0, ctx.dom), w = W.y + (off.W || 0), ex = X(W.x1) + 8;
        if (!e || w <= e.y + 0.05) {
          label(g, ex, Y(w) - 2, '균형보다 낮음', { size: 14, color: C.red, weight: 700 });
          label(g, ex, Y(w) + 16, '→ 구속력 없음', { size: 14, color: C.red, weight: 700 });
          info = 'W ≤ W_E : 시장 임금 W_E 로 거래 → 실업 없음(구속력 없는 최저임금)';
          return;
        }
        const ld = meet(W, off.W || 0, D, off.D || 0, ctx.dom), ls = meet(W, off.W || 0, S, off.S || 0, ctx.dom);
        [[ld, 'L_D'], [ls, 'L_S']].forEach(([q, lab]) => {
          if (!q) return;
          el('path', { d: 'M' + X(q.x) + ' ' + Y(q.y) + 'V' + (b[1] + b[3]), stroke: C.guide, 'stroke-width': 1.4, 'stroke-dasharray': '5 5', fill: 'none' }, g);
          el('circle', { cx: X(q.x), cy: Y(q.y), r: 5, fill: C.red }, g);
          label(g, X(q.x), b[1] + b[3] + 24, lab, { anchor: 'middle', size: 17 });
        });
        if (ld && ls && X(ls.x) - X(ld.x) > 40) {
          const y = Y(w) - 22;
          arrow(g, X(ld.x) + 4, y, X(ls.x) - 4, y, C.red, true);
          label(g, (X(ld.x) + X(ls.x)) / 2, y - 12, '실업 = L_S − L_D', { anchor: 'middle', size: 15, color: C.red, weight: 700 });
        }
        label(g, ex, Y(w) - 2, '균형보다', { size: 14, color: C.red, weight: 700 });
        label(g, ex, Y(w) + 16, '높은 임금', { size: 14, color: C.red, weight: 700 });
        if (ld && ls) info = 'W > W_E : 일하려는 사람 L_S − 기업이 원하는 사람 L_D = 실업 ' + fmt((ls.x - ld.x) * 10) + ' (그래프 단위)';
      }
    });
    plot.on = (ctx) => {
      const lines = [];
      if (info) lines.push(['chg', esc(info).replace(/_([SDE])/g, '<sub>$1</sub>')]);
      else if (ctx.P0[0] && ctx.P1[0]) {
        const a = ctx.P0[0], z = ctx.P1[0];
        lines.push(['chg', arrows('균형 : 고용 L ' + sign(a.x, z.x, 0.03) + ' · 임금 W ' + sign(a.y, z.y, 0.03) + ' (임금이 자유롭게 움직이면 실업 대신 임금이 조정)')]);
      } else lines.push(['chg', '균형 : W<sub>E</sub> 에서 L<sub>E</sub> 만큼 고용, 실업 없음']);
      const why = ctx.cur.meta.why || (ctx.cur.meta.drag ? ctx.cur.meta.drag + ' 를 끌어 옮김' : '');
      lines.push(why ? ['why', esc(why)] : ['hint', '단추를 누르거나 곡선 · W 선을 끌어 보세요.']);
      $('#read28').innerHTML = readHTML(lines);
    };
    buttons($('#ev28w'), [
      { t: '최저임금(균형보다 높게)', dir: 'r', q: 'MC 14', ch: { vis: { W: true }, abs: { W: 0 } }, why: '법으로 W > W_E → 공급 ↑ · 수요 ↓ → 실업(특히 10대 · 미숙련)' },
      { t: '노동조합', dir: 'r', q: 'MC 10', ch: { vis: { W: true }, abs: { W: 0.5 } }, why: '단체교섭으로 조합원(insider) 임금 ↑ → 그 부문 고용 ↓ → outsider 실업 · 노조 없는 부문으로 이동해 그쪽 임금 ↓' },
      { t: '효율임금', dir: 'r', q: 'MC 14', ch: { vis: { W: true }, abs: { W: -0.4 } }, why: '기업이 스스로 높은 임금: 건강 · 이직 ↓ · 질 높은 지원자 · 노력 ↑ → 그래도 W > W_E 라 실업' },
      { t: '최저임금이 균형보다 낮다면', dir: 'l', q: 'MC 10 +', ch: { vis: { W: true }, abs: { W: -3.4 } }, why: '구속력 없음 → 시장 임금 W_E 그대로, 남는 노동 없음' },
      { t: '임금 규제 없앰', dir: 'lr', ch: { vis: { W: false } }, why: '임금이 균형 W_E 로 → 구조적 실업 사라짐' }
    ], plot);
    buttons($('#ev28s'), [
      { t: '노동 수요 감소(수입 ↑ → 국내 산업 쇠퇴)', dir: 'l', q: 'SA 4', ch: { add: { D: -1.2 } }, why: '수입 ↑ → 국내 산업 쇠퇴 → 노동 수요 ↓. 임금이 묶여 있으면 실업 ↑, 자유로우면 임금 ↓' },
      { t: '노동 수요 증가', dir: 'r', ch: { add: { D: 1.2 } }, why: '노동 수요 ↑ → 고용 ↑ · 임금 ↑' },
      { t: '노동 공급 증가(이민 등)', dir: 'r', ch: { add: { S: 1.2 } }, why: '일하려는 사람 ↑ → 임금 ↓ · 고용 ↑ (임금이 묶여 있으면 실업 ↑)' }
    ], plot);
    $('[data-reset="28"]').addEventListener('click', () => { plot.reset(); $$('#c28 .grp .ev button.on').forEach((b) => b.classList.remove('on')); });

    // 노동 통계: 입력이 바뀌면 다시 계산, 사건은 바로 앞 값과 비교해 ↑ ↓ 를 붙인다
    const inp = { E: $('#sE'), U: $('#sU'), N: $('#sN') };
    let before = null;
    const val = () => ({ E: +inp.E.value || 0, U: +inp.U.value || 0, N: +inp.N.value || 0 });
    const calc = (v) => { const LF = v.E + v.U, pop = LF + v.N; return { pop, LF, LFPR: pop ? LF / pop * 100 : 0, UR: LF ? v.U / LF * 100 : 0 }; };
    const em = (a, b, d) => (a == null ? '' : Math.abs(b - a) < Math.pow(10, -d) / 2 ? '<em>=</em>' : b > a ? '<em>↑</em>' : '<em class="dn">↓</em>');
    function stat() {
      const n = calc(val()), b = before && calc(before);
      $('#oPop').innerHTML = fmt(n.pop) + em(b && b.pop, n.pop, 0);
      $('#oLF').innerHTML = fmt(n.LF) + em(b && b.LF, n.LF, 0);
      $('#oLFPR').innerHTML = fmt(n.LFPR, 1) + '%' + em(b && b.LFPR, n.LFPR, 2);
      $('#oUR').innerHTML = fmt(n.UR, 1) + '%' + em(b && b.UR, n.UR, 2);
    }
    Object.keys(inp).forEach((k) => inp[k].addEventListener('input', () => { before = null; stat(); }));
    const move = (from, to, k) => () => { before = val(); inp[from].value = Math.max(0, +inp[from].value - k); inp[to].value = +inp[to].value + k; stat(); };
    const MIL = 1000000;
    [
      { t: 'MC 1: 실직 후 구직 안 함 (E → 비경제활동, 100만 명)', f: move('E', 'N', MIL) },
      { t: 'MC 5: 구직 시늉만 하던 사람을 비경제활동으로 (U → NILF)', f: move('U', 'N', MIL) },
      { t: '실망 실업자: 구직 포기 (U → NILF)', f: move('U', 'N', MIL) },
      { t: 'SA 1 숫자로 되돌리기', f: () => { before = null; inp.E.value = 140196000; inp.U.value = 14729000; inp.N.value = 80729000; stat(); } }
    ].forEach((ev) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = ev.t; b.addEventListener('click', ev.f);
      $('#ev28stat').appendChild(b);
    });
    stat();
    return plot;
  }

  /* ───────── Ch29 통화승수: 은행 전체 대차대조표 ───────── */
  // 상태: 사람들이 쥔 현금 cash, 은행 지준 res, 지급준비율 rr, 은행이 일부러 더 쥔 초과지준 ex(금액)
  // 예금 D = (res − ex) / rr, 대출 = D − res, 통화량 M = cash + D, 실제 승수 = ΔM / Δ지준
  function ch29() {
    const BASE = { cash: 100, res: 100, rr: 0.1, ex: 0 };
    let st = Object.assign({}, BASE), prev = null, why = '';
    const host = $('#bank'), rr = $('#rr'), rrv = $('#rrv');
    host.innerHTML =
      '<div class="row"><div class="k">은행 자산<small>Assets</small></div><div class="bar"><div class="seg res" id="bRes"></div><div class="seg ex" id="bEx"></div><div class="seg loan" id="bLoan"></div></div></div>' +
      '<div class="row"><div class="k">은행 부채<small>Liabilities</small></div><div class="bar"><div class="seg dep" id="bDep"></div></div></div>' +
      '<div class="row"><div class="k">통화량 M<small>현금 + 예금</small></div><div class="bar"><div class="seg cash" id="bCash"></div><div class="seg dep" id="bDep2"></div></div></div>' +
      '<div class="legend"><i class="res"></i>필요지준 <i class="ex"></i>초과지준 <i class="loan"></i>대출 <i class="dep"></i>예금 <i class="cash"></i>현금</div>' +
      '<div class="nums" id="nums"></div>' +
      '<div class="flow"><div class="fh" id="flowH"></div><div class="fb" id="flowB"></div></div>';
    const der = (s) => { const D = Math.max(0, (s.res - s.ex) / s.rr); return { D, L: D - s.res, M: s.cash + D, req: D * s.rr }; };
    const KEYS = [['cash', '현금(사람들)'], ['res', '지준(은행)'], ['D', '예금'], ['L', '대출'], ['M', '통화량 M', true], ['mult', '승수 1/R']];
    function draw() {
      const n = der(st), p = prev && der(prev);
      const scale = Math.max(2400, n.M * 1.1, n.D * 1.1);
      const w = (v) => (Math.max(0, v) / scale * 100) + '%';
      const bw = $('#bDep').parentNode.clientWidth || 600;   // 칸이 글자보다 좁으면 글자를 비운다(범례 · 아래 숫자 칸에 값이 있음)
      const put = (id, v, txt) => { const e = $('#' + id); e.style.width = w(v); e.textContent = Math.max(0, v) / scale * bw > textW(txt, 14) + 16 ? txt : ''; };
      put('bRes', st.res - st.ex, '필요지준 $' + fmt(st.res - st.ex));
      put('bEx', st.ex, '초과 $' + fmt(st.ex));
      put('bLoan', n.L, '대출 $' + fmt(n.L));
      put('bDep', n.D, '예금 $' + fmt(n.D));
      put('bCash', st.cash, '현금 $' + fmt(st.cash));
      put('bDep2', n.D, '예금 $' + fmt(n.D));
      const all = Object.assign({}, st, n, { mult: 1 / st.rr }), pall = prev && Object.assign({}, prev, p, { mult: 1 / prev.rr });
      $('#nums').innerHTML = KEYS.map(([k, t, big]) => {
        const v = all[k], dv = pall ? v - pall[k] : 0;
        const ds = !pall || Math.abs(dv) < 0.005 ? '' : (dv > 0 ? '+' : '−') + (k === 'mult' ? fmt(Math.abs(dv), 1) : '$' + fmt(Math.abs(dv)));
        return '<div class="num' + (big ? ' big' : '') + '"><div class="k">' + t + '</div><div class="v">' + (k === 'mult' ? fmt(v, 1) : '$' + fmt(v)) + '</div><div class="d' + (dv < 0 ? ' dn' : '') + '">' + (ds || '&nbsp;') + '</div></div>';
      }).join('');
      const lines = [];
      if (prev) {
        const dR = st.res - prev.res, dM = n.M - p.M;
        lines.push(['chg', arrows('통화량 M ' + sign(p.M, n.M, 0.5) + ' ' + (dM >= 0 ? '+' : '−') + '$' + fmt(Math.abs(dM)) + ' · 예금 ' + sign(p.D, n.D, 0.5) + ' · 대출 ' + sign(p.L, n.L, 0.5) + (Math.abs(dR) > 0.005 ? ' · 지준 ' + (dR > 0 ? '+' : '−') + '$' + fmt(Math.abs(dR)) : ''))]);
      } else lines.push(['chg', esc('지준 $' + fmt(st.res) + ' × 승수 ' + fmt(1 / st.rr, 1) + ' = 예금 $' + fmt(n.D) + ' · 통화량 = 현금 + 예금 = $' + fmt(n.M))]);
      lines.push(why ? ['why', esc(why)] : ['hint', '사건 단추를 누르거나 지급준비율을 바꿔 보세요.']);
      $('#read29').innerHTML = readHTML(lines);
      rr.value = Math.round(st.rr * 100); rrv.textContent = Math.round(st.rr * 100) + '%';
      // 예금 창출: 바로 앞 사건의 새 지준(없으면 지금 쓰이는 지준 전체)이 은행을 돌며 × (1 − R) 씩 예금이 되는 과정
      const dRes = prev ? (st.res - st.ex) - (prev.res - prev.ex) : 0, base = Math.abs(dRes) > 0.005 ? dRes : st.res - st.ex, neg = base < 0;
      const q = 1 - st.rr, show = 14, tot = base / st.rr;
      $('#flowH').innerHTML = '<b>예금 창출</b> ' + (Math.abs(dRes) > 0.005 ? '(이번 지준 변화)' : '(지금 지준 전체)') + ' : ' +
        [0, 1, 2].map((i) => (neg ? '−' : '') + '$' + fmt(Math.abs(base) * Math.pow(q, i), Math.abs(base) * Math.pow(q, i) % 1 ? 1 : 0)).join(' + ') + ' + … = <b>' + (neg ? '−' : '') + '$' + fmt(Math.abs(tot)) + '</b> = ' + (neg ? '−' : '') + '$' + fmt(Math.abs(base)) + ' × 1/' + Math.round(st.rr * 100) + '%';
      $('#flowB').innerHTML = Array.from({ length: show }, (_, i) => '<span class="' + (neg ? 'dn' : '') + '" style="height:' + (Math.pow(q, i) * 100).toFixed(1) + '%"></span>').join('');
    }
    function apply(f, text) { prev = Object.assign({}, st); f(st); why = text; draw(); }
    rr.addEventListener('input', () => {
      const r = +rr.value / 100, r0 = st.rr;
      if (r === r0) return;
      apply((s) => { s.rr = r; }, '지급준비율 ' + Math.round(r0 * 100) + '% → ' + Math.round(r * 100) + '% : 지준은 그대로, 승수 ' + fmt(1 / r0, 1) + ' → ' + fmt(1 / r, 1) + ' → 예금 · 통화량 ' + (r > r0 ? '↓' : '↑') + ' (SA 10)');
    });
    buttons($('#pre29'), [
      { t: '기본: 지준 $100 · R 10% · 현금 $100', run: () => { prev = null; st = Object.assign({}, BASE); why = ''; draw(); } },
      { t: 'SA 10: 지준 $100B · R 10%', run: () => { prev = null; st = { cash: 0, res: 100, rr: 0.1, ex: 0 }; why = 'SA 10 a: 승수 10 · 통화량 $1,000(B). 지급준비율을 20% 로 바꿔 보세요 → ΔM = −$500B'; draw(); } },
      { t: 'SA 11: R 20%, 통화량 +$40 목표', run: () => { prev = null; st = { cash: 0, res: 100, rr: 0.2, ex: 0 }; $('#omo').value = 8; why = 'SA 11: 승수 5 → $40 ÷ 5 = $8 어치 채권을 매입하면 된다. 아래 「채권 매입」을 눌러 확인'; draw(); } },
      { t: 'MC 14: 예금 $400 · 대출 $380', run: () => { prev = null; st = { cash: 0, res: 20, rr: 0.05, ex: 0 }; why = 'MC 14: 지준 $20 / 예금 $400 → R = 5%, 승수 20. 「은행이 지준 $10 더 쥠」을 눌러 보세요'; draw(); } }
    ]);
    buttons($('#ev29'), [
      { t: '현금 $100 을 예금(매트리스 → 은행)', q: 'SA 5', run: () => { if (st.cash < 100) { why = '들고 있는 현금이 $100 보다 적어서 예금할 수 없음 — 「기본」을 눌러 보세요'; draw(); return; } apply((s) => { s.cash -= 100; s.res += 100; }, '현금 −$100 · 지준 +$100 → 예금 +$100 × ' + fmt(1 / st.rr, 1) + '. 현금은 이미 통화라 통화량은 그만큼 덜 늘어남(R 10% 면 +$900)'); } },
      { t: '은행이 지준 $10 더 쥠(불확실성)', q: 'MC 14', run: () => apply((s) => { s.ex += 10; }, '대출에 쓸 지준 −$10 → 예금 · 대출 −$10 × 승수 ' + fmt(1 / st.rr, 1) + ' = −$' + fmt(10 / st.rr) + ' (초과지준이 생기면 실제 승수가 작아짐)') },
      { t: '초과지준 다시 대출', run: () => { if (!st.ex) { why = '초과지준이 없음'; draw(); return; } apply((s) => { s.ex = 0; }, '초과지준을 모두 대출 → 예금 · 대출이 승수만큼 다시 ↑'); } }
    ]);
    const omo = (k) => () => {
      const a = Math.max(0, +$('#omo').value || 0) * k;
      if (st.res + a - st.ex < 0) { why = '지준보다 많이 매각할 수 없음'; draw(); return; }
      apply((s) => { s.res += a; }, 'Fed 가 채권 $' + fmt(Math.abs(a)) + (k > 0 ? ' 매입 → 은행에 새 지준(본원통화) +$' : ' 매각 → 지준 −$') + fmt(Math.abs(a)) + ' → 통화량 ' + (k > 0 ? '+' : '−') + '$' + fmt(Math.abs(a)) + ' × ' + fmt(1 / st.rr, 1) + ' = $' + fmt(Math.abs(a) / st.rr) + ' (SA 11)');
    };
    $('#buy').addEventListener('click', omo(1)); $('#sell').addEventListener('click', omo(-1));
    $('#reset29').addEventListener('click', () => { prev = null; st = Object.assign({}, BASE); why = ''; $$('#c29 .ev button.on').forEach((b) => b.classList.remove('on')); draw(); });
    draw();
  }

  /* ───────── 챕터 탭 ───────── */
  const p30 = ch30(), c33 = ch33(), p28 = ch28();
  ch29();
  const plots = { ch30: [p30], ch28: [p28] };
  function show(id, sub) {
    $$('.ch').forEach((s) => s.classList.toggle('on', s.id === id.replace('ch', 'c')));   // 구역 id(c29)를 주소(#ch29)와 다르게: 같으면 브라우저가 그 구역으로 내려가 고정 머리줄 밑에 가린다
    $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-ch') === id)));
    if (id === 'ch33') c33.showSub(sub || c33.current(), false);
    (plots[id] || []).forEach((p) => p.render());
  }
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => { show(b.getAttribute('data-ch')); history.replaceState(null, '', '#' + b.getAttribute('data-ch')); }));
  function fromHash() {
    const h = location.hash.slice(1), m = /^(ch29|ch30|ch33|ch28)(?:-(as|ad))?$/.exec(h);
    show(m ? m[1] : 'ch29', m && m[2]);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
