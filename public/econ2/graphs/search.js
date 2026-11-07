(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const KO = document.documentElement.lang === 'ko';
  const UI = KO
    ? { btn: '검색', ph: '시나리오 검색 (예: 유가, 지급준비율, 부)', none: '맞는 시나리오가 없다', prev: '이전 시나리오', next: '다음 시나리오', close: '검색 닫기', rw: '현실 사례' }
    : { btn: 'Search', ph: 'Search scenarios (e.g. oil, reserve ratio, wealth)', none: 'No matching scenario', prev: 'Previous scenario', next: 'Next scenario', close: 'Close search', rw: 'real-world case' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const norm = (s) => String(s || '').normalize('NFKC').replace(/\*\*|==|[\^_¶]/g, '').replace(/ — /g, ' ').replace(/▲/g, '↑').replace(/▼/g, '↓').replace(/\s+/g, ' ').toLowerCase();
  const clean = (s) => String(s || '').replace(/\*\*|==|¶/g, '').replace(/\^([a-z])/g, '$1').replace(/_([A-Z0-9])/g, '$1').replace(/ — /g, ' ').replace(/\s+/g, ' ').trim();

  const top = $('.top'), links = $('.top .links');
  if (!top || !links) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sxbtn'; btn.setAttribute('aria-label', UI.btn); btn.title = UI.btn + ' (Ctrl+F)';
  btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.6 12.6L17 17"/></svg>';
  const tg = links.previousElementSibling && !links.previousElementSibling.matches('nav') ? links.previousElementSibling : links;
  tg.parentNode.insertBefore(btn, tg);
  const bar = document.createElement('div');
  bar.className = 'sxbar'; bar.hidden = true;
  bar.innerHTML =
    '<div class="sxin"><svg class="sxic" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.6 12.6L17 17"/></svg>' +
    '<input type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(UI.ph) + '" aria-label="' + esc(UI.btn) + '" role="combobox" aria-expanded="false" aria-controls="sxres">' +
    '<span class="sxcnt" aria-live="polite"></span>' +
    '<button type="button" class="sxnav" data-d="-1" aria-label="' + esc(UI.prev) + '" title="' + esc(UI.prev) + ' (Shift+Enter)">‹</button>' +
    '<button type="button" class="sxnav" data-d="1" aria-label="' + esc(UI.next) + '" title="' + esc(UI.next) + ' (Enter)">›</button>' +
    '<button type="button" class="sxx" aria-label="' + esc(UI.close) + '" title="' + esc(UI.close) + ' (Esc)">×</button></div>' +
    '<ul class="sxres" id="sxres" role="listbox" hidden></ul>';
  document.body.appendChild(bar);

  function place() {
    const r = btn.getBoundingClientRect(), w = Math.min(520, window.innerWidth - 20);
    bar.style.top = Math.round(r.bottom + 8) + 'px';
    bar.style.left = Math.round(Math.max(10, Math.min(r.right - w, window.innerWidth - 10 - w))) + 'px';
    bar.style.width = w + 'px';
  }
  window.addEventListener('resize', () => { if (!bar.hidden) place(); });
  const inp = $('input', bar), cnt = $('.sxcnt', bar), ul = $('.sxres', bar);

  let items = null;
  function build() {
    items = $$('.ch .opts li button').map((b) => {
      const sec = b.closest('.ch'), ch = 'ch' + sec.id.slice(1);
      const tab = $('.tabs button[data-ch="' + ch + '"]'), sub = $$('.sub button', sec).find((t) => b.closest('[id$="' + t.getAttribute('data-sub') + '"]'));
      const h3 = b.closest('.opts') && $('h3', b.closest('.opts')), x = b.cloneNode(true);
      $$('.dir, .q', x).forEach((e) => e.remove());
      const hx = h3 && h3.cloneNode(true); if (hx) $$('small, .keylg', hx).forEach((e) => e.remove());
      const title = x.textContent.trim(), g0 = hx ? hx.textContent.trim() : '', grp = /^(Events|사건)$/.test(g0) ? '' : g0;
      const where = [tab ? tab.textContent.trim() : ch, sub ? sub.textContent.trim() : '', grp].filter(Boolean).join(' · ');
      const body = clean(b.getAttribute('data-s') || ''), rw = clean(b.getAttribute('data-rw') || '');
      return { b, ch, sub: sub ? sub.getAttribute('data-sub') : null, title, where, body, rw, nT: norm(title), nW: norm(where), nB: norm(body), nR: norm(rw) };
    });
  }
  let res = [], at = -1, hi = 0;
  function search(q) {
    if (!items) build();
    const terms = norm(q).split(' ').filter(Boolean);
    if (!terms.length) { res = []; return; }
    const hit = items.filter((it) => terms.every((t) => (it.nT + ' ' + it.nW + ' ' + it.nB + ' ' + it.nR).indexOf(t) >= 0));

    const head = (s, t) => (' ' + s).indexOf(' ' + t) >= 0 || new RegExp('[^a-z0-9]' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(' ' + s);
    const rank = (it) => { const n = it.nT + ' ' + it.nW; return terms.every((t) => head(n, t)) ? 0 : terms.every((t) => n.indexOf(t) >= 0) ? 1 : 2; };
    res = [0, 1, 2].reduce((out, r) => out.concat(hit.filter((it) => rank(it) === r)), []);
  }

  const low1 = (x) => String(x).toLowerCase().replace(/▲/g, '↑').replace(/▼/g, '↓');
  function marked(s, terms, around) {
    let txt = s, low = low1(s);
    if (around) {
      const i = Math.min.apply(null, terms.map((t) => low.indexOf(t)).filter((i) => i >= 0).concat([1e9]));
      if (i === 1e9) return '';
      const a = Math.max(0, i - around), z = Math.min(txt.length, i + around * 2);
      txt = (a ? '… ' : '') + txt.slice(a, z) + (z < s.length ? ' …' : ''); low = low1(txt);
    }
    const on = new Array(txt.length).fill(false);
    terms.forEach((t) => { let k = low.indexOf(t); while (k >= 0) { for (let j = k; j < k + t.length && j < on.length; j++) on[j] = true; k = low.indexOf(t, k + 1); } });
    let out = '', o = false;
    for (let i = 0; i < txt.length; i++) { if (on[i] !== o) { out += on[i] ? '<mark>' : '</mark>'; o = on[i]; } out += esc(txt[i]); }
    return out + (o ? '</mark>' : '');
  }
  function drawList() {
    const terms = norm(inp.value).split(' ').filter(Boolean);
    if (!terms.length) { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
    ul.innerHTML = res.length ? res.map((it, k) => {
      const tIn = terms.every((t) => (it.nT + ' ' + it.nW).indexOf(t) >= 0);
      const snip = tIn ? '' : marked(it.body, terms, 40) || (it.rw ? '<span class="sxrw">' + esc(UI.rw) + '</span> ' + marked(it.rw, terms, 40) : '');
      return '<li role="option" id="sxo' + k + '" data-k="' + k + '"' + (k === hi ? ' class="on" aria-selected="true"' : '') + '>' +
        '<span class="sxw">' + marked(it.where, terms) + '</span><span class="sxt">' + marked(it.title, terms) + '</span>' + (snip ? '<span class="sxs">' + snip + '</span>' : '') + '</li>';
    }).join('') : '<li class="sxnone">' + esc(UI.none) + '</li>';
    ul.hidden = false; inp.setAttribute('aria-expanded', 'true');
    inp.setAttribute('aria-activedescendant', res.length ? 'sxo' + hi : '');
    const on = $('li.on', ul); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function drawCnt() {
    cnt.textContent = !inp.value.trim() ? '' : res.length ? (at >= 0 ? (at + 1) + ' / ' + res.length : res.length + '') : '0';
    $$('.sxnav', bar).forEach((n) => { n.disabled = res.length < 1; });
  }

  function go(k) {
    if (!res.length) return;
    at = (k + res.length) % res.length; hi = at;
    const it = res[at], tab = $('.tabs button[data-ch="' + it.ch + '"]');
    if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
    if (it.sub) { const sb = $('#c' + it.ch.slice(2) + ' .sub button[data-sub="' + it.sub + '"]'); if (sb && sb.getAttribute('aria-selected') !== 'true') sb.click(); }
    if (it.b.getAttribute('aria-pressed') !== 'true') it.b.click();

    const li = it.b.closest('li'); li.classList.remove('sxflash'); void li.offsetWidth; li.classList.add('sxflash');
    ul.hidden = true; inp.setAttribute('aria-expanded', 'false');
    drawCnt();
  }

  function open() { place(); bar.hidden = false; btn.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('sxon'); inp.focus(); inp.select(); if (inp.value.trim()) drawList(); }
  function close(keepFocus) { bar.hidden = true; ul.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('sxon'); if (!keepFocus) btn.focus(); }
  btn.addEventListener('click', () => (bar.hidden ? open() : close()));
  $('.sxx', bar).addEventListener('click', close);
  $$('.sxnav', bar).forEach((n) => n.addEventListener('click', () => go(at < 0 ? (+n.getAttribute('data-d') > 0 ? 0 : res.length - 1) : at + +n.getAttribute('data-d'))));
  inp.addEventListener('input', () => { search(inp.value); at = -1; hi = 0; drawList(); drawCnt(); });
  inp.addEventListener('focus', () => { if (inp.value.trim() && ul.hidden) { hi = Math.max(0, at); drawList(); } });
  inp.addEventListener('keydown', (e) => {
    const listOpen = !ul.hidden && res.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!res.length) return;
      e.preventDefault();
      if (ul.hidden) { drawList(); return; }
      hi = (hi + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % res.length; drawList();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (listOpen) go(hi); else if (res.length) go(at < 0 ? 0 : at + (e.shiftKey ? -1 : 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (!ul.hidden) { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); } else close();
    }
  });
  ul.addEventListener('mousedown', (e) => e.preventDefault());
  ul.addEventListener('click', (e) => { const li = e.target.closest('li[data-k]'); if (li) go(+li.getAttribute('data-k')); });

  document.addEventListener('pointerdown', (e) => { if (!bar.hidden && !bar.contains(e.target) && !btn.contains(e.target)) close(true); }, true);
  document.addEventListener('wheel', (e) => { if (!bar.hidden && !bar.contains(e.target)) close(true); }, { passive: true, capture: true });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && /^[kKfF]$/.test(e.key))) { e.preventDefault(); open(); }
  });
  drawCnt();
})();
