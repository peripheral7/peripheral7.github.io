/* Econ2 덱 — Ch29 통화 창출(신용팽창) 장(<section class="mc">). 지급준비율 R 단추를 누르면 T계정 · 막대 · 합계를 다시 계산한다.
   처음 예금 D0 = $100(Short Answer 5 의 매트리스 현금), 은행은 초과지준 없이 R 만큼만 지준으로 두고 나머지를 모두 대출, 대출금은 전부 다음 은행에 다시 예금된다.
   n번째 은행 예금 = D0 (1 − R)^(n−1), 합계 = D0 / R. 막대가 나타나는 것은 덱의 단계(.step)와 CSS 가 맡는다. */
(function () {
  'use strict';
  const sec = document.querySelector('section.mc');
  if (!sec) return;
  const NS = 'http://www.w3.org/2000/svg', D0 = 100, BARS = 16;
  const money = (v) => '$' + (Math.round(v * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const put = (k, v) => sec.querySelectorAll('[data-v="' + k + '"]').forEach((e) => { e.textContent = v; });

  function render(R) {
    const m = 1 / R, total = D0 * m;
    for (let i = 1; i <= 3; i++) {
      const d = D0 * Math.pow(1 - R, i - 1);
      put('d' + i, money(d)); put('r' + i, money(d * R)); put('l' + i, money(d * (1 - R)));
    }
    put('R', Math.round(R * 100) + '%'); put('m', String(Math.round(m * 100) / 100));
    put('total', money(total)); put('new', money(total - D0));
    put('d2s', money(D0 * (1 - R))); put('d3s', money(D0 * Math.pow(1 - R, 2)));

    // 위: 은행별 예금 막대(왼쪽부터 1번 은행), 아래: 그 예금들이 쌓여 합계 D0/R 를 채우는 띠
    const svg = sec.querySelector('.mc-chart');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const W = 660, top = 10, base = 200, bw = W / BARS;
    const el = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
    for (let i = 0; i < BARS; i++) {
      const d = D0 * Math.pow(1 - R, i), h = (base - top) * d / D0;
      const r = el('rect', { x: i * bw + 2, y: base - h, width: bw - 4, height: Math.max(h, 0.5), class: 'mc-bar' + (i < 3 ? ' first' : '') });
      r.style.transitionDelay = (i * 45) + 'ms';
      if (!i) { const t = el('text', { x: bw / 2, y: base - h - 8, 'text-anchor': 'middle', class: 'mc-bl' }); t.textContent = money(d); }
    }
    el('line', { x1: 0, x2: W, y1: base, y2: base, class: 'mc-axis' });
    const tr = el('text', { x: W, y: top + 16, 'text-anchor': 'end', class: 'mc-tot' }); tr.textContent = '은행마다 × (1 − R) = × ' + Math.round((1 - R) * 100) / 100;
    const tl = el('text', { x: W, y: base + 24, 'text-anchor': 'end', class: 'mc-ax' }); tl.textContent = '은행 1, 2, 3, … 의 새 예금';

    // 합계 띠: 예금을 차례로 이어 붙인다(전체 길이 = D0/R). 5% 일 때도 앞쪽 몇 칸이 보이게 띠 하나 = 합계
    const y0 = 250, bh = 34;
    let x = 0, i = 0;
    while (x < W - 0.5 && i < 400) {
      const d = D0 * Math.pow(1 - R, i), w = W * d / total;
      const r = el('rect', { x, y: y0, width: Math.max(w - (w > 3 ? 1.5 : 0), 0.4), height: bh, class: 'mc-seg ' + (i % 2 ? 'b' : 'a') });
      r.style.transitionDelay = (300 + Math.min(i, 30) * 40) + 'ms';
      x += w; i++;
    }
    el('rect', { x: 0, y: y0, width: W, height: bh, class: 'mc-frame' });
    const t1 = el('text', { x: 0, y: y0 + bh + 26, class: 'mc-ax' }); t1.textContent = '처음 예금 ' + money(D0);
    const t2 = el('text', { x: W, y: y0 + bh + 26, 'text-anchor': 'end', class: 'mc-tot' }); t2.textContent = '예금 합계 ' + money(total) + ' = ' + money(D0) + ' × ' + Math.round(m * 100) / 100;
  }

  let R = 0.1;
  sec.querySelectorAll('.mc-r button').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      R = parseFloat(b.getAttribute('data-r'));
      sec.querySelectorAll('.mc-r button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render(R);
      b.blur();
    });
  });
  ['touchstart', 'touchend'].forEach((t) => sec.querySelector('.mc-r').addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
  render(R);
})();
