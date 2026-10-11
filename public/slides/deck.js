/* 슬라이드 덱 엔진 — deck.css 와 짝. 슬라이드는 덱 HTML 의 <main id="stage"> 안에 <section class="slide"> 로 쓴다(사용법은 /slides/ 덱 맨 위 주석).
   · 주소창은 건드리지 않는다. 흑/백·글꼴 선택은 이 브라우저(localStorage)에, 보고 있던 장은 이 탭(sessionStorage)에만 저장한다.
   · 임베드: data-src 가 있는 슬라이드/칸에 iframe 을 만든다. 현재 장과 바로 앞뒤 장의 것만 불러오고 나머지는 없애(소리·부하 방지) 다시 오면 새로 불러온다. */
(function () {
  'use strict';

  const W = 1600, H = 900;                                       // 무대(슬라이드) 크기 — 16:9. 화면 크기에 맞춰 통째로 확대·축소
  const root = document.documentElement;
  const body = document.body;
  const stage = document.getElementById('stage');
  if (!stage) return;
  const slides = Array.prototype.filter.call(stage.children, (e) => e.classList.contains('slide'));
  if (!slides.length) return;
  const params = new URLSearchParams(location.search);

  /* ───────── 저장소(막혀 있으면 조용히 넘어간다) ───────── */
  const LS = {
    get(k) { try { return localStorage.getItem('slides.' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('slides.' + k, v); } catch (e) { /* 저장 불가 */ } },
    del(k) { try { localStorage.removeItem('slides.' + k); } catch (e) { /* 저장 불가 */ } }
  };
  const POS_KEY = 'slides.pos.' + location.pathname;
  const SS = {
    get() { try { return sessionStorage.getItem(POS_KEY); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(POS_KEY, v); } catch (e) { /* 저장 불가 */ } }
  };

  /* ───────── 도우미 ───────── */
  function el(tag, props, text) {
    const e = document.createElement(tag);
    if (props) Object.keys(props).forEach((k) => { if (k === 'class') e.className = props[k]; else e.setAttribute(k, props[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  const each = (list, fn) => Array.prototype.forEach.call(list, fn);
  const clamp = (n) => Math.max(0, Math.min(slides.length - 1, n));
  function isEditable(t) { return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
  function slideTitle(s) {
    const t = s.getAttribute('data-title');
    if (t) return t;
    const h = s.querySelector('h1,h2,h3');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  /* ───────── 상태 ───────── */
  let cur = -1, uiTimer = 0, sticky = false, digits = '', digitTimer = 0;
  const state = {
    dark: params.has('theme') ? /^(dark|black)$/.test(params.get('theme')) : LS.get('theme') === 'dark',
    serif: (params.has('font') ? params.get('font') : LS.get('font')) === 'serif'     // 'serif' 가 아니면 모두 기본 고딕체(Pretendard)
  };

  /* ───────── 슬라이드 준비 ───────── */
  slides.forEach((s, i) => {
    s._steps = Array.prototype.slice.call(s.querySelectorAll('.step'));
    s._shown = 0;
    s._embeds = Array.prototype.slice.call(s.querySelectorAll('[data-src]'));
    if (s.hasAttribute('data-src')) { s._embeds.unshift(s); s.classList.add('embed'); }
    s._embeds.forEach((b) => { if (!b.getAttribute('data-title')) b.setAttribute('data-title', slideTitle(s)); });
    s.setAttribute('role', 'group');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', (i + 1) + ' / ' + slides.length);
  });

  /* ───────── 도구줄 ───────── */
  const ui = el('div', { id: 'ui' });
  const counter = el('span', { id: 'counter' }, '');
  ui.appendChild(counter);
  function btn(id, label, title, fn) {
    const b = el('button', { type: 'button', id, title }, label);
    b.addEventListener('click', () => { fn(); b.blur(); });         // 눌렀다 놓은 뒤 포커스를 비워야 스페이스·엔터가 단추를 또 누르지 않는다
    ui.appendChild(b);
    return b;
  }
  const bPrev = btn('bPrev', 'Prev', 'Previous (←)', prev);
  const bNext = btn('bNext', 'Next', 'Next (→)', next);
  const bOpen = btn('bOpen', 'Open', 'Open the embedded page in a new tab', openEmbed);
  const bOver = btn('bOver', 'Overview', 'Slide overview (O)', openOverview);
  const bTheme = btn('bTheme', 'Black / white', 'Black / white (D)', toggleTheme);
  const bFont = btn('bFont', 'Font: Sans', 'Font: Sans = Pretendard, Serif = Baskerville (T)', toggleFont);
  const bFull = btn('bFull', 'Full screen', 'Full screen (F)', toggleFull);
  const bar = el('div', { id: 'bar' });
  const sr = el('div', { id: 'sr', role: 'status', 'aria-live': 'polite' });
  const overview = el('div', { id: 'overview', hidden: '' });
  body.appendChild(ui); body.appendChild(bar); body.appendChild(sr); body.appendChild(overview);

  function showUi(isSticky) {
    body.classList.add('ui'); body.classList.remove('idle');
    clearTimeout(uiTimer);
    if (isSticky) { sticky = true; return; }                       // 포커스가 임베드 안에 있는 동안은 계속 보인다(키가 그 안으로 들어가 단추가 유일한 수단일 수 있음)
    if (sticky) return;
    uiTimer = setTimeout(hideUi, 3000);
  }
  function hideUi() {
    if (sticky) return;
    body.classList.remove('ui');
    if (!overviewOpen()) body.classList.add('idle');
  }

  /* ───────── 배치: 무대를 화면에 맞춰 확대·축소 ───────── */
  function fit() {
    const vw = window.innerWidth || root.clientWidth, vh = window.innerHeight || root.clientHeight, s = Math.min(vw / W, vh / H);
    stage.style.left = Math.round((vw - W * s) / 2) + 'px';
    stage.style.top = Math.round((vh - H * s) / 2) + 'px';
    stage.style.webkitTransform = stage.style.transform = 'scale(' + s + ')';
    if (overviewOpen()) fitThumbs();
  }

  /* ───────── 이동 ───────── */
  function setSteps(s, n, instant) {
    if (instant) s.classList.add('instant');                       // 장에 들어올 때는 효과 없이 바로 처음(또는 완성) 상태로
    s._shown = n;
    s._steps.forEach((x, k) => x.classList.toggle('shown', k < n));
    if (instant) { void s.offsetWidth; s.classList.remove('instant'); }
  }
  function show(i) {
    i = clamp(i);
    if (i === cur) return;
    const back = cur >= 0 && i < cur;                              // 앞 장으로 돌아온 경우엔 완성된 모습(단계 모두 표시), 앞으로 갈 때는 처음부터
    cur = i;
    slides.forEach((s, j) => { s.classList.toggle('active', j === cur); s.setAttribute('aria-hidden', j === cur ? 'false' : 'true'); });
    const s = slides[cur];
    setSteps(s, back ? s._steps.length : 0, true);
    syncEmbeds();
    const ff = focusedFrame();                                          // 임베드 안을 클릭해 둔 채 장을 넘기면, 숨겨진 iframe 이 포커스를 쥐고 있어 O·D·F 같은 단축키가 안 먹는다 → 포커스를 덱으로 되돌린다
    if (ff) { ff.blur(); try { window.focus(); } catch (e) { /* 무시 */ } }
    if (sticky && !focusedFrame()) { sticky = false; showUi(); }       // 포커스가 있던 임베드가 사라졌으면 도구줄을 다시 자동 숨김으로
    updateUi();
    SS.set(location.hash + '|' + cur);
  }
  function next() {
    const s = slides[cur];
    if (s._shown < s._steps.length) { setSteps(s, s._shown + 1); updateUi(); return; }
    show(cur + 1);
  }
  function prev() {
    const s = slides[cur];
    if (s._shown > 0) { setSteps(s, s._shown - 1); updateUi(); return; }
    show(cur - 1);
  }
  function updateUi() {
    const s = slides[cur], t = slideTitle(s);
    counter.textContent = (cur + 1) + ' / ' + slides.length;
    bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    bPrev.disabled = cur === 0 && s._shown === 0;
    bNext.disabled = cur === slides.length - 1 && s._shown === s._steps.length;
    bOpen.hidden = !s._embeds.length;
    sr.textContent = (cur + 1) + ' / ' + slides.length + (t ? ' — ' + t : '');
  }

  /* 숫자를 치고 엔터: 그 번호의 슬라이드로 */
  function typeDigit(d) {
    digits = (digits + d).slice(-3);
    counter.textContent = '→ ' + digits;
    clearTimeout(digitTimer);
    digitTimer = setTimeout(() => { digits = ''; updateUi(); }, 2500);
  }
  function jumpDigits() {
    const n = parseInt(digits, 10);
    digits = ''; clearTimeout(digitTimer);
    if (n >= 1 && n <= slides.length) show(n - 1); else updateUi();
  }

  /* ───────── 임베드(다른 페이지 넣기) ───────── */
  function embedUrl(box) { return new URL(box.getAttribute('data-src'), location.href).href; }
  function mount(box) {
    if (box._frame) return;
    const f = document.createElement('iframe');
    f.setAttribute('title', box.getAttribute('data-title') || 'Embedded page');
    f.setAttribute('allow', box.getAttribute('data-allow') || 'fullscreen; clipboard-write');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    if (box.hasAttribute('data-sandbox')) f.setAttribute('sandbox', box.getAttribute('data-sandbox'));
    f.addEventListener('load', () => bindFrame(f, box));
    f.src = embedUrl(box);                                          // 붙이기 전에 주소를 정해야 처음 이동 한 번으로 끝난다(브라우저 뒤로 가기 기록이 쌓이지 않음)
    box.appendChild(f);
    box._frame = f;
  }
  function unmount(box) {
    if (!box._frame) return;
    box.removeChild(box._frame);
    box._frame = null;
  }
  function syncEmbeds() {
    slides.forEach((s, j) => {
      const dist = Math.abs(j - cur);
      s._embeds.forEach((b) => {
        const want = dist === 0 || (dist === 1 && b.getAttribute('data-preload') !== 'off');
        if (want) mount(b); else unmount(b);
      });
    });
  }
  /* 같은 출처의 페이지(예: /clock/)는 안쪽 문서에 키 이벤트를 걸 수 있다 → 안쪽을 클릭해 포커스가 들어가도 화살표·PageUp/PageDown·Home/End 로 슬라이드를 넘길 수 있고
     Esc 는 도구줄을 보이게 한다. 입력칸에서는 넘기지 않고, data-keys="off" 인 칸은 건드리지 않는다. (마우스 움직임은 전달하지 않는다 — 덱 도구줄이 안쪽 페이지 자체의
     도구줄과 같은 자리에서 겹치기 때문.) 다른 출처 페이지는 안쪽에 손댈 수 없어 이 방법이 통하지 않으므로, 포커스가 들어가 있는 동안 도구줄을 계속 보여 준다. */
  function framedKeys(f, box) {
    try { return !!f.contentWindow.document.body && box.getAttribute('data-keys') !== 'off'; } catch (e) { return false; }
  }
  function bindFrame(f, box) {
    if (framedKeys(f, box)) f.contentWindow.document.addEventListener('keydown', onFrameKey, true);
  }
  function onFrameKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 'Escape') showUi();
  }
  function openEmbed() {
    const b = slides[cur]._embeds[0];
    if (b) window.open(embedUrl(b), '_blank', 'noopener');
  }
  function focusedFrame() { const a = document.activeElement; return a && a.tagName === 'IFRAME' ? a : null; }
  window.addEventListener('blur', () => setTimeout(() => {          // 부모 창이 blur = 포커스가 iframe 안으로 들어감
    const f = focusedFrame();
    if (f && !framedKeys(f, f.parentNode)) showUi(true);
  }, 0));
  window.addEventListener('focus', () => { sticky = false; showUi(); });

  /* ───────── 목록(O 키) ───────── */
  function overviewOpen() { return !overview.hidden; }
  function fitThumbs() {
    each(overview.querySelectorAll('.thumb'), (t) => { t.firstChild.style.webkitTransform = t.firstChild.style.transform = 'scale(' + (t.clientWidth / W) + ')'; });
  }
  function openOverview() {
    overview.textContent = '';
    slides.forEach((s, i) => {
      const t = el('button', { type: 'button', class: 'thumb' + (i === cur ? ' cur' : ''), title: (i + 1) + (slideTitle(s) ? ' · ' + slideTitle(s) : '') });
      const inner = el('div', { class: 'in' });
      const c = s.cloneNode(true);
      each(c.querySelectorAll('iframe'), (f) => f.remove());              // 축소판에는 실제 페이지 대신 이름과 주소만
      each(c.querySelectorAll('[id]'), (n) => n.removeAttribute('id'));
      each(c.querySelectorAll('[data-src]'), (n) => n.classList.add('ph'));
      if (c.hasAttribute('data-src')) c.classList.add('ph');
      c.removeAttribute('id'); c.classList.remove('active');
      inner.appendChild(c); t.appendChild(inner); t.appendChild(el('span', { class: 'num' }, String(i + 1)));
      t.addEventListener('click', () => { closeOverview(); show(i); });
      overview.appendChild(t);
    });
    overview.hidden = false;
    body.classList.remove('idle');
    fitThumbs();
    const c = overview.querySelector('.thumb.cur');
    if (c) { c.focus(); if (c.scrollIntoView) c.scrollIntoView({ block: 'center' }); }
  }
  function closeOverview() {
    overview.hidden = true;
    overview.textContent = '';
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function moveThumb(k) {                                              // 목록에서 방향키로 축소판 사이를 옮겨 다닌다
    const list = Array.prototype.slice.call(overview.querySelectorAll('.thumb')), at = list.indexOf(document.activeElement);
    if (!list.length) return;
    let n = at < 0 ? cur : at;
    const cols = Math.max(1, Math.round(overview.clientWidth / (list[0].offsetWidth + 26)));
    if (k === 'ArrowRight') n += 1; else if (k === 'ArrowLeft') n -= 1; else if (k === 'ArrowDown') n += cols; else if (k === 'ArrowUp') n -= cols;
    n = Math.max(0, Math.min(list.length - 1, n));
    list[n].focus();
  }

  /* ───────── 보기 설정 ───────── */
  function applyTheme() { root.classList.toggle('dark', state.dark); }
  function toggleTheme() { state.dark = !state.dark; applyTheme(); if (state.dark) LS.set('theme', 'dark'); else LS.del('theme'); }
  function applyFont() { root.classList.toggle('font-serif', state.serif); bFont.textContent = 'Font: ' + (state.serif ? 'Serif' : 'Sans'); }
  function toggleFont() { state.serif = !state.serif; applyFont(); if (state.serif) LS.set('font', 'serif'); else LS.del('font'); if (overviewOpen()) fitThumbs(); }
  function toggleFull() {
    const d = document, e = root, f = d.fullscreenElement || d.webkitFullscreenElement;
    try {
      if (f) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
      else { const r = e.requestFullscreen || e.webkitRequestFullscreen; if (r) { const p = r.call(e); if (p && p.catch) p.catch(() => {}); } }
    } catch (err) { /* 삽입된 화면에서는 전체 화면이 막힐 수 있다 */ }
  }

  /* ───────── 키보드·터치 ───────── */
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target, k = e.key || '';
    if (isEditable(t)) return;
    if ((k === ' ' || k === 'Enter') && t && (t.tagName === 'BUTTON' || t.tagName === 'A')) return;   // 단추·링크에서는 그 동작을 그대로
    showUi();
    if (overviewOpen()) {
      if (k === 'Escape' || k === 'o' || k === 'O') { closeOverview(); e.preventDefault(); }
      else if (k.indexOf('Arrow') === 0) { moveThumb(k); e.preventDefault(); }
      return;
    }
    let used = true;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) next();
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) prev();
    else if (k === 'Home') show(0);
    else if (k === 'End') show(slides.length - 1);
    else if (k === 'Enter') { if (digits) jumpDigits(); else next(); }
    else if (/^[0-9]$/.test(k)) typeDigit(k);
    else if (k === 'Escape') { if (digits) { digits = ''; clearTimeout(digitTimer); updateUi(); } else used = false; }
    else if (k === 'o' || k === 'O') openOverview();
    else if (k === 'd' || k === 'D') toggleTheme();
    else if (k === 't' || k === 'T') toggleFont();
    else if (k === 'f' || k === 'F') toggleFull();
    else used = false;
    if (used) e.preventDefault();
  }
  let tx = 0, ty = 0, tt = 0;
  document.addEventListener('touchstart', (e) => { showUi(); if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now(); } }, { passive: true });
  document.addEventListener('touchend', (e) => {                       // 좌우로 쓸어 넘기기
    if (overviewOpen() || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Date.now() - tt < 800 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  /* ───────── 시작 ───────── */
  function startIndex() {
    // 같은 탭에서 새로 고침하면 보던 장으로(주소가 그대로일 때만), 주소에 #번호 가 있으면 그 장, 아니면 첫 장
    const saved = SS.get(), m = /^#(\d+)$/.exec(location.hash);
    if (saved !== null) { const p = saved.split('|'); if (p[0] === location.hash && /^\d+$/.test(p[1] || '')) return clamp(parseInt(p[1], 10)); }
    return m ? clamp(parseInt(m[1], 10) - 1) : 0;
  }
  applyTheme(); applyFont(); fit();
  show(startIndex());
  document.addEventListener('keydown', onKey);
  document.addEventListener('mousemove', () => showUi());
  document.addEventListener('mousedown', () => showUi());
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  window.addEventListener('hashchange', () => { const m = /^#(\d+)$/.exec(location.hash); if (m) show(clamp(parseInt(m[1], 10) - 1)); SS.set(location.hash + '|' + cur); });

  window.Deck = { next, prev, goto(n) { show(clamp(n - 1)); }, count: slides.length, index() { return cur + 1; } };
})();
