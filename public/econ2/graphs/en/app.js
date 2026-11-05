(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1f2537', blue: '#1f6fd1', ghost: '#b3b8c2', guide: '#8d93a0', red: '#c8352e', soft: '#5b6170', up: '#d6322b', down: '#1f6fd1' };
  const LET = 'ABCDEFGH';
  const EASE = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function label(parent, x, y, s, o) {
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
  const dirW = (a, b, tol) => ['↓', 'unchanged', '↑'][dirOf(a, b, tol) + 1];
  function textW(s, size) {
    let w = 0, sub = false;
    for (const ch of String(s)) { if (ch === '_') { sub = true; continue; } if (ch === ' ') sub = false; w += sub ? 0.42 : /[ㄱ-힝]/.test(ch) ? 1 : 0.58; }
    return w * (size || 17);
  }
  function place(boxes, s, cands) {
    const w = textW(s), h = 19;
    const bx = (c) => { const x = c[2] === 'middle' ? c[0] - w / 2 : c[2] === 'end' ? c[0] - w : c[0]; return [x - 2, c[1] - h + 4, w + 4, h]; };
    const hit = (a) => boxes.some((q) => a[0] < q[0] + q[2] && q[0] < a[0] + a[2] && a[1] < q[1] + q[3] && q[1] < a[1] + a[3]);
    const pick = cands.find((c) => !hit(bx(c))) || cands[0];
    boxes.push(bx(pick));
    return pick;
  }

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
        const em = hl && hl.axis && i === n - 1 && !hideNow;
        el('path', { d: 'M' + box[0] + ' ' + Y(pt.y) + 'H' + X(pt.x) + 'V' + (box[1] + box[3]), fill: 'none', stroke: em ? C.blue : i === n - 1 ? C.guide : C.ghost, 'stroke-width': em ? 2.6 : 1.4, 'stroke-dasharray': em ? '7 5' : '5 5' }, g);
      }));

      let prevPt = null;
      if (cfg.cmp0) prevPt = n > 1 && P[0][0] ? P[0][0] : null;
      else for (let i = n - 2; i >= 0; i--) if (P[i][0]) { prevPt = P[i][0]; break; }
      const tolX = (d[1] - d[0]) * 0.006, tolY = (d[3] - d[2]) * 0.006;
      const usedY = [], usedX = [], usedT = [];
      for (let i = n - 1; i >= 0; i--) shown[i].forEach((pt) => {
        if (pt.o.guide === false) return;
        const moved0 = i > 0 && P[0][0] && (Math.abs(P[0][0].x - pt.x) > 1e-6 || Math.abs(P[0][0].y - pt.y) > 1e-6);
        const now = i === n - 1 && !hideNow, col = i === n - 1 ? C.ink : C.soft, yl = pt.o.yl ? pt.o.yl + (moved0 ? "'" : '') : cfg.yName + '_' + (i + 1), xl = xName(pt, offs[i], i);
        const dx = now && prevPt ? dirOf(prevPt.x, pt.x, tolX) : 0, dy = now && prevPt ? dirOf(prevPt.y, pt.y, tolY) : 0;
        const wt = (dd) => (now && dd ? 800 : 500), dc = (dd) => (now && dd ? (dd > 0 ? C.up : C.down) : col);
        const big = (ax, dd) => !!(now && dd && hl && hl.axis && hl.axis.indexOf(ax) >= 0);
        const pop = () => {};
        if (!usedY.some((v) => Math.abs(v - Y(pt.y)) < 15) && usedT.indexOf('y' + yl) < 0) {
          usedY.push(Y(pt.y)); usedT.push('y' + yl);
          const gy = el('g', {}, g);
          label(gy, box[0] - 8, Y(pt.y) + 7, yl, { anchor: 'end', size: big('y', dy) ? 22 : 17, color: dc(dy), weight: wt(dy) });
          tri(gy, box[0] - 12 - textW(yl, big('y', dy) ? 22 : 17), Y(pt.y) + 6, dy, 'end');
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

      cfg.curves.forEach((c) => {
        const pos = [];
        S.forEach((s) => { if (!s.vis[c.id]) return; const v = offOf(c, s.off); if (!pos.some((u) => same(u, v))) pos.push(v); });
        const lab = (v) => (c.plain || pos.length < 2 ? c.lab : c.lab + '_' + (pos.findIndex((u) => same(u, v)) + 1));
        const drawLab = (pts, s, col) => {
          const e = pts[pts.length - 1];
          if (c.axisLab) { label(g, box[0] + 8, e[1] - 8, s, { size: 18, color: col, weight: 800 }); return; }
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

    self.seq = (items) => { const ax = items.map((it) => it.axis || '').join(''); self.hilite(ax ? { axis: ax } : null); };

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

  const COND = {
    'Reserve ratio raised 10% → 20%': 'If the Fed raises the reserve ratio from 10% to 20%,',
    'Reserve ratio cut 10% → 5%': 'If the Fed cuts the reserve ratio from 10% to 5%,',
    'Banks hold more excess reserves': 'If banks hold more excess reserves,',
    'Deposits up $100': 'If people deposit $100 of currency,',
    'Withdrawal of $50': 'If people withdraw $50 as currency,',
    'Fed buys $100 of bonds': 'If the Fed buys $100 of bonds,',
    'Fed sells $50 of bonds': 'If the Fed sells $50 of bonds,',
    'Fed lends $100 to banks (discount rate cut)': 'If the Fed cuts the discount rate and lends banks $100,',
    'Bad loans → bank capital falls': 'If $50 of the bank\'s loans go bad,',
    'Fed doubles the money supply': 'If the Fed doubles the money supply,',
    'Fed cuts the money supply': 'If the Fed cuts the money supply,',
    'Credit cards spread → less money held': 'If credit cards spread and people hold less money,',
    'Real GDP rises → more money for transactions': 'If real GDP rises and more money is needed for transactions,',
    'Stock boom': 'If stock prices boom,',
    'Stock market crash': 'If the stock market crashes,',
    'Income tax cut': 'If income taxes are cut,',
    'Money supply up': 'If the money supply increases,',
    'Business optimism · investment boom': 'If businesses turn optimistic and investment booms,',
    'Investment tax credit': 'If an investment tax credit is introduced,',
    'Government purchases rise': 'If government purchases rise,',
    'Recession abroad': 'If there is a recession abroad,',
    'Turmoil abroad → currency appreciates': 'If turmoil abroad makes our currency appreciate,',
    'Expected price level rises': 'If the expected price level rises,',
    'Oil price spike': 'If oil prices spike,',
    'Nominal wages rise': 'If nominal wages rise,',
    'Technological progress': 'If technology advances,',
    'Capital · human capital rise': 'If capital and human capital rise,',
    'Immigration → labor rises': 'If immigration increases the labor force,',
    'Natural disaster · resources fall': 'If a natural disaster destroys resources,',
    'Natural rate of unemployment rises': 'If the natural rate of unemployment rises,',
    'Wage above equilibrium': 'If the wage is held above equilibrium,',
    'Labor demand falls': 'If labor demand falls,'
  };
  const rsTok = (s) => String(s).split(' · ').map((x) => { const m = /^(.+?) (↑|↓|▲|▼|unchanged|그대로|back)(?: (.+))?$/.exec(x.trim()); return m ? { n: m[1], d: /[↑▲]/.test(m[2]) ? 1 : /[↓▼]/.test(m[2]) ? -1 : 0, back: m[2] === 'back', x: m[3] || '' } : { n: x.trim(), d: null }; });

  function mvText(k) {
    const m = /^\[?\s*([A-Z][A-Za-z]*(?:\s*·\s*[A-Z][A-Za-z]*)*)\s*(가 더|further)?\s*([←→])\s*\]?$/.exec(String(k || '').trim());
    if (!m) return null;
    const c = m[1].split(/\s*·\s*/);
    return c.join(' and ') + (c.length > 1 ? ' shift ' : ' shifts ') + (m[2] ? 'further ' : '') + (m[3] === '←' ? 'left' : 'right');
  }
  function rsHTML(cond, parts) {
    const multi = new Set(parts.map((p) => p.g)).size > 1, when = { 'Short run': 'in the short run ', 'Long run': 'in the long run ' };
    const lead = (p, pi) => (pi && parts[pi - 1].g === p.g ? '' : p.sw || (multi ? (p.adj && p.g === 'Long run' ? 'in the long run, as wages and P<sup>e</sup> adjust, ' : when[p.g] || (pi ? 'then ' : '')) : ''));
    const toks = [];
    parts.forEach((p, pi) => (p.mv ? [{ mv: p.mv }] : rsTok(p.rs)).forEach((t, ti) => toks.push(Object.assign({ pre: ti ? '' : lead(p, pi), on: p.on, b: p.b, first: !ti && (!pi || parts[pi - 1].g !== p.g) }, t))));
    const nm = (n) => (/^[A-Z][a-z]/.test(n) ? n[0].toLowerCase() + n.slice(1) : n);
    const verb = (t) => { const pl = /[^s]s$/.test(t.n); return t.back ? (t.n === 'Y' ? 'returns to Y*' : 'returns to its previous level') : t.d > 0 ? (pl ? 'rise' : 'rises') : t.d < 0 ? (pl ? 'fall' : 'falls') : 'stays the same'; };
    const slot = (t) => {
      if (!t.on) return '<b class="slot q" data-b="' + t.b + '"></b>';
      if (t.mv) return '<b class="slot mv" data-b="' + t.b + '">' + esc(t.mv) + '</b>';
      if (t.back) return '<b class="slot back" data-b="' + t.b + '">' + verb(t) + '</b>';
      if (t.d == null) return '<b class="slot same" data-b="' + t.b + '">' + esc(nm(t.n)) + '</b>';
      return '<b class="slot ' + (t.d > 0 ? 'up' : t.d < 0 ? 'dn' : 'same') + '" data-b="' + t.b + '">' + (t.d > 0 ? '▲ ' : t.d < 0 ? '▼ ' : '') + verb(t) + (t.x ? ' by ' + esc(t.x) : '') + '</b>';
    };
    return esc(cond || '') + ' ' + toks.map((t, k) => (k ? (toks[k - 1].mv ? ', so ' : t.first && multi ? '; ' : ' and ') : '') + t.pre + (t.mv || (t.d == null && t.on) ? '' : arrows(nm(t.n)) + ' ') + slot(t)).join('') + '.';
  }
  const YBACK = 'Y back';
  const sitHTML = (x) => (x ? '<span class="lb">Situation</span><span class="st">' + String(x).split(' — ').map(arrows).join('<br>') + '</span>' : '');

  const SPEEDS = [['normal', 1], ['fast', 2]];
  let SPEED = (() => { try { return +localStorage.getItem('econ2.speed') === 1 ? 1 : 2; } catch (e) { return 2; } })();
  const players = [];
  function Player(host) {
    host.innerHTML =
      '<ol class="steps" aria-live="polite"></ol>' +
      '<div class="pbar"><span class="cnt"></span><span class="seg"><button type="button" data-a="prev">‹ Prev</button>' +
      '<button type="button" data-a="play" class="pp"></button><button type="button" data-a="next">Next ›</button></span>' +
      '<button type="button" data-a="spd" class="spdb"></button></div>';
    const ol = $('.steps', host), pp = $('.pp', host), cnt = $('.cnt', host), spd = $('[data-a="spd"]', host);
    let beats = [], i = -1, playing = false, timer = 0, fin = false;
    const self = { onGo: null };
    function draw() {
      host.classList.toggle('idle', !beats.length);
      $$('li[data-i]', ol).forEach((li) => { const k = +li.getAttribute('data-i'); li.className = k === i ? 'cur' : k < i ? 'done' : 'todo'; });
      $$('.stg', ol).forEach((st) => st.classList.toggle('cur', !!$('li.cur', st)));
      $$('.gl', ol).forEach((x) => x.classList.toggle('cur', !!beats[i] && beats[i].g === x.getAttribute('data-g')));
      host.classList.toggle('end', fin);
      const end = i >= beats.length - 1;
      pp.textContent = playing ? '❚❚ Pause' : end ? '↻ Replay' : '▶ Auto';
      pp.classList.toggle('on', playing);
      cnt.textContent = beats.length ? (i + 1) + ' / ' + beats.length : '';
      spd.innerHTML = SPEEDS.map((x) => '<span' + (x[1] === SPEED ? '' : ' class="spg" aria-hidden="true"') + '>Speed ' + x[0] + '</span>').join('');
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

    const rsEl = () => { const s = sitEl(), n = s && s.nextElementSibling; return n && n.classList.contains('auto') ? n : null; };
    let rsT = 0;
    function sentence(anim) {
      const el = rsEl(); if (!el) return;
      const parts = beats.map((b, k) => ({ g: b.g, rs: b.rs, mv: mvText(b.mv), adj: b.adj, sw: b.sw, on: k <= i, b: k })).filter((p) => p.rs || p.mv);
      el.innerHTML = parts.length && i >= 0 ? rsHTML(COND[beats[0].ev], parts) : '';
      clearTimeout(rsT);
      if (anim && beats[i] && (beats[i].rs || mvText(beats[i].mv))) { const hs = $$('[data-b="' + i + '"]', el); hs.forEach((h) => h.classList.add('pulse')); rsT = setTimeout(() => hs.forEach((h) => h.classList.remove('pulse')), 1000); }
    }
    function go(k, anim) {
      i = Math.max(0, Math.min(beats.length - 1, k)); fin = false;
      setSit(beats[0].sit); sentence(anim !== false);
      beats[i].run(anim !== false);
      draw(); schedule();
      if (self.onGo) self.onGo(i);
    }

    function build() {
      ol.innerHTML = '';

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

        const unit = (x) => x.split(' → ').map((u, k) => '<span class="u">' + (k ? '→ ' : '') + arrows(u) + '</span>').join(' ');
        btn.innerHTML = '<span class="dot"></span><span class="k">' + (/[←→]/.test(b.k || '') ? '[' + arrows(b.k) + ']' : arrows(b.k || '')) + '</span><span class="tx">' + String(b.t || '').split(' — ').map(unit).join('<br>') + '</span>' + (b.s ? '<span class="sm">' + arrows(b.s) + '</span>' : '');
        const from = k === gStart ? k - 1 : gStart;
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
    spd.addEventListener('click', () => {
      const k = SPEEDS.findIndex((x) => x[1] === SPEED);
      SPEED = SPEEDS[(k + 1) % SPEEDS.length][1]; try { localStorage.setItem('econ2.speed', String(SPEED)); } catch (e) {}
      players.forEach((q) => q.redrawSpeed());
    });
    idle();
    players.push(self);
    return self;
  }
  const dur = () => 750 / SPEED;

  const DIR = (d, w) => { w = w || ['up', 'down']; return d > 0 ? '<span class="kdir up">▲ ' + w[0] + '</span>' : d < 0 ? '<span class="kdir dn">▼ ' + w[1] + '</span>' : '<span class="kdir same">— unchanged</span>'; };
  function Keys(host, defs, ops) {
    host.innerHTML = defs.map((d, i) => (i && ops ? '<span class="kop">' + ops[i - 1] + '</span>' : '') +
      '<div class="key" data-k="' + d.k + '"><div class="kh"><span>' + esc(d.t) + '</span><i>' + esc(d.s || '') + '</i></div><div class="kv"></div><div class="kd"></div></div>').join('');
    if (ops) host.classList.add('ops');
    let timers = [];
    const mark = (k) => $$('.key', host).forEach((b) => b.classList.toggle('pulse', b.getAttribute('data-k') === k));
    const self = {

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

  function apply(st, ch, letter) {
    const off = Object.assign({}, st.off);
    if (ch.add) for (const k in ch.add) off[k] = (off[k] || 0) + ch.add[k];
    if (ch.abs) Object.assign(off, typeof ch.abs === 'function' ? ch.abs(off) : ch.abs);
    return { off, vis: Object.assign({}, st.vis, ch.vis || {}), letter };
  }

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
      const stp = st.step || '', g = st.label || (/Long run/.test(stp) ? 'Long run' : /Short run/.test(stp) ? 'Short run' : isAlt ? 'Long run' : num + ' stage');
      const altList = isAlt ? alts.map((a, k) => ({ t: sc.stages[a].short || sc.stages[a].name, on: a === id, pick: () => rebuild(a) })) : null;
      const cause = ps.slice(0, at), after = ps.slice(at + 1).join(' → ');

      const sit = id === 0 ? sc.sit || sc.t : st.sit || (cause.length ? cause.shift() : st.name);

      const res = o.result(prevS[prevS.length - 1], next, letter).split(' — '), pre = snap(prevS, false);
      out.push({ g, ev: sc.t, mv: ps[at], sw: st.sw, adj: /adjust|조정/.test(why || ''), alts: altList, sit, pre, k: ps[at], t: cause.join(' → '), run: snap(withNew, true), wait: 1.25 });
      out.push({ g, ev: sc.t, sw: st.sw, adj: /adjust|조정/.test(why || ''), rs: st.rs || (num > 1 && /Y = Y\*/.test(res[1] || '') ? res[0].replace(/^Y [↑↓]/, YBACK) : res[0]), alts: altList, sit, pre: snap(withNew, true), k: res[0], t: (after && !same0(after, res[0]) ? after : '') || res.slice(1).join(' — '),
        run: () => { snap(withNew, false)(false); if (o.after) o.after(prevS[prevS.length - 1], next); }, wait: 1.8 });
      S = withNew;
    });
    return out;
  }

  const KEY = new Set(['Reserve ratio raised 10% → 20%', 'Deposits up $100', 'Fed buys $100 of bonds', 'Bad loans → bank capital falls',
    'Fed doubles the money supply', 'Credit cards spread → less money held',
    'Stock market crash', 'Money supply up', 'Government purchases rise', 'Expected price level rises', 'Oil price spike', 'Technological progress',
    'Wage above equilibrium', 'Laid off, gives up searching']);
  const keyFit = (lg) => { lg.hidden = false; if (lg.offsetTop > lg.parentNode.firstChild.offsetTop + 4 || !lg.offsetParent) lg.hidden = true; };
  function keyLegend(host) {
    const box = host.closest('.panel') || host.closest('.ch') || host.parentNode, h3 = $('h3', host);
    if (!h3 || $('.keylg', box)) return;
    const lg = document.createElement('span'); lg.className = 'keylg'; lg.innerHTML = '<i></i>Key factor';
    const tt = document.createElement('span'); while (h3.firstChild) tt.appendChild(h3.firstChild);
    h3.classList.add('haslg'); h3.appendChild(tt); h3.appendChild(lg);
    if (window.ResizeObserver) new ResizeObserver(() => keyFit(lg)).observe(h3); else keyFit(lg);
  }

  const flatText = (o) => { const out = []; (function walk(v) { if (typeof v === 'string') { if (v.length > 1) out.push(v); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.keys(v).forEach((k) => walk(v[k])); })(o); return out.join(' '); };
  function list(host, items, onPick, scope) {
    const ul = $('ul', host);
    const tri = host.id === 'o29';
    if (items.some((it) => KEY.has(it.t))) keyLegend(host);
    items.forEach((it, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      if (KEY.has(it.t)) li.className = 'imp';
      b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-s', flatText(it));
      b.innerHTML = arrows(it.t) + (it.dir ? '<span class="dir' + (it.dir === 'l' ? ' l' : '') + '"' + (tri ? ' title="' + (it.dl || 'Money supply') + ' ' + (it.dir === 'l' ? '▼' : '▲') + '"' : '') + '>' + (tri ? (it.dir === 'l' ? '▼' : '▲') : it.dir === 'l' ? '←' : '→') + '</span>' : '') + (it.q ? '<span class="q">' + esc(it.q) + '</span>' : '');
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

  function bringFig(from) {
    if (!window.matchMedia('(max-width:900px)').matches) {
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

  function ch29() {

    const EN = document.documentElement.lang === 'en';
    const R0 = 0.1, RES0 = 100;
    const player = Player($('#pl29'));
    const row = (k, nm, id) => '<div class="r" data-k="' + k + '"><span>' + nm + '</span><b id="t' + id + '"></b><i id="d' + id + '"></i></div>';
    $('#bank').innerHTML =
      '<div class="eqrow" id="k29">' +
      '<div class="term" data-k="res"><i></i><span>Reserves</span></div><span class="kop">×</span>' +
      '<div class="term" data-k="R"><i></i><span>Money multiplier</span></div><span class="kop">=</span>' +
      '<div class="term" data-k="M"><i id="mLabEn">Money supply</i><span id="mLab">Money supply</span></div>' +
      '<b class="num" data-k="res" id="nRes"></b><span class="kop2">×</span><b class="num" data-k="R" id="nR"></b><span class="kop2">=</span><b class="num" data-k="M" id="nM"></b></div>' +
      '<p class="eqdetail" id="k29d"></p>' +
      '<div class="tacct" id="tacct" hidden><h3>Bank T-account</h3><div class="tt">' +
      '<div><span class="h">ASSETS</span>' + row('res', 'Reserves', 'Res') + row('L', 'Loans', 'Loan') + row('S', 'Securities', 'Sec') + '</div>' +
      '<div><span class="h">LIABILITIES & CAPITAL</span>' + row('D', 'Deposits', 'Dep') + row('Db', 'Debt', 'Debt') + row('K', 'Capital', 'Cap') + '</div></div>' +
      '<p class="tnote" id="tNote">※ Leverage ratio = assets ÷ capital</p></div>';
    const money = (v) => (v == null ? '—' : '$' + fmt(v));
    const sgn = (v) => (v > 0 ? '+' : '−') + '$' + fmt(Math.abs(v));
    let kt = [];
    const pulse = (ks) => { kt.forEach(clearTimeout); kt = []; const mark = (k) => $$('#k29 [data-k]').forEach((x) => x.classList.toggle('pulse', x.getAttribute('data-k') === k)); mark(null); ks.forEach((k, i) => kt.push(setTimeout(() => mark(k), i * 600 / SPEED))); kt.push(setTimeout(() => mark(null), ks.length * 600 / SPEED + 400)); };

    function formula(ev) {
      const nRes = $('#nRes'), nR = $('#nR'), nM = $('#nM');

      const sl = $('#c29 .sitline'), rsx = sl && sl.nextElementSibling, ans = ev && /\*\*([+−-])(\$[\d,]+)\*\*/.exec(ev.d);
      if (sl) sl.innerHTML = ev ? sitHTML(ev.t) : '';
      if (rsx) rsx.innerHTML = ans ? rsHTML(COND[ev.t], [{ g: '', rs: 'The money supply ' + (ans[1] === '+' ? '↑' : '↓') + ' ' + ans[2], on: true, b: -1 }]) : '';
      $('#mLab').textContent = ev && ev.dep ? 'Deposits' : 'Money supply'; $('#mLabEn').textContent = '';
      $('#k29d').innerHTML = ev ? ev.d.split(' ¶ ').map((p) => '<span class="dp">' + p.split(' — ').map((x) => '<span class="dl">' + x.split(' → ').map((u, k) => '<span class="u">' + (k ? '→ ' : '') + arrows(u).replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') + '</span>').join(' ') + '</span>').join('') + '</span>').join('') : '';
      if (!ev) { nRes.className = nR.className = nM.className = 'num'; nRes.textContent = money(RES0); nR.textContent = fmt(1 / R0); nM.textContent = money(RES0 / R0); return; }
      const R1 = ev.R || R0, dRes = ev.dRes || 0, dM = (RES0 + dRes) / R1 - RES0 / R0;
      nRes.className = 'num' + (dRes > 0 ? ' up' : dRes < 0 ? ' dn' : ''); nRes.textContent = dRes ? sgn(dRes) : money(RES0);
      nR.className = 'num' + (R1 !== R0 ? (R1 < R0 ? ' up' : ' dn') : ''); nR.innerHTML = R1 !== R0 ? '<span class="old">' + fmt(1 / R0) + ' →</span> ' + fmt(1 / R1) : fmt(1 / R0);
      nM.className = 'num' + (dM > 0 ? ' up' : ' dn'); nM.textContent = sgn(dM) + (dM > 0 ? ' ▲' : ' ▼');
      pulse(R1 !== R0 ? ['R', 'M'] : ['res', 'M']);
    }

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

    const EV = [
      { t: 'Reserve ratio raised 10% → 20%', q: 'SA 10', dir: 'l', R: 0.2, d: 'R 10% → 20% → multiplier 1/R 10 → 5 — Money supply = $100 × 5 = $500 → **−$500**' },
      { t: 'Reserve ratio cut 10% → 5%', dir: 'r', R: 0.05, d: 'R 10% → 5% → multiplier 1/R 10 → 20 — Money supply = $100 × 20 = $2,000 → **+$1,000**' },
      { t: 'Banks hold more excess reserves', dir: 'l', R: 0.2, d: 'Banks keep reserves beyond the requirement — → reserve ratio R 10% → 20% → multiplier 10 → 5 — Money supply → **−$500**' },
      { t: 'Deposits up $100', dir: 'r', dRes: 100, dep: true, d: 'The $100 is ==currency people already held== = ==part of the monetary base== — → already counted in the money supply ¶ Deposited: currency −$100 → reserves +$100 (monetary base unchanged) — → deposits +$1,000 ¶ Money supply = +$1,000 deposits − $100 currency = **+$900**' },
      { t: 'Withdrawal of $50', dir: 'l', dRes: -50, dep: true, d: 'The $50 ==stays in the monetary base== — it only moves from reserves to currency ¶ Withdrawn: reserves −$50 → deposits −$500 ¶ Money supply = −$500 deposits + $50 currency = **−$450**' },
      { t: 'Fed buys $100 of bonds', q: 'SA 11', dir: 'r', dRes: 100, d: 'Fed pays with new money → ==monetary base +$100== → bank reserves +$100 — No currency was taken out of circulation — → money supply = **+$1,000**' },
      { t: 'Fed sells $50 of bonds', dir: 'l', dRes: -50, d: 'Fed takes money out → ==monetary base −$50== → bank reserves −$50 — Money supply = **−$500**' },
      { t: 'Fed lends $100 to banks (discount rate cut)', dir: 'r', dRes: 100, d: 'Lower discount rate → banks borrow $100 from the Fed — → ==monetary base +$100== → bank reserves +$100 — Money supply = **+$1,000**' },
      { t: 'Bad loans → bank capital falls', dir: 'l', cap: true, dl: 'Capital' }
    ];
    const CAP = EV.find((e) => e.cap);
    const capBeats = () => [
      { g: CAP.t, ev: CAP.t, rs: 'Assets ↓ 5%', sit: 'Bad loans', k: 'Loans ↓ $50', t: 'Asset decline = $50 ÷ $1,000 = 5%', run: () => tshow(Object.assign({}, CB, { L: 650 }), ['L']), wait: 1.4 },
      { g: CAP.t, ev: CAP.t, rs: 'Capital ↓ 100%', sit: 'Bad loans', k: 'Capital ▼ 100%', t: 'Capital decline = asset decline × leverage = 5% × 20', run: () => tshow(Object.assign({}, CB, { L: 650, K: 0 }), ['K']), wait: 1.4 }
    ];
    list($('#o29'), EV, (i) => {
      const ev = i < 0 ? null : EV[i];
      if (ev && ev.cap) { mode(true); tshow(CB, []); player.load(capBeats()); }
      else { mode(false); player.clear(); formula(ev); }
      alignBank();
    });
    mode(false); formula(null);
  }

  const mdScale = (off) => (1 + (off.Yg || 0)) / (1 + (off.Vg || 0)) - 1;
  function ch30() {
    const plot = Plot($('#plot30'), {
      aria: 'Money market graph', dom: [0, 12, 0, 10], xName: 'M', yName: '1/P', xTitle: 'Quantity of money M', yTitle: 'Value of money 1/P', ptD: [12, -12],
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
      result: (a, b) => { const x = idx(a), y = idx(b); return '1/P ' + dirW(x.v, y.v, 0.02) + ' · P ' + dirW(x.P, y.P, 0.5); },
      quiet: () => plot.hilite(null),

      after: (a, b) => {
        const x = idx(a), y = idx(b), items = [];
        const ax = (dirOf(x.M, y.M, 0.5) ? 'x' : '') + (dirOf(x.v, y.v, 0.02) ? 'y' : '');
        if (ax) items.push({ axis: ax });
        plot.seq(items);
      }
    });
    const keep = (why) => ({ name: 'Fed shifts MS to hold P', label: 'For the Fed to keep P stable', sw: 'to keep P stable, the Fed cuts M and ', rs: 'P back', ch: { abs: (o) => ({ MS: 5 * (1 + mdScale(o)) - 5 }) }, why });
    const EV = [
      { t: 'Fed doubles the money supply', dir: 'r', stages: [{ name: 'MS →', at: 0, ch: { add: { MS: 5 } }, why: 'MS → → 1/P halves, P doubles' }] },
      { t: 'Fed cuts the money supply', dir: 'l', stages: [{ name: 'MS ←', at: 0, ch: { add: { MS: -1.5 } }, why: 'MS ← → 1/P ↑, P ↓' }] },
      { t: 'Credit cards spread → less money held', q: 'SA 2', dir: 'l', stages: [
        { name: 'Money demand falls', label: 'Money demand falls', ch: { add: { Vg: 0.5 } }, why: 'Pay by card → money held ↓ → MD ← → 1/P ↓, P ↑' },
        keep('Fed cuts M → MS ← → 1/P, P recover')] },
      { t: 'Real GDP rises → more money for transactions', dir: 'r', stages: [
        { name: 'Money demand rises', ch: { add: { Yg: 0.3 } }, why: 'Y ↑ → money demand ↑ → MD → → 1/P ↑, P ↓' }] }
    ];
    list($('#o30'), EV, (i) => r.pick(i < 0 ? null : EV[i]));
    return plot;
  }

  const adasCurves = () => [
    { id: 'LRAS', kind: 'vert', x: 5, y0: 0.8, y1: 9.6, lab: 'LRAS' },
    { id: 'SRAS', kind: 'line', x: 5, y: 5, m: 0.85, span: 3.8, lab: 'SRAS' },
    { id: 'AD', kind: 'line', x: 5, y: 5, m: -0.85, span: 3.8, lab: 'AD' }
  ];

  const lrSRAS = (off) => { const L = 5 + (off.LRAS || 0), yA = 5 - 0.85 * (L - 5 - (off.AD || 0)); return { SRAS: L - 5 - (yA - 5) / 0.85 }; };
  const lrAD = (off) => { const L = 5 + (off.LRAS || 0), yS = 5 + 0.85 * (L - 5 - (off.SRAS || 0)); return { AD: L - 5 + (yS - 5) / 0.85 }; };
  const eqX = (off) => 5 + ((off.AD || 0) + (off.SRAS || 0)) / 2;
  function longRun(S) {
    const b = S[S.length - 1].off, L = 5 + (b.LRAS || 0);
    return eqX(b) > L + 0.03
      ? 'Y > Y* → wages · P^e adjust ↑ → SRAS ← → Y* restored, P ↑'
      : 'Y < Y* → wages · P^e adjust ↓ → SRAS → → Y* restored, P ↓';
  }
  function gap(off, pt) {
    const L = 5 + (off.LRAS || 0);
    return Math.abs(pt.x - L) < 0.03 ? 'Y = Y* long-run equilibrium' : pt.x > L ? 'Y > Y* short-run boom' : 'Y < Y* short-run recession';
  }
  function ch33() {
    const mk = (host) => Plot(host, { aria: 'Aggregate demand–supply graph', dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: 'Real GDP Y', yTitle: 'Price level P', star: true, curves: adasCurves(), eqs: [['AD', 'SRAS']] });
    const ad = mk($('#plot33ad')), as = mk($('#plot33as')), player = Player($('#pl33'));
    const CV = ['AD', 'SRAS', 'LRAS'];
    const opt = (plot) => ({
      start: 'A : Y = Y*',
      result: (a, b) => { const x = plot.pointsOf(a.off, a.vis)[0], y = plot.pointsOf(b.off, b.vis)[0]; if (!x || !y) return ''; let s = 'Y ' + dirW(x.x, y.x, 0.03) + ' · P ' + dirW(x.y, y.y, 0.03) + ' — ' + gap(b.off, y); if (y.x < x.x - 0.03 && y.y > x.y + 0.03 && Math.abs(x.x - 5 - (a.off.LRAS || 0)) < 0.03) s += ' (stagflation)'; return s; },
      quiet: () => plot.hilite(null),

      after: (a, b) => {
        const x = plot.pointsOf(a.off, a.vis)[0], y = plot.pointsOf(b.off, b.vis)[0];
        if (!x || !y) return;
        const items = [];
        const ax = (dirOf(x.x, y.x, 0.03) ? 'x' : '') + (dirOf(x.y, y.y, 0.03) ? 'y' : '');
        if (ax) items.push({ axis: ax });
        plot.seq(items);
      }
    });
    const rad = runner(ad, player, opt(ad)), ras = runner(as, player, opt(as));
    let curName = 'ad';
    const R = 1.4;
    const adEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'AD ' + (dir === 'r' ? '→' : '←'), step: 'Stage 1 · Short run', ch: { add: { AD: dir === 'r' ? R : -R } }, why },
      { name: 'SRAS adjusts → Y*', step: 'Stage 2 · Long run', ch: { abs: lrSRAS }, why: longRun }] });
    const AD = {
      C: [adEv('Stock boom', 'r', 'Stocks ↑ → wealth ↑ → C ↑ → AD →'), adEv('Stock market crash', 'l', 'Stocks ↓ → wealth ↓ → C ↓ → AD ←', 'SA 4a'), adEv('Income tax cut', 'r', 'Income tax ↓ → disposable income ↑ → C ↑ → AD →')],
      I: [adEv('Money supply up', 'r', 'M ↑ → r ↓ → I ↑ → AD →'), adEv('Business optimism · investment boom', 'r', 'Expected profits ↑ → new plant & equipment I ↑ → AD →', 'SA 5'), adEv('Investment tax credit', 'r', 'Tax break on investment → I ↑ → AD →')],
      G: [adEv('Government purchases rise', 'r', 'Government purchases G ↑ → AD →', 'SA 4b')],
      NX: [adEv('Recession abroad', 'l', 'Foreign income ↓ → our exports ↓ → NX ↓ → AD ←', 'SA 4d'), adEv('Turmoil abroad → currency appreciates', 'l', 'Currency ↑ → exports ↓ · imports ↑ → NX ↓ → AD ←', 'MC 7')]
    };
    const srEv = (t, why, q) => ({ t, q, dir: 'l', stages: [
      { name: 'SRAS ←', step: 'Stage 1 · Short run', ch: { add: { SRAS: -R } }, why },
      { name: 'Do nothing: SRAS returns', short: 'Wait', ch: { abs: { SRAS: 0 } }, letter: 'A', at: 2, why: 'Y < Y* → wages · P^e adjust ↓ → SRAS → → Y* and P restored (slow)' },
      { name: 'Accommodate: AD →', short: 'Policy', sw: 'in the long run, policy accommodates (M ↑ · G ↑): ', sit: 'Y < Y* : accommodate with policy', from: 0, ch: { abs: lrAD }, chain: ['M ↑ · G ↑', 'AD →', 'Y* restored, P higher still'], at: 1 }] });

    const lrEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'LRAS · SRAS ' + (dir === 'r' ? '→' : '←'), ch: { add: { LRAS: dir === 'r' ? 1 : -1 }, abs: lrSRAS }, why }] });
    const AS = {
      SR: [srEv('Expected price level rises', 'P^e ↑ → wages · prices ↑ → SRAS ←', 'MC 11'), srEv('Oil price spike', 'Oil ↑ → production costs ↑ → SRAS ←'), srEv('Nominal wages rise', 'Nominal wages ↑ → costs ↑ → SRAS ←')],
      LR: [lrEv('Technological progress', 'r', 'Technology ↑ → productivity ↑ → Y* ↑ → LRAS · SRAS →', 'SA 4c'), lrEv('Capital · human capital rise', 'r', 'Capital K · human capital H ↑ → Y* ↑ → LRAS · SRAS →', 'SA 5c'), lrEv('Immigration → labor rises', 'r', 'Labor L ↑ → Y* ↑ → LRAS · SRAS →', 'SA 1'), lrEv('Natural disaster · resources fall', 'l', 'Resources N · capital ↓ → Y* ↓ → LRAS · SRAS ←', 'SA 1'), lrEv('Natural rate of unemployment rises', 'l', 'Minimum wage ↑ → natural rate of unemployment ↑ — → employed L ↓ → Y* ↓ → LRAS · SRAS ←')]
    };

    $$('#side33ad [data-o]').forEach((h) => { const L = AD[h.getAttribute('data-o')]; list(h, L, (i) => rad.pick(i < 0 ? null : L[i]), $('#side33ad')); });
    $$('#side33as [data-o]').forEach((h) => { const L = AS[h.getAttribute('data-o')]; list(h, L, (i) => ras.pick(i < 0 ? null : L[i]), $('#side33as')); });
    function showSub(which, push) {
      curName = which;
      $$('#c33 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === which)));
      $('#plot33ad').hidden = which !== 'ad'; $('#plot33as').hidden = which !== 'as';
      $('#side33ad').hidden = which !== 'ad'; $('#side33as').hidden = which !== 'as';
      (which === 'as' ? ras : rad).resume();
      if (push) history.replaceState(null, '', which === 'as' ? '#ch33-as' : '#ch33');
    }
    $$('#c33 .sub button').forEach((b) => b.addEventListener('click', () => showSub(b.getAttribute('data-sub'), true)));
    return { showSub, current: () => curName };
  }

  function ch28() {
    let info = '';
    const plot = Plot($('#plot28'), {
      aria: 'Labor market graph', dom: [0, 10, 0, 10], xName: 'L', yName: 'W', xTitle: 'Labor L', yTitle: 'Wage W', pad: { r: 130 },
      curves: [
        { id: 'S', kind: 'line', x: 5, y: 5, m: 0.9, span: 4.3, lab: 'Supply S' },
        { id: 'D', kind: 'line', x: 5, y: 5, m: -0.9, span: 4.3, lab: 'Demand D' },
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
          label(g, ex, Y(w) - 2, 'below equilibrium', { size: 14, color: C.red, weight: 700 });
          label(g, ex, Y(w) + 16, '→ not binding', { size: 14, color: C.red, weight: 700 });
          info = 'W ≤ W_E : market clears at W_E → no unemployment';
          return;
        }
        if (ctx.hide) return;
        const ld = meet(W, off.W || 0, D, off.D || 0, ctx.dom), ls = meet(W, off.W || 0, S, off.S || 0, ctx.dom);
        tri(g, b[0] + 8 + textW('W', 18) + 4, Y(w) - 9, 1);
        [[ld, 'L_D', -1], [ls, 'L_S', 1]].forEach(([q, lab, dd]) => {
          if (!q) return;
          el('path', { d: 'M' + X(q.x) + ' ' + Y(q.y) + 'V' + (b[1] + b[3]), stroke: C.guide, 'stroke-width': 1.4, 'stroke-dasharray': '5 5', fill: 'none' }, g);
          el('circle', { cx: X(q.x), cy: Y(q.y), r: 5, fill: C.red }, g);
          label(g, X(q.x), b[1] + b[3] + 24, lab, { anchor: 'middle', size: 17, weight: 800 });
          tri(g, X(q.x) + textW(lab, 17) / 2 + 4, b[1] + b[3] + 23, dd);
        });
        if (ld && ls && X(ls.x) - X(ld.x) > 40) {
          const y = Y(w) - 22;
          arrow(g, X(ld.x) + 4, y, X(ls.x) - 4, y, C.red, true);
          label(g, (X(ld.x) + X(ls.x)) / 2, y - 12, 'Unemployment = L_S − L_D', { anchor: 'middle', size: 15, color: C.red, weight: 700 });
        }
        label(g, ex, Y(w) - 2, 'above', { size: 14, color: C.red, weight: 700 });
        label(g, ex, Y(w) + 16, 'equilibrium', { size: 14, color: C.red, weight: 700 });
        info = 'W > W_E : labor supplied L_S > labor demanded L_D → the gap is unemployment';
      }
    });
    const player = Player($('#pl28'));
    const r = runner(plot, player, {
      start: 'A : W = W_E, L = L_E',
      result: (a, b) => (b.vis.W ? (b.off.W || 0) + 7 > eqW(b.off) + 0.05 ? 'U ↑' : 'No change' : 'W ↓ · L ↓ — no unemployment'),
      quiet: () => plot.hilite(null),

      after: (a, b) => plot.seq(b.vis.W ? [] : [{ axis: 'xy' }])
    });
    function eqW(off) { const m = meet(plot.byId.S, off.S || 0, plot.byId.D, off.D || 0, plot.dom); return m ? m.y : 5; }
    const EV = [
      { t: 'Wage above equilibrium', q: 'MC 10 · 14', dir: 'r',
        sit: 'Minimum wage : set by law — Union : collective bargaining — Efficiency wage : firms choose it (effort ↑ · turnover ↓)',
        stages: [{ name: 'W > W_E', at: 0, ch: { vis: { W: true }, abs: { W: 0 } }, chain: ['W > W_E', 'L_S ↑ · L_D ↓ → unemployment'] }] },
      { t: 'Labor demand falls', q: 'SA 4', dir: 'l', stages: [
        { name: 'Demand D ←, wage unchanged', step: 'Stage 1 · Short run', at: 2, ch: { add: { D: -1.4 }, vis: { W: true }, abs: { W: -2 } }, why: 'Imports ↑ → domestic industry declines → D ← → W stuck at W_E → unemployment' },
        { name: 'Wage ↓ → new equilibrium', step: 'Stage 2 · Long run', at: 0, ch: { vis: { W: false } }, why: 'W ↓ → no unemployment (workers move to other industries)' }] }
    ];
    list($('#o28'), EV, (i) => r.pick(i < 0 ? null : EV[i]));

    const B = { E: 140.196, U: 14.729, N: 80.729 };
    const NM = { E: 'Employed', U: 'Unemployed', N: 'Not in labor force' };
    const SIT = [
      { t: 'Laid off, searching', c: '실직한 사람이 일자리를 찾으면', ce: 'If a laid-off worker looks for a job,', m: { E: -1, U: 1 } },
      { t: 'Laid off, gives up searching', q: 'MC 1', c: '실직한 사람이 구직을 포기하면', ce: 'If a laid-off worker gives up looking,', m: { E: -1, N: 1 } },
      { t: 'Reclassify token job-seekers', q: 'MC 5', c: '구직 시늉만 하던 사람을 비경제활동인구로 다시 세면', ce: 'If token job-seekers are recounted as not in the labor force,', m: { U: -1, N: 1 } },
      { t: 'Unemployed finds a job', c: '실업자가 취업하면', ce: 'If an unemployed person finds a job,', m: { U: -1, E: 1 } },
      { t: 'Starts looking for a first job', c: '처음으로 일자리를 찾기 시작하면', ce: 'If someone starts looking for a first job,', m: { N: -1, U: 1 } }
    ];
    const pl2 = Player($('#pl28s'));

    const EN = document.documentElement.lang === 'en';
    let rkt = [], sit = null, rv = {};
    const KO_V = { 1: ['up하고', 'up한다'], '-1': ['down하고', 'down한다'], 0: ['unchanged이고', 'unchanged이다'] };
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
        : esc(sit.c) + ' Unemployment rate이 ' + slot('UR', rv.UR) + ' Participation rate은 ' + slot('LF', rv.LF, true);
    };
    const rk = {
      set(v) { rv = { UR: v.UR && v.UR.d != null ? v.UR : null, LF: v.LF && v.LF.d != null ? v.LF : null }; sentence(); },
      seq(ks) { rk.stop(); ks.forEach((k) => { const e = $('#k28s [data-k="' + k + '"]'); if (!e) return; e.classList.add('pulse'); rkt.push(setTimeout(() => e.classList.remove('pulse'), 1000)); }); },
      stop() { rkt.forEach(clearTimeout); rkt = []; $$('#k28s .slot').forEach((e) => e.classList.remove('pulse')); }
    };
    const tri = (d) => (d > 0 ? '<b class="up">▲</b>' : d < 0 ? '<b class="dn">▼</b>' : '');
    const wordOf = (d, w) => { w = w || ['up', 'down']; return d > 0 ? '<span class="t up">▲ ' + w[0] + '</span>' : d < 0 ? '<span class="t dn">▼ ' + w[1] + '</span>' : '<span class="t same">unchanged</span>'; };
    const ur = (x) => x.U / (x.E + x.U), lf = (x) => (x.E + x.U) / (x.E + x.U + x.N);

    function rates(m, lv) {
      const v = { E: B.E + (m.E || 0), U: B.U + (m.U || 0), N: B.N + (m.N || 0) };
      const d = (k) => (lv >= 1 ? m[k] || 0 : 0), dLF = d('E') + d('U'), dPop = dLF + d('N');
      const dUR = dirOf(ur(B), ur(v), 1e-9), dLFr = dirOf(lf(B), lf(v), 1e-9);
      rk.set({ UR: lv >= 4 ? { d: dUR } : { txt: '· · ·' }, LF: lv >= 7 ? { d: dLFr } : { txt: '· · ·' } });

      const hi = (n) => (lv === n ? ' hi' : '');
      const chip = (k) => '<span class="grp">' + NM[k] + tri(d(k)) + '</span>';
      const part = (ks, dd, on) => ks.map((k) => NM[k] + (ks.length > 1 ? tri(d(k)) : '')).join(' + ') + (on && dd && (ks.length === 1 || ks.filter((k) => d(k)).length > 1) ? ' ' + wordOf(dd) : '');
      const one = (name, dd, on) => name + (on && dd ? ' ' + wordOf(dd) : '');
      const res = (dd, on) => (on ? wordOf(dd, ['up', 'down']) : '<span class="q">?</span>');
      $('#rates').innerHTML =
        '<div class="who' + hi(1) + '"><span class="lb">Population</span>' + chip('E') + chip('U') + chip('N') + '</div>' +
        '<div class="rate"><span class="nm">Unemployment rate</span><span class="frac"><span class="' + hi(3) + '">' + part(['U'], d('U'), lv >= 3) + '</span><span class="' + hi(3) + '">' + part(['E', 'U'], dLF, lv >= 3) + '</span></span><span class="out"><span class="eqs">=</span><span class="res' + hi(4) + '">' + res(dUR, lv >= 4) + '</span></span></div>' +
        '<div class="rate"><span class="nm">Participation rate</span><span class="frac"><span class="' + hi(6) + '">' + part(['E', 'U'], dLF, lv >= 6) + '</span><span class="' + hi(6) + '">' + one('Adult population', dPop, lv >= 6) + '</span></span><span class="out"><span class="eqs">=</span><span class="res' + hi(7) + '">' + res(dLFr, lv >= 7) + '</span></span></div>';
    }
    let rt = [];
    const stopR = () => { rt.forEach(clearTimeout); rt = []; rk.stop(); };

    const KEY = { 4: 'UR', 7: 'LF' };
    const stage = (m, lvs) => (anim) => {
      stopR();
      if (!anim || reduce) { rates(m, lvs[lvs.length - 1]); rk.seq(lvs.map((lv) => KEY[lv]).filter(Boolean)); return; }
      lvs.forEach((lv, i) => rt.push(setTimeout(() => { rates(m, lv); if (KEY[lv]) rk.seq([KEY[lv]]); }, i * 700 / SPEED)));
    };
    const arrow = (dd) => (dd > 0 ? '↑' : dd < 0 ? '↓' : 'unchanged');
    function beats(s) {
      const m = s.m, v = { E: B.E + (m.E || 0), U: B.U + (m.U || 0), N: B.N + (m.N || 0) };
      const dLF = (m.E || 0) + (m.U || 0), dPop = dLF + (m.N || 0);
      const moved = Object.keys(m).map((k) => NM[k] + ' ' + (m[k] > 0 ? '↑' : '↓')).join(' · ');
      return [
        { g: s.t, sit: moved, k: 'Unemployment rate ' + arrow(dirOf(ur(B), ur(v), 1e-9)),
          t: 'Unemployed ' + arrow(m.U || 0) + ' · Labor force ' + arrow(dLF), run: stage(m, [1, 3, 4]), wait: 2.2 },
        { g: s.t, sit: moved, k: 'Participation rate ' + arrow(dirOf(lf(B), lf(v), 1e-9)),
          t: 'Labor force ' + arrow(dLF) + ' · Adult population ' + arrow(dPop), run: stage(m, [6, 7]), wait: 2.2 }
      ];
    }
    list($('#o28s'), SIT, (i) => { sit = i < 0 ? null : SIT[i]; if (i < 0) { pl2.clear(); stopR(); rates({}, 0); } else pl2.load(beats(SIT[i])); });
    rates({}, 0);

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

  function alignTabs() {
    $$('.ch.on.tabbed').forEach((sec) => {
      const svg = $$('.fig .stage:not([hidden]) svg.plot', sec)[0], sub = $('.sub', sec);
      if (!svg || !sub) return;
      const r = svg.getBoundingClientRect(), f = { left: sub.getBoundingClientRect().left - (parseFloat(sub.style.marginLeft) || 0) };
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

  function markMore() { $$('.side, .fig').forEach((e) => e.classList.toggle('more', e.scrollHeight - e.scrollTop - e.clientHeight > 4)); }
  document.addEventListener('scroll', markMore, true);
  window.addEventListener('resize', markMore);

  const setTop = () => document.documentElement.style.setProperty('--toph', $('.top').offsetHeight + 'px');
  setTop(); if (window.ResizeObserver) new ResizeObserver(() => { setTop(); markMore(); }).observe($('.top'));
  document.addEventListener('click', () => setTimeout(markMore, 50));

  ch29();
  const p30 = ch30(), c33 = ch33(), c28 = ch28();
  const plots = { ch30: [p30] };
  function show(id, sub) {
    $$('.ch').forEach((s) => s.classList.toggle('on', s.id === id.replace('ch', 'c')));
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
