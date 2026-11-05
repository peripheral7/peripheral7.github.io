/* Econ2 Interactive — Real world 모드
   · 토글 [Basic | Real world] · localStorage 'econ2.mode' · <html class="rw">
   · 카드: 예측 질문 → 실제 데이터 그래프 → 이론 대조 → 뉴스·연구
   · 데이터: real-data.json (FRED, scripts/econ2-real-data.mjs)
   · 한국어판(<html lang="ko">): real-ko.js 가 먼저 window.RW_KO = { cases } 를 둔다(사례 구조 · 숫자는 영문과 같고 글만 한국어). 화면 글자는 UI */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const KEY = 'econ2.mode';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const put = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* no storage */ } };

  /* ───────── 사례 ───────── */
  // 장 번호별 · m 버튼 · q 질문 · opts/ans 선택 · v 공개 · chart(marks: [날짜, 선, 글, 'below'|'side'|'left'?]) · th · src(k d t s u)
  const FED = 'https://www.federalreserve.gov/';
  const CASES = { 29: [
    {
      m: /^Reserve ratio cut/, when: 'March 2020 · United States', title: 'The Fed cut the reserve requirement to 0%',
      q: 'In March 2020 the Fed cut the required reserve ratio to 0%. In the model, the multiplier 1/R would explode. What happened to the money multiplier (M2 ÷ monetary base) over the next month?',
      opts: ['Shot up', 'Rose a little', 'Fell'], ans: 2,
      v: 'It fell — from 4.5 (Feb 2020) to 3.5 (Apr 2020).',
      chart: { k: 'mult', from: '2017-01', to: '2022-12', vline: ['2020-03', '0% requirement'], marks: [['2020-02', 0, '4.5'], ['2020-04', 0, '3.5']], y: 'M2 ÷ monetary base', cap: 'M2SL ÷ BOGMBASE, monthly' },
      th: 'The rule was not binding. In Feb 2020 banks held ==$1.73 trillion of reserves but only $0.21 trillion was required==, so the R that matters — the share of deposits banks choose to hold as reserves — did not move when the rule went to 0%. At the same time the Fed created reserves fast (monetary base +40%, Feb → Apr), and banks kept them.',
      src: [
        { k: 'News', d: 'Mar 15, 2020', by: 'Federal Reserve', t: 'Reserve requirements cut to zero', s: 'The Board set all reserve requirement ratios to 0% from March 26, saying requirements no longer play a significant role now that it runs an "ample reserves" system.', u: FED + 'newsevents/pressreleases/monetary20200315b.htm' },
        { k: 'Research', d: '2020', by: 'Ihrig & Wolla, Federal Reserve Board', t: 'Let\'s close the gap: Revising teaching materials to reflect how the Federal Reserve implements monetary policy', s: 'Textbooks still teach the reserve-requirement and money-multiplier story, but the Fed now steers interest rates mainly through the interest it pays on reserves.', u: FED + 'econres/feds/lets-close-the-gap-revising-teaching-materials-to-reflect-how-the-federal-reserve-implements-monetary-policy.htm' }
      ]
    },
    {
      m: /^Banks hold more excess reserves/, when: '2008–2014 · United States', title: 'Banks piled up excess reserves',
      q: 'After the 2008 crisis, bank reserves grew from $46 billion to $2.8 trillion (Aug 2008 → Aug 2014) — far more than required. What happened to the money multiplier (M2 ÷ monetary base)?',
      opts: ['Rose', 'Stayed near 9', 'Fell'], ans: 2,
      v: 'It fell — from 9.2 to 2.8.',
      chart: { k: 'mult', from: '2000-01', to: '2019-12', band: ['2008-09', '2014-10'], marks: [['2008-08', 0, '9.2'], ['2014-08', 0, '2.8']], y: 'M2 ÷ monetary base', cap: 'M2SL ÷ BOGMBASE, monthly' },
      th: 'Just as the model says: when banks hold more reserves, the reserve ratio R rises and the multiplier 1/R falls. Banks held them because ==lending looked risky in the crisis and, from October 2008, the Fed paid interest on reserves==.',
      src: [
        { k: 'News', d: 'Oct 6, 2008', by: 'Federal Reserve', t: 'The Fed starts paying interest on reserves', s: 'The Board announced it would pay interest on banks\' required and excess reserves — so simply holding reserves at the Fed now earned a return.', u: FED + 'newsevents/pressreleases/monetary20081006a.htm' }
      ]
    },
    {
      m: /^Fed buys/, when: 'Nov 2008 – Oct 2014 · United States', title: 'Quantitative easing: the Fed bought trillions in bonds',
      q: 'Bond purchases (QE) raised the monetary base from $0.85 trillion to $4.08 trillion (Aug 2008 → Aug 2014). With the 2008 multiplier of 9.2, the textbook predicts M2 rises by about $30 trillion. How much did M2 actually rise?',
      opts: ['About +$30 trillion', 'About +$10 trillion', 'About +$3.7 trillion'], ans: 2,
      v: 'About +$3.7 trillion ($7.8T → $11.5T). The base grew ×4.8, M2 only ×1.47.',
      chart: { k: 'qe', from: '2006-01', to: '2016-12', band: ['2008-11', '2014-10'], marks: [['2014-08', 0, '×4.8'], ['2014-08', 1, '×1.47']], names: ['Monetary base', 'M2'], y: 'Index, Aug 2008 = 100', cap: 'BOGMBASE and M2SL, monthly, Aug 2008 = 100' },
      th: 'Step one of the model worked: buying bonds added reserves dollar for dollar. Step two — banks lending the new reserves out again and again — mostly did not happen. ==The reserves stayed at the Fed as excess reserves== (see "Banks hold more excess reserves").',
      src: [
        { k: 'News', d: 'Nov 25, 2008', by: 'Federal Reserve', t: 'The Fed launches large-scale purchases of mortgage-backed securities', s: 'The start of QE1: the Fed said it would buy debt issued by Fannie Mae, Freddie Mac and the Federal Home Loan Banks, plus mortgage-backed securities they guarantee.', u: FED + 'newsevents/pressreleases/monetary20081125b.htm' },
        { k: 'Research', d: '2009', by: 'Keister & McAndrews, New York Fed Staff Report 380', t: 'Why are banks holding so many excess reserves?', s: 'The total amount of reserves is set by the Fed\'s own actions; banks as a group cannot lend it away. A huge stock of reserves does not by itself mean banks stopped lending.', u: 'https://www.newyorkfed.org/research/staff_reports/sr380.html' }
      ]
    },
    {
      m: /^Fed lends/, when: 'March 2023 · United States', title: 'Silicon Valley Bank run: banks borrow from the Fed',
      q: 'Silicon Valley Bank failed on March 10, 2023 after depositors rushed to pull their money. Other banks borrowed heavily from the Fed, and the monetary base rose $250 billion from February to March. In the model, new reserves are lent out again and again, so with a multiplier of about 4 the money supply should rise about $1 trillion. What happened to M2 from February to March?',
      opts: ['Rose about $1 trillion', 'Rose a little', 'Fell about $300 billion'], ans: 2,
      v: 'M2 fell $309 billion ($21.24 trillion → $20.93 trillion, monthly averages) and another $195 billion in April. Meanwhile discount-window loans jumped from $4.6 billion to a record $152.9 billion in one week, above the 2008 crisis peak of $110.7 billion.',
      chart: { k: 'dw', from: '2019-01-01', to: '2024-06-30', marks: [['2020-03-25', 0, 'COVID $51B'], ['2023-03-15', 0, 'SVB $153B']], y: 'Discount-window loans, $ billion', cap: 'WLCFLPCL (primary credit), weekly' },
      th: 'The first step of the model happened: loans from the Fed added reserves and raised the monetary base. The multiplier step did not, because ==banks borrowed to pay depositors who were leaving, not to make new loans==. Deposits kept flowing out, so M2 shrank even as the base grew. The Fed acted as lender of last resort: it kept deposits — and the money supply — from collapsing, rather than expanding them.',
      src: [
        { k: 'News', d: 'Mar 12, 2023', by: 'Treasury, Federal Reserve and FDIC', t: 'Joint statement on Silicon Valley Bank and Signature Bank', s: 'All depositors of the two failed banks would be protected, and the Fed opened a new Bank Term Funding Program lending to banks for up to one year.', u: FED + 'newsevents/pressreleases/monetary20230312a.htm' }
      ]
    }
  ], 30: [
    {
      m: /^Fed doubles/, when: '2020–2022 · United States', title: 'Pandemic money surge, then a 40-year high in inflation',
      q: 'M2 grew 27% in the year to February 2021 — the fastest since records began in 1959. In the model, more money means a higher price level. When did CPI inflation peak?',
      opts: ['Right away, in 2020', 'About 4 months later (mid-2021)', 'About 16 months later (mid-2022)'], ans: 2,
      v: 'In June 2022, at 9.0% (9.1% before seasonal adjustment) — the highest since 1981.',
      chart: { k: 'grow', from: '2015-01', to: '2025-12', marks: [['2021-02', 0, '27%'], ['2022-06', 1, '9.0%']], names: ['M2 growth', 'CPI inflation'], y: '% change from a year earlier', cap: 'M2SL and CPIAUCSL, monthly, % change from a year earlier' },
      th: 'Direction: right — ==money grew fast and prices followed, with a lag of more than a year==. Size: smaller than M × V = P × Y alone suggests. From Feb 2020 to Feb 2022 M2 rose 40% but consumer prices only 10%, because V fell: people held on to the extra money (see "Credit cards spread").',
      src: [
        { k: 'News', d: 'Jul 13, 2022', by: 'U.S. Bureau of Labor Statistics', t: 'Consumer Price Index — June 2022', s: 'The all-items CPI rose 9.1% over the 12 months to June 2022, the largest 12-month increase since 1981.', u: 'https://www.bls.gov/news.release/archives/cpi_07132022.htm' },
        { k: 'Research', d: '1995', by: 'McCandless & Weber, Minneapolis Fed Quarterly Review', t: 'Some Monetary Facts', s: 'Using up to 30 years of data for 110 countries, long-run money growth and inflation move almost one for one — the quantity theory works best over long periods.', u: 'https://www.minneapolisfed.org/research/qr/qr1931.pdf' }
      ]
    },
    {
      m: /^Fed cuts the money supply/, when: '2022–2023 · United States', title: 'M2 shrank for the first time on record',
      q: 'From March 2022 to October 2023, M2 fell 4.9% — its first decline since records began in 1959. In the model, less money means a lower price level. What happened to consumer prices (CPI)?',
      opts: ['Fell about 5%', 'Stayed about the same', 'Kept rising, about +7%'], ans: 2,
      v: 'Prices rose 7.0% — but inflation slowed from 9% to about 3%.',
      chart: { k: 'grow', from: '2021-01', to: '2024-12', marks: [['2023-04', 0, '−4.7%', 'below'], ['2023-06', 1, '3.1%']], names: ['M2 growth', 'CPI inflation'], y: '% change from a year earlier', cap: 'M2SL and CPIAUCSL, monthly, % change from a year earlier' },
      th: 'The model compares long-run levels. In reality ==the 5% cut came right after a 40% rise==, so money was still far above its 2020 level and the earlier surge was still reaching prices. What the cut changed was the trend: inflation fell from 9% to about 3% — the growth rate of P, not its level.',
      src: [
        { k: 'News', d: 'May 4, 2022', by: 'Federal Reserve', t: 'Plans for reducing the size of the Federal Reserve\'s balance sheet', s: 'From June 1, 2022 the Fed began letting its bonds mature without replacing them — the reverse of quantitative easing, shrinking the monetary base.', u: FED + 'newsevents/pressreleases/monetary20220504b.htm' }
      ]
    },
    {
      m: /^Credit cards spread/, when: '1960–2026 · United States', title: 'The velocity of money is not constant',
      q: 'Between 1960 and 1997, credit cards, ATMs and money-market funds spread. In the model people then hold less money for the same spending, so V = P × Y ÷ M rises. What happened to M2 velocity?',
      opts: ['Rose', 'Stayed the same', 'Fell'], ans: 0,
      v: 'It rose, from 1.82 to 2.19 (1997). Then it fell for two decades and hit a record low of 1.13 in 2020.',
      chart: { k: 'vel', from: '1960-01', to: '2099-12', marks: [['1960-01', 0, '1.82'], ['1997-07', 0, '2.19'], ['2020-04', 0, '1.13']], y: 'M2 velocity = nominal GDP ÷ M2', cap: 'M2V, quarterly' },
      th: 'The direction holds — ==easier payments raised V for decades==. But the shortcut "V is stable" did not: V fell after 1997 as interest rates dropped (holding money cost less), and collapsed in 2020 when people saved instead of spending. That is why the 2020 money surge raised prices far less than M2 alone suggested.',
      src: [
        { k: 'Data', d: 'quarterly since 1959', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Velocity of M2 Money Stock (M2V)', s: 'Velocity is nominal GDP divided by M2: how many times a year the average dollar is spent on final goods and services.', u: 'https://fred.stlouisfed.org/series/M2V' }
      ]
    }
  ], 33: [
  {
    m: /^Stock market crash/, when: 'March 2000 – October 2002 · United States', title: 'The dot-com crash: stocks fell 78%, but consumers kept spending',
    q: 'The Nasdaq index fell 78% from its peak on March 10, 2000 to October 9, 2002. In the model, lower stock prices cut household wealth, so consumption falls and AD shifts left. What happened to real consumer spending from 2000 Q1 to 2002 Q4?',
    opts: ['Fell about 8%', 'Rose about 7.5%', 'Stayed exactly flat'], ans: 1,
    v: 'It rose 7.5% (from 9,040 to 9,719 billion inflation-adjusted dollars). Real private investment, in contrast, was 10.9% lower in 2001 Q4 than in 2000 Q3.',
    chart: { k: 'c33_stock', from: '1999-01', to: '2004-10', marks: [['2002-07', 0, '−70%', 'below'], ['2002-10', 1, '+7.5%']], names: ['Nasdaq', 'Real consumer spending'], y: 'Index, 2000 Q1 = 100', cap: 'NASDAQCOM (quarterly average of daily closes) and PCECC96, quarterly, 2000 Q1 = 100' },
    th: 'The model\'s chain is wealth ↓ → C ↓ → AD ←. Here the AD shift came mostly from somewhere else: ==business investment collapsed while households kept buying==. Unemployment rose from 4.0% (Jan 2000) to 5.9% (Apr 2002) even though spending did not fall. Fed officials said the stock decline did restrain consumers, but income gains and tax cuts kept household spending up. A crash hurts spending through wealth, but the effect was smaller than the textbook arrow suggests.',
    src: [
      { k: 'News', d: 'Nov 12, 2002', by: 'Roger Ferguson, Federal Reserve Vice Chairman', t: 'Recent Experience and Economic Outlook', s: 'He says the 2001 downturn was led by a collapse in business spending on equipment and software. The stock decline held back consumers, yet household spending held up well, helped by income gains and income tax cuts.', u: 'https://www.federalreserve.gov/boarddocs/speeches/2002/200211122/default.htm' },
      { k: 'News', d: 'Jul 17, 2003', by: 'NBER Business Cycle Dating Committee', t: 'Business Cycle Dating Committee Announcement', s: 'The recession began in March 2001 and ended in November 2001; it lasted 8 months, a little shorter than the average postwar recession.', u: 'https://www.nber.org/news/business-cycle-dating-committee-announcement-july-17-2003' }
    ]
  },
  {
    m: /^Income tax cut/, when: 'May 2008 · United States', title: 'The 2008 tax rebates: income jumped, spending barely moved',
    q: 'In mid-2008 the government mailed out economic stimulus payments (tax rebates). Real disposable income rose 4.9% from April to May 2008. In the model, a tax cut raises disposable income, so consumption rises. What happened to real consumer spending that month?',
    opts: ['Rose about 5%', 'Rose about 2.5%', 'Barely changed: +0.2%'], ans: 2,
    v: 'Only +0.2%. People saved most of the first month\'s money: the saving rate jumped from 2.4% (April) to 6.8% (May), then fell back to 3.6% by July.',
    chart: { k: 'c33_rebate', from: '2007-02', to: '2009-06', marks: [['2008-05', 0, '+4.9%', 'side'], ['2008-05', 1, '+0.2%', 'below']], names: ['Disposable income', 'Consumer spending'], y: '% change from the previous month', cap: 'DSPIC96 and PCEC96, monthly, % change from the previous month' },
    th: 'The model gets the direction right but not the speed. A one-time payment is ==saved first and spent over the following months==. A study using survey data found households spent 12–30% of their payment on nondurables within three months, and 50–90% when cars and other durables are counted; the authors put the boost to consumption at 1.3–2.3% in 2008 Q2. Still, in the monthly totals the effect is hard to see: real spending fell 2.1% from May to December 2008, in the middle of the recession that had begun in December 2007.',
    src: [
      { k: 'Research', d: '2011 (revised 2013)', by: 'Parker, Souleles, Johnson & McClelland, NBER Working Paper 16684', t: 'Consumer Spending and the Economic Stimulus Payments of 2008', s: 'Using the random timing of payments, the authors find that households spent a large share of the money, especially on durable goods such as vehicles, and that this raised consumption in mid-2008.', u: 'https://www.nber.org/papers/w16684' },
      { k: 'Data', d: 'monthly since 1959', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Real Disposable Personal Income (DSPIC96)', s: 'Income after taxes and transfers, adjusted for inflation; the series shows the one-month spike in May 2008 when the payments went out.', u: 'https://fred.stlouisfed.org/series/DSPIC96' }
    ]
  },
  {
    m: /^Government purchases rise/, when: '1965–1969 · United States', title: 'Vietnam War spending pushed an economy at full employment into inflation',
    q: 'From early 1965 to spring 1968, federal defense spending rose 49% as the Vietnam War built up. In the model, higher government purchases shift AD right. U.S. inflation was 1.2% in December 1964. Where was it four years later?',
    opts: ['Still about 1%', 'About 4.7%', 'About 12%'], ans: 1,
    v: 'It reached 4.7% in December 1968 and 5.9% in December 1969, while unemployment fell to 3.4% (September 1968).',
    chart: { k: 'c33_gov', from: '1963-01', to: '1970-10', marks: [['1966-07', 0, '20%'], ['1969-10', 1, '5.7%']], names: ['Defense spending', 'CPI inflation'], y: '% change from a year earlier', cap: 'FDEFX (nominal, quarterly) and CPIAUCSL (first month of each quarter), % change from a year earlier' },
    th: 'This is the textbook case: ==AD shifted right when the economy was already near full employment, so prices rose more than output==. Real GDP grew 8.5% in the year to 1966 Q1, but only 2.7% in the year to 1967 Q4, while inflation kept climbing. War spending was not the only push: the Fed\'s history essay points to the Great Society programs and the war together, and President Johnson himself wrote in 1967 that inflation pressure had started in late 1965 as the economy neared full operation.',
    src: [
      { k: 'News', d: 'Jan 24, 1967', by: 'President Lyndon B. Johnson', t: 'Annual Budget Message to the Congress, Fiscal Year 1968', s: 'The President says that in late 1965 and early 1966, as the economy approached full operation, inflation pressure appeared and he asked Congress for tax changes to dampen it.', u: 'https://www.presidency.ucsb.edu/documents/annual-budget-message-the-congress-fiscal-year-1968' },
      { k: 'Research', d: '2013', by: 'Federal Reserve History', t: 'The Great Inflation', s: 'Great Society spending programs arrived when the Vietnam War was already straining the federal budget; these fiscal imbalances made monetary policy harder.', u: 'https://www.federalreservehistory.org/essays/great-inflation' }
    ]
  },
  {
    m: /^Turmoil abroad/, when: '2014–2016 · United States', title: 'The strong dollar: exports stalled while imports kept growing',
    q: 'From June 2014 to March 2015 the broad trade-weighted dollar index rose 14%. In the model, a stronger dollar makes U.S. goods dearer abroad, so net exports fall and AD shifts left. How much did real U.S. exports grow from 2014 Q3 to 2016 Q3?',
    opts: ['They fell about 5%', 'They barely grew: +1.5%', 'They rose about 10%'], ans: 1,
    v: 'Real exports rose only 1.5% (2,288 to 2,321 billion inflation-adjusted dollars), while real imports rose 6.8% (2,623 to 2,801).',
    chart: { k: 'c33_nx', from: '2012-01', to: '2017-10', vline: ['2014-07', 'Dollar starts rising'], marks: [['2015-10', 0, '−1.5%', 'below'], ['2015-01', 1, '6.7%']], names: ['Real exports', 'Real imports'], y: '% change from a year earlier', cap: 'EXPGSC1 and IMPGSC1, quarterly, % change from a year earlier; dollar: DTWEXBGS' },
    th: 'The direction is right: ==exports stalled and imports kept growing==, so net exports dragged on GDP. A Fed Vice Chairman estimated that net exports lowered GDP growth by almost ¾ of a percentage point over the year to late 2015, close to what the Fed\'s model predicted. Two things the simple model hides: GDP still grew 4.3% over those two years, since other parts of demand kept growing; and the trade deficit measured in dollars hardly changed (−$489 billion in 2014 Q3, −$481 billion in 2016 Q3), partly because a stronger dollar lowers the dollar price of each import.',
    src: [
      { k: 'News', d: 'Nov 12, 2015', by: 'Stanley Fischer, Federal Reserve Vice Chairman', t: 'The Transmission of Exchange Rate Changes to Output and Inflation', s: 'A stronger dollar raises the foreign price of U.S. goods and lowers exports; the effect on imports is weaker, so net exports fall and GDP is pushed down.', u: 'https://www.federalreserve.gov/newsevents/speech/fischer20151112a.htm' },
      { k: 'Data', d: 'daily since 2006', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Nominal Broad U.S. Dollar Index (DTWEXBGS)', s: 'A trade-weighted average of the dollar against the currencies of major U.S. trading partners; higher means a stronger dollar.', u: 'https://fred.stlouisfed.org/series/DTWEXBGS' }
    ]
  },
  {
    m: /^Oil price spike/, when: '1973–1975 · United States', title: 'The 1973–74 oil shock: inflation and unemployment rose together',
    q: 'After the Arab oil embargo that began in October 1973, the crude oil price rose from $4.31 (September 1973) to $11.16 (October 1974). In the model, an oil shock shifts SRAS left. What happened to inflation and unemployment?',
    opts: ['Both fell', 'Inflation rose to 12%, unemployment stayed near 5%', 'Inflation rose to 12%, unemployment rose to 9%'], ans: 2,
    v: 'CPI inflation peaked at 12.2% (November 1974) and unemployment reached 9.0% (May 1975) — stagflation.',
    chart: { k: 'c33_oil', from: '1972-01', to: '1977-12', vline: ['1973-10', 'Oil embargo'], marks: [['1974-11', 0, '12.2%'], ['1975-05', 1, '9.0%']], names: ['CPI inflation', 'Unemployment rate'], y: '% (inflation: change from a year earlier)', cap: 'CPIAUCSL and UNRATE, monthly; oil price: WTISPLC' },
    th: 'Exactly the model\'s prediction: ==a leftward SRAS shift raises prices and cuts output at the same time==. Real GDP fell in four of the five quarters from 1974 Q1 to 1975 Q1. But oil was not the only cause: the Fed\'s history essay stresses that inflation was already high and factories were near full capacity before the embargo. The 2022 oil spike shows how much depends on the surrounding economy: oil rose 60% (Dec 2021 to Jun 2022) and inflation hit 9.0%, but unemployment stayed between 3.5% and 3.9% through 2022, and real GDP fell only in 2022 Q1 (−0.3%) before growing every quarter through 2023.',
    src: [
      { k: 'Research', d: 'Nov 22, 2013', by: 'Michael Corbett, Federal Reserve History', t: 'Oil Shock of 1973–74', s: 'The embargo and OAPEC production cuts nearly quadrupled the oil price by January 1974. Higher oil prices tend to push inflation up and growth down at once, which leaves a central bank facing a trade-off.', u: 'https://www.federalreservehistory.org/essays/oil-shock-of-1973-74' },
      { k: 'Data', d: 'monthly since 1946', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Spot Crude Oil Price: West Texas Intermediate (WTISPLC)', s: 'Monthly crude oil price in dollars per barrel; the 1970s values are posted prices that changed in steps.', u: 'https://fred.stlouisfed.org/series/WTISPLC' }
    ]
  },
  {
    m: /^Technological progress/, when: '1995–2000 · United States', title: 'The late-1990s productivity boom: faster growth without more inflation',
    q: 'U.S. output per hour in the business sector grew about 3.0% a year from the end of 1995 to the end of 2000, up from 1.4% in 1973–95. In the model, better technology shifts both LRAS and SRAS right: more output at lower prices. Meanwhile unemployment fell from 5.6% (December 1995) to 3.8% (April 2000). What did inflation do in 1996–2000?',
    opts: ['Prices fell (deflation)', 'Stayed moderate, 1.4–3.8%', 'Climbed above 6%'], ans: 1,
    v: 'It stayed between 1.4% and 3.8% — no deflation, but no overheating either, even with unemployment at a 30-year low.',
    chart: { k: 'c33_tech', from: '1990-01', to: '2004-10', band: ['1995-10', '2000-10'], marks: [['1999-10', 0, '4.2%']], names: ['Productivity growth', 'CPI inflation'], y: '% change from a year earlier', cap: 'OPHNFB (output per hour, nonfarm business) and CPIAUCSL (quarterly average), quarterly, % change from a year earlier' },
    th: 'The model says more productivity means more output at lower prices. The output half is clear: growth was fast and unemployment fell to 3.8% in April 2000, the lowest in 30 years. The price half shows up differently: the price level did not fall; ==inflation stayed moderate even as unemployment dropped==, where weak productivity would have pushed it up. Fed economists estimate that information technology (computers and their production) explains about two-thirds of the 1-point step-up in productivity growth between the first and second halves of the 1990s.',
    src: [
      { k: 'Research', d: 'Apr 2000', by: 'Oliner & Sichel, Federal Reserve Board (FEDS 2000-20)', t: 'The Resurgence of Growth in the Late 1990s: Is Information Technology the Story?', s: 'Growth accounting shows IT use and computer production explain about two-thirds of the acceleration in productivity growth in the late 1990s.', u: 'https://www.federalreserve.gov/econres/feds/the-resurgence-of-growth-in-the-late-1990s-is-information-technology-the-story.htm' },
      { k: 'Data', d: 'quarterly since 1947', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Nonfarm Business Sector: Real Output Per Hour of All Persons (OPHNFB)', s: 'An index of how much output the business sector produces per hour worked.', u: 'https://fred.stlouisfed.org/series/OPHNFB' }
    ]
  }
], '28w': [
    {
      m: /^Wage above equilibrium/, when: '1992 · New Jersey & Pennsylvania', title: 'New Jersey raised its minimum wage — fast-food jobs did not fall',
      q: 'On April 1, 1992 New Jersey raised its minimum wage from $4.25 to $5.05 an hour; Pennsylvania left it at $4.25. Card and Krueger surveyed 410 fast-food restaurants in both states before and after. In the model a wage above equilibrium cuts employment. Relative to Pennsylvania, what happened to employment at New Jersey fast-food restaurants?',
      opts: ['Fell by about 13%', 'Rose by about 13%', 'Did not change at all'], ans: 1,
      v: 'It rose — by about 13% relative to Pennsylvania stores.',
      th: 'The model predicts fewer jobs when the wage is forced above W_E. This classic study found ==no loss of fast-food jobs==, which suggests employers can absorb a modest increase in other ways. It compared similar restaurants on both sides of the border, because statewide numbers mix all workers and industries. The finding was challenged, and the authors answered their critics in the American Economic Review in 2000.',
      src: [
        { k: 'Research', d: 'Oct 1993 (AER, Sept 1994)', by: 'Card & Krueger, NBER Working Paper 4509', t: 'Minimum Wages and Employment: A Case Study of the Fast Food Industry in New Jersey and Pennsylvania', s: 'The authors compared stores on both sides of the border before and after the rise and report that their results challenge the prediction that a higher minimum lowers employment.', u: 'https://www.nber.org/papers/w4509' },
        { k: 'Research', d: 'Dec 2000', by: 'Card & Krueger, American Economic Review 90(5)', t: 'Minimum Wages and Employment: A Case Study of the Fast-Food Industry in New Jersey and Pennsylvania: Reply', s: 'The authors\' reply to critics of the study, in the same journal — the minimum-wage question stayed under debate for years.', u: 'https://www.aeaweb.org/articles?id=10.1257/aer.90.5.1397' }
      ]
    },
    {
      m: /^Labor demand falls/, when: 'March – May 2020 · United States', title: 'COVID-19: labor demand collapsed, but average wages rose',
      q: 'Between March and April 2020 U.S. payroll employment fell by about 20.5 million, and the unemployment rate jumped from 3.5% (Feb) to 14.8% (Apr). In the model the wage is stuck at W_E in the short run, then falls. What happened to average hourly earnings (production and nonsupervisory workers) compared with a year earlier?',
      opts: ['Rose by almost 8%', 'Stayed about the same', 'Fell by about 5%'], ans: 0,
      v: 'They rose: $25.14 in April 2020 versus $23.33 in April 2019, +7.8% (it was +3.6% in February).',
      chart: { k: 'c28_covid', from: '2019-01', to: '2021-12', marks: [['2020-04', 0, '14.8%'], ['2020-04', 1, '+7.8%', 'below']], names: ['Unemployment rate', 'Hourly earnings'], y: '% (earnings: change from a year earlier)', cap: 'UNRATE and AHETPI (% change from a year earlier), monthly' },
      th: 'Stage 1 fits: demand fell and unemployment jumped while firms did not cut wages. Stage 2 (the wage falls to a new equilibrium) did not appear. The average rose because, as BLS noted, ==the jobs lost were mostly low-paid, so the ones left were higher paid== — a composition effect. Also 18.1 million of the unemployed said they were on temporary layoff, expecting to be recalled, so this looked more like a pause than a permanent shift of D.',
      src: [
        { k: 'News', d: 'May 8, 2020', by: 'U.S. Bureau of Labor Statistics', t: 'The Employment Situation — April 2020', s: 'Payrolls dropped by 20.5 million in April and the number on temporary layoff rose about ten-fold; BLS said the rise in average earnings largely reflects job loss among lower-paid workers.', u: 'https://www.bls.gov/news.release/archives/empsit_05082020.htm' },
        { k: 'Data', d: 'monthly since 1964', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Average Hourly Earnings of Production and Nonsupervisory Employees, Total Private (AHETPI)', s: 'The series used in the chart, collected by BLS from employers\' payroll records.', u: 'https://fred.stlouisfed.org/series/AHETPI' }
      ]
    }
  ], '28u': [
    {
      m: /^Laid off, searching/, when: '2007–2010 · United States', title: 'Looking for work took far longer in the Great Recession',
      q: 'In the model a laid-off worker who searches counts as unemployed until a job is found. In November 2007 the median unemployed person had been looking for 8.6 weeks. By June 2010, how long was the median spell?',
      opts: ['About 12 weeks', 'About 25 weeks', 'About 17 weeks'], ans: 1,
      v: 'About 25 weeks (25.2) — nearly three times as long as in 2007.',
      chart: { k: 'c28_dur', from: '2000-01', to: '2019-12', marks: [['2007-11', 0, '8.6 wks', 'left'], ['2010-06', 0, '25.2 wks'], ['2009-10', 1, '10.0%', 'below']], names: ['Median weeks', 'Unemployment rate'], y: 'Weeks / percent', cap: 'UEMPMED (median duration of unemployment, weeks) and UNRATE, monthly' },
      th: 'Direction is right: a laid-off searcher is counted as unemployed. But the model treats this as a short stop between jobs. ==In 2010 searching often lasted half a year==, and the duration kept rising for months after the unemployment rate peaked (10.0% in Oct 2009). In April 2010 the long-term unemployed (27 weeks or more) made up 45.5% of all unemployed, a record share in the BLS data.',
      src: [
        { k: 'Research', d: '2018', by: 'U.S. Bureau of Labor Statistics, Monthly Labor Review', t: 'Great Recession, great recovery? Trends from the Current Population Survey', s: 'Median unemployment duration rose from 8.6 weeks in Nov 2007 to 25.2 weeks in June 2010, and long-term unemployment was 45.5 percent of the unemployed in April 2010.', u: 'https://www.bls.gov/opub/mlr/2018/article/great-recession-great-recovery.htm' },
        { k: 'Data', d: 'monthly since 1967', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Median Duration of Unemployment (UEMPMED)', s: 'The series used in the chart: the middle value of how long unemployed people have been looking, in weeks.', u: 'https://fred.stlouisfed.org/series/UEMPMED' }
      ]
    },
    {
      m: /^Laid off, gives up searching/, when: 'February – April 2020 · United States', title: 'Millions left the labor force in the COVID-19 shock',
      q: 'The model says a laid-off worker who stops searching leaves the labor force, so participation falls and the unemployment rate rises less. From February to April 2020 the unemployment rate rose from 3.5% to 14.8%. By how many percentage points did the labor force participation rate fall (63.3% in Feb)?',
      opts: ['About 0.5 points', 'About 1.5 points', 'About 3.2 points'], ans: 2,
      v: 'It fell 3.2 points, to 60.1% — about 6.4 million people left the labor force from March to April.',
      chart: { k: 'c28_lfp', from: '2020-01', to: '2022-12', marks: [['2020-04', 0, '−3.2', 'below'], ['2020-04', 1, '+11.3']], names: ['Participation', 'Unemployment rate'], y: 'Change since Feb 2020, percentage points', cap: 'CIVPART and UNRATE, monthly, change from Feb 2020' },
      th: 'The flow is real: people who stop looking drop out of the labor force, which keeps the official rate from rising even more. But ==the label "gives up" fits only a few of them==. BLS counted 574,000 discouraged workers in April, against 9.9 million people outside the labor force who said they wanted a job. By definition none of them had searched in the last 4 weeks, so none counted as unemployed.',
      src: [
        { k: 'News', d: 'May 8, 2020', by: 'U.S. Bureau of Labor Statistics', t: 'The Employment Situation — April 2020', s: 'Reports the drop in participation, 9.9 million people not in the labor force who wanted a job, and 2.3 million marginally attached.', u: 'https://www.bls.gov/news.release/archives/empsit_05082020.htm' },
        { k: 'Data', d: 'Current Population Survey definitions', by: 'U.S. Bureau of Labor Statistics', t: 'Concepts and definitions: discouraged workers and people who want a job now', s: 'Explains that people who want a job now but have not searched in 4 weeks are outside the labor force, and that discouraged workers are a subset of them.', u: 'https://www.bls.gov/cps/definitions.htm' }
      ]
    },
    {
      m: /^Reclassify token job-seekers/, when: '2009–2020 · United States', title: 'The official rate vs the broadest measure (U-6)',
      q: 'The model shows how recounting people between "unemployed" and "not in the labor force" changes the official unemployment rate (U-3). BLS also publishes U-6, which adds people who want a job but stopped searching, plus part-timers who want full-time work. In April 2020 U-3 was 14.8%. What was U-6?',
      opts: ['About 23%', 'About 19%', 'About 16%'], ans: 0,
      v: 'U-6 was 22.9% — 8.1 points above the official rate that month.',
      chart: { k: 'c28_u6', from: '1994-01', to: '2024-12', marks: [['2009-12', 1, '17.2%'], ['2020-04', 1, '22.9%'], ['2020-04', 0, '14.8%', 'below']], names: ['U-3 (official)', 'U-6 (broadest)'], y: '% of labor force', cap: 'UNRATE and U6RATE, monthly' },
      th: 'The model is right that the rule for who counts as unemployed changes the rate — U-6 is a different rule. It adds the marginally attached (2.3 million) and people working part time for economic reasons (10.9 million) in April 2020. The gap is large even in normal times: ==in Feb 2020 U-3 was 3.5% and U-6 7.0%, twice as high==. So the official rate counts active searchers; it is not a full measure of slack.',
      src: [
        { k: 'Data', d: 'Current Population Survey definitions', by: 'U.S. Bureau of Labor Statistics', t: 'Concepts and definitions: alternative measures of labor underutilization (U-1 to U-6)', s: 'U-3 is the official rate; U-6 is the broadest, adding groups that the official rate leaves out.', u: 'https://www.bls.gov/cps/definitions.htm' },
        { k: 'News', d: 'May 8, 2020', by: 'U.S. Bureau of Labor Statistics', t: 'The Employment Situation — April 2020', s: 'Gives the April 2020 counts of marginally attached workers and people working part time for economic reasons, and defines U-6.', u: 'https://www.bls.gov/news.release/archives/empsit_05082020.htm' }
      ]
    }
  ] };
  // 용어 주석: [찾을 글자, 뜻]. 카드마다 처음 나오는 곳만 누를 수 있다(한국어판은 real-ko.js 의 gloss)
  const GLOSS = [
    [/required reserve ratio|reserve requirements?/, "Reserve requirement: the minimum share of deposits a bank must, by law, keep as reserves (cash in the vault or deposits at the central bank)."],
    [/excess reserves/, "Excess reserves: reserves a bank holds above the legal minimum."],
    [/monetary base/, "Monetary base: currency in circulation plus bank reserves, the money the central bank creates directly."],
    [/money multiplier/, "Money multiplier: how many dollars of money (here M2) exist per dollar of monetary base. In the simple model it equals 1/R."],
    [/\bM2\b/, "M2: a broad measure of money: currency, checking and savings deposits, small time deposits and retail money-market funds."],
    [/ample reserves/, "Ample-reserves system: since 2008 reserves are so plentiful that the Fed steers interest rates by the rate it pays on reserves, not by making reserves scarce."],
    [/interest (?:it pays )?on reserves/, "Interest on reserves: interest the Fed pays banks on the reserves they keep at the Fed. A higher rate makes holding reserves more attractive than lending them out cheaply."],
    [/quantitative easing|\bQE\b/, "Quantitative easing (QE): the central bank buys large amounts of long-term bonds with newly created reserves to push long-term interest rates down."],
    [/mortgage-backed securities/, "Mortgage-backed securities: bonds backed by a pool of home loans; holders receive the borrowers’ payments."],
    [/Fannie Mae, Freddie Mac/, "Fannie Mae and Freddie Mac: government-sponsored U.S. companies that buy home loans from lenders and package them into securities."],
    [/[Dd]iscount-window loans?/, "Discount window: the Fed’s standing facility that lends to banks against collateral, usually overnight or for a few weeks."],
    [/lender of last resort/, "Lender of last resort: the central bank’s role of lending to sound banks in a panic, so that a run does not force them to fail."],
    [/Bank Term Funding Program/, "Bank Term Funding Program (BTFP): an emergency Fed program (March 2023 to March 2024) that lent to banks for up to a year, valuing their Treasury and similar bonds at face value."],
    [/\bCPI\b/, "CPI (Consumer Price Index): the price of a fixed basket of goods and services that households buy, compared with a base period."],
    [/velocity/, "Velocity of money (V): how many times a year the average dollar is spent on final goods and services; V = P × Y ÷ M."],
    [/money-market funds/, "Money-market funds: funds that hold short-term, safe debt and let investors take money out almost like a bank account."],
    [/Nasdaq index/, "Nasdaq index: a stock index of companies listed on the Nasdaq exchange, heavy in technology firms."],
    [/[Rr]eal disposable income/, "Real disposable income: household income after taxes and government transfers, adjusted for inflation."],
    [/saving rate/, "Saving rate: the share of disposable income that households do not spend."],
    [/nondurables/, "Nondurables: goods used up quickly, such as food and gasoline. Durables (cars, appliances) last for years."],
    [/Great Society/, "Great Society: President Johnson’s 1960s domestic programs, such as Medicare, Medicaid and anti-poverty spending."],
    [/trade-weighted dollar index/, "Trade-weighted dollar index: the dollar’s average value against the currencies of U.S. trading partners, weighted by how much the U.S. trades with each."],
    [/net exports/, "Net exports: exports minus imports."],
    [/Arab oil embargo/, "1973 Arab oil embargo: after the October 1973 war, Arab oil producers stopped selling oil to the U.S. and some other countries and cut output."],
    [/stagflation/, "Stagflation: rising prices together with falling output and rising unemployment."],
    [/[Oo]utput per hour/, "Output per hour (labor productivity): how much is produced per hour worked."],
    [/[Gg]rowth accounting/, "Growth accounting: splitting output growth into the parts due to more labor, more capital and better technology."],
    [/payroll employment|[Pp]ayrolls/, "Payroll employment: the number of jobs on employers’ payrolls outside farming, from the BLS survey of businesses."],
    [/temporary layoff/, "Temporary layoff: laid off but expecting to be recalled; counted as unemployed even without searching."],
    [/composition effect/, "Composition effect: an average changes because the mix of the group changes, not because anyone’s own value changes."],
    [/production and nonsupervisory workers/, "Production and nonsupervisory workers: about four in five private employees: everyone except managers and supervisors."],
    [/long-term unemployed/, "Long-term unemployed: people who have been looking for work for 27 weeks or more."],
    [/discouraged workers/, "Discouraged workers: people who want a job and searched in the past year, but not in the last 4 weeks because they think no job is available. They are not in the labor force."],
    [/marginally attached/, "Marginally attached: people who want a job, are available, and searched in the past 12 months but not in the last 4 weeks, for any reason. Discouraged workers are a subset."],
    [/part time for economic reasons|part-timers who want full-time work/, "Part time for economic reasons: people who want full-time work but work part time because business is slack or they cannot find a full-time job."],
    [/Card and Krueger/, "David Card and Alan Krueger: labor economists. Card shared the 2021 Nobel Prize partly for this kind of natural-experiment research."],
    [/\bBLS\b/, "BLS (Bureau of Labor Statistics): the U.S. government agency that publishes jobs, wages and price data."]
  ];
  const KO = document.documentElement.lang === 'ko' && window.RW_KO;
  const CS = KO ? KO.cases : CASES;
  const G = KO ? KO.gloss || [] : GLOSS;
  const UI = KO ? {
    tag: '현실 연결', pick: '<b class="rwchip">현실</b> 표시가 붙은 사건을 고르면 모형을 미국 실제 데이터와 맞춰 볼 수 있다.',
    predict: '먼저 예측:', skip: '바로 보기', right: '✓ 정답.', wrong: '✗ 오답.', theory: '이론과 현실',
    source: '출처: FRED — ', got: ' · 받은 날 ', band: ' · 노란 칸: 사건 기간', nodata: '데이터를 불러오지 못했다.', fold: '시간선 내리기', unfold: '시간선 올리기', foldS: '내리기', unfoldS: '올리기', mode: '모드', basic: '기본', rw: '현실 연결'
  } : {
    tag: 'Real world', pick: 'Pick an event marked <b class="rwchip">REAL</b> to test the model against U.S. data.',
    predict: 'Predict first.', skip: 'Just show me', right: '✓ Right.', wrong: '✗ Not quite.', theory: 'Theory vs reality',
    source: 'Source: FRED — ', got: ' · retrieved ', band: ' · shaded: event period', nodata: 'Data could not be loaded.', fold: 'Hide timeline', unfold: 'Show timeline', foldS: 'Hide', unfoldS: 'Show', mode: 'Mode', basic: 'Basic', rw: 'Real world'
  };

  /* ───────── 선그래프 ───────── */
  const W = 640, H = 290, L = 52, R = 18, T = 30, B = 30;
  const COL = ['#1f6fd1', '#1f2537'];
  const yr = (d) => { const p = d.split('-').map(Number); return p[0] + (p[1] - 1) / 12 + ((p[2] || 1) - 1) / 365; };
  function nice(max) { const s = Math.pow(10, Math.floor(Math.log10(max / 4))); return [1, 2, 2.5, 5, 10].map((k) => k * s).find((k) => max / k <= 5); }
  function chart(c, data) {
    const rows = data[c.k].filter((r) => r[0] >= c.from && r[0] <= c.to);
    const n = rows[0].length - 1, xs = rows.map((r) => yr(r[0]));
    let ymax = 0, ymin = 0; rows.forEach((r) => { for (let j = 1; j <= n; j++) { ymax = Math.max(ymax, r[j]); ymin = Math.min(ymin, r[j]); } });
    const step = nice((ymax - ymin) * 1.08), top = Math.ceil(ymax * 1.15 / step) * step, bot = -Math.ceil(-ymin * 1.08 / step) * step;   // 음수 값이 있으면 0 아래까지
    const x0 = xs[0], x1 = xs[xs.length - 1];
    const X = (x) => L + (x - x0) / (x1 - x0) * (W - L - R), Y = (y) => T + (top - y) / (top - bot) * (H - T - B);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(c.y) + '">';
    if (c.band) s += '<rect x="' + X(yr(c.band[0])) + '" y="' + T + '" width="' + (X(yr(c.band[1])) - X(yr(c.band[0]))) + '" height="' + (H - T - B) + '" fill="#fff3b0" opacity=".7"/>';
    for (let v = bot; v <= top + 1e-9; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (bot < 0 && Math.abs(v) < 1e-9 ? '#8d93a0' : '#e3e6ea') + '"/><text x="' + (L - 8) + '" y="' + (Y(v) + 6) + '" text-anchor="end" class="ax">' + (+v.toFixed(2)) + '</text>';
    const span = x1 - x0, ys = span > 40 ? 10 : span > 12 ? 4 : span > 6 ? 2 : 1;
    for (let y = Math.ceil(x0); y <= x1; y++) if (y % ys === 0) s += '<line x1="' + X(y) + '" x2="' + X(y) + '" y1="' + (H - B) + '" y2="' + (H - B + 5) + '" stroke="#8d93a0"/><text x="' + X(y) + '" y="' + (H - 6) + '" text-anchor="middle" class="ax">' + y + '</text>';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="#1f2537" stroke-width="1.5"/>';
    if (c.vline) { const vx = X(yr(c.vline[0])); s += '<line x1="' + vx + '" x2="' + vx + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#c8352e" stroke-width="2" stroke-dasharray="5 4"/><text x="' + (vx + 6) + '" y="' + (T + 14) + '" class="vl">' + esc(c.vline[1]) + '</text>'; }
    for (let j = 1; j <= n; j++) s += '<polyline fill="none" stroke="' + COL[j - 1] + '" stroke-width="' + (j === 1 ? 3 : 2.5) + '" stroke-linejoin="round" points="' + rows.map((r, i) => X(xs[i]).toFixed(1) + ',' + Y(r[j]).toFixed(1)).join(' ') + '"/>';
    // 범례: 앞 이름 길이만큼 띄운다(휴대폰 22px 글자 ≈ 13px/자 기준, 두 이름 합쳐 40자 안팎까지)
    let lx = L + 10;
    if (c.names) s += c.names.map((nm, j) => { const x = lx; lx += 70 + nm.length * 13; return '<line x1="' + x + '" x2="' + (x + 24) + '" y1="' + (T - 12) + '" y2="' + (T - 12) + '" stroke="' + COL[j] + '" stroke-width="3"/><text x="' + (x + 30) + '" y="' + (T - 6) + '" class="lg">' + esc(nm) + '</text>'; }).join('');
    else s += '<text x="' + L + '" y="' + (T - 10) + '" class="lg">' + esc(c.y) + '</text>';
    (c.marks || []).forEach((mk) => {
      const r = rows.find((q) => q[0].indexOf(mk[0]) === 0); if (!r) return;
      // 글 자리: 기본 점 오른쪽 위 · below 아래 · side 바로 옆(위가 범례에 닿을 때) · left 왼쪽 위. 오른쪽 끝 가까우면 왼쪽으로
      const px = X(yr(r[0])), py = Y(r[mk[1] + 1]), pos = mk[3], left = pos === 'left' || px > W - 120;
      const ty = pos === 'below' ? py + 28 : pos === 'side' ? py + 8 : py - 10, tx = px + (left ? -10 : pos === 'side' ? 14 : 10);
      s += '<circle cx="' + px + '" cy="' + py + '" r="6" fill="#fff" stroke="' + COL[mk[1]] + '" stroke-width="3"/><text x="' + tx + '" y="' + ty + '" text-anchor="' + (left ? 'end' : 'start') + '" class="mk">' + esc(mk[2]) + '</text>';
    });
    return s + '</svg>';
  }

  /* ───────── 카드 ───────── */
  let data = null;
  const fmtT = (s) => esc(s).replace(/==(.+?)==/g, '<mark>$1</mark>');
  // 용어 주석: 이미 이스케이프된 html 의 글자 부분에서, 이 카드에서 아직 안 쓴(used) 용어 중 가장 앞에 나오는 것부터 단추로 감싼다
  function gloss(html, used) {
    return html.split(/(<[^>]+>)/).map((p) => {
      if (p[0] === '<') return p;
      let out = '';
      for (;;) {
        let best = null;
        G.forEach((g, i) => { if (used.has(i)) return; const m = g[0].exec(p); if (m && (!best || m.index < best.m.index)) best = { m, i }; });
        if (!best) return out + p;
        used.add(best.i);
        out += p.slice(0, best.m.index) + '<button type="button" class="rwterm" data-g="' + best.i + '" aria-expanded="false">' + best.m[0] + '</button>';
        p = p.slice(best.m.index + best.m[0].length);
      }
    }).join('');
  }
  // 용어를 누르면 그 문단 바로 아래에 뜻 상자를 열고, 다시 누르면 닫는다
  function termClick(e) {
    const b = e.target.closest('.rwterm'); if (!b) return;
    const i = b.getAttribute('data-g'), host = b.closest('p, li'), open = b.getAttribute('aria-expanded') === 'true';
    let box = host.nextElementSibling;
    while (box && box.classList.contains('rwdef') && box.getAttribute('data-g') !== i) box = box.nextElementSibling;
    if (open) { if (box && box.classList.contains('rwdef')) box.remove(); b.setAttribute('aria-expanded', 'false'); return; }
    const d = G[+i][1], k = d.indexOf(': ');
    box = document.createElement('div'); box.className = 'rwdef'; box.setAttribute('data-g', i);
    box.innerHTML = k > 0 ? '<b>' + esc(d.slice(0, k)) + '</b> ' + esc(d.slice(k + 2)) : esc(d);
    let at = host; while (at.nextElementSibling && at.nextElementSibling.classList.contains('rwdef')) at = at.nextElementSibling;
    at.after(box); b.setAttribute('aria-expanded', 'true');
  }
  function render(card, c) {
    card.hidden = c === 'none';   // 이 사건엔 현실 사례가 없으면 카드를 띄우지 않는다(선택을 풀면 다시 안내)
    if (!c) { card.innerHTML = '<p class="rwnote"><span class="rwtag">' + UI.tag + '</span>' + UI.pick + '</p>'; return; }
    if (c === 'none') { card.innerHTML = ''; return; }
    const used = new Set(), q = gloss(esc(c.q), used), vh = gloss(esc(c.v), used);   // 용어 주석은 읽는 순서(질문 → 답 → 이론 → 출처)대로 처음 한 번만
    card.innerHTML =
      '<div class="rwhd"><span class="rwtag">' + UI.tag + '</span><span class="rwwhen">' + esc(c.when) + '</span></div>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p class="rwq"><b>' + UI.predict + '</b> ' + q + '</p>' +
      '<div class="rwopts">' + c.opts.map((o, i) => '<button type="button" data-i="' + i + '">' + esc(o) + '</button>').join('') + '<button type="button" class="rwskip" data-i="-1">' + UI.skip + '</button></div>' +
      '<div class="rwans" hidden>' +
      '<p class="rwv"></p>' +
      (c.chart ? '<figure class="rwfig">' + (data ? chart(c.chart, data) : '<p class="rwnote">' + UI.nodata + '</p>') + '<figcaption>' + UI.source + esc(c.chart.cap) + (data ? UI.got + esc(data.fetched) : '') + (c.chart.band ? UI.band : '') + '</figcaption></figure>' : '') +   // chart 없으면 그림 생략(연구 사례)
      '<p class="rwth"><span class="lb">' + UI.theory + '</span>' + gloss(fmtT(c.th), used) + '</p>' +
      '<ul class="rwsrc">' + c.src.map((x) => '<li><span class="lb">' + x.k + '</span><div><a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a><small>' + esc(x.by) + ' · ' + esc(x.d) + '</small><p>' + gloss(esc(x.s), used) + '</p></div></li>').join('') + '</ul>' +
      '</div>';
    card.querySelectorAll('.rwopts button').forEach((b) => b.addEventListener('click', () => {
      const i = +b.getAttribute('data-i');
      card.querySelectorAll('.rwopts button').forEach((x) => { const k = +x.getAttribute('data-i'); x.disabled = true; x.classList.toggle('ok', k === c.ans); x.classList.toggle('no', k === i && i !== c.ans); });
      $('.rwv', card).innerHTML = (i < 0 ? '' : i === c.ans ? '<b class="ok">' + UI.right + '</b> ' : '<b class="no">' + UI.wrong + '</b> ') + vh;
      $('.rwans', card).hidden = false;
      card.dispatchEvent(new CustomEvent('rwanswer'));   // 시간선 숨김(attach)
    }));
  }

  /* ───────── 붙이기 ───────── */
  // 카드 자리: CASES 키 → [그림 칸, 사건 목록을 감싼 범위]. 탭 있는 장은 범위 안에 목록이 여럿(Ch33 AD·AS) 또는 패널마다 따로(Ch28)
  const SPOT = { 29: ['#c29 .fig', '#o29'], 30: ['#c30 .fig', '#o30'], 33: ['#c33 .fig', '#c33 .side'], '28w': ['#p28w .fig', '#o28'], '28u': ['#p28u .fig', '#o28s'] };
  // 범위 하나: 그림 칸 아래 카드 + 목록 REAL 표시. redo: 데이터가 늦게 오면 답 공개 전 카드 다시 그리기
  const redo = [];
  function attach(key, cases) {
    const fig = $(SPOT[key][0]), scope = $(SPOT[key][1]);
    if (!fig || !scope) return;
    const card = document.createElement('div'); card.className = 'rwcard'; card.id = 'rw' + key; card.setAttribute('aria-live', 'polite');
    fig.appendChild(card);
    card.addEventListener('click', termClick);
    let cur = null;
    const caseOf = (b) => cases.find((c) => c.m.test(b.textContent.trim())) || null;
    scope.querySelectorAll('li button').forEach((b) => { if (caseOf(b)) b.parentNode.classList.add('hasrw'); });
    // 시간선: 사건을 고르면(기본 모드도) rwdock(데스크톱 하단 고정), 정답을 고르면 rwgone(숨김). --dockh 는 시간선 높이
    // 내리기 단추(.rwfold): 조작 줄(.pbar) 안. 시간선을 내려도(정답을 골라도) 조작 줄은 남고, 누르면 다시 올라온다.
    // 아래 여백은 .ch 에 준다(Ch28 의 .panel 은 display:contents 라 padding 이 먹지 않았다)
    const host = fig.closest('.panel') || fig.closest('.ch'), ch = fig.closest('.ch'), player = host && $('.player', host);
    const wide = window.matchMedia('(min-width:901px)');
    const sync = () => {
      if (!player || host.hidden) return;
      const h = player.offsetHeight, on = wide.matches && host.classList.contains('rwdock') && !host.classList.contains('rwgone') && !player.classList.contains('idle');
      host.style.setProperty('--dockh', (wide.matches ? h : player.scrollHeight) + 'px');
      ch.style.paddingBottom = on ? Math.max(0, h - 24) + 'px' : '';
    };
    let fold = null;
    if (player) {
      fold = document.createElement('button'); fold.type = 'button'; fold.className = 'spdb rwfold';
      fold.addEventListener('click', () => { host.classList.toggle('rwgone'); setFold(); sync(); });
      $('.pbar', player).appendChild(fold);
      if (window.ResizeObserver) new ResizeObserver(sync).observe(player);
      new MutationObserver(sync).observe(player, { childList: true, subtree: true });   // 휴대폰은 max-height 로 크기가 묶여 ResizeObserver 만으로는 내용 변화를 못 잡는다
      wide.addEventListener && wide.addEventListener('change', sync);
    }
    // 카드 자리: 데스크톱은 그림 칸 안(Situation · 결과 문장 아래), 휴대폰은 시간선 다음(장의 맨 아래, grid-area rw)
    const place = () => { if (wide.matches || !player) { if (card.parentNode !== fig) fig.appendChild(card); } else if (card.previousElementSibling !== player) player.after(card); };
    place(); wide.addEventListener && wide.addEventListener('change', place);
    const setFold = () => { if (!fold) return; const d = host.classList.contains('rwgone'); fold.innerHTML = (d ? '▴' : '▾') + '<span class="fl"> ' + (d ? UI.unfoldS : UI.foldS) + '</span>'; fold.setAttribute('aria-label', d ? UI.unfold : UI.fold); fold.title = d ? UI.unfold : UI.fold; fold.setAttribute('aria-expanded', String(!d)); };
    const dock = () => { if (!host) return; host.classList.toggle('rwdock', !!cur); host.classList.remove('rwgone'); setFold(); requestAnimationFrame(sync); };
    card.addEventListener('rwanswer', () => { if (!host) return; host.classList.add('rwgone'); setFold(); sync(); });
    // 보이는 목록에서 눌린 사건 읽기(숨은 탭의 눌림은 무시)
    const read = () => {
      const b = Array.prototype.find.call(scope.querySelectorAll('button[aria-pressed="true"]'), (x) => !x.closest('[hidden]'));
      const c = b ? caseOf(b) || 'none' : null;
      if (c !== cur) { cur = c; render(card, cur); dock(); }
    };
    scope.addEventListener('click', (e) => { if (e.target.closest('li button')) { cur = undefined; read(); } });   // 같은 사건을 다시 골라도 새 카드
    const tabs = fig.closest('.ch') && $('.sub', fig.closest('.ch'));
    if (tabs) tabs.addEventListener('click', () => setTimeout(() => { read(); sync(); }, 0));
    render(card, cur);
    redo.push(() => { if (cur && cur !== 'none' && $('.rwans', card).hidden) render(card, cur); });
  }
  function init() {
    Object.keys(CS).forEach((k) => attach(k, CS[k]));
    fetch('/econ2/graphs/real-data.json?v=20261105j').then((r) => r.json()).then((d) => { data = d; redo.forEach((f) => f()); }).catch(() => {});

    // 모드 토글
    const links = $('.top .links'), tg = document.createElement('div');
    tg.className = 'rwtog'; tg.setAttribute('role', 'group'); tg.setAttribute('aria-label', UI.mode);
    tg.innerHTML = '<button type="button" data-m="basic">' + UI.basic + '</button><button type="button" data-m="rw">' + UI.rw + '</button>';
    links.parentNode.insertBefore(tg, links);
    const set = (m) => {
      document.documentElement.classList.toggle('rw', m === 'rw');
      tg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === m)));
    };
    tg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const m = b.getAttribute('data-m'); put(m); set(m); });
    set(get() === 'rw' ? 'rw' : 'basic');
  }
  init();
})();
