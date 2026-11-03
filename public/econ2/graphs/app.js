/* Econ2 핵심 그래프 페이지 — index.html 과 짝. 슬라이드 덱(/slides/econ2/graphs.js)과는 따로 쓴 작은 그래프 엔진 + 챕터별 사건.
   · 사건은 늘 처음 상태 A 에서 시작한다. 고른 줄을 한 번 더 누르면 풀리고 A 로 돌아간다.
   · 사건을 고르면 변화가 한 걸음씩(beat) 차례로 나온다: 원인 → 곡선 이동 → 새 균형점 → (2단계 장기 조정 …).
     Player 가 걸음 카드(‹ › · 밀어 넘기기) · 조작 줄(처음으로 · 자동 재생 · 속도) · 단계 목차(번호 점)를 맡는다. 모든 챕터가 같은 Player 를 쓴다.
   · 그래프 사건의 걸음은 stage.why 를 ' → ' 로 잘라 만든다. 곡선이 움직이는 걸음은 곡선 이름 + 화살표(AD → 등)로 찾고,
     못 찾으면 stage.at 으로 정한다. 각 단계 끝에는 "새 균형" 걸음을 붙인다. stage.from 을 주면 그 단계에서 갈라진다(2단계 ⓐ / ⓑ).
   · 교재의 기본 곡선만 쓴다: AD · SRAS 직선, LRAS · MS 수직선, MD 는 1/P = k / M(직각쌍곡선), 노동 수요 · 공급 직선.
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
    let S = [base()], disp = Object.assign({}, S[0].off), anim = 0, hideNow = false;
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

      const ctx = { g, S, P, off: disp, X, Y, box, dom: d, hide: hideNow };
      if (self.extra) self.extra(ctx);
      if (self.on) self.on(ctx);
    }
    self.render = render;
    // 상태 줄을 통째로 바꾸고 지금(마지막) 상태로 움직인다. o.hide: 새 균형점은 아직 숨김, o.dur: 애니메이션 길이(ms)
    self.show = (states, o) => {
      o = o || {};
      S = states; hideNow = !!o.hide;
      const to = Object.assign({}, S[S.length - 1].off), from = Object.assign({}, disp);
      cancelAnimationFrame(anim);
      if (o.instant || reduce) { disp = to; render(); return; }
      const ids = Object.keys(Object.assign({}, from, to)), t0 = performance.now(), dur = o.dur || 750;
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

  /* ───────── 재생기: 걸음 카드(그래프 바로 아래, ‹ › · 밀어 넘기기 · ← →) → 조작 줄(처음으로 · 자동 재생 · 속도) → 단계 목차(이름 + 번호 점) ───────── */
  // beat = { g: 묶음 이름(1단계 단기 …), alts: [{ t, on, pick }](갈라지는 단계일 때), t: 글자, run(anim), wait: 머무는 시간 배율 }
  // 사건을 고르기 전에는 카드에 안내만 보이고 조작 줄 · 목차는 숨는다(.idle)
  const SPEEDS = [['느리게', 0.5], ['보통', 1], ['빠르게', 2]];
  let SPEED = 1;
  const players = [];
  function Player(host, hint) {
    hint = hint || '목록에서 사건을 고르면 그래프가 한 걸음씩 움직입니다. ‹ › 로 넘겨 보세요.';
    host.innerHTML =
      '<div class="card"><button type="button" class="cv" data-a="prev" aria-label="이전 걸음">‹</button>' +
      '<div class="cbody" aria-live="polite"><div class="cg"></div><div class="ct"></div><div class="pstat"></div></div>' +
      '<button type="button" class="cv" data-a="next" aria-label="다음 걸음">›</button></div>' +
      '<div class="pbar"><span class="cnt"></span><button type="button" data-a="first">처음으로</button>' +
      '<button type="button" data-a="play" class="pp"></button><button type="button" data-a="spd"></button></div>' +
      '<ol class="toc" aria-label="단계 목차"></ol>';
    const toc = $('.toc', host), card = $('.card', host), body = $('.cbody', host), pp = $('.pp', host), cnt = $('.cnt', host), stat = $('.pstat', host), spd = $('[data-a="spd"]', host);
    let beats = [], pos = [], i = -1, playing = false, timer = 0;
    const self = { onGo: null };
    function draw() {
      host.classList.toggle('idle', !beats.length);
      $$('.dot', toc).forEach((d) => { const k = +d.getAttribute('data-i'); d.className = 'dot' + (k === i ? ' cur' : k < i ? ' done' : ''); });
      $$('li', toc).forEach((li, gi) => li.classList.toggle('cur', !!pos[i] && pos[i].gi === gi));
      const end = i >= beats.length - 1;
      pp.textContent = playing ? '❚❚ 멈춤' : end ? '↻ 다시 보기' : '▶ 자동 재생';
      pp.classList.toggle('on', playing);
      cnt.textContent = beats.length ? (i + 1) + ' / ' + beats.length : '';
      spd.textContent = '속도 ' + SPEEDS.find((s) => s[1] === SPEED)[0];
      $('[data-a="prev"]', host).disabled = i <= 0; $('[data-a="first"]', host).disabled = i <= 0; $('[data-a="next"]', host).disabled = end;
    }
    function idle() {
      $('.cg', body).textContent = '사건을 고르세요';
      $('.ct', body).textContent = hint;
      body.classList.remove('in-r', 'in-l');
      draw();
    }
    function schedule() {
      clearTimeout(timer);
      if (!playing) return;
      if (i >= beats.length - 1) { playing = false; draw(); return; }
      timer = setTimeout(() => go(i + 1, true), 1500 * (beats[i].wait || 1) / SPEED);
    }
    function go(k, anim) {
      const was = i;
      i = Math.max(0, Math.min(beats.length - 1, k));
      beats[i].run(anim !== false);
      const p = pos[i];
      $('.cg', body).textContent = p.n > 1 ? p.g + ' · ' + (p.si + 1) + ' / ' + p.n : p.g;
      $('.ct', body).innerHTML = arrows(beats[i].t);
      body.classList.remove('in-r', 'in-l');
      if (anim !== false && was !== i && !reduce) { void body.offsetWidth; body.classList.add(i > was ? 'in-r' : 'in-l'); }   // 넘기는 방향으로 카드가 들어온다
      draw(); schedule();
      if (self.onGo) self.onGo(i);
    }
    // 목차: 단계(묶음)마다 한 줄 — 이름(누르면 그 단계 첫 걸음) + 걸음 번호 점(누르면 그 걸음, 지금 파랑 · 지난 것 진하게)
    function build() {
      toc.innerHTML = ''; pos = [];
      const groups = [];
      beats.forEach((b, k) => {
        if (!groups.length || groups[groups.length - 1].g !== b.g) groups.push({ g: b.g, alts: b.alts, ks: [] });
        const G = groups[groups.length - 1];
        pos[k] = { gi: groups.length - 1, si: G.ks.length, g: b.g };
        G.ks.push(k);
      });
      pos.forEach((p) => { p.n = groups[p.gi].ks.length; });
      groups.forEach((G) => {
        const li = document.createElement('li'), nm = document.createElement('button');
        nm.type = 'button'; nm.className = 'gn'; nm.textContent = G.g;
        nm.addEventListener('click', () => { playing = false; go(G.ks[0], true); });
        li.appendChild(nm);
        if (G.alts) G.alts.forEach((a) => { const x = document.createElement('button'); x.type = 'button'; x.className = a.on ? 'alt on' : 'alt'; x.textContent = a.t; x.addEventListener('click', a.pick); li.appendChild(x); });
        const dots = document.createElement('span');
        dots.className = 'dots';
        G.ks.forEach((k, j) => {
          const d = document.createElement('button');
          d.type = 'button'; d.className = 'dot'; d.setAttribute('data-i', k); d.textContent = j + 1;
          d.title = beats[k].t; d.setAttribute('aria-label', G.g + ' ' + (j + 1) + '번째 걸음: ' + beats[k].t);
          d.addEventListener('click', () => { playing = false; go(k, true); });
          dots.appendChild(d);
        });
        li.appendChild(dots); toc.appendChild(li);
      });
    }
    self.load = (list, o) => {
      o = o || {};
      clearTimeout(timer);
      beats = list; i = -1;
      build();
      playing = o.play !== false && !reduce;
      if (list.length) go(o.at || 0, o.anim !== false); else idle();
    };
    self.clear = () => { clearTimeout(timer); playing = false; beats = []; pos = []; i = -1; toc.innerHTML = ''; stat.innerHTML = ''; idle(); };
    self.status = (html) => { stat.innerHTML = html || ''; };
    self.index = () => i;
    self.redrawSpeed = () => { draw(); if (playing) schedule(); };
    const step = (dk) => { if (!beats.length) return; playing = false; go(i + dk, true); };
    $('[data-a="first"]', host).addEventListener('click', () => { playing = false; go(0, true); });
    $('[data-a="prev"]', host).addEventListener('click', () => step(-1));
    $('[data-a="next"]', host).addEventListener('click', () => step(1));
    // 휴대폰: 카드를 옆으로 밀어 넘긴다. 키보드: 재생기 안에서 ← →
    let tx = null, ty = 0;
    card.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    card.addEventListener('touchend', (e) => {
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
    spd.addEventListener('click', () => {   // 느리게 → 보통 → 빠르게 → 느리게 (모든 재생기 같이)
      const k = SPEEDS.findIndex((s) => s[1] === SPEED);
      SPEED = SPEEDS[(k + 1) % SPEEDS.length][1];
      players.forEach((p) => p.redrawSpeed());
    });
    idle();
    players.push(self);
    return self;
  }
  const dur = () => 750 / SPEED;

  /* ───────── 지표 상자: 이름 · 처음 → 지금 · 변화 알약 (바뀐 상자는 파란 테두리) ───────── */
  // defs = [{ k, t: 이름, s: 기호, f: 값 → 글자, d: (처음, 지금) → 알약 글자 }], ops: 상자 사이 기호(× = 등)
  function Keys(host, defs, ops) {
    host.innerHTML = defs.map((d, i) => (i && ops ? '<span class="kop">' + ops[i - 1] + '</span>' : '') +
      '<div class="key" data-k="' + d.k + '"><div class="kh"><span>' + esc(d.t) + '</span><i>' + esc(d.s || '') + '</i></div><div class="kv"><span class="kb"></span><span class="karr">→</span><span class="ka"></span></div><div class="kd"></div></div>').join('');
    if (ops) host.classList.add('ops');
    return {
      // vals[k] = { b: 처음 값, a: 지금 값 } 또는 { txt: 글자 값(곡선 이동 등), base: 처음 글자 }, note: 아래 작은 글
      set(vals) {
        defs.forEach((d) => {
          const v = vals[d.k] || {}, box = $('[data-k="' + d.k + '"]', host);
          const f = d.f || ((x) => String(x));
          const txt = v.txt != null, ch = txt ? !!v.txt : v.a != null && v.b != null && Math.abs(v.a - v.b) > 1e-6;
          box.classList.toggle('chg', ch);   // 'ch' 는 챕터 구역 이름이라 쓰지 않는다
          $('.kb', box).textContent = ch && !txt ? f(v.b) : '';
          $('.karr', box).style.display = ch && !txt ? '' : 'none';
          $('.ka', box).textContent = txt ? v.txt || v.base || '—' : v.a != null ? f(v.a) : v.b != null ? f(v.b) : '—';
          const pill = ch && !txt && d.d ? d.d(v.b, v.a) : '';
          $('.kd', box).innerHTML = (pill ? '<span class="pill' + (v.a < v.b ? ' dn' : '') + '">' + esc(pill) + '</span>' : '') + (v.note ? '<span class="kn">' + arrows(v.note) + '</span>' : '');
        });
      }
    };
  }
  const pct = (b, a) => (a >= b ? '+' : '−') + fmt(Math.abs(a / b - 1) * 100) + '%';
  const pp = (b, a) => (a >= b ? '+' : '−') + fmt(Math.abs(a - b), 1) + '%p';
  const idx0 = (v) => fmt(v);
  // 그래프에서 지금 보이는 마지막 균형점(곡선이 움직이는 걸음에서는 그 앞 점)
  const lastPt = (ctx) => { for (let i = ctx.P.length - 1; i >= 0; i--) if (ctx.P[i][0]) return { pt: ctx.P[i][0], i }; return null; };
  // 처음과 지금 사이에 움직인 곡선 이름(AD →, SRAS ← …)
  function movedText(plot, S, names) {
    const a = S[0], z = S[S.length - 1];
    return names.filter((id) => { const c = plot.byId[id]; return z.vis[id] && a.vis[id] && !same(plot.offOf(c, a.off), plot.offOf(c, z.off)); })
      .map((id) => { const c = plot.byId[id], dv = plot.offOf(c, z.off) - plot.offOf(c, a.off); return c.lab + ' ' + (dv > 0 ? '→' : '←'); }).join(' · ');
  }

  /* ───────── 그래프 사건 → 걸음 ───────── */
  // stage.ch = { add: {id: 더할 양}, abs: {id: 값} 또는 (앞 상태 off) => {…}, vis: {id: bool} }
  function apply(st, ch, letter) {
    const off = Object.assign({}, st.off);
    if (ch.add) for (const k in ch.add) off[k] = (off[k] || 0) + ch.add[k];
    if (ch.abs) Object.assign(off, typeof ch.abs === 'function' ? ch.abs(st.off) : ch.abs);
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
  const MOVE = /(AD|SRAS|LRAS|MS|MD)( 가 더)?\s*[←→]/;
  // 사건(sc)의 갈래(branch: 갈라지는 단계 번호)를 따라 걸음을 만든다. o.start: A 설명, o.result(앞 상태, 새 상태, 글자): 새 균형 설명
  function beatsFor(plot, sc, branch, o, rebuild) {
    const alts = sc.stages.map((s, i) => i).filter((i) => i > 0 && (sc.stages[i].from != null || sc.stages.some((x) => x.from != null)));
    let ids;
    if (alts.length) ids = [0, branch != null ? branch : alts[0]];
    else ids = sc.stages.map((s, i) => i);
    const out = [];
    let S = [plot.base()];
    const snap = (states, hide) => (anim) => plot.show(states, { hide, dur: dur(), instant: !anim });
    out.push({ g: '처음', t: o.start, run: snap(S, false), wait: 0.8 });
    let num = 0;
    ids.forEach((id) => {
      const st = sc.stages[id], prevS = S, next = apply(S[S.length - 1], st.ch, st.letter);
      const why = typeof st.why === 'function' ? st.why(S) : st.why;
      const ps = st.chain || pieces(why), at = st.at != null ? st.at : Math.max(0, ps.findIndex((t) => MOVE.test(t)));
      const withNew = S.concat([next]), letter = next.letter || LET[withNew.length - 1];
      num++;
      const isAlt = alts.length && id !== 0;
      const g = (st.step || (isAlt ? '2단계' : num + '단계')) + ' · ' + st.name;
      const altList = isAlt ? alts.map((a, k) => ({ t: 'ⓐⓑⓒ'[k] + ' ' + sc.stages[a].name, on: a === id, pick: () => rebuild(a) })) : null;
      ps.forEach((t, k) => out.push({ g: isAlt ? '2단계' : g, alts: altList, t, run: snap(k < at ? prevS : withNew, k === at), wait: k === at ? 1.25 : 1 }));
      out.push({ g: isAlt ? '2단계' : g, alts: altList, t: '새 균형 ' + letter + ' : ' + o.result(prevS[prevS.length - 1], next, letter), run: snap(withNew, false), wait: 1.4 });
      S = withNew;
    });
    return out;
  }
  // 글자 목록: items = [{ t, q, dir }] → 누르면 onPick(i, 줄), 고른 줄을 다시 누르면 onPick(-1) 로 풀림
  function list(host, items, onPick, scope) {
    const ul = $('ul', host);
    items.forEach((it, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = esc(it.t) + (it.dir ? '<span class="dir' + (it.dir === 'l' ? ' l' : '') + '">' + (it.dir === 'l' ? '←' : '→') + '</span>' : '') + (it.q ? '<span class="q">' + esc(it.q) + '</span>' : '');
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
  function bringFig(from) {
    if (!window.matchMedia('(max-width:900px)').matches) return;
    const pane = from.closest('.pane'), t = pane ? $('.stage, .keys', pane) : $('.fig', from.closest('.ch'));
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
      beats = beatsFor(plot, sc, branch, o, (b) => { const k = beats.findIndex((x) => x.g === '2단계'); load(b, k, true); });
      player.load(beats, { at: start || 0, play });
    }
    return {
      pick(s) { if (!s) { sc = null; player.clear(); plot.show([plot.base()], { dur: dur() }); return; } sc = s; load(null, 0, true); },
      resume() { if (sc) player.load(beats, { at, play: false, anim: false }); else { player.clear(); plot.show([plot.base()], { instant: true }); } },
      cur: () => sc
    };
  }

  /* ───────── Ch29 은행 T계정 ───────── */
  // 처음: 지준 $100, R 10% → 예금 $1,000 · 대출 $900 · 통화량 $1,000(현금 보유 없음). 사건마다 걸음별 값(R · 지준 · 대출 · 예금)을 차례로 보여 준다
  function ch29() {
    const B = { R: 0.1, res: 100, L: 900, D: 1000 };
    const player = Player($('#pl29'), '목록에서 사건을 고르면 T계정이 한 걸음씩 바뀝니다. ‹ › 로 넘겨 보세요.');
    $('#bank').innerHTML =
      '<div class="keys" id="k29"></div>' +
      '<div class="tacct"><h3>은행 전체 T계정</h3><div class="tt">' +
      '<div><span class="h">ASSETS 자산</span><div class="r" data-k="res">지준 <b id="tRes"></b><i id="dRes"></i></div><div class="r" data-k="L">대출 <b id="tLoan"></b><i id="dLoan"></i></div></div>' +
      '<div><span class="h">LIABILITIES 부채</span><div class="r" data-k="D">예금 <b id="tDep"></b><i id="dDep"></i></div></div></div>' +
      '<p class="tnote" id="tNote"></p></div>';
    const money = (v) => '$' + fmt(v);
    const keys = Keys($('#k29'), [
      { k: 'res', t: '지준', s: 'Reserves', f: money, d: (b, a) => (a >= b ? '+' : '−') + money(Math.abs(a - b)) },
      { k: 'R', t: '통화승수', s: '1/R', f: (v) => fmt(v), d: (b, a) => (a >= b ? '+' : '−') + fmt(Math.abs(a - b)) },
      { k: 'M', t: '통화량 = 예금', s: 'M', f: money, d: (b, a) => (a >= b ? '+' : '−') + money(Math.abs(a - b)) }
    ], ['×', '=']);
    const delta = (id, v) => { const e = $('#' + id); e.className = v < -0.5 ? 'dn' : ''; e.textContent = Math.abs(v) < 0.5 ? '' : (v > 0 ? '+' : '−') + money(Math.abs(v)); };
    function show(s, hi) {
      keys.set({ res: { b: B.res, a: s.res }, R: { b: 1 / B.R, a: 1 / s.R, note: 'R = ' + Math.round(s.R * 100) + '%' }, M: { b: B.D, a: s.D } });
      $('#tRes').textContent = money(s.res); $('#tLoan').textContent = money(s.L); $('#tDep').textContent = money(s.D);
      delta('dRes', s.res - B.res); delta('dLoan', s.L - B.L); delta('dDep', s.D - B.D);
      const req = s.R * s.D, gap = s.res - req;
      $('#tNote').innerHTML = 'R = <b>' + Math.round(s.R * 100) + '%</b> · 필요지준 = R × 예금 = ' + money(req) + (Math.abs(gap) < 0.5 ? ' = 지준' : gap > 0 ? ' → 초과지준 <b>' + money(gap) + '</b>' : ' → 지준 부족 <b>' + money(-gap) + '</b>');
      $$('#bank [data-k]').forEach((e) => e.classList.toggle('hi', (hi || []).indexOf(e.getAttribute('data-k')) >= 0));
    }
    // 걸음: [글자, 값, 강조할 칸]
    const R2 = { R: 0.2 }, R5 = { R: 0.05 };
    const EV = [
      { t: '지급준비율 인상 10% → 20%', q: 'SA 10', dir: 'l', steps: [
        ['지급준비율 R 10% → 20% : 승수 1/R = 10 → 5', R2, ['R']],
        ['필요지준 = 20% × 예금 $1,000 = $200 > 가진 지준 $100 → 지준 부족', R2, ['res']],
        ['은행이 대출을 줄임 → 대출 $900 → $400, 그만큼 예금도 $1,000 → $500', { R: 0.2, L: 400, D: 500 }, ['L', 'D']],
        ['통화량 M $1,000 → $500 ↓ (= 지준 $100 × 승수 5, 지준은 그대로)', { R: 0.2, L: 400, D: 500 }, ['M']]] },
      { t: '지급준비율 인하 10% → 5%', dir: 'r', steps: [
        ['지급준비율 R 10% → 5% : 승수 1/R = 10 → 20', R5, ['R']],
        ['필요지준 = 5% × 예금 $1,000 = $50 < 가진 지준 $100 → 초과지준 $50', R5, ['res']],
        ['초과지준을 대출 → 대출 $900 → $1,900, 다시 예금되어 예금 $1,000 → $2,000', { R: 0.05, L: 1900, D: 2000 }, ['L', 'D']],
        ['통화량 M $1,000 → $2,000 ↑ (= 지준 $100 × 승수 20)', { R: 0.05, L: 1900, D: 2000 }, ['M']]] },
      { t: 'Fed 채권 매입 $100 (공개시장 매입)', q: 'SA 11', dir: 'r', steps: [
        ['Fed 가 은행에서 채권 $100 을 사고 대금을 지준으로 줌 → 지준 $100 → $200', { res: 200 }, ['res']],
        ['필요지준은 10% × $1,000 = $100 → 초과지준 $100', { res: 200 }, ['res']],
        ['은행이 초과지준을 대출 → 대출금이 다시 예금되기를 반복 → 대출 $900 → $1,800, 예금 $1,000 → $2,000', { res: 200, L: 1800, D: 2000 }, ['L', 'D']],
        ['통화량 M +$1,000 ↑ = 새 지준 $100 × 승수 10', { res: 200, L: 1800, D: 2000 }, ['M']]] },
      { t: 'Fed 채권 매각 $50 (공개시장 매각)', dir: 'l', steps: [
        ['Fed 가 은행에 채권 $50 을 팔고 대금을 지준에서 받음 → 지준 $100 → $50', { res: 50 }, ['res']],
        ['필요지준은 10% × $1,000 = $100 > 가진 지준 $50 → 지준 부족', { res: 50 }, ['res']],
        ['은행이 대출을 줄임 → 대출 $900 → $450, 예금 $1,000 → $500', { res: 50, L: 450, D: 500 }, ['L', 'D']],
        ['통화량 M −$500 ↓ = 지준 −$50 × 승수 10', { res: 50, L: 450, D: 500 }, ['M']]] }
    ];
    function beats(ev) {
      const out = [{ g: '처음', t: '처음: 지준 $100 × 승수 10 = 예금 · 통화량 $1,000', run: () => show(B, []), wait: 0.8 }];
      ev.steps.forEach(([t, v, hi]) => { const s = Object.assign({}, B, v); out.push({ g: ev.t, t, run: () => show(s, hi), wait: 1.3 }); });
      return out;
    }
    list($('#o29'), EV, (i) => { if (i < 0) { player.clear(); show(B, []); } else player.load(beats(EV[i])); });
    show(B, []);
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
      start: 'A : 처음 균형 — M = 100, P = 100 (지수)',
      result: (a, b) => { const x = idx(a), y = idx(b); return '1/P ' + sign(x.v, y.v, 0.02) + ' → 물가 P ' + fmt(x.P) + ' → ' + fmt(y.P) + ' (화폐량 M ' + fmt(x.M) + ' → ' + fmt(y.M) + ')'; }
    });
    const keys = Keys($('#k30'), [
      { k: 'M', t: '화폐량', s: 'M (A = 100)', f: idx0, d: pct },
      { k: 'v', t: '화폐가치', s: '1/P (A = 100)', f: idx0, d: pct },
      { k: 'P', t: '물가', s: 'P (A = 100)', f: idx0, d: pct }
    ]);
    plot.on = (ctx) => {
      const S = ctx.S, n = idx({ off: ctx.off, vis: S[S.length - 1].vis }), a = idx(S[0]), lp = lastPt(ctx), z = lp ? idx(S[lp.i]) : a;
      keys.set({ M: { b: a.M, a: z.M }, v: { b: 100, a: 100 * z.v / a.v }, P: { b: a.P, a: z.P } });
      player.status(esc('M × V = P × Y : ' + fmt(n.M) + ' × ' + fmt(n.V, 2) + ' = ' + fmt(n.P) + ' × ' + fmt(n.Y / 100, 2)));
    };
    const keep = (why) => ({ name: 'Fed 가 MS 를 옮겨 물가 유지', ch: { abs: (o) => ({ MS: 5 * (1 + mdScale(o)) - 5 }) }, why });
    const EV = [
      { t: 'Fed 통화량 2배', dir: 'r', stages: [{ name: 'MS →', at: 0, ch: { add: { MS: 5 } }, why: 'Fed 가 통화량 M 을 2배로(MS →) → 화폐가 흔해져 화폐가치 1/P 절반 → 물가 P 2배 → V · Y 그대로라 통화 증가율 = 물가상승률' }] },
      { t: 'Fed 통화량 감소', dir: 'l', stages: [{ name: 'MS ←', at: 0, ch: { add: { MS: -1.5 } }, why: 'Fed 가 통화량을 줄임(MS ←) → 화폐가치 1/P ↑ → 물가 P ↓' }] },
      { t: '신용카드 보급 → 현금 덜 보유', q: 'SA 2', dir: 'l', stages: [
        { name: '화폐 수요 감소', ch: { add: { Vg: 0.5 } }, why: '카드로 결제 → 같은 물가에서 들고 있을 돈 ↓ → MD ← → 화폐가치 1/P ↓ → 물가 P ↑ (Fed 가 가만히 있으면, SA 2b)' },
        keep('Fed 가 통화량을 MD 감소만큼 줄임(MS ←) → 1/P 가 처음 높이로 → 물가 그대로 (SA 2c)')] },
      { t: '실질 GDP 증가 → 거래용 돈 더 필요', dir: 'r', stages: [
        { name: '화폐 수요 증가', ch: { add: { Yg: 0.3 } }, why: '생산 Y ↑ → 같은 물가에서 돈이 더 필요 → MD → → 화폐가치 1/P ↑ → 물가 P ↓' },
        keep('Fed 가 통화량을 늘림(MS →) → 1/P 가 처음 높이로 → 물가 그대로')] }
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
      ? 'Y > Y* : 일손 부족 → 임금과 기대물가 ↑ → SRAS ← → Y 는 Y* 로 돌아오고 P 는 더 ↑'
      : 'Y < Y* : 실업 ↑ → 임금과 기대물가 ↓ → SRAS → → Y 는 Y* 로 돌아오고 P ↓';
  }
  function gap(off, pt) {
    const L = 5 + (off.LRAS || 0);
    return Math.abs(pt.x - L) < 0.03 ? 'Y = Y* 장기균형' : pt.x > L ? 'Y > Y* 단기 경기 과열' : 'Y < Y* 단기 경기 침체';
  }
  function ch33() {
    const mk = (host) => Plot(host, { aria: '총수요 총공급 그래프', dom: [0, 10, 0, 10], xName: 'Y', yName: 'P', xTitle: '실질 GDP Y', yTitle: '물가 P', star: true, curves: adasCurves(), eqs: [['AD', 'SRAS']] });
    const ad = mk($('#plot33ad')), as = mk($('#plot33as')), player = Player($('#pl33'));
    const opt = (plot) => ({
      start: 'A : 처음 장기균형 (Y = Y*)',
      result: (a, b) => { const x = plot.pointsOf(a.off, a.vis)[0], y = plot.pointsOf(b.off, b.vis)[0]; if (!x || !y) return ''; let s = 'Y ' + sign(x.x, y.x, 0.03) + ' · P ' + sign(x.y, y.y, 0.03) + ' — ' + gap(b.off, y); if (y.x < x.x - 0.03 && y.y > x.y + 0.03 && Math.abs(x.x - 5 - (a.off.LRAS || 0)) < 0.03) s += ' (스태그플레이션)'; return s; }
    });
    const rad = runner(ad, player, opt(ad)), ras = runner(as, player, opt(as));
    let curName = 'ad';
    const stat = (plot) => (ctx) => {
      if ((curName === 'ad') !== (plot === ad) || ctx.hide) return;
      const z = ctx.P[ctx.S.length - 1][0];
      if (z) player.status('지금: <b>' + esc(gap(ctx.off, z)) + '</b>' + (Math.abs(z.x - 5 - (ctx.off.LRAS || 0)) < 0.03 ? '' : z.x > 5 + (ctx.off.LRAS || 0) ? ' — 실업률 &lt; 자연실업률' : ' — 실업률 &gt; 자연실업률'));
    };
    const keys = Keys($('#k33'), [
      { k: 'Y', t: '실질 GDP', s: 'Y (Y* = 100)', f: idx0, d: pct },
      { k: 'P', t: '물가', s: 'P (A = 100)', f: idx0, d: pct },
      { k: 'mv', t: '곡선 이동', s: '처음 A 대비' }
    ]);
    const card = (plot) => (ctx) => {
      if ((curName === 'ad') !== (plot === ad)) return;
      const a = plot.pointsOf(ctx.S[0].off, ctx.S[0].vis)[0], lp = lastPt(ctx);
      if (!a) return;
      const z = lp ? lp.pt : a, off = lp && lp.i < ctx.S.length - 1 ? ctx.S[lp.i].off : ctx.off;
      keys.set({ Y: { b: 100, a: 100 * z.x / 5, note: gap(off, z) }, P: { b: 100, a: 100 * z.y / 5 }, mv: { txt: movedText(plot, ctx.S, ['AD', 'SRAS', 'LRAS']), base: '없음' } });
      stat(plot)(ctx);
    };
    ad.on = card(ad); as.on = card(as);
    const R = 1.4;
    const adEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'AD ' + (dir === 'r' ? '→' : '←'), step: '1단계 단기', ch: { add: { AD: dir === 'r' ? R : -R } }, why },
      { name: 'SRAS 조정 → Y*', step: '2단계 장기', ch: { abs: lrSRAS }, why: longRun }] });
    const AD = {
      C: [adEv('주가 급등 → 부 ↑', 'r', '주가 ↑ → 부 ↑ → 소비 C ↑ → AD →'), adEv('주가 폭락', 'l', '주가 ↓ → 부 ↓ → 소비 C ↓ → AD ←', 'SA 4a'), adEv('소득세 인하', 'r', '소득세 ↓ → 가처분소득 ↑ → C ↑ → AD →')],
      I: [adEv('통화량 증가 (M ↑ → r ↓)', 'r', '통화량 M ↑ → 이자율 r ↓ → 투자 I ↑ (원화 ↓ → NX ↑ 도) → AD →'), adEv('기업 낙관 · 투자 붐', 'r', '미래 사업 전망 ↑ → 새 설비 투자 I ↑ → AD →', 'SA 5'), adEv('투자세액공제', 'r', '투자하면 세금 감면 → I ↑ → AD →')],
      G: [adEv('정부 구매 증가', 'r', '정부 구매 G ↑ → AD →', 'SA 4b')],
      NX: [adEv('해외 경기 침체', 'l', '외국 소득 ↓ → 우리 수출 ↓ → NX ↓ → AD ←', 'SA 4d'), adEv('해외 정치 불안 → 원화 절상', 'l', '한국 자산 수요 ↑ → 원화 가치 ↑ → 수출 ↓ · 수입 ↑ → NX ↓ → AD ← (P 때문이 아닌 환율 변화라 이동)', 'MC 7')]
    };
    const srEv = (t, why, q) => ({ t, q, dir: 'l', stages: [
      { name: 'SRAS ←', step: '1단계 단기', ch: { add: { SRAS: -R } }, why },
      { name: '그대로 두면 SRAS 복귀', ch: { abs: { SRAS: 0 } }, letter: 'A', at: 2, why: 'Y < Y* : 실업 ↑ → 임금 · 기대물가 ↓ → SRAS 가 처음 자리로 → A 로 돌아옴 (시간이 오래 걸림)' },
      { name: '정책으로 수용 AD →', from: 0, ch: { abs: lrAD }, chain: ['Fed · 정부가 통화량 ↑ · 정부 구매 ↑', 'AD →', 'Y 는 바로 Y* 로, 대신 P 는 더 ↑ (공급충격 수용)'], at: 1 }] });
    const lrEv = (t, dir, why, q) => ({ t, q, dir, stages: [
      { name: 'LRAS · SRAS ' + (dir === 'r' ? '→' : '←'), step: '1단계', ch: { add: { LRAS: dir === 'r' ? 1 : -1, SRAS: dir === 'r' ? 1 : -1 } }, why },
      { name: 'SRAS 조정 → 새 Y*', step: '2단계 장기', ch: { abs: lrSRAS }, chain: dir === 'r' ? ['P 가 Pe 보다 낮아짐 → 기대물가 ↓', 'SRAS 가 더 →', '새 Y* 에서 장기균형, P ↓'] : ['P 가 Pe 보다 높아짐 → 기대물가 ↑', 'SRAS 가 더 ←', '새 Y* 에서 장기균형, P ↑'], at: 1 }] });
    const AS = {
      SR: [srEv('기대물가 상승', '기대물가 Pe ↑ → 명목임금 계약 · 가격을 미리 ↑ → 같은 P 에서 생산 ↓ → SRAS ← (LRAS 그대로)', 'MC 11'), srEv('유가 급등 (원자재 비용 ↑)', '유가 ↑ → 생산 비용 ↑ → SRAS ←'), srEv('명목임금 상승', '명목임금 ↑ → 비용 ↑ → SRAS ←')],
      LR: [lrEv('기술 진보', 'r', '같은 노동 · 자본으로 더 생산 → Y* ↑ → LRAS · SRAS →', 'SA 4c'), lrEv('자본 · 인적자본 증가', 'r', '자본 K · 인적자본 H ↑ → Y* ↑ → LRAS · SRAS →', 'SA 5c'), lrEv('이민 → 노동 증가', 'r', '노동 L ↑ → Y* ↑ → LRAS · SRAS →', 'SA 1'), lrEv('자연재해 · 자원 감소', 'l', '자원 N · 자본 ↓ → Y* ↓ → LRAS · SRAS ←', 'SA 1')]
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
        if (ctx.hide) return;
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
    const player = Player($('#pl28'));
    const r = runner(plot, player, {
      start: '처음: 균형 W_E 에서 L_E 만큼 고용, 실업 없음',
      result: (a, b) => (b.vis.W ? (b.off.W || 0) + 7 > eqW(b.off) + 0.05 ? '임금이 W_E 보다 높게 묶임 → L_S − L_D 만큼 실업' : '임금 바닥이 균형보다 낮아 효과 없음' : '임금이 내려가 새 균형 — 고용 ↓ · 임금 ↓, 실업 없음')
    });
    function eqW(off) { const m = meet(plot.byId.S, off.S || 0, plot.byId.D, off.D || 0, plot.dom); return m ? m.y : 5; }
    const keys = Keys($('#k28'), [
      { k: 'W', t: '임금', s: 'W (W_E = 100)', f: idx0, d: pct },
      { k: 'L', t: '고용', s: 'L (L_E = 100)', f: idx0, d: pct },
      { k: 'U', t: '실업', s: 'L_S − L_D', f: idx0, d: (b, a) => (a >= b ? '+' : '−') + fmt(Math.abs(a - b)) }
    ]);
    plot.on = (ctx) => {
      player.status(info ? arrows(info) : '');
      const cur = ctx.S[ctx.S.length - 1], off = ctx.off, Wc = plot.byId.W, Sc = plot.byId.S, Dc = plot.byId.D;
      const lp = lastPt(ctx), e = lp ? lp.pt : { x: 5, y: 5 };
      let w = e.y, L = e.x, U = 0;
      if (cur.vis.W && !ctx.hide) {
        const wl = Wc.y + (off.W || 0);
        if (wl > e.y + 0.05) {
          const ld = meet(Wc, off.W || 0, Dc, off.D || 0, plot.dom), ls = meet(Wc, off.W || 0, Sc, off.S || 0, plot.dom);
          if (ld && ls) { w = wl; L = ld.x; U = (ls.x - ld.x) * 10; }
        }
      }
      keys.set({ W: { b: 100, a: 100 * w / 5 }, L: { b: 100, a: 100 * L / 5 }, U: { b: 0, a: U } });
    };
    const w = (t, q, dir, W, why) => ({ t, q, dir, stages: [{ name: t, at: 0, ch: { vis: { W: true }, abs: { W } }, why }] });
    const EV = [
      w('최저임금 (균형보다 높게)', 'MC 14', 'r', 0, '법으로 최저임금 W > W_E → 일하려는 사람 ↑ · 기업이 원하는 사람 ↓ → 실업 (특히 10대 · 미숙련)'),
      w('노동조합', 'MC 10', 'r', 0.5, '단체교섭으로 조합원 임금 W > W_E → 그 부문 고용 ↓ → 밀려난 사람은 실업 · 노조 없는 부문으로'),
      w('효율임금', 'MC 14', 'r', -0.4, '기업이 스스로 W > W_E 를 줌 → 건강 · 이직 ↓ · 좋은 지원자 · 노력 ↑ → 그래도 W > W_E 라 실업'),
      w('최저임금이 균형보다 낮다면', 'MC 10 +', 'l', -3.4, '최저임금 W < W_E → 구속력 없음 → 시장 임금 W_E 그대로, 남는 노동 없음'),
      { t: '노동 수요 감소 (수입 ↑ → 국내 산업 쇠퇴)', q: 'SA 4', dir: 'l', stages: [
        { name: '수요 D ←, 임금 그대로', step: '1단계 단기', at: 2, ch: { add: { D: -1.4 }, vis: { W: true }, abs: { W: -2 } }, why: '수입 ↑ → 국내 산업 쇠퇴 → 노동 수요 D ← → 임금은 처음 W_E 에 묶임 → 일하려는 사람 > 원하는 사람 → 실업' },
        { name: '임금 ↓ → 새 균형', step: '2단계 장기', at: 0, ch: { vis: { W: false } }, why: '시간이 지나 임금이 내려감 → 새 균형에서 고용 ↓ · 임금 ↓ → 실업은 사라짐(다른 산업으로 옮겨 가며 임금이 같아짐)' }] }
    ];
    list($('#o28'), EV, (i) => r.pick(i < 0 ? null : EV[i]));

    // 실업 지표: 분수로 보여 주고, 걸음마다 바뀐 사람 수 → 실업률 분자 → 분모 → 결과 → 참가율 분자 → 분모 → 결과 순으로 강조
    const B = { E: 140.196, U: 14.729, N: 80.729 };
    const SIT = [
      { t: '실직 후 구직 중 (취업자 → 실업자)', m: { E: -1, U: 1 } },
      { t: '실직 후 구직 포기 (취업자 → 비경제활동)', q: 'MC 1', m: { E: -1, N: 1 } },
      { t: '구직 시늉만 하던 사람을 비경제활동으로 (실업자 → 비경제활동)', q: 'MC 5', m: { U: -1, N: 1 } },
      { t: '실업자가 취업 (실업자 → 취업자)', m: { U: -1, E: 1 } },
      { t: '처음으로 구직 시작 (비경제활동 → 실업자)', m: { N: -1, U: 1 } }
    ];
    const pl2 = Player($('#pl28s'), '목록에서 상황을 고르면 분자 · 분모가 한 걸음씩 바뀝니다. ‹ › 로 넘겨 보세요.'), one = (v) => fmt(v, 1);
    // lv: 0 처음 · 1 사람 수 바뀜 · 2 실업률 분자 · 3 분모 · 4 실업률 · 5 참가율 분자 · 6 분모 · 7 참가율
    const rk = Keys($('#k28s'), [
      { k: 'UR', t: '실업률', s: 'U ÷ (E + U)', f: (v) => fmt(v, 1) + '%', d: pp },
      { k: 'LF', t: '경제활동참가율', s: '(E + U) ÷ 인구', f: (v) => fmt(v, 1) + '%', d: pp }
    ]);
    function rates(m, lv) {
      const v = { E: B.E + (m.E || 0), U: B.U + (m.U || 0), N: B.N + (m.N || 0) }, u = lv >= 1 ? v : B;
      const ur = (x) => x.U / (x.E + x.U) * 100, lf = (x) => (x.E + x.U) / (x.E + x.U + x.N) * 100;
      rk.set({ UR: { b: ur(B), a: lv >= 4 ? ur(v) : ur(B) }, LF: { b: lf(B), a: lv >= 7 ? lf(v) : lf(B) } });
      const t = (k) => { const dd = lv >= 1 ? m[k] || 0 : 0; return '<span class="t' + (dd > 0 ? ' up' : dd < 0 ? ' dn' : '') + '">' + one(u[k]) + (dd > 0 ? '↑' : dd < 0 ? '↓' : '') + '</span>'; };
      const UR = (x) => x.U / (x.E + x.U) * 100, LF = (x) => (x.E + x.U) / (x.E + x.U + x.N) * 100;
      const res = (f, show) => { const a = f(B), b = f(v); return fmt(show ? b : a, 1) + '%' + (show && Math.abs(b - a) > 0.005 ? (b > a ? '<span class="t up">↑</span>' : '<span class="t dn">↓</span>') : ''); };
      const hi = (n) => (lv === n ? ' hi' : '');
      $('#rates').innerHTML =
        '<div class="rate"><span class="nm">실업률</span><span class="frac sym"><span>U</span><span>E + U</span></span><span>=</span><span class="frac"><span class="' + hi(2) + '">' + t('U') + '</span><span class="' + hi(3) + '">' + t('E') + ' + ' + t('U') + '</span></span><span class="res' + hi(4) + '">= ' + res(UR, lv >= 4) + '</span></div>' +
        '<div class="rate"><span class="nm">경제활동참가율</span><span class="frac sym"><span>E + U</span><span>E + U + NILF</span></span><span>=</span><span class="frac"><span class="' + hi(5) + '">' + t('E') + ' + ' + t('U') + '</span><span class="' + hi(6) + '">' + t('E') + ' + ' + t('U') + ' + ' + t('N') + '</span></span><span class="res' + hi(7) + '">= ' + res(LF, lv >= 7) + '</span></div>' +
        '<div class="pop' + hi(1) + '">E 취업자 · U 실업자 · NILF 비경제활동, 단위 백만 명 · 성인 인구 = <b>' + one(u.E + u.U + u.N) + '</b> · 경제활동인구 = <b>' + one(u.E + u.U) + '</b></div>';
    }
    const word = (dv) => (Math.abs(dv) < 1e-9 ? '그대로' : dv > 0 ? '↑' : '↓');
    const nm = { E: '취업자 E', U: '실업자 U', N: '비경제활동 NILF' };
    function beats(s) {
      const m = s.m, dU = m.U || 0, dLF = (m.E || 0) + (m.U || 0), dPop = dLF + (m.N || 0);
      const v = { E: B.E + (m.E || 0), U: B.U + (m.U || 0), N: B.N + (m.N || 0) };
      const UR0 = B.U / (B.E + B.U) * 100, UR1 = v.U / (v.E + v.U) * 100, LF0 = (B.E + B.U) / (B.E + B.U + B.N) * 100, LF1 = (v.E + v.U) / (v.E + v.U + v.N) * 100;
      const moved = Object.keys(m).map((k) => nm[k] + ' ' + (m[k] > 0 ? '+1.0' : '−1.0')).join(' · ');
      const steps = [
        ['처음: 2009년 6월 (SA 1) — 실업률 9.5% · 참가율 65.7%', 0],
        [moved, 1],
        ['실업률 분자 U : ' + word(dU), 2], ['실업률 분모 E + U : ' + word(dLF), 3],
        ['→ 실업률 ' + fmt(UR0, 1) + '% → ' + fmt(UR1, 1) + '% ' + word(UR1 - UR0 > 0.005 || UR1 - UR0 < -0.005 ? UR1 - UR0 : 0), 4],
        ['참가율 분자 E + U : ' + word(dLF), 5], ['참가율 분모 E + U + NILF : ' + word(dPop), 6],
        ['→ 참가율 ' + fmt(LF0, 1) + '% → ' + fmt(LF1, 1) + '% ' + word(Math.abs(LF1 - LF0) > 0.005 ? LF1 - LF0 : 0), 7]
      ];
      return steps.map(([t, lv]) => ({ g: lv ? s.t : '처음', t, run: () => rates(m, lv), wait: lv === 4 || lv === 7 ? 1.3 : 1 }));
    }
    list($('#o28s'), SIT, (i) => { if (i < 0) { pl2.clear(); rates({}, 0); } else pl2.load(beats(SIT[i])); });
    rates({}, 0);
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
