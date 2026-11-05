/* Econ2 Interactive — 태블릿 세로 · 휴대폰 배치(lay.css 와 함께). 데스크톱(901px 이상)은 index.html 그대로.
   app.js 를 고치지 않고, 900px 이하에서만 칸을 옮겨 담는다. 옮긴 자리마다 주석 표시를 남겨 두었다가 크기가 바뀌면 되돌린 뒤 다시 옮긴다.
   · 태블릿 세로(640~900px, .lt): [탭] / 그래프 / 해설(전체 폭) / [사건 목록 | 세로 시간선] (두 칸은 같은 높이, 각자 스크롤) / 파란 개념 상자 / 현실 문제
   · 휴대폰(639px 이하, .lm): 같은 순서, 그래프와 시간선(단계 목록)은 한 상자에 두고 [그래프 | 단계] 단추로 바꿔 본다. 해설(상황 · 결과 문장)은 늘 보인다
   app.js 가 찾는 관계는 그대로 둔다: 상황 줄(.sitline) 바로 다음에 결과 문장(.rsent), 둘 다 같은 장(.ch) · 패널(.panel) 안 */
(function () {
  'use strict';
  const KO = document.documentElement.lang === 'ko';
  const T = KO ? { g: '그래프', s: '단계 해설', lab: '보기' } : { g: 'Graph', s: 'Steps', lab: 'View' };
  const mqT = window.matchMedia('(max-width:900px)'), mqM = window.matchMedia('(max-width:639px)');
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const home = new Map();   // 옮긴 요소 → 원래 자리 표시(주석)
  const park = (n) => { if (!home.has(n)) { const c = document.createComment('lay'); n.before(c); home.set(n, c); } };
  const back = () => home.forEach((c, n) => { if (n.previousSibling !== c) c.after(n); });

  // 한 덩어리 = 패널(Ch28 탭마다) 또는 장
  const units = $$('.ch').reduce((a, ch) => { const ps = $$(':scope > .panel', ch); return a.concat(ps.length ? ps : [ch]); }, []).map((u) => {
    const fig = u.querySelector('.fig'), side = u.querySelector('.side'), player = u.querySelector('.player');
    const sit = fig.querySelector('.sitline'), rs = sit && sit.nextElementSibling && sit.nextElementSibling.classList.contains('rsent') ? sit.nextElementSibling : null;
    const eqs = $$('.eq', side);
    eqs.forEach((e) => { const p = e.parentNode; if (p !== side && p.id) e.setAttribute('data-of', p.id); });   // Ch33: AD · AS 중 보이는 쪽 것만(lay.css :has)
    const lbox = document.createElement('div'); lbox.className = 'lbox';
    const cbox = document.createElement('div'); cbox.className = 'cbox';
    const sw = document.createElement('div'); sw.className = 'gsw'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', T.lab);
    sw.innerHTML = '<button type="button" data-v="g" aria-pressed="true">' + T.g + '</button><button type="button" data-v="s" aria-pressed="false">' + T.s + '</button>';
    sw.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) view(x, b.getAttribute('data-v')); });
    lbox.addEventListener('scroll', () => more(lbox), { passive: true });
    const x = { u, ch: u.closest('.ch'), fig, side, player, sit, rs, eqs, lbox, cbox, sw };
    return x;
  });
  function view(x, v) {
    x.fig.setAttribute('data-v', v);
    $$('button', x.sw).forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)));
    if (v === 's') x.fig.style.setProperty('--gh', Math.round(Math.max(240, (x.fig.querySelector(':scope > :not(.gsw):not(.player):not([hidden])') || x.fig).getBoundingClientRect().height)) + 'px');   // 단계 보기도 그래프 높이만큼은 차지해 상자 크기가 덜 튄다
  }
  // 스크롤바를 숨긴 칸: 아래에 더 있으면 아래쪽을 흐리게(app.js markMore 와 같은 표시)
  const more = (e) => e.classList.toggle('more', e.scrollHeight - e.scrollTop - e.clientHeight > 4);

  function apply() {
    const mode = mqM.matches ? 'm' : mqT.matches ? 't' : 'd';
    back();
    units.forEach((x) => {
      x.ch.classList.toggle('lt', mode === 't'); x.ch.classList.toggle('lm', mode === 'm');
      x.fig.classList.toggle('gbox', mode === 'm');
      if (mode === 'd') { x.lbox.remove(); x.cbox.remove(); x.sw.remove(); x.fig.removeAttribute('data-v'); return; }
      // 해설(상황 · 결과 문장) → 왼쪽 칸, 개념 상자 → 사건 아래 전체 폭
      x.u.appendChild(x.lbox); x.u.appendChild(x.cbox);
      [x.sit, x.rs].forEach((n) => { if (n) { park(n); x.lbox.appendChild(n); } });
      x.eqs.forEach((n) => { park(n); x.cbox.appendChild(n); });
      if (!x.player) return;
      park(x.player);
      if (mode === 't') { x.sw.remove(); x.fig.removeAttribute('data-v'); }   // 태블릿: 시간선은 제자리(grid-area play, 사건 오른쪽)
      else { x.fig.insertBefore(x.sw, x.fig.firstChild); x.fig.appendChild(x.player); if (!x.fig.hasAttribute('data-v')) view(x, 'g'); }
    });
    // 현실 문제 카드(real.js)는 900px 이하에서 장(패널)의 바로 아래 칸 — 옮긴 시간선 안에 들어가 있지 않게
    units.forEach((x) => { const c = x.u.querySelector('.rwcard'); if (c && mode !== 'd' && c.parentNode !== x.u) x.u.appendChild(c); });
    requestAnimationFrame(() => units.forEach((x) => more(x.lbox)));
  }
  apply();
  [mqT, mqM].forEach((m) => m.addEventListener && m.addEventListener('change', apply));
  document.addEventListener('click', () => setTimeout(() => units.forEach((x) => more(x.lbox)), 60));
  if (window.ResizeObserver) units.forEach((x) => new ResizeObserver(() => more(x.lbox)).observe(x.lbox));
})();
