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
      v: 'Unlike the model, it fell — from 4.5 (Feb 2020) to 3.5 (Apr 2020).',
      chart: { k: 'mult', from: '2017-01', to: '2022-12', hl: ['2020-02', '2020-04'], vline: ['2020-03', '0% requirement'], marks: [['2020-02', 0, '4.5'], ['2020-04', 0, '3.5']], y: 'M2 ÷ monetary base', cap: 'M2SL ÷ BOGMBASE, monthly' },
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
      v: 'As the model predicts, it fell — from 9.2 to 2.8.',
      chart: { k: 'mult', from: '2000-01', to: '2019-12', hl: ['2008-08', '2014-08'], band: ['2008-09', '2014-10'], marks: [['2008-08', 0, '9.2'], ['2014-08', 0, '2.8']], y: 'M2 ÷ monetary base', cap: 'M2SL ÷ BOGMBASE, monthly' },
      th: 'Just as the model says: when banks hold more reserves, the reserve ratio R rises and the multiplier 1/R falls. Banks held them because ==lending looked risky in the crisis and, from October 2008, the Fed paid interest on reserves==.',
      src: [
        { k: 'News', d: 'Oct 6, 2008', by: 'Federal Reserve', t: 'The Fed starts paying interest on reserves', s: 'The Board announced it would pay interest on banks\' required and excess reserves — so simply holding reserves at the Fed now earned a return.', u: FED + 'newsevents/pressreleases/monetary20081006a.htm' }
      ]
    },
    {
      m: /^Fed buys/, when: 'Nov 2008 – Oct 2014 · United States', title: 'Quantitative easing: the Fed bought trillions in bonds',
      q: 'Bond purchases (QE) raised the monetary base from $0.85 trillion to $4.08 trillion (Aug 2008 → Aug 2014). With the 2008 multiplier of 9.2, the textbook predicts M2 rises by about $30 trillion. How much did M2 actually rise?',
      opts: ['About +$30 trillion', 'About +$10 trillion', 'About +$3.7 trillion'], ans: 2,
      v: 'Far less than the model predicts: about +$3.7 trillion ($7.8T → $11.5T). The base grew ×4.8, M2 only ×1.47.',
      chart: { k: 'qe', from: '2006-01', to: '2016-12', hl: ['2008-08', '2014-08'], band: ['2008-11', '2014-10'], marks: [['2014-08', 0, '×4.8'], ['2014-08', 1, '×1.47']], names: ['Monetary base', 'M2'], y: 'Index, Aug 2008 = 100', cap: 'BOGMBASE and M2SL, monthly, Aug 2008 = 100' },
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
      v: 'The opposite of the model: M2 fell $309 billion ($21.24 trillion → $20.93 trillion, monthly averages) and another $195 billion in April. Meanwhile discount-window loans jumped from $4.6 billion to a record $152.9 billion in one week, above the 2008 crisis peak of $110.7 billion.',
      chart: { k: 'dw', from: '2019-01-01', to: '2024-06-30', hl: ['2023-03-15'], marks: [['2020-03-25', 0, 'COVID $51B'], ['2023-03-15', 0, 'SVB $153B']], y: 'Discount-window loans, $ billion', cap: 'WLCFLPCL (primary credit), weekly' },
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
      v: 'As the model predicts, prices followed the money — but more than a year later: inflation peaked in June 2022 at 9.0% (9.1% before seasonal adjustment), the highest since 1981.',
      chart: { k: 'grow', from: '2015-01', to: '2025-12', hl: ['2022-06'], marks: [['2021-02', 0, '27%'], ['2022-06', 1, '9.0%']], names: ['M2 growth', 'CPI inflation'], y: '% change from a year earlier', cap: 'M2SL and CPIAUCSL, monthly, % change from a year earlier' },
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
      v: 'Unlike the model, prices kept rising: +7.0%. What fell was inflation, from 9% to about 3%.',
      chart: { k: 'grow', from: '2021-01', to: '2024-12', hl: ['2022-03', '2023-10'], marks: [['2023-04', 0, '−4.7%', 'left'], ['2023-06', 1, '3.1%']], names: ['M2 growth', 'CPI inflation'], y: '% change from a year earlier', cap: 'M2SL and CPIAUCSL, monthly, % change from a year earlier' },
      th: 'The model compares long-run levels. In reality ==the 5% cut came right after a 40% rise==, so money was still far above its 2020 level and the earlier surge was still reaching prices. What the cut changed was the trend: inflation fell from 9% to about 3% — the growth rate of P, not its level.',
      src: [
        { k: 'News', d: 'May 4, 2022', by: 'Federal Reserve', t: 'Plans for reducing the size of the Federal Reserve\'s balance sheet', s: 'From June 1, 2022 the Fed began letting its bonds mature without replacing them — the reverse of quantitative easing, shrinking the monetary base.', u: FED + 'newsevents/pressreleases/monetary20220504b.htm' }
      ]
    },
    {
      m: /^Credit cards spread/, when: '1960–2026 · United States', title: 'The velocity of money is not constant',
      q: 'Between 1960 and 1997, credit cards, ATMs and money-market funds spread. In the model people then hold less money for the same spending, so V = P × Y ÷ M rises. What happened to M2 velocity?',
      opts: ['Rose', 'Stayed the same', 'Fell'], ans: 0,
      v: 'As the model predicts, it rose, from 1.82 to 2.19 (1997). But unlike the "stable V" shortcut, it then fell for two decades and hit a record low of 1.13 in 2020.',
      chart: { k: 'vel', from: '1960-01', to: '2099-12', hl: ['1960-01', '1997-07'], marks: [['1960-01', 0, '1.82'], ['1997-07', 0, '2.19'], ['2020-04', 0, '1.13']], y: 'M2 velocity = nominal GDP ÷ M2', cap: 'M2V, quarterly' },
      th: 'The direction holds — ==easier payments raised V for decades==. But the shortcut "V is stable" did not: V fell after 1997 as interest rates dropped (holding money cost less), and collapsed in 2020 when people saved instead of spending. That is why the 2020 money surge raised prices far less than M2 alone suggested.',
      src: [
        { k: 'Data', d: 'quarterly since 1959', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Velocity of M2 Money Stock (M2V)', s: 'Velocity is nominal GDP divided by M2: how many times a year the average dollar is spent on final goods and services.', u: 'https://fred.stlouisfed.org/series/M2V' }
      ]
    },
    {
      m: /^Fed doubles/,
      cc: 'KR',
      when: '2020–2022 · Korea',
      title: 'Korea: money grew 11% a year, prices followed a year later',
      q: 'Korea’s M2 grew 11.1% in 2020 and 11.4% in 2021 (annual averages) — about 24% in two years. In the model, more money means a higher price level. How much did consumer prices rise in 2021?',
      opts: ['About 24%','About 11%','Only 2.5%'],
      ans: 2,
      v: 'Prices followed the money as in the model, but late and much less: only 2.5% in 2021. They jumped a year later: 5.1% in 2022, the highest since 1998, peaking at 6.3% (July 2022, from a year earlier).',
      chart: {k: 'kr_money',from: '2018-01',to: '2023-12',hl: ['2021-01', '2021-12'],marks: [['2020-07',0,'12.3%'],['2022-07',1,'6.3%','left']],names: ['M2 growth','CPI inflation'],y: '% change from a year earlier',cap: 'M2 average balance (161Y006) and CPI (901Y009), monthly',src: 'ecos'},
      th: 'Direction: right — money grew fast and prices followed, a year later. Size: much smaller. M2 rose about 24% from 2019 to 2021, but consumer prices only 7.7% from 2020 to 2022. M × V = P × Y explains the gap: V (nominal GDP ÷ M2) fell from 0.78 in 2019 to 0.69 in 2021, because ==households and firms held the extra money instead of spending it==.',
      src: [{k: 'News',d: 'Dec 30, 2022',by: 'Statistics Korea',t: 'Consumer Price Index in December 2022',s: 'Consumer prices in 2022 were 5.1 percent higher than in 2021; December was up 5.0 percent from a year earlier.',u: 'https://mods.go.kr/board.es?mid=a20109020000&bid=11751&act=view&list_no=422841&tag=&nPage=5&ref_bid='},{k: 'Data',d: 'monthly and annual',by: 'Bank of Korea, ECOS',t: 'Economic Statistics System',s: 'M2 average balance (161Y006), consumer price index (901Y009) and nominal GDP (200Y101): the chart, and V = nominal GDP ÷ M2.',u: 'https://ecos.bok.or.kr/'}]
    }
  ], 33: [
  {
    m: /^Stock market crash/, when: '2022 · United States', title: 'The 2022 stock slide: the Nasdaq lost a third, consumers kept spending',
    q: 'From its peak close on November 19, 2021 to the end of 2022 the Nasdaq index fell 35% (16,057 → 10,466). In the model, lower stock prices cut household wealth, so consumption falls and AD shifts left. What happened to real consumer spending from November 2021 to December 2022?',
    opts: ['Fell about 5%', 'Rose about 1%', 'Rose about 8%'], ans: 1,
    v: 'Unlike the model, spending did not fall: it rose 1.1% (15,118 → 15,279 billion inflation-adjusted dollars, annual rate). Households saved less instead — the saving rate fell from 6.9% to 2.4% (June 2022).',
    chart: { k: 'c33_stock22', from: '2021-01', to: '2023-12', hl: ['2021-11', '2022-12'], marks: [['2022-10', 0, '−32%', 'below'], ['2022-12', 1, '+1.1%']], names: ['Nasdaq', 'Real consumer spending'], y: 'Index, Nov 2021 = 100', cap: 'NASDAQCOM (monthly average of daily closes) and PCEC96, monthly, Nov 2021 = 100' },
    th: 'The wealth effect exists, but in 2022 something bigger pushed the other way: ==households were sitting on extra savings built up from pandemic transfers, and jobs were plentiful==. Fed economists put those excess savings at about $2.3 trillion at their 2021 peak, and households still held most of them in mid-2022. So the stock slide trimmed spending growth rather than reversing it. Stocks are also owned mostly by richer households, who spend a small share of a change in wealth.',
    src: [
      { k: 'Research', d: 'Oct 21, 2022', by: 'Aladangady, Cho, Feiveson & Pinto, FEDS Notes (Federal Reserve Board)', t: 'Excess Savings during the COVID-19 Pandemic', s: 'Record government transfers raised household income while social distancing held spending down, leaving households with savings far above the pre-pandemic trend.', u: 'https://www.federalreserve.gov/econres/notes/feds-notes/excess-savings-during-the-covid-19-pandemic-20221021.html' },
      { k: 'Data', d: 'monthly since 1959', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Personal Saving Rate (PSAVERT)', s: 'Saving as a share of disposable income: 6.9% in November 2021, 2.4% in June 2022.', u: 'https://fred.stlouisfed.org/series/PSAVERT' }
    ]
  },
  {
    m: /^Income tax cut/, when: 'March 2021 · United States', title: '$1,400 relief checks: income jumped 23%, spending rose 4%',
    q: 'In March 2021 the American Rescue Plan sent most Americans a $1,400 payment. Real disposable income jumped 22.8% from February to March. In the model, higher disposable income raises consumption. How much did real consumer spending rise that month?',
    opts: ['About 23%', 'About 4%', 'It fell'], ans: 1,
    v: 'Spending rose as the model predicts, but far less than income: +4.3%. The saving rate doubled from 13.0% to 26.2%, and income fell back 15.1% in April once the checks had gone out.',
    chart: { k: 'c33_check21', from: '2020-07', to: '2021-12', hl: ['2021-03'], marks: [['2021-03', 0, '+22.8%', 'side'], ['2021-03', 1, '+4.3%', 'below']], names: ['Disposable income', 'Consumer spending'], y: '% change from the previous month', cap: 'DSPIC96 and PCEC96, monthly, % change from the previous month' },
    th: 'Direction right, size far smaller. A one-time check raises income for a month, not for a lifetime, so ==most of it was saved or used to pay down debt at first==. Part of the 4.3% also came from reopening as vaccines spread. Using household survey data, Parker, Schild, Erhard and Johnson found that people spent only about 10% of the first (2020) payments on nondurable goods and services within three months, and even less of the later rounds — less than after the 2001 and 2008 rebates. The saved money did not vanish: it financed spending in 2022 (see "Stock market crash").',
    src: [
      { k: 'Research', d: '2022 (Brookings Papers on Economic Activity)', by: 'Parker, Schild, Erhard & Johnson, NBER Working Paper 30596', t: 'Economic Impact Payments and Household Spending During the Pandemic', s: 'Across the three rounds of payments, households spent less in the first months than after the 2001 and 2008 rebates; households with little cash on hand spent more.', u: 'https://www.nber.org/papers/w30596' },
      { k: 'Data', d: 'monthly since 1959', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Real Disposable Personal Income (DSPIC96)', s: 'Income after taxes and transfers, adjusted for inflation; the spikes in January and March 2021 are the $600 and $1,400 payments.', u: 'https://fred.stlouisfed.org/series/DSPIC96' }
    ]
  },
  {
    m: /^Government purchases rise/, when: '2023 · United States', title: 'Government spending kept growing — and the predicted recession never came',
    q: 'In 2023 real government purchases (federal, state and local) grew 5.5% (2022 Q4 → 2023 Q4), while the Fed raised its policy rate above 5%. In March 2023 the Fed staff forecast a mild recession starting later that year. In the model, higher government purchases shift AD right. What happened to real GDP in 2023 (Q4 to Q4)?',
    opts: ['Fell about 1% (recession)', 'Grew about 1%', 'Grew about 3.4%'], ans: 2,
    v: 'As the model predicts, output kept growing: real GDP rose 3.4% (2022 Q4 → 2023 Q4), and unemployment stayed between 3.4% and 3.9% all year.',
    chart: { k: 'c33_gov23', from: '2022-01', to: '2025-10', hl: ['2022-10', '2023-10'], marks: [['2023-10', 0, '5.5%'], ['2023-10', 1, '3.4%', 'below']], names: ['Gov. purchases', 'Real GDP'], y: '% change from a year earlier', cap: 'GCEC1 (real government consumption expenditures and gross investment) and GDPC1, quarterly, % change from a year earlier' },
    th: 'A clear recent match. ==State and local governments spent pandemic aid and strong tax revenue (+6.5%), and federal purchases grew 3.8%== — together adding roughly 0.9 percentage point to GDP growth just as tight money was pushing AD the other way. Government was not the only support: households were still spending their pandemic savings. By July 2023 the Fed staff had dropped its recession forecast.',
    src: [
      { k: 'News', d: 'Apr 12, 2023', by: 'Federal Reserve (FOMC minutes, March 21–22 meeting)', t: 'Minutes of the Federal Open Market Committee, March 21–22, 2023', s: 'Given the banking stress, the staff projected a mild recession starting later in 2023, followed by a recovery over the next two years.', u: 'https://www.federalreserve.gov/monetarypolicy/fomcminutes20230322.htm' },
      { k: 'News', d: 'Aug 16, 2023', by: 'Federal Reserve (FOMC minutes, July 25–26 meeting)', t: 'Minutes of the Federal Open Market Committee, July 25–26, 2023', s: 'With spending and jobs stronger than expected, the staff no longer forecast a recession.', u: 'https://www.federalreserve.gov/monetarypolicy/fomcminutes20230726.htm' }
    ]
  },
  {
    m: /^Turmoil abroad/, when: '2014–2016 · United States', title: 'The strong dollar: exports stalled while imports kept growing',
    q: 'From June 2014 to March 2015 the broad trade-weighted dollar index rose 14%. In the model, a stronger dollar makes U.S. goods dearer abroad, so net exports fall and AD shifts left. How much did real U.S. exports grow from 2014 Q3 to 2016 Q3?',
    opts: ['They fell about 5%', 'They barely grew: +1.5%', 'They rose about 10%'], ans: 1,
    v: 'As the model predicts, net exports weakened: real exports rose only 1.5% (2,288 to 2,321 billion inflation-adjusted dollars), while real imports rose 6.8% (2,623 to 2,801).',
    chart: { k: 'c33_nx', from: '2012-01', to: '2017-10', hl: ['2014-07', '2016-07'], vline: ['2014-07', 'Dollar rises'], marks: [['2015-10', 0, '−1.5%', 'left'], ['2015-01', 1, '6.7%', 'below']], names: ['Real exports', 'Real imports'], y: '% change from a year earlier', cap: 'EXPGSC1 and IMPGSC1, quarterly, % change from a year earlier; dollar: DTWEXBGS' },
    th: 'The direction is right: ==exports stalled and imports kept growing==, so net exports dragged on GDP. A Fed Vice Chairman estimated that net exports lowered GDP growth by almost ¾ of a percentage point over the year to late 2015, close to what the Fed\'s model predicted. Two things the simple model hides: GDP still grew 4.3% over those two years, since other parts of demand kept growing; and the trade deficit measured in dollars hardly changed (−$489 billion in 2014 Q3, −$481 billion in 2016 Q3), partly because a stronger dollar lowers the dollar price of each import.',
    src: [
      { k: 'News', d: 'Nov 12, 2015', by: 'Stanley Fischer, Federal Reserve Vice Chairman', t: 'The Transmission of Exchange Rate Changes to Output and Inflation', s: 'A stronger dollar raises the foreign price of U.S. goods and lowers exports; the effect on imports is weaker, so net exports fall and GDP is pushed down.', u: 'https://www.federalreserve.gov/newsevents/speech/fischer20151112a.htm' },
      { k: 'Data', d: 'daily since 2006', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Nominal Broad U.S. Dollar Index (DTWEXBGS)', s: 'A trade-weighted average of the dollar against the currencies of major U.S. trading partners; higher means a stronger dollar.', u: 'https://fred.stlouisfed.org/series/DTWEXBGS' }
    ]
  },
  {
    m: /^Oil price spike/, when: '2022 · United States', title: 'The 2022 energy shock: inflation hit 9%, unemployment stayed at 3.5%',
    q: 'After Russia invaded Ukraine on February 24, 2022, crude oil rose from $72 (December 2021) to $115 a barrel (June 2022). In the model, an oil shock shifts SRAS left: prices rise and output falls, so unemployment rises (stagflation). What happened in 2022?',
    opts: ['Inflation rose to 9%, unemployment rose to about 6%', 'Inflation rose to 9%, unemployment stayed at 3.5–3.7%', 'Inflation fell, unemployment rose'], ans: 1,
    v: 'Only half like the model: CPI inflation peaked at 9.0% (June 2022), but unemployment stayed between 3.5% and 3.7% from March to December. Real GDP dipped only in 2022 Q1 (−1.0% at an annual rate).',
    chart: { k: 'c33_oil22', from: '2021-01', to: '2024-12', hl: ['2022-03', '2022-12'], vline: ['2022-02', 'Invasion'], marks: [['2022-06', 0, '9.0%'], ['2022-12', 1, '3.5%', 'below']], names: ['CPI inflation', 'Unemployment rate'], y: '% (inflation: change from a year earlier)', cap: 'CPIAUCSL and UNRATE, monthly; oil price: WTISPLC' },
    th: 'The price half fits: ==energy and food price shocks plus shortages drove most of the inflation surge==, as Bernanke and Blanchard found. The output half did not, because SRAS was not the only curve moving: AD was still strong (pandemic savings, reopening, record job openings), so firms kept hiring. The U.S. had also become a net petroleum exporter in 2020, so dearer oil raised incomes in oil-producing states as well as costs elsewhere. Compare the 1973–74 oil shock, when unemployment rose to 9.0%.',
    src: [
      { k: 'Research', d: 'June 2023', by: 'Bernanke & Blanchard, NBER Working Paper 31417', t: 'What Caused the U.S. Pandemic-Era Inflation?', s: 'Most of the 2021–22 surge came from price shocks — energy, food and shortages in some sectors — rather than an overheated labor market; tight labor markets matter more for how long inflation lasts.', u: 'https://www.nber.org/papers/w31417' },
      { k: 'Data', d: 'updated yearly', by: 'U.S. Energy Information Administration', t: 'Oil and petroleum products explained: imports and exports', s: 'In 2020 the U.S. exported more petroleum than it imported over a full year, for the first time since at least 1949.', u: 'https://www.eia.gov/energyexplained/oil-and-petroleum-products/imports-and-exports.php' }
    ]
  },
  {
    m: /^Technological progress/, when: '2023–2025 · United States', title: 'Productivity sped up — and inflation came down without a recession',
    q: 'From the end of 2022 to the end of 2025, U.S. output per hour in the business sector grew 2.8% a year, almost twice the 1.5% pace of 2007–2019. In the model, higher productivity shifts SRAS (and LRAS) right: more output at lower prices. Unemployment stayed between 3.4% and 4.5%. What did inflation do?',
    opts: ['Climbed above 6%', 'Fell from 6.4% to about 3%', 'Turned negative (deflation)'], ans: 1,
    v: 'As the model predicts, prices rose more slowly while output kept growing: CPI inflation fell from 6.4% (December 2022) to 2.9% (December 2024) and 2.7% (December 2025), with no recession.',
    chart: { k: 'c33_tech23', from: '2021-01', to: '2026-04', hl: ['2022-10', '2025-10'], marks: [['2023-10', 0, '3.5%'], ['2022-04', 1, '8.6%']], names: ['Productivity growth', 'CPI inflation'], y: '% change from a year earlier', cap: 'OPHNFB (output per hour, nonfarm business) and CPIAUCSL (quarterly average), quarterly, % change from a year earlier' },
    th: 'The direction fits: ==faster productivity growth let output grow while inflation fell== — the "soft landing" many forecasters doubted. Two cautions. The cause is not clearly new technology: San Francisco Fed economists find that much of the swing is the usual cycle (productivity jumps in a recession and falls back), and the 2023–24 gains partly made up for the 2022 drop (−2.1%); AI was still too new to show up much. And inflation also fell because energy prices dropped and supply chains healed, alongside the Fed’s rate increases.',
    src: [
      { k: 'Research', d: 'Nov 25, 2024', by: 'Fernald, Li, Meisenbacher & Yalcin, FRBSF Economic Letter 2024-31', t: 'Productivity During and Since the Pandemic', s: 'Productivity rose sharply in 2020, fell back to its slow pre-pandemic trend as the economy recovered, and by mid-2024 was only a little above that trend.', u: 'https://www.frbsf.org/wp-content/uploads/el2024-31.pdf' },
      { k: 'Data', d: 'quarterly since 1947', by: 'Federal Reserve Bank of St. Louis (FRED)', t: 'Nonfarm Business Sector: Real Output Per Hour of All Persons (OPHNFB)', s: 'An index of how much output the business sector produces per hour worked.', u: 'https://fred.stlouisfed.org/series/OPHNFB' }
    ]
  }
], '28w': [
    {
      m: /^Wage above equilibrium/, when: 'April 2024 · California', title: 'California’s $20 fast-food wage: a big raise, a small change in jobs',
      q: 'On April 1, 2024 California set a $20 minimum wage for workers at large fast-food chains, up from the $16 state minimum — a 25% jump. In the model a wage above equilibrium cuts employment, and a raise this large should cut it a lot. What have studies found for fast-food employment, compared with places without the raise?',
      opts: ['A drop of about 15–20%', 'Between no change and about −3%', 'A rise of about 10%'], ans: 1,
      v: 'Much smaller than the model suggests for a 25% raise: a Berkeley study found no job loss, and an NBER study found about 1.5–3% fewer jobs after one year. The debate is over a few percent, not a collapse.',
      th: 'Direction: the NBER estimate points the way the model predicts, the Berkeley one does not, but both find ==a small employment change next to an 18% rise in average pay==. Employers adjusted in other ways: menu prices rose about 3.7% once (about 15 cents on a $4 burger). Labor is only about 30% of a fast-food restaurant’s costs, so a big wage rise is a smaller cost shock — in the model, labor demand here looks steep (inelastic).',
      src: [
        { k: 'Research', d: 'Sept 2024', by: 'Reich & Sosinskiy, UC Berkeley IRLE', t: 'New study analyzes impact of California’s $20 minimum wage for fast food workers', s: 'Average pay of non-managerial fast-food workers rose about 18%, employment was not adversely affected, and prices rose about 3.7% one time.', u: 'https://irle.berkeley.edu/publications/press-release/new-study-analyzes-impact-of-californias-20-minimum-wage-for-fast-food-workers' },
        { k: 'Research', d: 'July 2025 (revised)', by: 'Clemens, Edwards, Meer & Nguyen, NBER Working Paper 34033', t: 'Employment Effects of California’s Fast Food Minimum Wage: Evidence from the QCEW and QWI', s: 'Relative to a counterfactual built from the rest of the country, California fast-food employment was about 3% (QCEW) and 1.5% (QWI) lower after one year, and about 3.5% lower after two.', u: 'https://www.nber.org/papers/w34033' }
      ]
    },
    {
      m: /^Wage above equilibrium/,
      cc: 'KR',
      when: '2018 · Korea',
      title: 'Korea: the minimum wage rose 16.4% — low-wage industries shed jobs',
      q: 'In January 2018 Korea raised its minimum wage 16.4%, from 6,470 to 7,530 won an hour — the largest rise in 17 years. In the model, a wage above equilibrium cuts employment. Total employment still rose in 2018, by 97,000. What happened to employment in accommodation & food services and in wholesale & retail, where many minimum-wage workers work?',
      opts: ['It rose with total employment', 'It hardly changed', 'It fell by 117,000 together'],
      ans: 2,
      v: 'As the model predicts for these industries, employment fell: accommodation & food −45,000 and wholesale & retail −72,000 from 2017. Total employment grew by only 97,000, the smallest rise since 2009.',
      chart: {k: 'kr_minwage',from: '2017-01',to: '2019-12',hl: ['2018-01', '2018-12'],band: ['2018-01', '2018-12'],marks: [['2018-10',0,'−97k','side'],['2018-08',1,'−123k','left']],names: ['Accommodation & food','Wholesale & retail'],y: 'Change in employment from a year earlier, thousands',cap: 'Economically Active Population Survey (901Y027), employed by industry, not seasonally adjusted, monthly',src: 'ecos'},
      th: 'Direction: as the model predicts, ==employment fell in the industries where minimum-wage jobs are concentrated==. The cause is harder to pin down. Accommodation & food jobs were already falling from mid-2017, before the rise; weak consumer demand and self-service kiosks hit the same industries; and in 2019, after a further 10.9% rise to 8,350 won, accommodation & food employment grew again (+60,000). Studies of 2018 disagree on how much of the loss the minimum wage caused.',
      src: [{k: 'Data',d: 'monthly and annual',by: 'Bank of Korea, ECOS',t: 'Economic Statistics System',s: 'Economically Active Population Survey (901Y027): employed by industry — the chart, and annual totals (2017 26.725 million, 2018 26.822 million).',u: 'https://ecos.bok.or.kr/'},{k: 'Data',d: '2017–2019',by: 'Minimum Wage Commission',t: 'Minimum wage by year',s: 'Hourly minimum wage: 6,470 won (2017), 7,530 won (2018, +16.4%), 8,350 won (2019, +10.9%).',u: 'https://www.minimumwage.go.kr/'}]
    },
    {
      m: /^Labor demand falls/, when: 'March – May 2020 · United States', title: 'COVID-19: labor demand collapsed, but average wages rose',
      q: 'Between March and April 2020 U.S. payroll employment fell by about 20.5 million, and the unemployment rate jumped from 3.5% (Feb) to 14.8% (Apr). In the model the wage is stuck at W_E in the short run, then falls. What happened to average hourly earnings (production and nonsupervisory workers) compared with a year earlier?',
      opts: ['Rose by almost 8%', 'Stayed about the same', 'Fell by about 5%'], ans: 0,
      v: 'Unlike the model, they rose: $25.14 in April 2020 versus $23.33 in April 2019, +7.8% (it was +3.6% in February).',
      chart: { k: 'c28_covid', from: '2019-01', to: '2021-12', hl: ['2020-04'], marks: [['2020-04', 0, '14.8%'], ['2020-04', 1, '+7.8%', 'below']], names: ['Unemployment rate', 'Hourly earnings'], y: '% (earnings: change from a year earlier)', cap: 'UNRATE and AHETPI (% change from a year earlier), monthly' },
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
      v: 'Far longer than the model\'s "short stop between jobs": about 25 weeks (25.2), nearly three times as long as in 2007.',
      chart: { k: 'c28_dur', from: '2004-01', to: '2016-12', hl: ['2007-11', '2010-06'], marks: [['2007-11', 0, '8.6 wks', 'left'], ['2010-06', 0, '25.2 wks'], ['2009-10', 1, '10.0%', 'below']], names: ['Median weeks', 'Unemployment rate'], y: 'Weeks / percent', cap: 'UEMPMED (median duration of unemployment, weeks) and UNRATE, monthly' },
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
      v: 'As the model describes, participation fell — by 3.2 points, to 60.1% — about 6.4 million people left the labor force from March to April.',
      chart: { k: 'c28_lfp', from: '2020-01', to: '2022-12', hl: ['2020-02', '2020-04'], marks: [['2020-04', 0, '−3.2', 'below'], ['2020-04', 1, '+11.3']], names: ['Participation', 'Unemployment rate'], y: 'Change since Feb 2020, percentage points', cap: 'CIVPART and UNRATE, monthly, change from Feb 2020' },
      th: 'The flow is real: people who stop looking drop out of the labor force, which keeps the official rate from rising even more. But ==the label "gives up" fits only a few of them==. BLS counted 574,000 discouraged workers in April, against 9.9 million people outside the labor force who said they wanted a job. By definition none of them had searched in the last 4 weeks, so none counted as unemployed.',
      src: [
        { k: 'News', d: 'May 8, 2020', by: 'U.S. Bureau of Labor Statistics', t: 'The Employment Situation — April 2020', s: 'Reports the drop in participation, 9.9 million people not in the labor force who wanted a job, and 2.3 million marginally attached.', u: 'https://www.bls.gov/news.release/archives/empsit_05082020.htm' },
        { k: 'Data', d: 'Current Population Survey definitions', by: 'U.S. Bureau of Labor Statistics', t: 'Concepts and definitions: discouraged workers and people who want a job now', s: 'Explains that people who want a job now but have not searched in 4 weeks are outside the labor force, and that discouraged workers are a subset of them.', u: 'https://www.bls.gov/cps/definitions.htm' }
      ]
    },
    {
      m: /^Reclassify token job-seekers/, when: 'April 2020 · United States', title: 'The official rate vs the broadest measure (U-6)',
      q: 'The model shows how recounting people between "unemployed" and "not in the labor force" changes the official unemployment rate (U-3). BLS also publishes U-6, which adds people who want a job but stopped searching, plus part-timers who want full-time work. In April 2020 U-3 was 14.8%. What was U-6?',
      opts: ['About 23%', 'About 19%', 'About 16%'], ans: 0,
      v: 'As the model shows, the counting rule matters: U-6 was 22.9%, 8.1 points above the official rate that month.',
      chart: { k: 'c28_u6', from: '2015-01', to: '2024-12', hl: ['2020-04'], marks: [['2020-04', 1, '22.9%'], ['2020-04', 0, '14.8%', 'below']], names: ['U-3 (official)', 'U-6 (broadest)'], y: '% of labor force', cap: 'UNRATE and U6RATE, monthly' },
      th: 'The model is right that the rule for who counts as unemployed changes the rate — U-6 is a different rule. It adds the marginally attached (2.3 million) and people working part time for economic reasons (10.9 million) in April 2020. The gap is large even in normal times: ==in Feb 2020 U-3 was 3.5% and U-6 7.0%, twice as high==. So the official rate counts active searchers; it is not a full measure of slack.',
      src: [
        { k: 'Data', d: 'Current Population Survey definitions', by: 'U.S. Bureau of Labor Statistics', t: 'Concepts and definitions: alternative measures of labor underutilization (U-1 to U-6)', s: 'U-3 is the official rate; U-6 is the broadest, adding groups that the official rate leaves out.', u: 'https://www.bls.gov/cps/definitions.htm' },
        { k: 'News', d: 'May 8, 2020', by: 'U.S. Bureau of Labor Statistics', t: 'The Employment Situation — April 2020', s: 'Gives the April 2020 counts of marginally attached workers and people working part time for economic reasons, and defines U-6.', u: 'https://www.bls.gov/news.release/archives/empsit_05082020.htm' }
      ]
    },
    {
      m: /^Laid off, gives up searching/,
      cc: 'KR',
      when: 'April 2020 · Korea',
      title: 'Korea: 476,000 fewer jobs, yet the unemployment rate fell',
      q: 'In April 2020 the COVID-19 shock left Korea with 476,000 fewer employed people than a year earlier. In the model, laid-off workers who keep searching count as unemployed; those who stop searching leave the labor force. The unemployment rate was 4.4% in April 2019. What was it in April 2020?',
      opts: ['About 6%','About 5%','4.2%, lower than a year earlier'],
      ans: 2,
      v: 'Just as the model\'s "stop searching" flow implies, the rate did not rise: it fell to 4.2%, down 0.2 points. The number of unemployed fell by 73,000, while the population outside the labor force rose by 831,000.',
      chart: {k: 'kr_jobs',from: '2019-01',to: '2021-12',hl: ['2020-04'],marks: [['2020-04',1,'+831k'],['2020-04',0,'−73k','below']],names: ['Unemployed','Not in labor force'],y: 'Change from a year earlier, thousands',cap: 'Economically Active Population Survey (901Y027), not seasonally adjusted, monthly',src: 'ecos'},
      th: 'The flow in the model is real, and in Korea it dominated: ==the people who lost work mostly did not search, so they were counted outside the labor force, not as unemployed==. That is why the unemployment rate fell while jobs disappeared. The employment rate (59.4%, down 1.4 points) and the participation rate (62.0%, down 1.6 points) showed the shock; the unemployment rate did not.',
      src: [{k: 'News',d: 'May 13, 2020',by: 'Statistics Korea',t: 'Economically Active Population Survey in April 2020',s: 'Employment fell by 476,000 from a year earlier; the unemployment rate was 4.2%, down 0.2 points; the economically inactive population rose by 831,000.',u: 'https://mods.go.kr/board.es?mid=a20105020000&bid=11732&act=view&list_no=382428&tag=&nPage=8&ref_bid='}]
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
    [/American Rescue Plan/, "American Rescue Plan: a $1.9 trillion U.S. relief law signed on March 11, 2021, including $1,400 payments to most people."],
    [/excess savings/, "Excess savings: savings above what households would have built up on the pre-pandemic trend."],
    [/net petroleum exporter/, "Net petroleum exporter: a country that exports more crude oil and oil products than it imports."],
    [/soft landing/, "Soft landing: bringing inflation down without causing a recession."],
    [/\bBLS\b/, "BLS (Bureau of Labor Statistics): the U.S. government agency that publishes jobs, wages and price data."]
  ];
  const KO = document.documentElement.lang === 'ko' && window.RW_KO;
  const HOME = KO ? 'KR' : 'US';   // 사건에 사례가 여럿이면 이 나라 것을 먼저
  const CS = KO ? KO.cases : CASES;
  const G = KO ? KO.gloss || [] : GLOSS;
  const UI = KO ? {
    tag: '현실 연결', pick: '<b class="rwchip">현실</b> 표시가 붙은 사건을 고르면 모형을 미국·한국 실제 데이터와 맞춰 볼 수 있다.', cc: { US: '미국', KR: '한국' }, ccLabel: '나라', sourceKr: '출처: 한국은행 ECOS — ',
    skip: '바로 보기', right: '✓ 정답.', wrong: '✗ 오답.', theory: '이론과 현실',
    source: '출처: FRED — ', got: ' · 받은 날 ', band: ' · 노란 칸: 사건 기간', hl: ' · 초록 선: 정답', ans: '정답', prevQ: '이전', nextQ: '다음', qWord: ' 문제', nodata: '데이터를 불러오지 못했다.', fold: '시간선 내리기', unfold: '시간선 올리기', foldS: '내리기', unfoldS: '올리기', mode: '모드', basic: '기본', rw: '현실 연결'
  } : {
    tag: 'Real world', pick: 'Pick an event marked <b class="rwchip">REAL</b> to test the model against U.S. and Korean data.', cc: { US: 'U.S.', KR: 'Korea' }, ccLabel: 'Country', sourceKr: 'Source: Bank of Korea ECOS — ',
    skip: 'Just show me', right: '✓ Right.', wrong: '✗ Not quite.', theory: 'Theory vs reality',
    source: 'Source: FRED — ', got: ' · retrieved ', band: ' · shaded: event period', hl: ' · green line: answer', ans: 'Answer', prevQ: 'Prev', nextQ: 'Next', qWord: ' question', nodata: 'Data could not be loaded.', fold: 'Hide timeline', unfold: 'Show timeline', foldS: 'Hide', unfoldS: 'Show', mode: 'Mode', basic: 'Basic', rw: 'Real world'
  };

  /* ───────── 선그래프 ───────── */
  const W = 640, R = 18, B = 30;
  const COL = ['#1f6fd1', '#1f2537'], ANS = '#1d8a4a';   // 정답 선: 정답 버튼(.ok)과 같은 초록
  const yr = (d) => { const p = d.split('-').map(Number); return p[0] + (p[1] - 1) / 12 + ((p[2] || 1) - 1) / 365; };
  function nice(max) { const s = Math.pow(10, Math.floor(Math.log10(max / 4))); return [1, 2, 2.5, 5, 10].map((k) => k * s).find((k) => max / k <= 5); }
  const tw = (t) => [...t].reduce((w, ch) => w + (ch.charCodeAt(0) > 127 ? 22 : 13), 0);   // 휴대폰 22px 글자 기준 대략의 글 폭(한글 22 · 영문 13)
  function chart(c, data) {
    const rows = data[c.k].filter((r) => r[0] >= c.from && r[0] <= c.to);
    const n = rows[0].length - 1, xs = rows.map((r) => yr(r[0]));
    let ymax = 0, ymin = 0; rows.forEach((r) => { for (let j = 1; j <= n; j++) { ymax = Math.max(ymax, r[j]); ymin = Math.min(ymin, r[j]); } });
    const step = nice((ymax - ymin) * 1.08), top = Math.ceil(ymax * 1.15 / step) * step, bot = -Math.ceil(-ymin * 1.08 / step) * step;   // 음수 값이 있으면 0 아래까지
    // 정답 표시(hl: [날짜] 또는 [시작, 끝])가 있으면 범례 아래 한 줄(정답 글자 · 구간 괄호)을 더 두고 그만큼 그림을 키운다
    const T = c.hl ? 72 : 30, H = 260 + T;
    const x0 = Math.min(xs[0], c.hl ? yr(c.hl[0]) : Infinity), x1 = Math.max(xs[xs.length - 1], c.hl ? yr(c.hl[c.hl.length - 1]) : -Infinity);
    const L = Math.max(52, 14 + 13 * Math.max(String(top).length, String(bot).length));   // 왼쪽 여백: 축 숫자가 길면(1000, -500) 넓힌다(휴대폰 22px 글자 기준)
    const X =(x) => L + (x - x0) / (x1 - x0) * (W - L - R), Y = (y) => T + (top - y) / (top - bot) * (H - T - B);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(c.y) + '">';
    if (c.band) s += '<rect x="' + X(yr(c.band[0])) + '" y="' + T + '" width="' + (X(yr(c.band[1])) - X(yr(c.band[0]))) + '" height="' + (H - T - B) + '" fill="#fff3b0" opacity=".7"/>';
    for (let v = bot; v <= top + 1e-9; v += step) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (bot < 0 && Math.abs(v) < 1e-9 ? '#8d93a0' : '#e3e6ea') + '"/><text x="' + (L - 8) + '" y="' + (Y(v) + 6) + '" text-anchor="end" class="ax">' + (+v.toFixed(2)) + '</text>';
    const span = x1 - x0, ys = span > 40 ? 10 : span > 12 ? 4 : span > 6 ? 2 : 1;
    for (let y = Math.ceil(x0); y <= x1; y++) if (y % ys === 0) s += '<line x1="' + X(y) + '" x2="' + X(y) + '" y1="' + (H - B) + '" y2="' + (H - B + 5) + '" stroke="#8d93a0"/><text x="' + X(y) + '" y="' + (H - 6) + '" text-anchor="' + (X(y) - 30 < L ? 'start' : X(y) + 30 > W ? 'end' : 'middle') + '" class="ax">' + y + '</text>';
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="#1f2537" stroke-width="1.5"/>';
    if (c.vline) { const vx = X(yr(c.vline[0])); s += '<line x1="' + vx + '" x2="' + vx + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#c8352e" stroke-width="2" stroke-dasharray="5 4"/><text x="' + (vx + 6) + '" y="' + (T + 14) + '" class="vl">' + esc(c.vline[1]) + '</text>'; }
    // 정답 시점(세로선 하나) · 구간(양 끝 세로선 + 위쪽 괄호). 글자는 범례 아래 줄, 그림 칸 밖으로 넘치지 않게 가운데를 당긴다
    if (c.hl) {
      const a = X(yr(c.hl[0])), b = X(yr(c.hl[c.hl.length - 1])), top = T - 7, lw = tw(UI.ans) + 8;
      const mid = Math.max(L + lw / 2, Math.min(W - R - lw / 2, (a + b) / 2));
      [a, b].filter((x, k) => k === 0 || b - a > 1).forEach((x) => { s += '<line x1="' + x + '" x2="' + x + '" y1="' + top + '" y2="' + (H - B) + '" stroke="' + ANS + '" stroke-width="2.5"/>'; });
      if (b - a > 1) s += '<line x1="' + a + '" x2="' + b + '" y1="' + top + '" y2="' + top + '" stroke="' + ANS + '" stroke-width="2.5"/>';
      s += '<text x="' + mid + '" y="' + (T - 15) + '" text-anchor="middle" class="an">' + esc(UI.ans) + '</text>';
    }
    for (let j = 1; j <= n; j++) s += '<polyline fill="none" stroke="' + COL[j - 1] + '" stroke-width="' + (j === 1 ? 3 : 2.5) + '" stroke-linejoin="round" points="' + rows.map((r, i) => X(xs[i]).toFixed(1) + ',' + Y(r[j]).toFixed(1)).join(' ') + '"/>';
    // 범례: 앞 이름 길이만큼 띄운다(휴대폰 22px 글자 ≈ 13px/자 기준, 두 이름 합쳐 40자 안팎까지)
    let lx = L + 10;
    if (c.names) s += c.names.map((nm, j) => { const x = lx; lx += 70 + tw(nm); return '<line x1="' + x + '" x2="' + (x + 24) + '" y1="' + 18 + '" y2="' + 18 + '" stroke="' + COL[j] + '" stroke-width="3"/><text x="' + (x + 30) + '" y="' + 24 + '" class="lg">' + esc(nm) + '</text>'; }).join('');
    else s += '<text x="' + L + '" y="' + 20 + '" class="lg">' + esc(c.y) + '</text>';
    (c.marks || []).forEach((mk) => {
      const r = rows.find((q) => q[0].indexOf(mk[0]) === 0); if (!r) return;
      // 글 자리: 기본 점 오른쪽 위 · below 아래 · side 바로 옆(위가 범례에 닿을 때) · left 왼쪽 위. 오른쪽 끝 가까우면 왼쪽으로
      const px = X(yr(r[0])), py = Y(r[mk[1] + 1]), pos = mk[3], left = pos === 'left' || px + 14 + tw(mk[2]) * 1.2 > W - 4;
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
  // 용어를 누르면 그 문단 바로 아래에 뜻 상자를 열고, 다시 누르면 닫는다. 뜻 상자는 페이지에 하나만:
  // 다른 용어가 열린 채로 누르면 같은 문단이면 그 상자의 내용만 바꾸고, 다른 문단이면 상자를 그 문단 아래로 옮긴다
  function termClick(e) {
    const b = e.target.closest('.rwterm'); if (!b) return;
    const i = b.getAttribute('data-g'), host = b.closest('p, li');
    const off = () => document.querySelectorAll('.rwterm[aria-expanded="true"]').forEach((x) => x.setAttribute('aria-expanded', 'false'));
    let box = document.querySelector('.rwdef');
    if (b.getAttribute('aria-expanded') === 'true') { if (box) box.remove(); off(); return; }
    off();
    const d = G[+i][1], k = d.indexOf(': '), html = k > 0 ? '<b>' + esc(d.slice(0, k)) + '</b> ' + esc(d.slice(k + 2)) : esc(d);
    if (box && box.previousElementSibling === host) {   // 같은 문단: 내용만 바꾼다
      box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
    } else {
      if (box) box.remove();
      box = document.createElement('div'); box.className = 'rwdef';
      host.after(box);
    }
    box.setAttribute('data-g', i); box.innerHTML = html;
    b.setAttribute('aria-expanded', 'true');
  }
  // list: 같은 사건의 사례들(나라별, cc 없으면 미국). 둘 이상이면 머리에 [미국 | 한국] 고르기
  function render(card, c, list) {
    card.hidden = c === 'none';   // 이 사건엔 현실 사례가 없으면 카드를 띄우지 않는다(선택을 풀면 다시 안내)
    if (!c) { card.innerHTML = '<p class="rwnote"><span class="rwtag">' + UI.tag + '</span>' + UI.pick + '</p>'; return; }
    if (c === 'none') { card.innerHTML = ''; return; }
    const used = new Set(), q = gloss(esc(c.q), used), vh = gloss(esc(c.v), used);   // 용어 주석은 읽는 순서(질문 → 답 → 이론 → 출처)대로 처음 한 번만
    const cc = list && list.length > 1 ? '<span class="rwcc" role="group" aria-label="' + UI.ccLabel + '">' + list.map((x, i) => '<button type="button" data-c="' + i + '" aria-pressed="' + (x === c) + '">' + UI.cc[x.cc || 'US'] + '</button>').join('') + '</span>' : '';
    const ecos = c.chart && c.chart.src === 'ecos';
    card.innerHTML =
      '<div class="rwhd"><span class="rwtag">' + UI.tag + '</span>' + cc + '<span class="rwwhen">' + esc(c.when) + '</span></div>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p class="rwq">' + q + '</p>' +
      '<div class="rwopts">' + c.opts.map((o, i) => '<button type="button" data-i="' + i + '">' + esc(o) + '</button>').join('') + '<button type="button" class="rwskip" data-i="-1">' + UI.skip + '</button></div>' +
      '<div class="rwans" hidden>' +
      '<p class="rwv"></p>' +
      (c.chart ? '<figure class="rwfig">' + (data ? chart(c.chart, data) : '<p class="rwnote">' + UI.nodata + '</p>') + '<figcaption>' + (ecos ? UI.sourceKr : UI.source) + esc(c.chart.cap) + (data ? UI.got + esc(ecos ? data.fetched_kr : data.fetched) : '') + (c.chart.band ? UI.band : '') + (c.chart.hl ? UI.hl : '') + '</figcaption></figure>' : '') +   // chart 없으면 그림 생략(연구 사례)
      '<p class="rwth"><span class="lb">' + UI.theory + '</span>' + gloss(fmtT(c.th), used) + '</p>' +
      '<ul class="rwsrc">' + c.src.map((x) => '<li><span class="lb">' + x.k + '</span><div><a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.t) + '</a><small>' + esc(x.by) + ' · ' + esc(x.d) + '</small><p>' + gloss(esc(x.s), used) + '</p></div></li>').join('') + '</ul>' +
      '</div>' +
      '<div class="rwnav"><button type="button" data-q="-1">« ' + UI.prevQ + UI.qWord + '</button><button type="button" data-q="1">' + UI.nextQ + UI.qWord + ' »</button></div>';
    card.querySelectorAll('.rwopts button').forEach((b) => b.addEventListener('click', () => {
      const i = +b.getAttribute('data-i');
      card.querySelectorAll('.rwopts button').forEach((x) => { const k = +x.getAttribute('data-i'); x.disabled = true; x.classList.toggle('ok', k === c.ans); x.classList.toggle('no', k === i && i !== c.ans); });
      $('.rwv', card).innerHTML = (i < 0 ? '' : i === c.ans ? '<b class="ok">' + UI.right + '</b> ' : '<b class="no">' + UI.wrong + '</b> ') + vh;
      $('.rwans', card).hidden = false;
      card.dispatchEvent(new CustomEvent('rwanswer'));   // 시간선 숨김(attach)
    }));
    card.querySelectorAll('.rwcc button').forEach((b) => b.addEventListener('click', () => card.dispatchEvent(new CustomEvent('rwcountry', { detail: list[+b.getAttribute('data-c')] }))));
  }

  /* ───────── 붙이기 ───────── */
  // 카드 자리: CASES 키 → [그림 칸, 사건 목록을 감싼 범위]. 탭 있는 장은 범위 안에 목록이 여럿(Ch33 AD·AS) 또는 패널마다 따로(Ch28)
  const SPOT = { 29: ['#c29 .fig', '#o29'], 30: ['#c30 .fig', '#o30'], 33: ['#c33 .fig', '#c33 .side'], '28w': ['#p28w .fig', '#o28'], '28u': ['#p28u .fig', '#o28s'] };
  // 범위 하나: 그림 칸 아래 카드 + 목록 REAL 표시. redo: 데이터가 늦게 오면 답 공개 전 카드 다시 그리기
  const redo = [];
  // 사례 글 모으기(주소 · 정규식 · 숫자 제외)
  const rwText = (o) => { const out = []; (function walk(v, k) { if (typeof v === 'string') { if (k !== 'u' && !/^https?:/.test(v)) out.push(v); } else if (Array.isArray(v)) v.forEach((x) => walk(x)); else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.keys(v).forEach((kk) => walk(v[kk], kk)); })(o); return out.join(' ').replace(/<[^>]+>/g, ' '); };
  // 시간선 내리기 상태: 내리기 단추로 정한 값은 장 · 문제를 바꿔도 유지(localStorage 'econ2.fold'). 정답을 고르면 잠깐 내려가는 것은 이 값을 바꾸지 않는다
  let folded = (() => { try { return localStorage.getItem('econ2.fold') === '1'; } catch (e) { return false; } })();
  const setFolded = (v) => { folded = v; try { localStorage.setItem('econ2.fold', v ? '1' : '0'); } catch (e) { /* no storage */ } };
  function attach(key, cases) {
    const fig = $(SPOT[key][0]), scope = $(SPOT[key][1]);
    if (!fig || !scope) return;
    const card = document.createElement('div'); card.className = 'rwcard'; card.id = 'rw' + key; card.setAttribute('aria-live', 'polite');
    fig.appendChild(card);
    card.addEventListener('click', termClick);
    let cur = null, list = null;
    // 사건 하나에 사례가 여럿(나라별)일 수 있다. 처음 보이는 것은 페이지 언어의 나라(한국어판 = 한국) 사례
    const casesOf = (b) => cases.filter((c) => c.m.test(b.textContent.trim())).sort((x, y) => (y.cc === HOME) - (x.cc === HOME));
    const caseOf = (b) => casesOf(b)[0] || null;
    scope.querySelectorAll('li button').forEach((b) => { const cs = casesOf(b); if (!cs.length) return; b.parentNode.classList.add('hasrw'); b.setAttribute('data-rw', rwText(cs)); });   // data-rw: 검색(search.js)용 사례 글
    card.addEventListener('rwcountry', (e) => { cur = e.detail; render(card, cur, list); });   // 나라만 바꿀 때는 시간선 상태(내려 둠 · 올려 둠)를 그대로 둔다
    // 시간선: 사건을 고르면(기본 모드도) rwdock(데스크톱 하단 고정), 정답을 고르면 rwgone(숨김). --dockh 는 시간선 높이
    // 내리기 단추(.rwfold): 조작 줄(.pbar) 안. 시간선을 내려도(정답을 골라도) 조작 줄은 남고, 누르면 다시 올라온다.
    // 아래 여백 대신 --dockv: 데스크톱 두 칸(따로 스크롤)의 높이를 시간선 위까지로(index.html)
    const host = fig.closest('.panel') || fig.closest('.ch'), ch = fig.closest('.ch'), player = host && $('.player', host);
    const wide = window.matchMedia('(min-width:901px)');
    const sync = () => {
      // 숨은 장(·탭)에서는 재지 않는다: 높이 0 이 --dockh 에 남으면, 정답으로 내려간 시간선이 장을 다시 열 때 떠올랐다 내려갔다
      if (!player || host.hidden || !ch.classList.contains('on')) return;
      const h = player.offsetHeight, on = wide.matches && host.classList.contains('rwdock') && !host.classList.contains('rwgone') && !player.classList.contains('idle');
      host.style.setProperty('--dockh', (wide.matches ? h : player.scrollHeight) + 'px');
      // 데스크톱 두 칸의 아래 끝 = 시간선 윗변(--dockv). 내려 둔 시간선은 조작 줄 자리(64px)만
      const docked = wide.matches && host.classList.contains('rwdock') && !player.classList.contains('idle');
      host.style.setProperty('--dockv', on ? h + 'px' : docked ? '64px' : '0px');
    };
    // 이전 · 다음 문제: 지금 보이는 사건 목록에서 앞뒤 사건을 누른다(현실 연결 모드는 현실 표시가 붙은 사건만, 끝에서는 반대쪽 끝으로)
    const navQ = (d) => {
      const rw = document.documentElement.classList.contains('rw');
      const all = Array.prototype.filter.call(scope.querySelectorAll('li button'), (x) => !x.closest('[hidden]') && x.offsetParent !== null && (!rw || x.parentNode.classList.contains('hasrw')));
      if (!all.length) return;
      const at = all.findIndex((x) => x.getAttribute('aria-pressed') === 'true');
      const k = at < 0 ? (d > 0 ? 0 : all.length - 1) : (at + d + all.length) % all.length;
      if (k !== at) all[k].click();
    };
    // 문제 넘기기 단추: 단추가 flex 라 글 조각 앞뒤 일반 공백은 지워진다 → 줄바꿈 없는 공백(«  ·  » · qWord)
    const qbtn = (d) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'spdb rwqb ' + (d < 0 ? 'rwqp' : 'rwqn'); const w = '<span class="qw">' + UI.qWord + '</span>'; b.innerHTML = d < 0 ? '« ' + UI.prevQ + w : UI.nextQ + w + ' »'; b.setAttribute('aria-label', (d < 0 ? UI.prevQ : UI.nextQ) + UI.qWord); b.addEventListener('click', () => navQ(d)); return b; };
    card.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) navQ(+b.getAttribute('data-q')); });   // 걸음 없는 사건(Ch29)은 조작 줄이 없어 카드 아래 단추로
    let fold = null;
    if (player) {
      fold = document.createElement('button'); fold.type = 'button'; fold.className = 'spdb rwfold';
      fold.addEventListener('click', () => { host.classList.toggle('rwgone'); setFolded(host.classList.contains('rwgone')); setFold(); sync(); });
      // 조작 줄 순서: [« 이전 문제][다음 문제 »] [n / N] [▶ 자동] [속도] [▾] — 걸음 ‹ 이전 · 다음 › 은 real.css 가 숨긴다. 내리기는 시간선이 가로(데스크톱)일 때만
      const pb = $('.pbar', player);
      pb.insertBefore(qbtn(1), pb.firstChild); pb.insertBefore(qbtn(-1), pb.firstChild);
      pb.appendChild(fold);
      if (window.ResizeObserver) new ResizeObserver(sync).observe(player);
      new MutationObserver(sync).observe(player, { childList: true, subtree: true });   // 휴대폰은 max-height 로 크기가 묶여 ResizeObserver 만으로는 내용 변화를 못 잡는다
      wide.addEventListener && wide.addEventListener('change', sync);
    }
    // 카드 자리: 데스크톱은 그림 칸 안(Situation · 결과 문장 아래), 휴대폰은 시간선 다음(장의 맨 아래, grid-area rw)
    const place = () => { if (wide.matches || !player) { if (card.parentNode !== fig) fig.appendChild(card); } else { const u = fig.closest('.panel') || fig.closest('.ch'); if (card.parentNode !== u) u.appendChild(card); } };   // 900px 이하: 장(패널) 바로 아래 칸(grid-area rw) — 시간선은 lay.js 가 옮긴다
    place(); wide.addEventListener && wide.addEventListener('change', place);
    const setFold = () => { if (!fold) return; const d = host.classList.contains('rwgone'); fold.textContent = d ? '▴' : '▾'; fold.setAttribute('aria-label', d ? UI.unfold : UI.fold); fold.title = d ? UI.unfold : UI.fold; fold.setAttribute('aria-expanded', String(!d)); };
    const dock = () => { if (!host) return; host.classList.toggle('rwdock', !!cur); host.classList.toggle('rwgone', folded); setFold(); requestAnimationFrame(sync); };
    card.addEventListener('rwanswer', () => { if (!host) return; host.classList.add('rwgone'); setFold(); sync(); });
    // 보이는 목록에서 눌린 사건 읽기(숨은 탭의 눌림은 무시)
    const read = () => {
      const b = Array.prototype.find.call(scope.querySelectorAll('button[aria-pressed="true"]'), (x) => !x.closest('[hidden]'));
      const all = b ? casesOf(b) : null, c = b ? all[0] || 'none' : null;
      if (c !== cur) { cur = c; list = all; render(card, cur, list); dock(); }
    };
    scope.addEventListener('click', (e) => { if (e.target.closest('li button')) { cur = undefined; read(); } });   // 같은 사건을 다시 골라도 새 카드
    const tabs = fig.closest('.ch') && $('.sub', fig.closest('.ch'));
    if (tabs) tabs.addEventListener('click', () => setTimeout(() => { read(); sync(); }, 0));
    render(card, cur);
    redo.push(() => { if (cur && cur !== 'none' && $('.rwans', card).hidden) render(card, cur, list); });
  }
  function init() {
    Object.keys(CS).forEach((k) => attach(k, CS[k]));
    if (/[?&]rwtest/.test(location.search)) window.RW_TEST = { cases: CS, chart: (c) => chart(c, data), ready: () => !!data };   // 점검용(그래프 글자 겹침 검사)
    fetch('/econ2/graphs/real-data.json?v=20261106a').then((r) => r.json()).then((d) => { data = d; redo.forEach((f) => f()); }).catch(() => {});

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
