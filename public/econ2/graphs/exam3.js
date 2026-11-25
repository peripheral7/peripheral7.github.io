/*
  Econ 2 Interactive — Exam 3 챕터 (Ch35 필립스곡선 · Ch31 개방경제 기본 개념 · Ch32 개방경제 이론).
  app.js 보다 먼저 읽힌다. app.js 가 Ch29·30·33·28 을 만든 뒤 window.E2_EXT 의 함수들을 엔진 API(Plot · Player · runner · list …)와 함께 부른다.
  한·영 두 판(/econ2/graphs/, /econ2/graphs/en/)이 이 파일 하나를 함께 쓰고, 글자는 <html lang> 으로 고른다.
  사건 꼬리표(q)는 문제집 번호: MC = Questions ChXX 객관식, SA = 교재 8판 Problems and Applications(Ch35 SA 1·2·3 = 교재 Q2·3·4), AL = 강의 Active Learning.
*/
(function () {
  'use strict';
  const EXT = (window.E2_EXT = window.E2_EXT || []);
  const SL = 0.85;
  const pcs = (s) => { const out = []; String(s).split(' → ').forEach((t) => { t = t.trim(); while (t.indexOf('→ ') === 0 && out.length) { out[out.length - 1] += ' →'; t = t.slice(2).trim(); } if (t) out.push(t); }); return out; };
  const atOf = (s, re) => Math.max(0, pcs(s).findIndex((p) => re.test(p)));

  /* ============================ Ch35 필립스곡선 ============================ */
  EXT.push(function ch35(A) {
    const $ = A.$, $$ = A.$$;
    if (!$('#c35')) return null;
    const EN = A.lang === 'en', T = (k, e) => (EN ? e : k);
    const Y0 = 4, R = 1.4, Z = 1.6;
    const plot = A.Plot($('#plot35'), {
      aria: T('필립스곡선 그래프', 'Phillips curve graph'), dom: [0, 10, 0, 10], xName: 'u', yName: 'π',
      xTitle: T('실업률 u', 'Unemployment rate u'), yTitle: T('인플레이션율 π', 'Inflation rate π'), star: true, lr: 'LRPC',
      curves: [
        { id: 'LRPC', kind: 'vert', x: 5, y0: 0.8, y1: 9.6, lab: 'LRPC' },
        { id: 'SRPC', kind: 'line', x: 5, y: Y0, m: -SL, span: 3.8, lab: 'SRPC' },
        { id: 'DM', kind: 'line', x: 5, y: Y0, m: SL, span: 9, lab: '', invisible: true }
      ],
      eqs: [['SRPC', 'DM']]
    });
    const player = A.Player($('#pl35'));
    const gapT = (off, pt) => { const L = 5 + (off.LRPC || 0); return Math.abs(pt.x - L) < 0.03 ? T('u = u* 장기균형', 'u = u* long-run equilibrium') : pt.x > L ? T('u > u* 경기 침체', 'u > u* recession') : T('u < u* 경기 과열', 'u < u* boom'); };
    const pt = (s) => plot.pointsOf(s.off, s.vis)[0];
    const r = A.runner(plot, player, {
      start: 'A : u = u*',
      result: (a, b) => {
        const x = pt(a), y = pt(b); if (!x || !y) return '';
        let s = 'u ' + A.dirW(x.x, y.x, 0.03) + ' · π ' + A.dirW(x.y, y.y, 0.03) + ' — ' + gapT(b.off, y);
        if (y.x > x.x + 0.03 && y.y > x.y + 0.03) s += T(' (스태그플레이션)', ' (stagflation)');
        return s;
      },
      quiet: () => plot.hilite(null),
      after: (a, b) => { const x = pt(a), y = pt(b); if (!x || !y) return; const ax = (A.dirOf(x.x, y.x, 0.03) ? 'x' : '') + (A.dirOf(x.y, y.y, 0.03) ? 'y' : ''); plot.seq(ax ? [{ axis: ax }] : []); }
    });

    // 기대가 실제를 따라잡아 SRPC 가 이동하고 u = u* 로 돌아온다
    const lrPC = (o) => ({ SRPC: 2 * (o.LRPC || 0) - (o.DM || 0) });
    const lrWhy = (S) => {
      const b = S[S.length - 1], p = pt(b), L = 5 + (b.off.LRPC || 0);
      return p && p.x < L - 0.03
        ? T('π > π^e → 기대 π^e ↑ → SRPC → → u* 회복, π ↑', 'π > π^e → expected π^e ↑ → SRPC → → back to u*, π ↑')
        : T('π < π^e → 기대 π^e ↓ → SRPC ← → u* 회복, π ↓', 'π < π^e → expected π^e ↓ → SRPC ← → back to u*, π ↓');
    };
    const LR = { name: T('기대 따라잡기', 'Expectations catch up'), label: T('장기', 'Long run'), ch: { abs: lrPC }, why: lrWhy, at: 2 };
    const ALONG = T('SRPC 위 이동', 'Along SRPC');
    const along = (t, up, why, q) => ({ t, q, stages: [
      { name: ALONG, label: T('단기', 'Short run'), ch: { add: { DM: up ? -R : R } }, why, at: atOf(why, /SRPC/) }, LR] });
    const shift = (t, dir, why, q, add) => ({ t, q, dir, stages: [{ name: 'SRPC ' + (dir === 'r' ? '→' : '←'), ch: { add }, why, at: atOf(why, /SRPC/) }] });

    const E = {
      A: [
        along(T('통화량 증가', 'Money supply up'), true, T('M ↑ → AD ↑ → SRPC 위 이동 ↖', 'M ↑ → AD ↑ → Along SRPC ↖'), 'MC 1 · 8'),
        along(T('정부 구매 증가', 'Government purchases rise'), true, T('G ↑ → AD ↑ → SRPC 위 이동 ↖', 'G ↑ → AD ↑ → Along SRPC ↖'), 'SA 1c · MC 4'),
        along(T('소비 위축 → 경기 침체', 'Consumers cut spending → recession'), false, T('C ↓ → AD ↓ → SRPC 위 이동 ↘', 'C ↓ → AD ↓ → Along SRPC ↘'), 'SA 2'),
        along(T('통화 긴축 · 디스인플레이션', 'Tight money · disinflation'), false, T('M 증가율 ↓ → AD ↓ → SRPC 위 이동 ↘', 'Money growth ↓ → AD ↓ → Along SRPC ↘'), 'MC 17'),
        { t: T('기업 비관 → 통화 확장?', 'Business pessimism → expand money?'), q: 'SA 3b', stages: [
          { name: ALONG, label: T('단기', 'Short run'), ch: { add: { DM: R } }, why: T('I ↓ → AD ↓ → SRPC 위 이동 ↘', 'I ↓ → AD ↓ → Along SRPC ↘'), at: 2 },
          { name: T('그대로 두면 기대 하락', 'Wait: expectations fall'), short: T('기다림', 'Wait'), ch: { abs: lrPC }, why: lrWhy, at: 2 },
          { name: T('통화 확장으로 AD 회복', 'Expand money: AD back'), short: T('통화 확장', 'Expand money'), from: 0, sw: T('장기에는 통화 확장으로 ', 'in the long run, with monetary expansion, '), sit: T('u > u* : 통화 확장', 'u > u* : expand money'),
            ch: { abs: { DM: 0 } }, chain: ['M ↑', 'AD ↑', T('SRPC 위 이동 ↖', 'Along SRPC ↖'), T('원래 점 A', 'back to A')], at: 2, letter: 'A', rs: T('u back · π back', 'u back · π back') }] },
        { t: T('신뢰받는 디스인플레이션', 'Credible disinflation'), q: 'MC 18', stages: [
          { name: 'SRPC ←', label: T('합리적 기대', 'Rational expectations'), ch: { add: { DM: R }, abs: (o) => ({ SRPC: 2 * (o.LRPC || 0) - o.DM }) },
            why: T('M 증가율 ↓ 약속을 믿음 → 기대 π^e 바로 ↓ → SRPC ← → u 그대로, π ↓ (희생률 0)', 'Credible plan to slow money growth → expected π^e ↓ at once → SRPC ← → u unchanged, π ↓ (no sacrifice)'), at: 2 }] }
      ],
      S: [
        shift(T('기대인플레이션 하락', 'Expected inflation falls'), 'l', T('π^e ↓ → SRPC ←', 'π^e ↓ → SRPC ←'), 'SA 1d', { SRPC: -Z }),
        { t: T('유가 급등', 'Oil price spike'), q: 'MC 14 · 16 · SA 3c', dir: 'r', stages: [
          { name: 'SRPC →', label: T('단기', 'Short run'), ch: { add: { SRPC: Z } }, why: T('유가 ↑ → 생산 비용 ↑ → SRPC →', 'Oil price ↑ → production costs ↑ → SRPC →'), at: 2 },
          { name: T('그대로 두면 원래대로', 'Wait: costs fall back'), short: T('기다림', 'Wait'), ch: { abs: { SRPC: 0 } }, letter: 'A', why: T('u > u* → 임금 · 비용 ↓ → SRPC ← → 원래 점 A (오래 걸림)', 'u > u* → wages and costs ↓ → SRPC ← → back to A (slowly)'), at: 2 },
          { name: T('수용: 통화 확장', 'Accommodate: expand money'), short: T('수용(확장)', 'Accommodate'), from: 0, sw: T('장기에는 통화 확장으로 수용해 ', 'in the long run, accommodating with monetary expansion, '), sit: T('스태그플레이션 : 수용', 'Stagflation : accommodate'),
            ch: { abs: (o) => ({ DM: 2 * (o.LRPC || 0) - (o.SRPC || 0) }) }, chain: ['M ↑', 'AD ↑', T('SRPC 위 이동 ↖', 'Along SRPC ↖'), T('u* 회복, π 더 ↑', 'back to u*, π higher')], at: 2 },
          { name: T('긴축', 'Tighten'), short: T('긴축', 'Tighten'), from: 0, sw: T('장기에는 긴축으로 ', 'in the long run, tightening, '), sit: T('스태그플레이션 : 긴축', 'Stagflation : tighten'),
            ch: { abs: (o) => ({ DM: o.SRPC || 0 }) }, chain: ['M ↓', 'AD ↓', T('SRPC 위 이동 ↘', 'Along SRPC ↘'), T('π 회복, u 더 ↑', 'π back, u higher')], at: 2 }] },
        shift(T('수입 유가 하락', 'Imported oil gets cheaper'), 'l', T('유가 ↓ → 생산 비용 ↓ → SRPC ←', 'Oil price ↓ → production costs ↓ → SRPC ←'), 'SA 1b · MC 15', { SRPC: -Z })
      ],
      L: [
        { t: T('자연실업률 상승', 'Natural rate of unemployment rises'), q: 'SA 1a', dir: 'r', stages: [
          { name: 'LRPC · SRPC →', label: T('1단계', 'Step 1'), ch: { add: { LRPC: 1, SRPC: 1 } }, why: T('실업급여 ↑ · 구직 기간 ↑ → u* ↑ → LRPC · SRPC →', 'More generous benefits → u* ↑ → LRPC · SRPC →'), at: 2 },
          LR] },
        { t: T('최저임금 인하 + 통화 확장', 'Lower minimum wage + monetary expansion'), q: 'MC 10', dir: 'l', stages: [
          { name: 'LRPC · SRPC ←', label: T('1단계', 'Step 1'), ch: { add: { LRPC: -1, SRPC: -1 } }, why: T('최저임금 ↓ → 구조적 실업 ↓ → u* ↓ → LRPC · SRPC ←', 'Minimum wage ↓ → structural unemployment ↓ → u* ↓ → LRPC · SRPC ←'), at: 3 },
          { name: ALONG, label: T('2단계', 'Step 2'), ch: { add: { DM: -R } }, why: T('M ↑ → AD ↑ → SRPC 위 이동 ↖', 'M ↑ → AD ↑ → Along SRPC ↖'), at: 2 },
          LR] }
      ]
    };
    Object.assign(A.COND, EN ? {
      'Money supply up': 'If the money supply increases,', 'Government purchases rise': 'If government purchases rise,',
      'Consumers cut spending → recession': 'If households cut spending,', 'Tight money · disinflation': 'If the central bank slows money growth,',
      'Business pessimism → expand money?': 'If firms turn pessimistic and cut investment,', 'Credible disinflation': 'If the central bank credibly slows money growth,',
      'Expected inflation falls': 'If expected inflation falls,', 'Oil price spike': 'If oil prices spike,', 'Imported oil gets cheaper': 'If imported oil gets cheaper,',
      'Natural rate of unemployment rises': 'If the natural rate of unemployment rises,', 'Lower minimum wage + monetary expansion': 'If the minimum wage is cut and money is expanded,'
    } : {
      '소비 위축 → 경기 침체': '가계가 소비를 줄이면', '통화 긴축 · 디스인플레이션': '중앙은행이 통화 증가율을 낮추면',
      '기업 비관 → 통화 확장?': '기업이 비관해 투자를 줄이면', '신뢰받는 디스인플레이션': '사람들이 믿는 가운데 중앙은행이 통화 증가율을 낮추면',
      '기대인플레이션 하락': '기대인플레이션이 내려가면', '수입 유가 하락': '수입 유가가 내리면', '최저임금 인하 + 통화 확장': '최저임금을 내리고 통화를 늘리면'
    });
    const side = $('#c35 .side');
    $$('#c35 [data-o]').forEach((h) => { const L = E[h.getAttribute('data-o')]; A.list(h, L, (i) => r.pick(i < 0 ? null : L[i]), side); });
    return { id: 'ch35', show: () => plot.render() };
  });

  /* ============================ Ch32 개방경제 이론 ============================ */
  EXT.push(function ch32(A) {
    const $ = A.$, $$ = A.$$;
    if (!$('#c32')) return null;
    const EN = A.lang === 'en', T = (k, e) => (EN ? e : k);
    const R = 1.4;
    // 대부자금: S = 5 + SL(x − 5 − sS), D(= I + NCO) = 5 − SL(x − 5 − dI − dN). r 은 교점, NCO 그래프는 rN(한 단계 늦은 r), 외환 공급은 QF(한 단계 늦은 NCO).
    const rOff = (o) => SL * ((o.dI || 0) + (o.dN || 0) - (o.sS || 0)) / 2;
    const vals = (o) => ({ r: 5 + rOff(o), I: (o.dI || 0) - rOff(o) / SL, NCO: (o.dN || 0) - (o.rN || 0) / SL, E: 5 - SL * ((o.QF || 0) - (o.dX || 0)), NX: o.QF || 0 });
    const mk = (id, cfg) => A.Plot($(id), Object.assign({ dom: [0, 10, 0, 10], ptD: [14, -12] }, cfg));
    const lf = mk('#plot32lf', { aria: T('대부자금시장', 'Loanable funds market'), xName: 'LF', yName: 'r', xTitle: T('대부자금 LF', 'Loanable funds LF'), yTitle: T('실질이자율 r', 'Real interest rate r'),
      curves: [
        { id: 'S', kind: 'line', x: 5, y: 5, m: SL, span: 3.8, lab: 'S', calc: (o) => o.sS || 0 },
        { id: 'D', kind: 'line', x: 5, y: 5, m: -SL, span: 3.8, lab: 'D = I + NCO', calc: (o) => (o.dI || 0) + (o.dN || 0) }],
      eqs: [['S', 'D']] });
    const nco = mk('#plot32nco', { aria: T('순자본유출', 'Net capital outflow'), xName: 'NCO', yName: 'r', xTitle: T('순자본유출 NCO', 'Net capital outflow NCO'), yTitle: T('실질이자율 r', 'Real interest rate r'),
      curves: [
        { id: 'NCO', kind: 'line', x: 5, y: 5, m: -SL, span: 3.8, lab: 'NCO', calc: (o) => o.dN || 0 },
        { id: 'RL', kind: 'horiz', y: 5, lab: '', invisible: true, calc: (o) => o.rN || 0 }],
      eqs: [['NCO', 'RL']] });
    const fx = mk('#plot32fx', { aria: T('외환시장', 'Market for foreign-currency exchange'), xName: 'Q', yName: 'E', xTitle: T('자국 통화량', 'Quantity of domestic currency'), yTitle: T('실질환율 E', 'Real exchange rate E'),
      curves: [
        { id: 'SF', kind: 'vert', x: 5, y0: 0.8, y1: 9.6, lab: 'S = NCO', calc: (o) => o.QF || 0 },
        { id: 'DF', kind: 'line', x: 5, y: 5, m: -SL, span: 3.8, lab: 'D = NX', calc: (o) => o.dX || 0 }],
      eqs: [['SF', 'DF', { xl: 'NX' }]] });
    const P = { lf, nco, fx };
    let view = 'lf';
    function showSub(v, push) {
      if (!P[v]) v = 'lf';
      view = v;
      $$('#c32 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === v)));
      Object.keys(P).forEach((k) => { $('#plot32' + k).hidden = k !== v; });
      P[v].render(); A.alignTabs();
      if (push) history.replaceState(null, '', '#ch32-' + v);
    }
    const changed = (a, b, ks) => ks.some((k) => Math.abs((a[k] || 0) - (b[k] || 0)) > 1e-6);
    // 그래프마다 자기 변수가 바뀐 단계만 남겨 A → B → C 로 다시 이름 붙인다
    const KEYS = { lf: ['sS', 'dI', 'dN'], nco: ['dN', 'rN'], fx: ['QF', 'dX'] };
    const own = (k, states) => {
      const out = [];
      states.forEach((s, i) => { if (i && !changed(out[out.length - 1].off, s.off, KEYS[k])) out[out.length - 1] = s; else out.push(s); });
      return out.map((s, i) => Object.assign({}, s, { letter: 'ABCDEFGH'[i] }));
    };
    const facade = {
      base: () => ({ off: {}, vis: Object.assign({}, lf.base().vis, nco.base().vis, fx.base().vis) }),
      show(states, o) {
        Object.keys(P).forEach((k) => P[k].show(own(k, states), o));
        if (states.length > 1) {
          const a = states[states.length - 2].off, b = states[states.length - 1].off;
          const v = changed(a, b, ['QF', 'dX']) ? 'fx' : changed(a, b, ['rN']) || (changed(a, b, ['dN']) && !changed(a, b, ['sS', 'dI'])) ? 'nco' : changed(a, b, ['sS', 'dI']) ? 'lf' : view;
          if (v !== view && $('#c32').classList.contains('on')) showSub(v, false);
        }
      },
      hilite: (h) => Object.keys(P).forEach((k) => P[k].hilite(k === view ? h : null)),
      seq: (items) => Object.keys(P).forEach((k) => P[k].seq(k === view ? items : [])),
      render: () => Object.keys(P).forEach((k) => P[k].render())
    };
    const player = A.Player($('#pl32'));
    const r = A.runner(facade, player, {
      start: 'A',
      result: (a, b) => {
        const x = vals(a.off), y = vals(b.off), mv = (k, tol) => Math.abs(y[k] - x[k]) > (tol || 0.02), out = [];
        let note = '';
        if (mv('r')) { out.push('r ' + A.dirW(x.r, y.r, 0.02)); if (mv('I')) out.push('I ' + A.dirW(x.I, y.I, 0.02)); note = 'S = I + NCO'; }
        if (mv('NCO')) { out.push('NCO ' + A.dirW(x.NCO, y.NCO, 0.02)); if (!note) note = changed(a.off, b.off, ['dN']) ? T('NCO 곡선 이동', 'NCO curve shifts') : T('NCO 곡선 위의 이동', 'movement along the NCO curve'); }
        if (mv('E')) { out.push('E ' + A.dirW(x.E, y.E, 0.02)); out.push('NX ' + A.dirW(x.NX, y.NX, 0.02)); note = 'NX = NCO'; }
        if (!out.length) { out.push('r ' + A.dirW(0, 0) + ' · NCO ' + A.dirW(0, 0)); note = T('S · I 그대로', 'S and I unchanged'); }
        return out.join(' · ') + ' — ' + note;
      },
      quiet: () => facade.hilite(null),
      after: (a, b) => {
        const x = vals(a.off), y = vals(b.off), ax = view === 'lf' ? (A.dirOf(x.r, y.r, 0.02) ? 'xy' : '') : view === 'nco' ? (A.dirOf(x.NCO, y.NCO, 0.02) ? 'x' : '') + (A.dirOf(5 + (a.off.rN || 0), 5 + (b.off.rN || 0), 0.02) ? 'y' : '') : (A.dirOf(x.E, y.E, 0.02) ? 'y' : '') + (A.dirOf(x.NX, y.NX, 0.02) ? 'x' : '');
        facade.seq(ax ? [{ axis: ax }] : []);
      }
    });
    const nStage = { name: T('NCO 곡선 위', 'Along NCO'), label: 'NCO', ch: { abs: (o) => ({ rN: rOff(o) }) }, at: 2,
      why: (S) => { const o = S[S.length - 1].off; return rOff(o) > (o.rN || 0) ? T('r ↑ → 국내 자산 매력 ↑ → NCO 곡선 위 이동', 'r ↑ → domestic assets more attractive → along the NCO curve') : T('r ↓ → 해외 자산 매력 ↑ → NCO 곡선 위 이동', 'r ↓ → foreign assets more attractive → along the NCO curve'); } };
    const xStage = { name: T('외환 공급 = NCO', 'Supply of currency = NCO'), label: T('외환시장', 'FX market'), ch: { abs: (o) => ({ QF: (o.dN || 0) - (o.rN || 0) / SL }) }, at: 1,
      why: (S) => { const o = S[S.length - 1].off, q = (o.dN || 0) - (o.rN || 0) / SL; return q < (o.QF || 0) ? T('NCO ↓ → S ←', 'NCO ↓ → S ←') : T('NCO ↑ → S →', 'NCO ↑ → S →'); } };
    const lfEv = (t, q, dir, add, why) => ({ t, q, dir, stages: [{ name: pcs(why)[atOf(why, /^[SD] [←→]$/)], label: T('대부자금', 'Loanable funds'), ch: { add }, why, at: atOf(why, /^[SD] [←→]$/) }, nStage, xStage] });
    const fxEv = (t, q, why) => ({ t, q, dir: 'r', stages: [{ name: 'D →', label: T('외환시장', 'FX market'), ch: { add: { dX: R } }, why, at: atOf(why, /^D →$/) }] });
    const E = {
      S: [
        lfEv(T('재정적자 확대', 'Larger budget deficit'), 'MC 13 · 14', 'l', { sS: -R }, T('정부저축 ↓ → 국민저축 ↓ → S ←', 'Public saving ↓ → national saving ↓ → S ←')),
        lfEv(T('재정적자 축소', 'Smaller budget deficit'), 'MC 20', 'r', { sS: R }, T('정부저축 ↑ → 국민저축 ↑ → S →', 'Public saving ↑ → national saving ↑ → S →'))],
      I: [lfEv(T('투자세액공제', 'Investment tax credit'), 'MC 19 · AL', 'r', { dI: R }, T('투자하면 세금 감면 → I ↑ → D →', 'Tax break on new investment → I ↑ → D →'))],
      N: [{ t: T('자본 도피', 'Capital flight'), q: 'MC 18', dir: 'r', stages: [
        { name: 'NCO →', label: 'NCO', ch: { add: { dN: R }, abs: (o) => ({ rN: rOff(o) }) }, why: T('국내 자산 위험 ↑ → NCO → → D(= I + NCO) → → r ↑ 이 NCO 를 조금 되돌림', 'Domestic assets riskier → NCO → → D (= I + NCO) → → higher r pulls NCO back a little'), at: 1 },
        xStage]}],
      X: [
        fxEv(T('수입 할당 · 관세', 'Import quota or tariff'), 'MC 16 · 17', T('수입 ↓ → 같은 E 에서 NX ↑ → D →', 'Imports ↓ → NX ↑ at each E → D →')),
        fxEv(T('해외에서 한국 상품 인기', 'Foreigners like our goods'), 'SA 1', T('외국인의 한국 상품 선호 ↑ → 원화 수요 ↑ → D →', 'Foreign taste for our goods ↑ → demand for our currency ↑ → D →'))]
    };
    Object.assign(A.COND, EN ? {
      'Larger budget deficit': 'If the government runs a larger budget deficit,', 'Smaller budget deficit': 'If the government cuts its budget deficit,',
      'Investment tax credit': 'If an investment tax credit is introduced,', 'Capital flight': 'If capital flight hits the country,',
      'Import quota or tariff': 'If imports are limited by a quota or tariff,', 'Foreigners like our goods': 'If foreigners develop a taste for our goods,'
    } : {
      '재정적자 확대': '정부가 재정적자를 늘리면', '재정적자 축소': '정부가 재정적자를 줄이면', '자본 도피': '자본 도피가 일어나면',
      '수입 할당 · 관세': '수입 할당이나 관세로 수입을 막으면', '해외에서 한국 상품 인기': '외국인이 한국 상품을 더 좋아하게 되면'
    });
    const side = $('#c32 .side');
    $$('#c32 [data-o]').forEach((h) => { const L = E[h.getAttribute('data-o')]; A.list(h, L, (i) => r.pick(i < 0 ? null : L[i]), side); });
    $$('#c32 .sub button').forEach((b) => b.addEventListener('click', () => showSub(b.getAttribute('data-sub'), true)));
    showSub('lf', false);
    return { id: 'ch32', show: (sub) => showSub(sub && P[sub] ? sub : view, false) };
  });

  /* ============================ Ch31 개방경제 기본 개념 ============================ */
  EXT.push(function ch31(A) {
    const $ = A.$, $$ = A.$$;
    if (!$('#c31')) return null;
    const EN = A.lang === 'en', T = (k, e) => (EN ? e : k);
    const term = (k, ko, en) => '<div class="term" data-k="' + k + '"><i>' + (EN ? '' : en) + '</i><span>' + (EN ? en : ko) + '</span><b></b></div>';
    const op = (s) => '<span class="kop">' + s + '</span>';
    $('#f31').innerHTML =
      '<div class="eqrow">' + term('X', '수출', 'Exports') + op('−') + term('M', '수입', 'Imports') + op('=') + term('NX', '순수출 NX', 'Net exports NX') + '</div>' +
      '<div class="eqrow">' + term('A', '해외 자산 매입', 'Buying foreign assets') + op('−') + term('F', '외국인의 국내 자산 매입', 'Foreigners buying ours') + op('=') + term('NCO', '순자본유출 NCO', 'Net capital outflow NCO') + '</div>' +
      '<p class="eqdetail f31id"><b>NX = NCO</b></p>' +
      '<div class="eqrow">' + term('S', '국민저축 S', 'National saving S') + op('=') + term('I', '국내투자 I', 'Investment I') + op('+') + term('NCO2', '순자본유출 NCO', 'NCO') + '</div>';
    $('#x31').innerHTML =
      '<div class="eqrow e4">' + term('e', '명목환율 e', 'Nominal rate e') + op('×') + term('P', '국내 물가 P', 'Domestic prices P') + op('÷') + term('Ps', '외국 물가 P*', 'Foreign prices P*') + op('=') + term('eps', '실질환율 ε', 'Real rate ε') + '</div>' +
      '<div class="eqrow e2">' + term('eps2', '실질환율 ε', 'Real rate ε') + op('→') + term('NXx', '순수출 NX', 'Net exports NX') + '</div>' +
      '<p class="eqdetail">' + T('구매력평가(PPP): 같은 재화는 어디서나 같은 가격 → ε = 1', 'Purchasing-power parity: one price everywhere → ε = 1') + '</p>' +
      '<div class="eqrow">' + term('pe', 'PPP 환율 e', 'PPP rate e') + op('=') + term('Ps2', '외국 물가 P*', 'Foreign prices P*') + op('÷') + term('P2', '국내 물가 P', 'Domestic prices P') + '</div>';

    function paint(host, st, hi) {
      $$('.term', host).forEach((t) => {
        const k = t.getAttribute('data-k'), v = st[k], b = $('b', t);
        if (v == null) { b.className = ''; b.textContent = ''; }
        else if (typeof v === 'number') { b.className = v > 0 ? 'up' : v < 0 ? 'dn' : ''; b.textContent = v > 0 ? T('▲ 증가', '▲ up') : v < 0 ? T('▼ 감소', '▼ down') : T('그대로', 'same'); }
        else { b.className = /▲/.test(v) ? 'up' : /▼/.test(v) ? 'dn' : ''; b.textContent = v; }
        t.classList.toggle('pulse', (hi || []).indexOf(k) >= 0);
      });
    }
    // 단계: [바뀌는 칸, 굵은 글, 작은 글, 문장 조각]
    function mkBeats(host, ev) {
      let st = {};
      return ev.steps.map((s) => {
        st = Object.assign({}, st, s.set);
        const snap = Object.assign({}, st);
        return { g: ev.t, ev: ev.t, sit: (ev.q ? ev.q + ' · ' : '') + ev.t, k: s.k, t: s.t || '', rs: s.rs, run: () => paint(host, snap, Object.keys(s.set)), wait: 1.6 };
      });
    }
    const FLOW = [
      { t: T('외국 관광객이 한국 화장품 구매', 'A foreign tourist buys Korean cosmetics'), q: 'SA 1', dir: 'r', steps: [
        { set: { X: 1 }, k: T('수출 ↑', 'Exports ↑'), t: T('외국인이 한국 재화를 산다', 'a foreigner buys a Korean good'), rs: T('수출 ↑', 'exports ↑') },
        { set: { NX: 1 }, k: 'NX ↑', t: T('NX = 수출 − 수입', 'NX = exports − imports'), rs: 'NX ↑' },
        { set: { A: 1, NCO: 1, NCO2: 1 }, k: 'NCO ↑', t: T('대금으로 받은 외국 통화 = 해외 자산 ↑', 'the foreign currency received is a foreign asset'), rs: 'NCO ↑' }] },
      { t: T('한국 학생이 미국 스트리밍 구독', 'A Korean student subscribes to a U.S. streaming service'), q: 'SA 1 · 2', dir: 'l', steps: [
        { set: { M: 1 }, k: T('수입 ↑', 'Imports ↑'), t: T('한국인이 외국 서비스를 산다', 'a Korean buys a foreign service'), rs: T('수입 ↑', 'imports ↑') },
        { set: { NX: -1 }, k: 'NX ↓', t: T('NX = 수출 − 수입', 'NX = exports − imports'), rs: 'NX ↓' },
        { set: { F: 1, NCO: -1, NCO2: -1 }, k: 'NCO ↓', t: T('외국인이 받은 원화 = 외국인의 국내 자산 ↑', 'the won paid is a Korean asset held abroad'), rs: 'NCO ↓' }] },
      { t: T('현대차가 미국에 공장 건설', 'Hyundai builds a plant in the U.S.'), q: 'SA 3', dir: 'r', steps: [
        { set: { A: '▲ ' + T('직접투자', 'direct') }, k: T('해외 자산 ↑', 'Foreign assets ↑'), t: T('직접 소유 · 경영 = 해외직접투자', 'owned and run = foreign direct investment'), rs: T('해외 자산 ↑', 'foreign assets ↑') },
        { set: { NCO: 1, NCO2: 1 }, k: 'NCO ↑', t: T('국내 거주자의 해외 자산 매입 ↑', 'residents buy more foreign assets'), rs: 'NCO ↑' }] },
      { t: T('한국인이 미국 주식 매입', 'A Korean buys U.S. stock'), q: 'SA 2 · 3', dir: 'r', steps: [
        { set: { A: '▲ ' + T('포트폴리오', 'portfolio') }, k: T('해외 자산 ↑', 'Foreign assets ↑'), t: T('주식 · 채권만 산다 = 해외포트폴리오투자', 'shares or bonds only = portfolio investment'), rs: T('해외 자산 ↑', 'foreign assets ↑') },
        { set: { NCO: 1, NCO2: 1 }, k: 'NCO ↑', t: '', rs: 'NCO ↑' }] },
      { t: T('일본 연기금이 한국 국채 매입', 'A Japanese pension fund buys Korean bonds'), q: 'SA 2', dir: 'l', steps: [
        { set: { F: '▲ ' + T('포트폴리오', 'portfolio') }, k: T('외국인의 국내 자산 ↑', 'Foreign-owned Korean assets ↑'), t: T('외국인이 한국 자산을 산다 = 자본 유입', 'a foreigner buys a Korean asset = capital inflow'), rs: T('외국인의 국내 자산 ↑', 'foreign-owned Korean assets ↑') },
        { set: { NCO: -1, NCO2: -1 }, k: 'NCO ↓', t: T('NCO = 해외 자산 매입 − 외국인의 국내 자산 매입', 'NCO = our purchases − their purchases'), rs: 'NCO ↓' }] },
      { t: T('국민저축 증가', 'National saving rises'), q: 'MC 4', dir: 'r', steps: [
        { set: { S: 1, I: 0 }, k: 'S ↑', t: T('국내투자 I 는 그대로', 'investment I unchanged'), rs: 'S ↑' },
        { set: { NCO2: 1, NCO: 1 }, k: 'NCO ↑', t: 'S = I + NCO', rs: 'NCO ↑' },
        { set: { NX: 1 }, k: 'NX ↑', t: 'NX = NCO', rs: 'NX ↑' }] },
      { t: T('수출 30 · 수입 40 · 투자 60 → 저축?', 'Exports 30 · imports 40 · investment 60 → saving?'), q: 'MC 5', steps: [
        { set: { X: '30', M: '40' }, k: T('수출 30 · 수입 40', 'Exports 30 · imports 40'), t: '', rs: '' },
        { set: { NX: '▼ −10' }, k: 'NX = −10', t: '30 − 40', rs: 'NX ↓ −10' },
        { set: { NCO: '▼ −10', NCO2: '▼ −10' }, k: 'NCO = −10', t: 'NX = NCO', rs: 'NCO ↓ −10' },
        { set: { I: '60', S: '50' }, k: 'S = 50', t: 'S = I + NCO = 60 + (−10)', rs: T('국민저축 50', 'saving 50') }] }
    ];
    const XR = [
      { t: T('원화 절상', 'The won appreciates'), q: 'MC 7 · SA 4', dir: 'r', steps: [
        { set: { e: 1 }, k: 'e ↑', t: T('원화 1단위로 사는 외국 통화 ↑', 'each won buys more foreign currency'), rs: 'e ↑' },
        { set: { eps: 1, eps2: 1 }, k: 'ε ↑', t: T('한국 재화가 상대적으로 비싸짐', 'Korean goods relatively dearer'), rs: 'ε ↑' },
        { set: { NXx: -1 }, k: 'NX ↓', t: T('수출 ↓ · 수입 ↑', 'exports ↓ · imports ↑'), rs: 'NX ↓' }] },
      { t: T('한국 물가가 외국보다 빠르게 상승', 'Korean prices rise faster than foreign prices'), q: 'SA 5', dir: 'r', steps: [
        { set: { e: 0, P: 1 }, k: 'P ↑', t: T('명목환율 e 는 그대로', 'nominal rate e unchanged'), rs: 'P ↑' },
        { set: { eps: 1, eps2: 1 }, k: 'ε ↑', t: 'ε = e × P ÷ P*', rs: 'ε ↑' },
        { set: { NXx: -1 }, k: 'NX ↓', t: '', rs: 'NX ↓' }] },
      { t: T('외국 물가가 더 빠르게 상승', 'Foreign prices rise faster'), q: 'SA 5', dir: 'l', steps: [
        { set: { e: 0, Ps: 1 }, k: 'P* ↑', t: T('명목환율 e 는 그대로', 'nominal rate e unchanged'), rs: 'P* ↑' },
        { set: { eps: -1, eps2: -1 }, k: 'ε ↓', t: 'ε = e × P ÷ P*', rs: 'ε ↓' },
        { set: { NXx: 1 }, k: 'NX ↑', t: '', rs: 'NX ↑' }] },
      { t: T('한국은행 통화량 증가 (PPP)', 'Bank of Korea expands money (PPP)'), q: 'MC 16 · 18', dir: 'l', steps: [
        { set: { P2: 1 }, k: 'P ↑', t: T('통화량 ↑ → 물가 ↑ (Ch30)', 'more money → higher prices (Ch30)'), rs: 'P ↑' },
        { set: { pe: -1 }, k: T('e ↓ 원화 절하', 'e ↓ won depreciates'), t: 'e = P* ÷ P', rs: T('e ↓', 'e ↓') }] },
      { t: T('한국 물가 연 4% · 미국 연 1% 상승 (PPP)', 'Korean prices +4% a year, U.S. +1% (PPP)'), q: 'MC 19', dir: 'l', steps: [
        { set: { P2: '▲ 4%', Ps2: '▲ 1%' }, k: 'P +4% · P* +1%', t: '', rs: '' },
        { set: { pe: '▼ ≈ 3%' }, k: T('e(달러/원) ≈ −3%', 'e ($ per won) ≈ −3%'), t: T('원/달러는 약 3% 상승 = 원화 절하', 'won per dollar ≈ +3% = the won depreciates'), rs: T('e ↓ 약 3%', 'e ↓ about 3%') }] },
      { t: T('빅맥: 150엔/$ · 미국 $5 · 일본 600엔', 'Big Mac: ¥150/$ · U.S. $5 · Japan ¥600'), q: 'MC 8 · 12', steps: [
        { set: { e: '150', P: '$5', Ps: '¥600' }, k: 'e × P = ¥750', t: T('미국 빅맥의 엔화 가격 (미국 = 자국)', 'U.S. Big Mac in yen (home = U.S.)'), rs: '' },
        { set: { eps: '1.25', eps2: '1.25' }, k: 'ε = 750 ÷ 600 = 1.25', t: T('미국 빅맥 1개 = 일본 빅맥 1.25개', 'one U.S. Big Mac = 1.25 Japanese'), rs: T('ε ↑ 1.25', 'ε ↑ 1.25') },
        { set: { pe: '120', Ps2: '¥600', P2: '$5' }, k: T('PPP e = 120엔', 'PPP e = ¥120'), t: T('ε > 1 → 일본에서 사서 미국에서 판다 · 달러 고평가', 'ε > 1 → buy in Japan, sell in the U.S. · the dollar is overvalued'), rs: '' }] }
    ];
    Object.assign(A.COND, EN ? {} : {
      '외국 관광객이 한국 화장품 구매': '외국 관광객이 한국 화장품을 사면', '한국 학생이 미국 스트리밍 구독': '한국 학생이 미국 스트리밍 서비스를 구독하면',
      '현대차가 미국에 공장 건설': '현대차가 미국에 공장을 지으면', '한국인이 미국 주식 매입': '한국인이 미국 주식을 사면', '일본 연기금이 한국 국채 매입': '일본 연기금이 한국 국채를 사면',
      '국민저축 증가': '국민저축이 늘면', '원화 절상': '원화가 절상되면', '한국 물가가 외국보다 빠르게 상승': '한국 물가가 외국보다 빠르게 오르면',
      '외국 물가가 더 빠르게 상승': '외국 물가가 더 빠르게 오르면', '한국은행 통화량 증가 (PPP)': 'PPP 가 성립할 때 한국은행이 통화량을 늘리면',
      '한국 물가 연 4% · 미국 연 1% 상승 (PPP)': 'PPP 가 성립할 때 한국 물가가 4%, 미국 물가가 1% 오르면'
    });
    const plF = A.Player($('#pl31f')), plX = A.Player($('#pl31x'));
    const wire = (opts, list, pl, host) => A.list($(opts), list, (i) => { if (i < 0) { pl.clear(); paint(host, {}, []); } else pl.load(mkBeats(host, list[i])); });
    wire('#o31f', FLOW, plF, $('#f31')); wire('#o31x', XR, plX, $('#x31'));
    paint($('#f31'), {}, []); paint($('#x31'), {}, []);
    let cur = 'f';
    function showSub(v, push) {
      if (v !== 'f' && v !== 'x') v = cur;
      cur = v;
      $$('#c31 .sub button').forEach((b) => b.setAttribute('aria-selected', String(b.getAttribute('data-sub') === v)));
      $('#p31f').hidden = v !== 'f'; $('#p31x').hidden = v !== 'x';
      if (push) { history.replaceState(null, '', v === 'x' ? '#ch31-x' : '#ch31'); A.alignTabs(); }
    }
    $$('#c31 .sub button').forEach((b) => b.addEventListener('click', () => showSub(b.getAttribute('data-sub'), true)));
    showSub('f', false);
    return { id: 'ch31', show: (sub) => showSub(sub, false) };
  });
})();
