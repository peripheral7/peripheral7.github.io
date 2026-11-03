/* Econ2 핵심 그래프 페이지 — index.html 과 짝. 슬라이드 덱(/slides/econ2/graphs.js)과는 따로 쓴 작은 그래프 엔진 + 챕터별 사건.
   · 사건(시나리오)은 늘 처음 상태 A 에서 시작한다. 사건의 stages 가 단계(1단계 단기 → 2단계 장기 …)이고, 단계 줄을 눌러 넘어간다.
     stage.from 을 주면 그 단계에서 갈라진다(예: 2단계 ⓐ 자동 조정 / ⓑ 정책 수용 둘 다 1단계 뒤).
   · Plot 은 지금까지 지나온 상태들(A, B, C …)을 한 번에 그린다: 앞 위치의 곡선은 흐리게, 지금 곡선은 진하게, 마지막 이동만 화살표.
   · 교재의 기본 곡선만 쓴다: AD · SRAS 는 직선, LRAS · MS 는 수직선, MD 는 1/P = k / M(직각쌍곡선), 노동 수요 · 공급은 직선.
   · 라벨의 '_' 뒤는 아래 첨자(P_1, AD_2, L_E). 좌표: 곡선은 데이터 단위(dom = [x0, x1, y0, y1]), 글자는 SVG 픽셀(640 × 520). */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1f2537', blue: '#1f6fd1', ghost: '#b3b8c2', guide: '#8d93a0', red: '#c8352e', soft: '#5b6170' };
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
  const arrows = (s) => esc(s).replace(/↓/g, '<span class="dn">↓</span>').replace(/_([A-Z])/g, '<sub>$1</sub>');
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
    let S = [base()], disp = Object.assign({}, S[0].off), anim = 0;
    const self = { X, Y, box, dom: d, byId, offOf, base, on: null, extra: cfg.extra || null, states: () => S };

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

      // 균형점: 상태마다. 뒤 상태와 같은 자리면 앞 것은 생략
      const P = S.map((s, i) => pointsOf(offs[i], s.vis));
      const lr = byId.LRAS, sx = (d[1] - d[0]) * 0.012;
      const xName = (pt, off, i) => {
        if (pt.o.xl) return pt.o.xl;
        if (cfg.star && lr && Math.abs(lr.x + offOf(lr, off) - pt.x) < sx) return same(offOf(lr, off), 0) ? cfg.xName + '*' : cfg.xName + '*_2';
        return cfg.xName + '_' + (i + 1);
      };
      const shown = P.map((pts, i) => pts.filter((a) => !P.slice(i + 1).some((later) => later.some((b) => Math.abs(X(a.x) - X(b.x)) < 3 && Math.abs(Y(a.y) - Y(b.y)) < 3))));
      shown.forEach((pts, i) => pts.forEach((pt) => {
        if (pt.o.guide === false) return;
        el('path', { d: 'M' + box[0] + ' ' + Y(pt.y) + 'H' + X(pt.x) + 'V' + (box[1] + box[3]), fill: 'none', stroke: i === n - 1 ? C.guide : C.ghost, 'stroke-width': 1.4, 'stroke-dasharray': '5 5' }, g);
      }));
      const usedY = [], usedX = [], usedT = [];     // 지금 것부터: 같은 자리 · 같은 이름(W_E 등 고정 이름)은 한 번만
      for (let i = n - 1; i >= 0; i--) shown[i].forEach((pt) => {
        if (pt.o.guide === false) return;
        const col = i === n - 1 ? C.ink : C.soft, yl = pt.o.yl || cfg.yName + '_' + (i + 1), xl = xName(pt, offs[i], i);
        if (!usedY.some((v) => Math.abs(v - Y(pt.y)) < 15) && usedT.indexOf('y' + yl) < 0) { usedY.push(Y(pt.y)); usedT.push('y' + yl); label(g, box[0] - 8, Y(pt.y) + 6, yl, { anchor: 'end', size: 17, color: col }); }
        if (!usedX.some((v) => Math.abs(v - X(pt.x)) < 28) && usedT.indexOf('x' + xl) < 0) { usedX.push(X(pt.x)); usedT.push('x' + xl); label(g, X(pt.x), box[1] + box[3] + 24, xl, { anchor: 'middle', size: 17, color: col }); }
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

      // 이동 화살표: 바로 앞 상태 → 지금
      if (n > 1) cfg.curves.forEach((c) => {
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

      const ctx = { g, S, P, off: disp, X, Y, box, dom: d };
      if (self.extra) self.extra(ctx);
      if (self.on) self.on(ctx);
    }
    self.render = render;
    // 상태 줄을 통째로 바꾸고, 지금(마지막) 상태로 움직인다
    self.show = (states, instant) => {
      S = states;
      const to = Object.assign({}, S[S.length - 1].off), from = Object.assign({}, disp);
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
    };
    render();
    return self;
  }

  /* ───────── 사건 · 단계 ───────── */
  // stage.ch = { add: {id: 더할 양}, abs: {id: 값} 또는 (앞 상태 off) => {…}, vis: {id: bool} }
  function apply(st, ch, letter) {
    const off = Object.assign({}, st.off);
    if (ch.add) for (const k in ch.add) off[k] = (off[k] || 0) + ch.add[k];
    if (ch.abs) Object.assign(off, typeof ch.abs === 'function' ? ch.abs(st.off) : ch.abs);
    return { off, vis: Object.assign({}, st.vis, ch.vis || {}), letter };
  }
  // k 번째 단계까지의 상태 줄: 처음 A → (갈라지는 from 을 따라) … → k
  function chain(plot, sc, k) {
    const ids = [];
    for (let i = k; i >= 0; i = sc.stages[i].from != null ? sc.stages[i].from : i - 1) ids.unshift(i);
    const S = [plot.base()];
    ids.forEach((i) => S.push(apply(S[S.length - 1], sc.stages[i].ch, sc.stages[i].letter)));
    return { S, ids };
  }
  // 글자 목록: items = [{ t, q, dir }] → 누르면 onPick(i, 그 줄). 고른 줄은 aria-pressed
  function list(host, items, onPick) {
    const ul = $('ul', host);
    items.forEach((it, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = esc(it.t) + (it.dir ? '<span class="dir' + (it.dir === 'l' ? ' l' : '') + '">' + (it.dir === 'l' ? '←' : '→') + '</span>' : '') + (it.q ? '<span class="q">' + esc(it.q) + '</span>' : '');
      b.addEventListener('click', () => onPick(i, b));
      li.appendChild(b); ul.appendChild(li);
    });
  }
  const unpress = (scope) => $$('.opts button[aria-pressed="true"]', scope).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  // 단계 줄: "1단계 → 2단계", 갈라지는 단계는 2단계 ⓐ / ⓑ. 지금 단계는 파랑, 지나온 단계는 진한 테두리
  function stages(host, sc, k, ids, go) {
    host.innerHTML = '';
    if (!sc || sc.stages.length < 2) return;
    const hasAlt = sc.stages.some((s) => s.from != null);
    let altN = 0;
    sc.stages.forEach((s, i) => {
      if (i) { const sep = document.createElement('li'); sep.className = 'sep'; sep.textContent = s.from != null ? '/' : '→'; host.appendChild(sep); }
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      const num = s.step || (hasAlt && i > 0 ? '2단계 ' + 'ⓐⓑⓒ'[altN++] : (i + 1) + '단계');
      b.innerHTML = '<span class="n">' + esc(num) + (i === k ? ' · 지금' : '') + '</span>' + esc(s.name);
      if (i === k) b.className = 'cur'; else if (ids.indexOf(i) >= 0) b.className = 'done';
      b.addEventListener('click', () => go(i));
      li.appendChild(b); host.appendChild(li);
    });
  }
  function readHTML(lines) { return lines.filter(Boolean).map((l) => '<div class="' + l[0] + '">' + l[1] + '</div>').join(''); }
  // 그래프 하나 + 글자 목록 묶음 + 단계 줄을 이어 주는 진행기
  function runner(plot, stHost, scope) {
    let sc = null, k = -1;
    function go(i) {
      k = i;
      const c = chain(plot, sc, k);
      stages(stHost, sc, k, c.ids, go);
      plot.show(c.S);
    }
    return {
      pick(s, b) { unpress(scope); if (b) b.setAttribute('aria-pressed', 'true'); sc = s; go(0); },
      cur: () => (sc ? { sc, k, st: sc.stages[k] } : null)
    };
  }
  const whyOf = (r, plot) => { const c = r.cur(); if (!c) return ''; const w = c.st.why; return typeof w === 'function' ? w(chain(plot, c.sc, c.k).S) : w || ''; };

  /* ───────── Ch29 은행 T계정 ───────── */
  // 처음: 지준 $100, R 10% → 예금 $1,000 · 대출 $900 · 통화량 $1,000(현금 보유 없음). 지급준비율과 공개시장조작을 하나씩 고른다
  function ch29() {
    const BASE = { R: 0.1, omo: 0 };
    const st = Object.assign({}, BASE);
    const R = [{ t: '10% (처음)', v: 0.1 }, { t: '20% — 지급준비율 인상', q: 'SA 10', v: 0.2, dir: 'l' }, { t: '5% — 지급준비율 인하', v: 0.05, dir: 'r' }];
    const M = [{ t: '없음 (처음)', v: 0 }, { t: '채권 매입 $100 — 지준 +$100', q: 'SA 11', v: 100, dir: 'r' }, { t: '채권 매각 $50 — 지준 −$50', v: -50, dir: 'l' }];
    $('#bank').innerHTML =
      '<div class="flow"><div class="bx">지준 Reserves<b id="fRes"></b></div><div class="ar" id="fMul"></div><div class="bx">예금 Deposits<b id="fDep"></b></div><div class="ar">현금 없음</div><div class="bx m">통화량 M<b id="fM"></b></div></div>' +
      '<div class="tacct"><h3>은행 전체 T계정 (Banking system)</h3><div class="tt">' +
      '<div><span class="h">ASSETS 자산</span><div class="r">지준 Reserves <span><b id="tRes"></b></span><i id="dRes"></i></div><div class="r">대출 Loans <span><b id="tLoan"></b></span><i id="dLoan"></i></div></div>' +
      '<div><span class="h">LIABILITIES 부채</span><div class="r">예금 Deposits <span><b id="tDep"></b></span><i id="dDep"></i></div></div></div>' +
      '<p class="tnote" id="tNote"></p></div>';
    const der = (s) => { const res = 100 + s.omo, D = res / s.R; return { res, D, L: D - res, M: D }; };
    const money = (v) => '$' + fmt(v);
    const delta = (id, v) => { const e = $('#' + id); e.className = v < -0.5 ? 'dn' : ''; e.textContent = Math.abs(v) < 0.5 ? '' : (v > 0 ? '+' : '−') + money(Math.abs(v)); };
    let drawn = false;
    function draw() {
      const n = der(st), b = der(BASE);
      const set = (id, v) => {
        const e = $('#' + id), s = money(v);
        if (e.textContent === s) return;
        e.textContent = s;
        if (drawn) { const box = e.closest('.bx, .r'); box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash'); }
      };
      set('fRes', n.res); set('fDep', n.D); set('fM', n.M); set('tRes', n.res); set('tLoan', n.L); set('tDep', n.D);
      $('#fMul').textContent = '× 1/R = × ' + fmt(1 / st.R);
      $('#tNote').innerHTML = '지준 = R × 예금 = ' + Math.round(st.R * 100) + '% × ' + money(n.D) + ' = <b>' + money(n.res) + '</b> · 대출 = 예금 − 지준 = <b>' + money(n.L) + '</b>';
      delta('dRes', n.res - b.res); delta('dLoan', n.L - b.L); delta('dDep', n.D - b.D);
      const why = [];
      if (st.R !== BASE.R) why.push('지급준비율 10% → ' + Math.round(st.R * 100) + '% : 지준은 그대로, 승수 10 → ' + fmt(1 / st.R) + (st.R > BASE.R ? ' → 은행이 대출을 줄여 예금 · 통화량 ↓' : ' → 대출 ↑ → 예금 · 통화량 ↑'));
      if (st.omo) why.push('Fed 채권 ' + (st.omo > 0 ? '매입 → 은행 지준 +' : '매각 → 은행 지준 −') + money(Math.abs(st.omo)) + ' → 통화량 ' + (st.omo > 0 ? '+' : '−') + money(Math.abs(st.omo)) + ' × ' + fmt(1 / st.R) + ' = ' + money(Math.abs(st.omo) / st.R));
      const dM = n.M - b.M;
      $('#read29').innerHTML = readHTML([
        ['chg', arrows('통화량 M ' + money(b.M) + ' → ' + money(n.M) + (Math.abs(dM) < 0.5 ? ' (변화 없음)' : ' (' + (dM > 0 ? '+' : '−') + money(Math.abs(dM)) + ' ' + (dM > 0 ? '↑' : '↓') + ')'))],
        why.length ? ['why', esc(why.join(' · '))] : ['hint', '지급준비율이나 공개시장조작을 골라 보세요. 처음: 지준 $100 × 승수 10 = 통화량 $1,000']
      ]);
      drawn = true;
    }
    const press = (host, b) => { unpress(host); b.setAttribute('aria-pressed', 'true'); };
    list($('#o29r'), R, (i, b) => { press($('#o29r'), b); st.R = R[i].v; draw(); });
    list($('#o29m'), M, (i, b) => { press($('#o29m'), b); st.omo = M[i].v; draw(); });
    $('#o29r button').setAttribute('aria-pressed', 'true'); $('#o29m button').setAttribute('aria-pressed', 'true');
    draw();
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
    const r = runner(plot, $('#st30'), $('#c30'));
    const idx = (s) => {
      const m = plot.pointsOf(s.off, s.vis)[0];
      const M = 100 * (5 + (s.off.MS || 0)) / 5, P = m ? 100 * 5 / m.y : NaN, Y = 100 * (1 + (s.off.Yg || 0));
      return { M, P, Y, V: P * Y / M / 100, v: m ? m.y : NaN };
    };
    plot.on = (ctx) => {
      const S = ctx.S, n = idx({ off: ctx.off, vis: S[S.length - 1].vis }), lines = [];
      if (S.length > 1) {
        const a = idx(S[0]), pct = (b, c) => (c >= b ? '+' : '') + fmt((c / b - 1) * 100) + '%';
        lines.push(['chg', arrows('A → ' + LET[S.length - 1] + ' : 1/P ' + sign(a.v, n.v, 0.02) + ' · 물가 P ' + fmt(a.P) + ' → ' + fmt(n.P) + ' (' + pct(a.P, n.P) + ') · 화폐량 M ' + fmt(a.M) + ' → ' + fmt(n.M))]);
      } else lines.push(['chg', 'A : M = 100, P = 100 (지수), V = 1, Y = 1']);
      lines.push(['why', esc('M × V = P × Y : ' + fmt(n.M) + ' × ' + fmt(n.V, 2) + ' = ' + fmt(n.P) + ' × ' + fmt(n.Y / 100, 2))]);
      const why = whyOf(r, plot);
      lines.push(why ? ['why', arrows(why)] : ['hint', '오른쪽 목록에서 사건을 골라 보세요.']);
      $('#read30').innerHTML = readHTML(lines);
    };
    const keep = (why) => ({ name: 'Fed 가 MS 를 옮겨 물가 유지', ch: { abs: (o) => ({ MS: 5 * (1 + mdScale(o)) - 5 }) }, why });
    const SUP = [
      { t: 'Fed 통화량 2배', dir: 'r', stages: [{ name: 'MS →', ch: { add: { MS: 5 } }, why: 'M 2배 → 화폐가치 1/P 절반 → 물가 P 2배. V · Y 그대로라 통화 증가율 = 물가상승률' }] },
      { t: 'Fed 통화량 감소', dir: 'l', stages: [{ name: 'MS ←', ch: { add: { MS: -1.5 } }, why: 'M ↓ → 1/P ↑ → 물가 P ↓' }] }
    ];
    const DEM = [
      { t: '신용카드 보급 → 현금 덜 보유', q: 'SA 2', dir: 'l', stages: [
        { name: '화폐 수요 감소: MD ←', ch: { add: { Vg: 0.5 } }, why: '같은 물가에서 들고 있을 돈 ↓(V ↑) → MD ← → 1/P ↓ → 물가 P ↑ (Fed 가 가만히 있으면, SA 2b)' },
        keep('Fed 가 통화량을 MD 감소만큼 줄임(MS ←) → 1/P 가 처음 높이로 → 물가 그대로 (SA 2c)')] },
      { t: '실질 GDP 증가 → 거래용 돈 더 필요', dir: 'r', stages: [
        { name: '화폐 수요 증가: MD →', ch: { add: { Yg: 0.3 } }, why: 'Y ↑ → 같은 물가에서 돈이 더 필요 → MD → → 1/P ↑ → 물가 P ↓' },
        keep('Fed 가 통화량을 늘림(MS →) → 1/P 가 처음 높이로 → 물가 그대로')] }
    ];
    list($('#o30s'), SUP, (i, b) => r.pick(SUP[i], b));
    list($('#o30d'), DEM, (i, b) => r.pick(DEM[i], b));
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
    const b = S[S.length - 2].off, L = 5 + (b.LRAS || 0);
    return eqX(b) > L + 0.03
      ? 'Y > Y* → 일손 부족 · 임금과 기대물가 ↑ → SRAS ← → Y 는 Y* 로 돌아오고 P 는 더 ↑'
      : 'Y < Y* → 실업 ↑ · 임금과 기대물가 ↓ → SRAS → → Y 는 Y* 로 돌아오고 P ↓';
  }
  function ch33() {
    const mk = (host) => Plot(host, { aria: '총수요 총공급 그래프', dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: '실질 GDP Y', yTitle: '물가 P', star: true, curves: adasCurves(), eqs: [['AD', 'SRAS']] });
    const ad = mk($('#plot33ad')), as = mk($('#plot33as'));
    const rad = runner(ad, $('#st33'), $('#side33ad')), ras = runner(as, $('#st33'), $('#side33as'));
    let curName = 'ad';
    const read = (plot, r) => (ctx) => {
      if ((curName === 'ad') !== (plot === ad)) return;
      const S = ctx.S, a = ctx.P[0][0], z = ctx.P[S.length - 1][0], lines = [];
      if (S.length > 1 && a && z) {
        let s = 'A → ' + (S[S.length - 1].letter || LET[S.length - 1]) + ' : Y ' + sign(a.x, z.x, 0.03) + ' · P ' + sign(a.y, z.y, 0.03);
        const c = r.cur();
        if (c && c.k === 0 && z.x < a.x - 0.03 && z.y > a.y + 0.03) s += ' — 스태그플레이션';
        lines.push(['chg', arrows(s)]);
      } else lines.push(['chg', 'A : 장기균형 (Y = Y*)']);
      const why = whyOf(r, plot);
      lines.push(why ? ['why', arrows(why)] : ['hint', '오른쪽 목록에서 사건을 골라 보세요. 단기 변화는 아래 단계 줄에서 2단계(장기)로 넘어갑니다.']);
      if (z) {
        const L = 5 + (ctx.off.LRAS || 0);
        lines.push(['hint', Math.abs(z.x - L) < 0.03 ? '지금: Y = Y* — 장기균형' : z.x > L ? '지금: Y > Y* — 단기 경기 과열(실업률 < 자연실업률)' : '지금: Y < Y* — 단기 경기 침체(실업률 > 자연실업률)']);
      }
      $('#read33').innerHTML = readHTML(lines);
    };
    ad.on = read(ad, rad); as.on = read(as, ras);
    const R = 1.4;
    const adEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: '단기: AD ' + (dir === 'r' ? '→' : '←'), step: '1단계 단기', ch: { add: { AD: dir === 'r' ? R : -R } }, why },
      { name: '장기: SRAS 조정 → Y*', step: '2단계 장기', ch: { abs: lrSRAS }, why: longRun }] });
    const AD = {
      C: [adEv('주가 급등 → 부 ↑', 'r', '주가 ↑ → 부 ↑ → 소비 C ↑ → AD →'), adEv('주가 폭락', 'l', '부 ↓ → 소비 C ↓ → AD ←', 'SA 4a'), adEv('소득세 인하', 'r', '가처분소득 ↑ → C ↑ → AD →')],
      I: [adEv('통화량 증가 (M ↑ → r ↓)', 'r', 'M ↑ → 이자율 r ↓ → 투자 I ↑ (원화 ↓ → NX ↑ 도) → AD →'), adEv('기업 낙관 · 투자 붐', 'r', '미래 사업 전망 ↑ → 새 설비 투자 I ↑ → AD →', 'SA 5'), adEv('투자세액공제', 'r', '투자하면 세금 감면 → I ↑ → AD →')],
      G: [adEv('정부 구매 증가', 'r', 'G ↑ → AD →', 'SA 4b')],
      NX: [adEv('해외 경기 침체', 'l', '외국 소득 ↓ → 우리 수출 ↓ → NX ↓ → AD ←', 'SA 4d'), adEv('해외 정치 불안 → 원화 절상', 'l', '한국 자산 수요 ↑ → 원화 ↑ → 수출 ↓ · 수입 ↑ → NX ↓ → AD ← (P 때문이 아닌 환율 변화라 이동)', 'MC 7')]
    };
    const srEv = (t, why, q) => ({ t, q, dir: 'l', stages: [
      { name: '단기: SRAS ← (스태그플레이션)', step: '1단계 단기', ch: { add: { SRAS: -R } }, why },
      { name: '그대로 두면: 임금 ↓ → SRAS 복귀', ch: { abs: { SRAS: 0 } }, letter: 'A', why: 'Y < Y* → 실업 ↑ → 임금 · 기대물가 ↓ → SRAS 가 처음 자리로 → A 로 돌아옴(시간이 오래 걸림)' },
      { name: '정책으로 수용: AD →', from: 0, ch: { abs: lrAD }, why: 'Fed · 정부가 AD → → Y 는 바로 Y* 로, 대신 P 는 더 ↑ (공급충격 수용)' }] });
    const lrEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'LRAS · SRAS ' + (dir === 'r' ? '→' : '←'), step: '1단계', ch: { add: { LRAS: dir === 'r' ? 1 : -1, SRAS: dir === 'r' ? 1 : -1 } }, why },
      { name: '장기: SRAS 조정 → 새 Y*', step: '2단계 장기', ch: { abs: lrSRAS }, why: dir === 'r' ? 'P 가 Pe 보다 낮아짐 → 기대물가 ↓ → SRAS 가 더 → → 새 Y* 에서 장기균형, P ↓' : 'P 가 Pe 보다 높아짐 → 기대물가 ↑ → SRAS 가 더 ← → 새 Y* 에서 장기균형, P ↑' }] });
    const AS = {
      SR: [srEv('기대물가 상승', 'Pe ↑ → 명목임금 계약 · 가격 미리 ↑ → 같은 P 에서 생산 ↓ → SRAS ← (LRAS 그대로)', 'MC 11'), srEv('유가 급등 (원자재 비용 ↑)', '생산 비용 ↑ → SRAS ← → Y ↓ · P ↑'), srEv('명목임금 상승', '비용 ↑ → SRAS ←')],
      LR: [lrEv('기술 진보', 'r', '같은 노동 · 자본으로 더 생산 → Y* ↑ → LRAS · SRAS →', 'SA 4c'), lrEv('자본 · 인적자본 증가', 'r', 'K · H ↑ → Y* ↑ → LRAS · SRAS →', 'SA 5c'), lrEv('이민 → 노동 증가', 'r', 'L ↑ → Y* ↑ → LRAS · SRAS →', 'SA 1'), lrEv('자연재해 · 자원 감소', 'l', '자원 N · 자본 ↓ → Y* ↓ → LRAS · SRAS ←', 'SA 1')]
    };
    // 어느 목록에서 골라도 그 탭의 줄 표시를 모두 지우고 새 사건을 처음 상태 A 에서 시작한다(앞 사건의 LRAS 이동 등은 풀린다)
    $$('#side33ad [data-o]').forEach((h) => { const L = AD[h.getAttribute('data-o')]; list(h, L, (i, b) => rad.pick(L[i], b)); });
    $$('#side33as [data-o]').forEach((h) => { const L = AS[h.getAttribute('data-o')]; list(h, L, (i, b) => ras.pick(L[i], b)); });
    function showSub(which, push) {
      curName = which;
      $$('#c33 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === which)));
      $('#plot33ad').hidden = which !== 'ad'; $('#plot33as').hidden = which !== 'as';
      $('#side33ad').hidden = which !== 'ad'; $('#side33as').hidden = which !== 'as';
      const r = which === 'as' ? ras : rad, c = r.cur();     // 탭을 오가면 그 탭에서 고른 사건을 1단계부터 다시
      if (c) r.pick(c.sc, $('#side33' + which + ' button[aria-pressed="true"]')); else { $('#st33').innerHTML = ''; (which === 'as' ? as : ad).render(); }
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
      eqs: [['S', 'D', { xl: 'L_E', yl: 'W_E', lab: false }]],
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
        info = 'W > W_E : 일하려는 사람 L_S > 기업이 원하는 사람 L_D → 그 차이만큼 실업';
      }
    });
    const r = runner(plot, $('#st28'), $('#o28'));
    plot.on = (ctx) => {
      const lines = [];
      if (info) lines.push(['chg', arrows(info)]);
      else if (ctx.S.length > 1) {
        const a = ctx.P[0][0], z = ctx.P[ctx.S.length - 1][0];
        lines.push(['chg', arrows('새 균형 : 고용 L ' + sign(a.x, z.x, 0.03) + ' · 임금 W ' + sign(a.y, z.y, 0.03) + ' — 임금이 내려가 실업 없이 맞춰짐')]);
      } else lines.push(['chg', arrows('균형 : W_E 에서 L_E 만큼 고용, 실업 없음')]);
      const why = whyOf(r, plot);
      lines.push(why ? ['why', arrows(why)] : ['hint', '아래 목록에서 골라 보세요.']);
      $('#read28').innerHTML = readHTML(lines);
    };
    const w = (t, q, dir, W, why) => ({ t, q, dir, stages: [{ name: t, ch: { vis: { W: true }, abs: { W } }, why }] });
    const EV = [
      w('최저임금 (균형보다 높게)', 'MC 14', 'r', 0, '법으로 W > W_E → 노동 공급 ↑ · 수요 ↓ → 실업 (특히 10대 · 미숙련)'),
      w('노동조합', 'MC 10', 'r', 0.5, '단체교섭으로 조합원 임금 ↑ → 그 부문 고용 ↓ → 밀려난 사람은 실업 · 노조 없는 부문으로'),
      w('효율임금', 'MC 14', 'r', -0.4, '기업이 스스로 높은 임금(건강 · 이직 ↓ · 좋은 지원자 · 노력 ↑) → W > W_E 라 실업'),
      w('최저임금이 균형보다 낮다면', 'MC 10 +', 'l', -3.4, '구속력 없음 → 시장 임금 W_E 그대로, 남는 노동 없음'),
      { t: '노동 수요 감소 (수입 ↑ → 국내 산업 쇠퇴)', q: 'SA 4', dir: 'l', stages: [
        { name: '단기: 수요 D ←, 임금 그대로', step: '1단계 단기', ch: { add: { D: -1.4 }, vis: { W: true }, abs: { W: -2 } }, why: '수요가 줄었는데 임금이 처음 W_E 에 묶여 있으면 → 일하려는 사람 > 원하는 사람 → 실업' },
        { name: '장기: 임금 ↓ → 새 균형', step: '2단계 장기', ch: { vis: { W: false } }, why: '임금이 내려가면 → 새 균형에서 고용 ↓ · 임금 ↓, 실업은 사라짐(다른 산업으로 옮겨 가며 임금이 같아짐)' }] }
    ];
    list($('#o28'), EV, (i, b) => r.pick(EV[i], b));

    // 실업 지표: 분수로 보여 주고, 상황마다 무엇(분자 · 분모)이 바뀌는지 ↑ ↓ 로 표시. 단위 백만 명
    const B = { E: 140.196, U: 14.729, N: 80.729 };
    const SIT = [
      { t: '처음: 2009년 6월 숫자', q: 'SA 1', m: {} },
      { t: '실직 후 구직 중 (취업자 → 실업자)', m: { E: -1, U: 1 } },
      { t: '실직 후 구직 포기 (취업자 → 비경제활동)', q: 'MC 1', m: { E: -1, N: 1 } },
      { t: '구직 시늉만 하던 사람을 비경제활동으로 (실업자 → 비경제활동)', q: 'MC 5', m: { U: -1, N: 1 } },
      { t: '실업자가 취업 (실업자 → 취업자)', m: { U: -1, E: 1 } },
      { t: '처음으로 구직 시작 (비경제활동 → 실업자)', m: { N: -1, U: 1 } }
    ];
    let sit = SIT[0];
    const one = (v) => fmt(v, 1);
    function rates() {
      const v = { E: B.E + (sit.m.E || 0), U: B.U + (sit.m.U || 0), N: B.N + (sit.m.N || 0) };
      const t = (k) => { const dd = sit.m[k] || 0; return '<span class="t' + (dd > 0 ? ' up' : dd < 0 ? ' dn' : '') + '">' + one(v[k]) + (dd > 0 ? '↑' : dd < 0 ? '↓' : '') + '</span>'; };
      const UR = v.U / (v.E + v.U) * 100, UR0 = B.U / (B.E + B.U) * 100;
      const LF = (v.E + v.U) / (v.E + v.U + v.N) * 100, LF0 = (B.E + B.U) / (B.E + B.U + B.N) * 100;
      const res = (x, x0) => fmt(x, 1) + '%' + (sit === SIT[0] || Math.abs(x - x0) < 0.005 ? '' : x > x0 ? '<span class="t up">↑</span>' : '<span class="t dn">↓</span>');
      $('#rates').innerHTML =
        '<div class="rate"><span class="nm">실업률</span><span class="frac sym"><span>U</span><span>E + U</span></span><span>=</span><span class="frac"><span>' + t('U') + '</span><span>' + t('E') + ' + ' + t('U') + '</span></span><span class="res">= ' + res(UR, UR0) + '</span></div>' +
        '<div class="rate"><span class="nm">경제활동참가율</span><span class="frac sym"><span>E + U</span><span>E + U + NILF</span></span><span>=</span><span class="frac"><span>' + t('E') + ' + ' + t('U') + '</span><span>' + t('E') + ' + ' + t('U') + ' + ' + t('N') + '</span></span><span class="res">= ' + res(LF, LF0) + '</span></div>' +
        '<div class="pop">E 취업자 · U 실업자 · NILF 비경제활동(일도 구직도 안 함), 단위 백만 명.<br>성인 인구 = E + U + NILF = <b>' + one(v.E + v.U + v.N) + '</b> · 경제활동인구 = E + U = <b>' + one(v.E + v.U) + '</b></div>';
      // 분자 · 분모가 어떻게 움직였는지 글로
      const part = (num, den, r0, r1, nm) => nm + ': 분자 ' + (Math.abs(num) < 1e-9 ? '그대로' : num > 0 ? '↑' : '↓') + ' · 분모 ' + (Math.abs(den) < 1e-9 ? '그대로' : den > 0 ? '↑' : '↓') + ' → ' + (Math.abs(r1 - r0) < 0.005 ? '그대로' : r1 > r0 ? '↑' : '↓');
      const m = sit.m, dU = m.U || 0, dLF = (m.E || 0) + (m.U || 0), dPop = dLF + (m.N || 0);
      $('#read28s').innerHTML = readHTML(sit === SIT[0]
        ? [['chg', esc('실업률 = 실업자 ÷ 경제활동인구, 참가율 = 경제활동인구 ÷ 성인 인구')], ['hint', '아래 상황을 골라 분자 · 분모 중 무엇이 바뀌는지 보세요.']]
        : [['chg', arrows(part(dU, dLF, UR0, UR, '실업률') + '   |   ' + part(dLF, dPop, LF0, LF, '참가율'))], ['why', arrows(sit.t)]]);
    }
    list($('#o28s'), SIT, (i, b) => { unpress($('#o28s')); b.setAttribute('aria-pressed', 'true'); sit = SIT[i]; rates(); });
    $('#o28s button').setAttribute('aria-pressed', 'true');
    rates();
    return plot;
  }

  /* ───────── 챕터 탭 ───────── */
  ch29();
  const p30 = ch30(), c33 = ch33(), p28 = ch28();
  const plots = { ch30: [p30], ch28: [p28] };
  function show(id, sub) {
    $$('.ch').forEach((s) => s.classList.toggle('on', s.id === id.replace('ch', 'c')));   // 구역 id(c29)를 주소(#ch29)와 다르게: 같으면 브라우저가 그 구역으로 내려가 고정 머리줄 밑에 가린다
    $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-ch') === id)));
    if (id === 'ch33') c33.showSub(sub || c33.current(), false);
    (plots[id] || []).forEach((p) => p.render());
  }
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => { show(b.getAttribute('data-ch')); history.replaceState(null, '', '#' + b.getAttribute('data-ch')); }));
  function fromHash() {
    const m = /^(ch29|ch30|ch33|ch28)(?:-(as|ad))?$/.exec(location.hash.slice(1));
    show(m ? m[1] : 'ch29', m && m[2]);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
