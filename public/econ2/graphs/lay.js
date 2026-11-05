(function () {
  'use strict';
  const KO = document.documentElement.lang === 'ko';
  const T = KO ? { g: '그래프', s: '단계 해설', lab: '보기' } : { g: 'Graph', s: 'Steps', lab: 'View' };
  const mqT = window.matchMedia('(max-width:900px)'), mqM = window.matchMedia('(max-width:639px)');
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const home = new Map();
  const park = (n) => { if (!home.has(n)) { const c = document.createComment('lay'); n.before(c); home.set(n, c); } };
  const back = () => home.forEach((c, n) => { if (n.previousSibling !== c) c.after(n); });

  const units = $$('.ch').reduce((a, ch) => { const ps = $$(':scope > .panel', ch); return a.concat(ps.length ? ps : [ch]); }, []).map((u) => {
    const fig = u.querySelector('.fig'), side = u.querySelector('.side'), player = u.querySelector('.player');
    const sit = fig.querySelector('.sitline'), rs = sit && sit.nextElementSibling && sit.nextElementSibling.classList.contains('rsent') ? sit.nextElementSibling : null;
    const eqs = $$('.eq', side);
    eqs.forEach((e) => { const p = e.parentNode; if (p !== side && p.id) e.setAttribute('data-of', p.id); });
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
    if (v === 's') x.fig.style.setProperty('--gh', Math.round(Math.max(240, (x.fig.querySelector(':scope > :not(.gsw):not(.player):not([hidden])') || x.fig).getBoundingClientRect().height)) + 'px');
  }

  const more = (e) => e.classList.toggle('more', e.scrollHeight - e.scrollTop - e.clientHeight > 4);

  function apply() {
    const mode = mqM.matches ? 'm' : mqT.matches ? 't' : 'd';
    back();
    units.forEach((x) => {
      x.ch.classList.toggle('lt', mode === 't'); x.ch.classList.toggle('lm', mode === 'm');
      x.fig.classList.toggle('gbox', mode === 'm');
      if (mode === 'd') { x.lbox.remove(); x.cbox.remove(); x.sw.remove(); x.fig.removeAttribute('data-v'); return; }

      x.u.appendChild(x.lbox); x.u.appendChild(x.cbox);
      [x.sit, x.rs].forEach((n) => { if (n) { park(n); x.lbox.appendChild(n); } });
      x.eqs.forEach((n) => { park(n); x.cbox.appendChild(n); });
      if (!x.player || x.player.id === 'pl28s') return;
      park(x.player);
      if (mode === 't') { x.sw.remove(); x.fig.removeAttribute('data-v'); }
      else { x.fig.insertBefore(x.sw, x.fig.firstChild); x.fig.appendChild(x.player); if (!x.fig.hasAttribute('data-v')) view(x, 'g'); }
    });

    units.forEach((x) => { const c = x.u.querySelector('.rwcard'); if (c && mode !== 'd' && c.parentNode !== x.u) x.u.appendChild(c); });
    requestAnimationFrame(() => units.forEach((x) => more(x.lbox)));
  }
  apply();
  [mqT, mqM].forEach((m) => m.addEventListener && m.addEventListener('change', apply));
  document.addEventListener('click', () => setTimeout(() => units.forEach((x) => more(x.lbox)), 60));
  if (window.ResizeObserver) units.forEach((x) => new ResizeObserver(() => more(x.lbox)).observe(x.lbox));
})();
