#!/usr/bin/env python3
"""Econ2 Exam 3 TA Session — Exam 2 TA 세션(econ2-exam2-ta-session.pptx)과 같은 서식으로 PPT · PDF · 덱을 만든다.

  python scripts/econ2-exam3/ta/make_ta.py            # PPTX → PDF(PowerPoint) → 덱 그림 · scn.js · index.html
  python scripts/econ2-exam3/ta/make_ta.py --no-pdf   # PPTX 만

입력  scripts/econ2-exam3/review-data.json (문제 · 풀이의 영어 쪽), 아래 표(번호 · 제목 · 개념 · 정답 줄 · 그래프)
틀    public/econ2/econ2-exam2-ta-session.pptx (Exam 2 판: 슬라이드 크기 · 테마만 쓰고 장은 모두 지운다)
출력  public/econ2/econ2-exam3-ta-session.pptx · .pdf
      public/slides/econ2-exam3/pNN.jpg (1920×1080) · scn.js(움직이는 그래프 데이터) · index.html · qr.svg
서식  Exam 2 판에서 읽은 값 그대로: 머리줄 맑은 고딕 14pt, 문제 Times New Roman 22pt 줄간격 1.15 양쪽 정렬,
      정답 보기 검정 · 나머지 #9CA3AF, 해설 파랑 #0070C0, 표지 Franklin Gothic Medium Cond.
그래프 PPT 안에는 흑백 도형(이동한 곡선도 실선 + 아래 첨자, 곡선 사이 짧은 화살표, 수직선은 가로축까지, 축 이름은 축 끝)으로,
      덱에서는 같은 자리에 움직이는 그래프(graphs.js + scn.js)를 덮는다. 자리 = 무대 px(1600×900) = EMU ÷ 7620.
문제는 문제집 원문이 아니라 같은 유형의 새 문제(review-data.json)다. 괄호 안 번호 = 같은 유형의 문제집 번호.
"""
import copy, json, math, os, re, shutil, subprocess, sys
from lxml import etree
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.dml import MSO_LINE
from pptx.enum.text import MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.oxml.ns import qn

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
DATA = os.path.join(ROOT, 'scripts', 'econ2-exam3', 'review-data.json')
TEMPLATE = os.path.join(ROOT, 'public', 'econ2', 'econ2-exam2-ta-session.pptx')
OUT_PPTX = os.path.join(ROOT, 'public', 'econ2', 'econ2-exam3-ta-session.pptx')
OUT_PDF = os.path.join(ROOT, 'public', 'econ2', 'econ2-exam3-ta-session.pdf')
DECK = os.path.join(ROOT, 'public', 'slides', 'econ2-exam3')
DECK_URL = 'https://peripheral7.github.io/slides/econ2-exam3/'

SW, SH, PXE = 12192000, 6858000, 7620          # 슬라이드 EMU, 무대 1px = 7620 EMU
INK, GREY, OPTG, BLUE, AG, AT = '1F2A44', '4B5563', '9CA3AF', '0070C0', '6B7280', '374151'
FR, HD, TNR, GF = 'Franklin Gothic Medium Cond', '맑은 고딕', 'Times New Roman', 'Arial'

D = json.load(open(DATA, encoding='utf-8'))
RV = {c['ch']: c for c in D['RV']}
EN = lambda v: v[1] if isinstance(v, list) and len(v) == 2 and all(isinstance(x, str) for x in v) else v
LET = 'abcdefgh'

# ─────────────────────────── 장 구성 표 ───────────────────────────
# 문제마다 (review-data id, 종류 번호, 제목, 같은 유형의 문제집 번호, 그래프)
CH = [
    {'ch': 35, 'title': 'The Short-Run Trade-off between Inflation and Unemployment', 'short': 'Phillips Curve', 'probs': [
        ('35-1', 'Price Level ↔ Inflation', 'MC 3', None),
        ('35-2', 'Phillips-Curve Equation', 'lecture', None),
        ('35-3', 'Exploiting the Trade-off', 'MC 8', 'pc_money'),
        ('35-4', 'Natural Rate · Money Growth', 'MC 10', None),
        ('35-5', 'Expectations · SRPC Shift', 'MC 11', 'pc_rec'),
        ('35-6', 'Accommodating a Supply Shock', 'MC 14', 'pc_oil_acc'),
        ('35-7', 'Favorable Supply Shock', 'MC 16', 'pc_oilfall'),
        ('35-8', 'Sacrifice Ratio', 'MC 17', 'pc_disinf'),
        ('35-9', 'Rational Expectations', 'MC 18', 'pc_ratex'),
        ('35-A', 'Four Developments · SRPC and LRPC', 'SA 1', None),
        ('35-B', 'Recession and Adjustment', 'SA 2', 'pc_rec'),
        ('35-C', 'Demand vs Supply Shock · Policy', 'SA 3', None)]},
    {'ch': 31, 'title': 'Open-Economy Macroeconomics: Basic Concepts', 'short': 'Open-Economy Basics', 'probs': [
        ('31-1', 'Net Exports', 'MC 2', None),
        ('31-2', 'S = I + NCO', 'MC 5', None),
        ('31-3', 'Y = C + I + G + NX', 'MC 6', None),
        ('31-4', 'Saving · NCO · NX', 'MC 4', None),
        ('31-5', 'Appreciation · Travel Cost', 'MC 7', None),
        ('31-6', 'Real Exchange Rate · Arbitrage', 'MC 8 · 12', None),
        ('31-7', 'Big Mac PPP', 'MC 15', None),
        ('31-8', 'Money Supply · PPP', 'MC 16 · 18', None),
        ('31-9', 'Inflation Gap · Exchange Rate', 'MC 19', None),
        ('31-A', 'NX or NCO?', 'SA 1–3', None),
        ('31-B', 'Who Gains from Appreciation', 'SA 4', None),
        ('31-C', 'Direction of the Real Exchange Rate', 'SA 5', None),
        ('31-D', 'Big Mac Index', 'SA 6', None),
        ('31-E', 'PPP · Rule of 70 · Fisher Effect', 'SA 7', None)]},
    {'ch': 32, 'title': 'A Macroeconomic Theory of the Open Economy', 'short': 'Open-Economy Theory', 'probs': [
        ('32-1', 'Supply and Demand for Loanable Funds', 'MC 1 · 3', None),
        ('32-2', 'Supply of Loanable Funds', 'MC 2', None),
        ('32-3', 'Shortage of Loanable Funds', 'MC 5', None),
        ('32-4', 'More Saving · NCO', 'MC 6 · 9', 'surplus'),
        ('32-5', 'Interest Rate · Supply of Currency', 'MC 10 · 11', None),
        ('32-6', 'Budget Deficit', 'MC 13 · 14', 'deficit'),
        ('32-7', 'Import Tariff', 'MC 16 · 17', 'quota'),
        ('32-8', 'Capital Flight', 'MC 18', 'flight'),
        ('32-9', 'Budget Deficit vs Investment Credit', 'MC 19 · 20', 'invest'),
        ('32-A', 'Foreign Taste for Korean Goods', 'SA 1', 'taste'),
        ('32-B', 'Budget Deficit vs Investment Tax Credit', 'lecture', None),
        ('32-C', 'Capital Flight (1997)', 'review', 'flight')]},
]
SORTLAB = {'NX+': 'NX ↑', 'NX-': 'NX ↓', 'NCO+d': 'NCO ↑ · direct', 'NCO+p': 'NCO ↑ · portfolio', 'NCO-d': 'NCO ↓ · direct', 'NCO-p': 'NCO ↓ · portfolio'}

# 정답 줄(서술형). 객관식은 review-data 의 ans 로 만든다
SA_KEY = {
    '35-2': ['a. 7%, 4%', 'b. 8%, 5% · SRPC ↑ (right)', 'c. LRPC at 5% · 6%, 3%'],
    '35-A': ['a. LRPC and SRPC → (right)', 'b. SRPC ← (down)', 'c. Along the SRPC: u ↓, π ↑', 'd. SRPC ← (down)'],
    '35-B': ['a. π ↓, u ↑ (along the SRPC)', 'b. SRPC ↓ → better trade-off'],
    '35-C': ['a. LRPC vertical at u*, SRPC slopes down', 'b. Yes (demand shock)', 'c. Expansion: u back, π higher', '    Contraction: π back, u higher'],
    '31-B': ['Pleased: a (Japanese fund), d (buyer abroad)', 'Unhappy: b (exporter), c (tourists)'],
    '31-C': ['a. ε ↑   b. ε ↓   c. ε ↓   d. ε ↑'],
    '31-D': ['a. ¥87, ₩1,000, £0.80 per $', 'b. PPP ¥0.087/₩ · actual ¥0.109/₩', 'c. Close for the U.K.; yen, won undervalued'],
    '31-E': ['a. 6 pesos/$', 'b. $10, 120 pesos → 12 pesos/$', 'c. B (Fisher effect)', 'd. Depreciation offsets the gap'],
    '32-A': ['a. Demand for won →', 'b. Won appreciates (E ↑)', 'c. NX unchanged (NX = NCO)'],
    '32-B': ['1. r ↑, NCO ↓, E ↑, NX ↓', '2. Same directions', '3. Deficit: I ↓ · tax credit: I ↑'],
    '32-C': ['a. NCO curve →, LF demand →', 'b. r ↑, I ↓', 'c. E ↓ (depreciation), NX ↑'],
}

# ─────────────────────────── 그래프(덱의 graphs.js 와 같은 모양) ───────────────────────────
def pc_panel(pts):
    return {'dom': [0, 10, 0, 10], 'xName': 'u', 'yName': 'π', 'xTitle': 'u', 'yTitle': 'π', 'star': True, 'starId': 'LRPC',
            'curves': [{'id': 'LRPC', 'kind': 'vert', 'x': 5, 'y0': 0, 'y1': 9.4, 'lab': 'LRPC'},
                       {'id': 'SRPC', 'kind': 'line', 'x': 5, 'y': 5, 'm': -0.85, 'span': 4.0, 'lab': 'SRPC'},
                       {'id': 'DM', 'kind': 'line', 'x': 5, 'y': 5, 'm': 0.85, 'span': 4.0, 'lab': '', 'hidden': True}],
            'pts': pts}

def pc(states, pts=None):
    return {'panels': [pc_panel(pts or [['SRPC', 'DM']])], 'states': [{'off': s[0], 'say': s[1]} for s in states]}

def open3(states, two=None):
    lf = {'title': 'Loanable funds', 'dom': [0, 10, 0, 10], 'xName': 'LF', 'yName': 'r', 'xTitle': 'LF', 'yTitle': 'r',
          'curves': [{'id': 'S', 'kind': 'line', 'x': 5, 'y': 5, 'm': 0.85, 'span': 4.0, 'lab': 'S'},
                     {'id': 'D', 'kind': 'line', 'x': 5, 'y': 5, 'm': -0.85, 'span': 4.0, 'lab': 'D'}], 'pts': [['S', 'D']]}
    nco = {'title': 'Net capital outflow', 'dom': [0, 10, 0, 10], 'xName': 'NCO', 'yName': 'r', 'xTitle': 'NCO', 'yTitle': 'r',
           'curves': [{'id': 'N', 'kind': 'line', 'x': 5, 'y': 5, 'm': -0.85, 'span': 4.0, 'lab': 'NCO'},
                      {'id': 'RL', 'kind': 'horiz', 'y': 5, 'x0': 0, 'x1': 10, 'lab': '', 'hidden': True}], 'pts': [['N', 'RL']]}
    fx = {'title': 'Foreign-currency exchange', 'dom': [0, 10, 0, 10], 'xName': 'Q', 'yName': 'E', 'xTitle': 'Q', 'yTitle': 'E',
          'curves': [{'id': 'FS', 'kind': 'vert', 'x': 5, 'y0': 0, 'y1': 9.4, 'lab': 'S'},
                     {'id': 'FD', 'kind': 'line', 'x': 5, 'y': 5, 'm': -0.85, 'span': 4.0, 'lab': 'D'}], 'pts': [['FS', 'FD']]}
    return {'panels': [lf, nco, fx], 'states': [{'off': s[0], 'say': s[1]} for s in states], 'sayOnly': True}

M = 2.4    # 곡선 이동 폭(축 0~10)
K = 1.02   # 대부자금 곡선을 M 만큼 옮기면 r 이 K(= 0.85 × M ÷ 2) 오르내리고, NCO 는 M ÷ 2 움직인다(기울기 ±0.85)
SCN = {
    'pc_concept': pc([({}, ['장기 균형 A: π = πᵉ, u = u*', 'Long-run point A: π = πᵉ, u = u*']),
                      ({'SRPC': M}, ['πᵉ ↑ 또는 불리한 공급 충격 → SRPC ↑ : 같은 u 에서 π ↑', 'πᵉ ↑ or an adverse supply shock → SRPC ↑ : higher π at each u'])],
                     pts=[['SRPC', 'LRPC']]),
    'pc_money': pc([({}, ['장기 균형 A: u = u*', 'Long-run point A: u = u*']),
                    ({'DM': -M}, ['통화 확장 → AD ↑ → SRPC 위 이동: u ↓, π ↑', 'Money growth → AD ↑ → along the SRPC: u ↓, π ↑']),
                    ({'DM': -M, 'SRPC': M}, ['기대 조정(πᵉ ↑) → SRPC ↑ : u = u*, π 만 ↑', 'Expectations adjust (πᵉ ↑) → SRPC ↑ : u back to u*, only π ↑'])]),
    'pc_rec': pc([({}, ['장기 균형 A', 'Long-run point A']),
                  ({'DM': M}, ['AD ↓ → SRPC 위 이동: u ↑, π ↓', 'AD ↓ → along the SRPC: u ↑, π ↓']),
                  ({'DM': M, 'SRPC': -M}, ['πᵉ ↓ → SRPC ↓ : u = u*, π 더 낮음', 'πᵉ ↓ → SRPC ↓ : u back to u*, lower π'])]),
    'pc_oil_acc': pc([({}, ['장기 균형 A', 'Long-run point A']),
                      ({'SRPC': M}, ['불리한 공급 충격 → SRPC ↑ : u ↑, π ↑', 'Adverse supply shock → SRPC ↑ : u ↑, π ↑']),
                      ({'SRPC': M, 'DM': -M}, ['수용(확장) → AD ↑ : u 회복, π 더 높음', 'Accommodate (expand) → AD ↑ : u restored, π higher'])]),
    'pc_oilfall': pc([({}, ['장기 균형 A', 'Long-run point A']),
                      ({'SRPC': -M}, ['유리한 공급 충격 → SRPC ↓ (왼쪽): u ↓, π ↓', 'Favorable supply shock → SRPC ↓ (left): u ↓, π ↓'])]),
    'pc_disinf': pc([({}, ['높은 인플레이션 A', 'High inflation at A']),
                     ({'DM': M}, ['긴축 → AD ↓ : π ↓, u ↑ (희생)', 'Tight money → AD ↓ : π ↓, u ↑ (the sacrifice)']),
                     ({'DM': M, 'SRPC': -M}, ['πᵉ ↓ → SRPC ↓ : u = u*, 낮은 π', 'πᵉ ↓ → SRPC ↓ : u back to u*, lower π'])]),
    'pc_ratex': pc([({}, ['A: 높은 인플레이션', 'A: high inflation']),
                    ({'DM': M, 'SRPC': -M}, ['믿을 만한 정책 → πᵉ 즉시 ↓ : u 그대로, π 만 ↓', 'Credible policy → πᵉ falls at once : u unchanged, only π ↓'])]),
    'deficit': open3([({}, ['처음: 재정 · 무역 균형', 'Start: balanced budget and trade']),
                      ({'S': -M}, ['재정적자 → 국민저축 ↓ → S ← : r ↑', 'Deficit → national saving ↓ → S ← : r ↑']),
                      ({'S': -M, 'RL': K}, ['r ↑ → NCO ↓ (NCO 곡선 위 이동)', 'r ↑ → NCO ↓ (along the NCO curve)']),
                      ({'S': -M, 'RL': K, 'FS': -M / 2}, ['외환 공급(= NCO) ← : E ↑ → NX ↓', 'Supply of currency (= NCO) ← : E ↑ → NX ↓'])]),
    'surplus': open3([({}, ['처음 균형', 'Start']),
                      ({'S': M}, ['저축 ↑ → S → : r ↓', 'More saving → S → : r ↓']),
                      ({'S': M, 'RL': -K}, ['r ↓ → NCO ↑ (곡선 위 이동) · 대부자금 수요량 ↑', 'r ↓ → NCO ↑ (along the curve) · quantity demanded ↑']),
                      ({'S': M, 'RL': -K, 'FS': M / 2}, ['외환 공급 → : E ↓ → NX ↑', 'Supply of currency → : E ↓ → NX ↑'])]),
    'invest': open3([({}, ['처음 균형', 'Start']),
                     ({'D': M}, ['투자세액공제 → I ↑ → D → : r ↑', 'Investment tax credit → I ↑ → D → : r ↑']),
                     ({'D': M, 'RL': K}, ['r ↑ → NCO ↓ (곡선 위 이동)', 'r ↑ → NCO ↓ (along the curve)']),
                     ({'D': M, 'RL': K, 'FS': -M / 2}, ['외환 공급 ← : E ↑ → NX ↓ (재정적자와 같은 방향, I 는 ↑)', 'Supply of currency ← : E ↑ → NX ↓ (as with a deficit, but I ↑)'])]),
    'quota': open3([({}, ['처음 균형', 'Start']),
                    ({'FD': M}, ['관세 → 같은 E 에서 NX ↑ → D → : E ↑\nS · I 그대로 → NCO 그대로 → NX 그대로', 'Tariff → NX ↑ at each E → D → : E ↑\nS, I unchanged → NCO unchanged → NX unchanged'])]),
    'taste': open3([({}, ['처음 균형', 'Start']),
                    ({'FD': M}, ['한국 상품 선호 ↑ → 원화 수요 D → : E ↑\nNCO 그대로 → NX 그대로', 'Taste for Korean goods ↑ → demand for won → : E ↑\nNCO unchanged → NX unchanged'])]),
    'flight': open3([({}, ['처음 균형', 'Start']),
                     ({'N': M, 'D': M}, ['자본 도피 → NCO 곡선 → · 대부자금 수요(I + NCO) → : r ↑', 'Capital flight → NCO curve → and LF demand (I + NCO) → : r ↑']),
                     ({'N': M, 'D': M, 'RL': K}, ['r ↑ 이 NCO 를 조금 되돌림 (그래도 처음보다 ↑)', 'Higher r pulls NCO back a little (still above the start)']),
                     ({'N': M, 'D': M, 'RL': K, 'FS': M / 2}, ['외환 공급 → : E ↓ (절하) → NX ↑', 'Supply of currency → : E ↓ (depreciation) → NX ↑'])]),
}
for k, v in SCN.items():
    if len(v['panels']) == 3: v['pad'] = {'l': 52, 'r': 56, 't': 128, 'b': 58, 'gap': 34}

# ─────────────────────────── XML 도우미 ───────────────────────────
def SE(parent, tag, **at):
    e = etree.SubElement(parent, qn(tag))
    for k, v in at.items(): e.set(k, str(v))
    return e

def rpr(st, tag='a:rPr'):
    r = etree.Element(qn(tag)); r.set('lang', 'en-US'); r.set('sz', str(int(round(st.get('sz', 22) * 100))))
    r.set('b', '1' if st.get('b') else '0'); r.set('i', '1' if st.get('i') else '0'); r.set('dirty', '0')
    if st.get('spc'): r.set('spc', str(st['spc']))
    if st.get('base'): r.set('baseline', str(st['base']))
    SE(SE(r, 'a:solidFill'), 'a:srgbClr', val=st.get('color', '000000'))
    f = st.get('font', TNR)
    SE(r, 'a:latin', typeface=f); SE(r, 'a:ea', typeface=st.get('ea', f)); SE(r, 'a:cs', typeface=st.get('ea', f))
    return r

def para(runs, algn='l', ln=100, bef=0, aft=0, tabs=None, marL=None, indent=None):
    p = etree.Element(qn('a:p')); pp = SE(p, 'a:pPr', algn=algn)
    if marL is not None: pp.set('marL', str(marL))
    if indent is not None: pp.set('indent', str(indent))
    SE(SE(pp, 'a:lnSpc'), 'a:spcPct', val=int(ln * 1000))
    SE(SE(pp, 'a:spcBef'), 'a:spcPts', val=int(round(bef * 100)))
    SE(SE(pp, 'a:spcAft'), 'a:spcPts', val=int(round(aft * 100)))
    if tabs:
        tl = SE(pp, 'a:tabLst')
        for pos, al in tabs: SE(tl, 'a:tab', pos=pos, algn=al)
    for text, st in runs:
        r = SE(p, 'a:r'); r.append(rpr(st)); SE(r, 'a:t').text = text
    if runs: p.append(rpr(runs[-1][1], 'a:endParaRPr'))
    return p

def textbox(shapes, x, y, w, h, paras, ins=(0, 0, 0, 0), anchor='t', name=None, wrap=True):
    tb = shapes.add_textbox(Emu(int(x)), Emu(int(y)), Emu(int(w)), Emu(int(h)))
    if name: tb.name = name
    body = tb.text_frame._txBody
    bp = body.find(qn('a:bodyPr'))
    for ch in list(bp): bp.remove(ch)
    for k in list(bp.attrib): del bp.attrib[k]
    bp.set('wrap', 'square' if wrap else 'none')
    for k, v in zip(('lIns', 'tIns', 'rIns', 'bIns'), ins): bp.set(k, str(int(v)))
    bp.set('anchor', anchor)
    for p in body.findall(qn('a:p')): body.remove(p)
    for p in paras: body.append(p)
    return tb

SUBS = dict(zip('₀₁₂₃₄₅', '012345'))
def rich(text, st):
    """**굵게**, 아래 첨자 ₁₂, 위 첨자 ᵉ 를 run 들로"""
    out, bold = [], False
    for seg in re.split(r'(\*\*)', text):
        if seg == '**': bold = not bold; continue
        buf = ''
        s2 = dict(st, b=st.get('b') or bold)
        for ch in seg:
            if ch in SUBS or ch == 'ᵉ':
                if buf: out.append((buf, s2)); buf = ''
                out.append((SUBS.get(ch, 'e'), dict(s2, base=-25000 if ch in SUBS else 30000)))
            else: buf += ch
        if buf: out.append((buf, s2))
    return out

def lines_of(text, sz, w_emu, cw=0.5):
    """글자 수로 어림한 줄 수(Times 평균 글자 폭 ≈ 0.5em)"""
    cpl = max(6, int(w_emu / 12700 / (cw * sz)))
    n, cur = 1, 0
    for wd in re.sub(r'\*\*', '', text).split(' '):
        L = len(wd) + (1 if cur else 0)
        if cur + L > cpl: n += 1; cur = len(wd)
        else: cur += L
    return n

def page_num(slide, n):
    tb = textbox(slide.shapes, 11002975, 6400800, 731520, 274320, [], anchor='ctr', name='Page Number')
    p = etree.Element(qn('a:p')); SE(p, 'a:pPr', algn='r')
    f = SE(p, 'a:fld', id='{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}', type='slidenum')
    f.append(rpr({'sz': 12, 'color': GREY, 'font': HD})); SE(f, 'a:t').text = str(n)
    tb.text_frame._txBody.append(p)

# ─────────────────────────── 흑백 그래프(PPT 도형) ───────────────────────────
def off_of(c, off): return off.get(c['id'], 0)
def fy(c, o, x):
    if c['kind'] == 'line': return c['y'] + c['m'] * (x - (c['x'] + o))
    if c['kind'] == 'horiz': return c['y'] + o
    return float('nan')
def meet(c1, o1, c2, o2):
    if c2['kind'] == 'vert': c1, c2, o1, o2 = c2, c1, o2, o1
    if c1['kind'] == 'vert':
        x = c1['x'] + o1; return (x, fy(c2, o2, x))
    if c2['kind'] == 'horiz' and c1['kind'] == 'line':
        y = c2['y'] + o2; return ((y - c1['y']) / c1['m'] + c1['x'] + o1, y)
    if c1['kind'] == 'horiz': return meet(c2, o2, c1, o1)
    # 두 직선
    m1, m2 = c1['m'], c2['m']
    b1 = c1['y'] - m1 * (c1['x'] + o1); b2 = c2['y'] - m2 * (c2['x'] + o2)
    x = (b2 - b1) / (m1 - m2); return (x, m1 * x + b1)

def seg_of(pn, c, o):
    d = pn['dom']
    if c['kind'] == 'vert':
        x = c['x'] + o; return [(x, c.get('y0', d[2])), (x, c.get('y1', d[3]))]
    if c['kind'] == 'horiz': return [(c.get('x0', d[0]), c['y'] + o), (c.get('x1', d[1]), c['y'] + o)]
    a, b = c['x'] + o - c['span'], c['x'] + o + c['span']
    a, b = max(a, d[0] + (d[1] - d[0]) * 0.02), min(b, d[1] - (d[1] - d[0]) * 0.02)   # 덱 엔진처럼 가로 범위 안으로
    lo, hi = d[2] + (d[3] - d[2]) * 0.03, d[3]
    pts = []
    for x in (a, b):
        y = fy(c, o, x)
        if y < lo: x = (lo - c['y']) / c['m'] + c['x'] + o; y = lo
        if y > hi: x = (hi - c['y']) / c['m'] + c['x'] + o; y = hi
        pts.append((x, y))
    return pts

def sublab(s):
    """'π_1' → [('π', 0), ('1', 아래 첨자)]"""
    out = []
    for part in re.split(r'(_[^\s·:,()→/]+)', s):
        if not part: continue
        out.append((part[1:], -25000) if part[0] == '_' else (part, 0))
    return out

class StaticGraph:
    """흑백 정적 그래프. 모든 상태의 곡선 자리를 실선 + 아래 첨자로, 곡선 사이에 짧은 화살표, 균형점 A · B · C, 점선 안내선"""
    def __init__(self, slide, region, sc, name):
        self.g = slide.shapes.add_group_shape(); self.g.name = name
        self.x0, self.y0 = region[0], region[1]
        self.W, self.H = region[2] / PXE, region[3] / PXE
        multi = len(sc['panels']) > 1
        p = {'l': 46, 'r': 66 if multi else 84, 't': 52 if multi else 34, 'b': 44, 'gap': 46}
        n = len(sc['panels']); w = (self.W - n * p['l'] - n * p['r'] - (n - 1) * p['gap']) / n; h = self.H - p['t'] - p['b']
        for i, pn in enumerate(sc['panels']): pn['_box'] = (p['l'] + i * (w + p['r'] + p['gap'] + p['l']), p['t'], w, h)
        for pn in sc['panels']: self.panel(pn, sc['states'])

    def E(self, v): return Emu(int(round(v)))
    def X(self, pn, x): b, d = pn['_box'], pn['dom']; return b[0] + (x - d[0]) / (d[1] - d[0]) * b[2]
    def Y(self, pn, y): b, d = pn['_box'], pn['dom']; return b[1] + b[3] - (y - d[2]) / (d[3] - d[2]) * b[3]

    def line(self, x1, y1, x2, y2, w=1.6, dash=False, head=False, color='000000'):
        c = self.g.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, self.E(self.x0 + x1 * PXE), self.E(self.y0 + y1 * PXE), self.E(self.x0 + x2 * PXE), self.E(self.y0 + y2 * PXE))
        c.line.color.rgb = RGBColor.from_string(color); c.line.width = Pt(w)
        if dash: c.line.dash_style = MSO_LINE.DASH
        if head:
            ln = c.line._get_or_add_ln(); te = SE(ln, 'a:tailEnd', type='triangle', w='med', len='med')
        return c

    def dot(self, x, y, r=4.6):
        s = self.g.shapes.add_shape(MSO_SHAPE.OVAL, self.E(self.x0 + (x - r) * PXE), self.E(self.y0 + (y - r) * PXE), self.E(2 * r * PXE), self.E(2 * r * PXE))
        s.fill.solid(); s.fill.fore_color.rgb = RGBColor(0, 0, 0); s.line.fill.background(); s.shadow.inherit = False

    def text(self, x, y, s, size=11, anchor='l', bold=False, color='000000'):
        """(x, y) = 글자 기준선(px). anchor l/c/r"""
        if not s: return
        hpx = size * 12700 / PXE * 1.25
        wpx = sum((0.42 if b else 0.62) * size * 1.667 for t, b in sublab(s) for ch in t) + 8
        left = x if anchor == 'l' else x - wpx / 2 if anchor == 'c' else x - wpx
        runs = [(t, {'sz': size if not b else size, 'b': bold, 'color': color, 'font': GF, 'base': b}) for t, b in sublab(s)]
        textbox(self.g.shapes, self.x0 + left * PXE, self.y0 + (y - hpx * 0.82) * PXE, wpx * PXE, hpx * PXE,
                [para(runs, algn={'l': 'l', 'c': 'ctr', 'r': 'r'}[anchor])], wrap=False)

    def panel(self, pn, states):
        b = pn['_box']; X = lambda v: self.X(pn, v); Y = lambda v: self.Y(pn, v)
        if pn.get('title'): self.text(b[0] + b[2] / 2, b[1] - 30, pn['title'], 11, 'c', color=GREY)
        # 축(축 이름은 각 축 끝)
        self.line(b[0], b[1] - 12, b[0], b[1] + b[3], 1.5); self.line(b[0], b[1] + b[3], b[0] + b[2] + 12, b[1] + b[3], 1.5)
        self.text(b[0] - 7, b[1] - 6, pn['yTitle'], 12, 'r')
        self.text(b[0] + b[2] + 16, b[1] + b[3] + 6, pn['xTitle'], 12, 'l')
        cur = {c['id']: c for c in pn['curves']}
        # 균형점: 상태마다, 바로 앞과 같은 자리면 이름을 물려받는다
        P, letters = [], iter('ABCDEFGH')
        for j, st in enumerate(states):
            row = []
            for qi, q in enumerate(pn['pts']):
                c1, c2 = cur[q[0]], cur[q[1]]
                x, y = meet(c1, off_of(c1, st['off']), c2, off_of(c2, st['off']))
                prev = P[j - 1][qi] if j else None
                if prev and abs(prev['x'] - x) < 1e-6 and abs(prev['y'] - y) < 1e-6: row.append(dict(prev)); prev['skip'] = True
                else: row.append({'x': x, 'y': y, 'lab': next(letters)})
            P.append(row)
        pts = [p for row in P for p in row if not p.get('skip')]
        # 안내선과 축 위 이름(π_1 · u* · u_2 …)
        star = cur.get(pn.get('starId', '')) if pn.get('star') else None
        ys, xs = [], []
        def nm(lst, v, base, frm):
            for i, u in enumerate(lst):
                if abs(u - v) < 0.05: return base + '_' + str(i + frm)
            lst.append(v); return base + '_' + str(len(lst) - 1 + frm)
        usedY, usedX = [], []
        for p in pts:
            px, py = X(p['x']), Y(p['y'])
            self.line(b[0], py, px, py, 1, dash=True); self.line(px, py, px, b[1] + b[3], 1, dash=True)
            yl = nm(ys, p['y'], pn['yName'], 1)
            xl = pn['xName'] + '*' if star and abs(star['x'] - p['x']) < 0.05 else nm(xs, p['x'], pn['xName'], 2 if star else 1)
            if not any(abs(v - py) < 14 for v in usedY): usedY.append(py); self.text(b[0] - 6, py + 5, yl, 11, 'r')
            wl = len(xl.replace('_', '')) * 8.5 + 6               # 가로축 이름: 겹치면 한 줄 아래로, 같은 이름은 한 번만
            if any(n == xl for v, wv, r, n in usedX): continue
            for row in (0, 1):
                if not any(r == row and abs(v - px) < (wl + wv) / 2 + 2 for v, wv, r, n in usedX):
                    usedX.append((px, wl, row, xl)); self.text(px, b[1] + b[3] + 17 + row * 14, xl, 11, 'c'); break
        # 곡선: 서로 다른 자리마다 실선, 여러 자리면 아래 첨자 1 · 2
        for c in pn['curves']:
            if c.get('hidden'): continue
            pos = []
            for st in states:
                o = off_of(c, st['off'])
                if not any(abs(o - v) < 1e-6 for v in pos): pos.append(o)
            for i, o in enumerate(pos):
                (ax, ay), (bx, by) = seg_of(pn, c, o)
                self.line(X(ax), Y(ay), X(bx), Y(by), 2.2)
                lab = c['lab'] + ('_' + str(i + 1) if len(pos) > 1 else '')
                if c['kind'] == 'vert': self.text(X(bx), Y(by) - 6, lab, 11, 'c')
                else:
                    ex, ey = (X(bx), Y(by))
                    self.text(ex + 5, ey + (12 if c['m'] < 0 else 2), lab, 11, 'l')
            for o1, o2 in zip(pos, pos[1:]):         # 곡선 사이 짧은 화살표(실제 이동 방향)
                d = pn['dom']
                if c['kind'] == 'vert': yy = c.get('y1', d[3]) - (d[3] - d[2]) * 0.1; inv = lambda o: c['x'] + o
                else: yy = c['y'] + abs(c['m']) * c['span'] * 0.72; inv = lambda o: (yy - c['y']) / c['m'] + c['x'] + o
                x1, x2 = X(inv(o1)), X(inv(o2)); yp = Y(yy)
                if abs(x2 - x1) > 18:
                    sgn = 1 if x2 > x1 else -1
                    self.line(x1 + sgn * 7, yp, x2 - sgn * 9, yp, 1.6, head=True)
        for p in pts:
            px, py = X(p['x']), Y(p['y']); self.dot(px, py)
            left = star and p['x'] < star['x'] - 0.05
            self.text(px + (-22 if left else 9), py + 6, p['lab'], 12, 'l', bold=True)

# ─────────────────────────── 슬라이드 ───────────────────────────
prs = Presentation(TEMPLATE)
for sid in list(prs.slides._sldIdLst):
    prs.part.drop_rel(sid.get(qn('r:id'))); prs.slides._sldIdLst.remove(sid)
BLANK = [l for l in prs.slide_layouts if l.name == 'Blank'][0]
DECK_SLIDES = []        # 덱 장: {'title', 'g': [(scn id, region)]}

def new_slide(title):
    s = prs.slides.add_slide(BLANK)
    DECK_SLIDES.append({'title': title, 'g': []})
    return s

def graph(slide, key, region, name):
    StaticGraph(slide, region, copy.deepcopy(SCN[key]), name)
    DECK_SLIDES[-1]['g'].append((key, region))

def head(slide, ch, kind, title, src):
    runs = [('Ch%d' % ch, {'sz': 14, 'b': 1, 'color': INK, 'font': HD}), ('   Practice', {'sz': 14, 'color': GREY, 'font': HD}),
            ('   ' + kind + ' · ' + title, {'sz': 14, 'b': 1, 'color': INK, 'font': HD})]
    if src: runs.append(('   like ' + src if src[0] in 'MS' else '   ' + src, {'sz': 14, 'color': GREY, 'font': HD}))
    textbox(slide.shapes, 731520, 411480, 10500000, 411480, [para(runs)], name='Header')

def fit(blocks, w, h, sizes, gap_pt):
    """blocks: [(text, extra_before_pt)] — 가장 큰 글자 크기(sizes 순서)로 높이 h 안에 들어가는 것"""
    for sz in sizes:
        tot = sum(lines_of(t, sz, w) * sz * 1.15 + (gap_pt if extra else 0) for t, extra in blocks) * 12700 + 91440
        if tot <= h: return sz
    return sizes[-1]

def notes_paras(lines, sz, bold_last=True):
    out = []
    for i, t in enumerate(lines):
        st = {'sz': sz, 'color': BLUE, 'b': bold_last and i == len(lines) - 1}
        out.append(para(rich(t, st), algn='l', ln=112, bef=(sz * 0.45 if i else 0)))
    return out

def mc_slide(ch, num, pid, title, src, scn, prob):
    s = new_slide('Ch%d MC %d · %s' % (ch, num, title))
    head(s, ch, 'MC %d' % num, title, src)
    q, opts, ans, sol = EN(prob['q']), [EN(o) for o in prob['opts']], prob['ans'], [EN(x) for x in prob['sol']]
    three = scn and len(SCN[scn]['panels']) == 3
    if three:                                   # 넓은 판: 위에 문제(전체 폭), 그 아래 왼쪽 보기 · 오른쪽 해설, 맨 아래 세 시장 그래프
        bw, top, glim, ow = 10760000, 1051560, 3330000, 5950000
        for sz in (20, 19, 18, 17, 16):
            qh = lines_of(q, sz, bw - 91440, 0.47) * sz * 1.15 * 12700 + 45720
            oh = sum(lines_of(LET[i] + '. ' + o, sz, ow - 91440) for i, o in enumerate(opts)) * sz * 1.15 * 12700 + 45720
            if top + qh + sz * 0.5 * 12700 + oh <= glim: break
        textbox(s.shapes, 685800, top, bw, qh, [para(rich('%d. %s' % (num, q), {'sz': sz}), algn='l', ln=115)], ins=(45720, 45720, 45720, 0), name='Problem')
        oy = top + qh + sz * 0.5 * 12700
        textbox(s.shapes, 685800, oy, ow, glim - oy, [para([(LET[i] + '. ' + o, {'sz': sz, 'color': '000000' if i == ans else OPTG})], algn='l', ln=115) for i, o in enumerate(opts)], ins=(45720, 0, 45720, 0), name='Options')
        nw = 4850000; nsz = fit([(t, 1) for t in sol], nw - 91440, glim - oy, [16, 15, 14, 13, 12], 5)
        textbox(s.shapes, 6800000, oy, nw, glim - oy, notes_paras(sol, nsz), ins=(45720, 0, 45720, 0), name='Notes')
        graph(s, scn, (731520, 3420000, 10728960, 3000000), 'Graph ' + scn)
        return s
    bw = 6900000 if scn else 7441996
    blocks = [(str(num) + '. ' + q, 0)] + [(LET[i] + '. ' + o, 1 if i == 0 else 0) for i, o in enumerate(opts)]
    sz = fit(blocks, bw - 91440, 5120640, [22, 20, 18], 24)
    ps = [para(rich('%d. %s' % (num, q), {'sz': sz}), algn='just', ln=115)]
    for i, o in enumerate(opts):
        ps.append(para([(LET[i] + '. ' + o, {'sz': sz, 'color': '000000' if i == ans else OPTG})], algn='just', ln=115, bef=sz * 1.36 if i == 0 else 0))
    textbox(s.shapes, 685800, 1051560, bw, 5120640, ps, ins=(45720, 45720, 45720, 45720), name='Problem')
    if scn:
        nx, nw, nh = 7700000, 4060000, 3080000 - 1051560
        nsz = fit([(t, 1) for t in sol], nw - 91440, nh, [17, 16, 15, 14, 13], 6)
        textbox(s.shapes, nx, 1051560, nw, nh, notes_paras(sol, nsz), ins=(45720, 45720, 45720, 45720), name='Notes')
        graph(s, scn, (7700000, 3150000, 4060000, 3300000), 'Graph ' + scn)
    else:
        nx, nw, nh = 8450000, 3350000, 5200000
        nsz = fit([(t, 1) for t in sol], nw - 91440, nh, [20, 18, 17, 16, 15, 14], 8)
        textbox(s.shapes, nx, 1051560, nw, nh, notes_paras(sol, nsz), ins=(45720, 45720, 45720, 45720), name='Notes')
    return s

def sa_parts(prob):
    if prob['kind'] == 'sort':
        return [(EN(it['t']), SORTLAB[it['a']]) for it in D['SORT']]
    return [(EN(pt['q']), EN(pt['a'])) for pt in prob['parts']]

def cell_paras(cell, paras, ml=0, mr=91440, mt=0, mb=0):
    body = cell.text_frame._txBody
    for p in body.findall(qn('a:p')): body.remove(p)
    for p in paras: body.append(p)
    cell.margin_left, cell.margin_right, cell.margin_top, cell.margin_bottom = Emu(ml), Emu(mr), Emu(int(mt)), Emu(mb)
    cell.vertical_anchor = MSO_ANCHOR.TOP

def sa_slide(ch, num, pid, title, src, scn, prob, suffix=''):
    s = new_slide('Ch%d SA %d · %s%s' % (ch, num, title, suffix))
    head(s, ch, 'Short Answer %d' % num, title + suffix, src)
    q, parts = EN(prob['q']), sa_parts(prob)
    if scn:                                      # 오른쪽에 그래프: 답은 각 문항 바로 아래(파랑)
        bw, ML, IND = 6900000, 571500, -285750
        for sz, bef in ((22, 25), (20, 18), (20, 10), (18, 10), (17, 6), (16, 4)):
            tot = lines_of(q, sz, bw - 91440) * sz * 1.15 + sum(lines_of(t, sz, bw - 91440 - ML) * sz * 1.15 + bef + lines_of(a, sz - 4, bw - 91440 - ML) * (sz - 4) * 1.15 + 4 for t, a in parts)
            if tot * 12700 + 91440 <= 5250000: break
        ps = [para(rich('%d. %s' % (num, q), {'sz': sz}), algn='just', ln=115)]
        for i, (t, a) in enumerate(parts):
            ps.append(para(rich(LET[i] + '.\t' + t, {'sz': sz}), algn='just', ln=115, bef=bef, marL=ML, indent=IND, tabs=[(ML, 'l')]))
            ps.append(para(rich('→ ' + a, {'sz': sz - 4, 'color': BLUE}), algn='l', ln=112, bef=3, marL=ML))
        textbox(s.shapes, 685800, 1051560, bw, 5250000, ps, ins=(45720, 45720, 45720, 45720), name='Problem')
        graph(s, scn, (7700000, 1250000, 4060000, 5100000), 'Graph ' + scn)
        return s
    # 표(테두리 없음): 첫 줄 = 문제, 다음 줄마다 [a. | 문항 | 파란 답]. PowerPoint 가 줄 높이를 글에 맞춰 늘려 답이 문항과 같은 높이에 온다
    W, C0, C2 = 11000000, 520000, 3700000
    C1 = W - C0 - C2
    for sz, asz, gap in ((22, 17, 22), (20, 16, 16), (20, 15, 10), (18, 15, 10), (17, 14, 6), (16, 13, 4), (15, 12, 3)):
        tot = lines_of(q, sz, W - 91440) * sz * 1.15 + sum(max(lines_of(t, sz, C1 - 91440) * sz * 1.15, lines_of(a, asz, C2 - 91440) * asz * 1.1) + gap for t, a in parts)
        if tot * 12700 <= 5150000: break
    gf = s.shapes.add_table(1 + len(parts), 3, Emu(685800), Emu(1051560), Emu(W), Emu(200000 * (1 + len(parts))))
    gf.name = 'Problem'
    t = gf.table
    tp = t._tbl.tblPr; tp.set('firstRow', '0'); tp.set('bandRow', '0')
    sid = tp.find(qn('a:tableStyleId'))
    if sid is None: sid = SE(tp, 'a:tableStyleId')
    sid.text = '{2D5ABB26-0587-4C30-8999-92F81FD0307C}'          # No Style, No Grid
    for r in t.rows: r.height = Emu(150000)
    t.columns[0].width, t.columns[1].width, t.columns[2].width = Emu(C0), Emu(C1), Emu(C2)
    t.cell(0, 0).merge(t.cell(0, 2))
    cell_paras(t.cell(0, 0), [para(rich('%d. %s' % (num, q), {'sz': sz}), algn='just', ln=115)], ml=0, mr=0, mt=45720)
    for i, (pt, a) in enumerate(parts):
        mt = gap * 12700
        cell_paras(t.cell(i + 1, 0), [para([(LET[i] + '.', {'sz': sz})], algn='r', ln=115)], ml=0, mr=110000, mt=mt)
        cell_paras(t.cell(i + 1, 1), [para(rich(pt, {'sz': sz}), algn='just', ln=115)], ml=0, mr=0, mt=mt)
        cell_paras(t.cell(i + 1, 2), [para(rich(a, {'sz': asz, 'color': BLUE, 'b': True}), algn='l', ln=108)], ml=300000, mr=0, mt=mt + (sz - asz) * 0.35 * 12700)
    return s

def sa_graph_slide(ch, num, title, src, scn, prob):
    """세 시장 그래프가 필요한 서술형의 둘째 장: 문제 한 줄 + 큰 그래프"""
    s = new_slide('Ch%d SA %d · %s (2/2)' % (ch, num, title))
    head(s, ch, 'Short Answer %d' % num, title + '   (2/2)', src)
    textbox(s.shapes, 685800, 1000000, 10800000, 600000, [para(rich('%d. %s' % (num, EN(prob['q'])), {'sz': 20}), algn='l', ln=115)], ins=(45720, 45720, 45720, 45720), name='Problem')
    graph(s, scn, (731520, 1650000, 10728960, 4700000), 'Graph ' + scn)
    return s

def cover():
    s = new_slide('Exam 3 Review')
    textbox(s.shapes, 731520, 1900000, 10500000, 320000, [para([('INTRODUCTION TO ECONOMICS II  ·  26-2', {'sz': 13, 'spc': 250, 'color': GREY, 'font': FR, 'ea': 'KoPub돋움체 Medium'})])], name='Kicker')
    textbox(s.shapes, 731520, 2250000, 10900000, 1500000, [para([('Exam 3 Review', {'sz': 88, 'color': INK, 'font': FR, 'ea': 'KoPub돋움체 Bold'})])], name='Title')
    ps = [para([('Ch%d' % c['ch'], {'sz': 18, 'color': GREY, 'font': FR}), ('\t' + c['title'], {'sz': 18, 'color': INK, 'font': FR})], ln=135, tabs=[(960120, 'l')]) for c in CH]
    textbox(s.shapes, 731520, 4900000, 9000000, 1500000, ps, name='Chapters')

def ch_cover(c, items_mc, items_sa):
    s = new_slide('Ch%d %s' % (c['ch'], c['title']))
    textbox(s.shapes, 731520, 731520, 10500000, 320000, [para([('CHAPTER %d' % c['ch'], {'sz': 13, 'spc': 250, 'color': GREY, 'font': FR})])], name='Kicker')
    textbox(s.shapes, 731520, 1050000, 10700000, 2000000, [para([(c['title'], {'sz': 60, 'color': INK, 'font': FR})], ln=92)], name='Title')
    def col(x, w, head_, items):
        ps = [para([(head_, {'sz': 14, 'color': GREY, 'font': FR})], aft=6)]
        for n, t, src in items:
            runs = [('\t%d' % n, {'sz': 14, 'color': GREY, 'font': FR}), ('\t' + t, {'sz': 15, 'color': INK, 'font': FR})]
            if src: runs.append(('   ' + src, {'sz': 13, 'color': OPTG, 'font': FR}))
            ps.append(para(runs, ln=128, tabs=[(320040, 'r'), (548640, 'l')]))
        return ps
    rows = max(len(items_mc), len(items_sa))
    h = 300000 + rows * 292000
    top = max(2700000, 6330000 - h)
    textbox(s.shapes, 731520, top, 5000000, h, col(731520, 5000000, 'Multiple Choice', items_mc), name='Contents MC')
    textbox(s.shapes, 6035040, top, 5400000, h, col(6035040, 5400000, 'Short Answer', items_sa), name='Contents SA')
    textbox(s.shapes, 731520, top - 420000, 10500000, 300000, [para([('New practice problems of the same types as the problem set  ·  grey = problem-set number', {'sz': 12, 'color': OPTG, 'font': FR})])], name='Note')
    page_num(s, len(prs.slides))

def concept_title(s, text):
    textbox(s.shapes, 783203, 372330, 10789920, 457200, [para([(text, {'sz': 23, 'b': 1, 'color': INK, 'font': '맑은고딕'})])], ins=(91440, 45720, 91440, 45720), name='Title')

def blue_block(s, x, y, w, items, h=5000000):
    """items: ('h', 제목) 또는 ('b', 글머리) 또는 ('s', 작은 글)"""
    ps = []
    for kind, t in items:
        if kind == 'h': ps.append(para(rich(t, {'sz': 21, 'b': True, 'color': BLUE}), ln=100, bef=14 if ps else 0, aft=4))
        elif kind == 'b': ps.append(para(rich('• ' + t, {'sz': 16, 'color': BLUE}), ln=100, aft=4))
        else: ps.append(para(rich(t, {'sz': 13, 'b': True, 'color': BLUE}), ln=100, bef=6))
    textbox(s.shapes, x, y, w, h, ps, ins=(91440, 45720, 91440, 45720), name='Concept')

def frac(s, x, y, lhs, num, den, sz=21):
    """lhs = num / den 을 가로줄 분수로(분자 · 줄 · 분모). (x, y) = 왼쪽 위"""
    cw = sz * 12700 * 0.52
    lw = len(lhs) * cw + 60000; fw = max(len(num), len(den)) * cw + 120000; lh = sz * 12700 * 1.25
    st = {'sz': sz, 'b': True, 'color': BLUE}
    textbox(s.shapes, x, y + lh * 0.55, lw, lh, [para(rich(lhs, st))], wrap=False)
    textbox(s.shapes, x + lw, y, fw, lh, [para(rich(num, st), algn='ctr')], wrap=False)
    c = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Emu(int(x + lw + 30000)), Emu(int(y + lh * 1.08)), Emu(int(x + lw + fw - 30000)), Emu(int(y + lh * 1.08)))
    c.line.color.rgb = RGBColor.from_string(BLUE); c.line.width = Pt(1.6)
    textbox(s.shapes, x + lw, y + lh * 1.1, fw, lh, [para(rich(den, st), algn='ctr')], wrap=False)
    return x + lw + fw

def concept(ch):
    if ch == 35:
        s = new_slide('Ch35 Phillips Curve Overview · Curve Shifters')
        concept_title(s, 'Ch35   Phillips Curve Overview · Curve Shifters')
        graph(s, 'pc_concept', (731520, 1250000, 4500000, 4950000), 'Graph pc_concept')
        blue_block(s, 5650000, 1000000, 5950000, [
            ('h', 'Phillips Curve: u = u* − a(π − πᵉ)'),
            ('b', 'Short run: π > πᵉ → u < u* (move along the SRPC)'),
            ('b', 'Long run: πᵉ = π → u = u* (LRPC vertical at u*)'),
            ('h', 'SRPC Shifters: πᵉ, supply shocks'),
            ('b', 'πᵉ ↑ or oil price ↑ → SRPC ↑ (right): π and u both ↑'),
            ('b', 'Favorable supply shock or πᵉ ↓ → SRPC ↓ (left)'),
            ('b', 'AD change (M, G, C, I) → move along the SRPC, not a shift'),
            ('h', 'LRPC Shifter: natural rate u*'),
            ('b', 'Benefits, unions, minimum wage, job search → u* ↑ → LRPC and SRPC →'),
            ('h', 'Sacrifice Ratio'),
            ('b', 'Output lost (% of a year) ÷ inflation cut (points), typical ≈ 5'),
            ('b', 'Credible policy (rational expectations) → πᵉ ↓ at once → smaller cost'),
        ], h=5400000)
        textbox(s.shapes, 900000, 6250000, 4600000, 280000, [para(rich('AD shift = movement along SRPC · SRAS shift = SRPC shift', {'sz': 12, 'b': True, 'color': BLUE}))], name='Note')
    elif ch == 31:
        s = new_slide('Ch31 Open-Economy Identities · Exchange Rates')
        concept_title(s, 'Ch31   Open-Economy Identities · Exchange Rates')
        blue_block(s, 731520, 1050000, 5300000, [
            ('h', 'Flows: NX = Exports − Imports'),
            ('b', 'NCO = our purchases of foreign assets − foreign purchases of our assets'),
            ('b', 'Direct investment (own and run) vs portfolio (stocks, bonds)'),
            ('h', 'Identities: NX = NCO,  S = I + NCO'),
            ('b', 'Every transaction moves NX and NCO by the same amount'),
            ('b', 'Surplus: NX > 0 ⇔ S > I ⇔ NCO > 0'),
            ('b', 'Foreigners buy our assets → our NCO ↓ (capital inflow)'),
            ('b', 'S = I holds only in a closed economy'),
        ], h=5300000)
        x0 = 6300000
        blue_block(s, x0, 1050000, 5200000, [
            ('h', 'Nominal Rate e = foreign currency per won'),
            ('b', 'e ↑ = appreciation → exports ↓, imports ↑'),
            ('b', 'News “₩ per $” ↑ = won depreciates (textbook e ↓)'),
            ('h', 'Real Exchange Rate'),
        ], h=2100000)
        frac(s, x0 + 200000, 3020000, 'ε = ', 'e × P', 'P*')
        blue_block(s, x0, 3900000, 5200000, [
            ('b', 'ε ↑ → our goods dearer → NX ↓'),
            ('h', 'Purchasing-Power Parity (ε = 1)'),
        ], h=1000000)
        frac(s, x0 + 200000, 4720000, 'e = ', 'P*', 'P')
        blue_block(s, x0, 5600000, 5200000, [('b', 'Faster inflation → currency depreciates: %Δe ≈ π* − π')], h=500000)
    else:
        s = new_slide('Ch32 Three Markets · Order of Attack')
        concept_title(s, 'Ch32   Three Markets · Order of Attack')
        graph(s, 'deficit', (731520, 950000, 10728960, 3450000), 'Graph deficit')
        blue_block(s, 731520, 4520000, 5200000, [
            ('h', 'Order of Attack'),
            ('b', '1. What moves first: S, I, the NCO curve or NX?'),
            ('b', '2. Loanable funds → r   3. r → NCO (along or shift?)'),
            ('b', '4. NCO = supply of currency → E   5. NX = NCO'),
        ], h=1800000)
        blue_block(s, 6100000, 4520000, 5500000, [
            ('h', 'Four Classic Events'),
            ('b', 'Budget deficit: r ↑, NCO ↓, E ↑, NX ↓, I ↓'),
            ('b', 'Investment credit: r ↑, NCO ↓, E ↑, NX ↓, I ↑'),
            ('b', 'Quota or tariff: E ↑ only (NX, NCO, r unchanged)'),
            ('b', 'Capital flight: r ↑, NCO ↑, E ↓, NX ↑'),
        ], h=1800000)
    page_num(s, len(prs.slides))

def answers(page, chs):
    s = new_slide('Answers %d / 2 · %s' % (page, ' · '.join('Ch%d' % c['ch'] for c in chs)))
    textbox(s.shapes, 731520, 250000, 10700000, 600000, [para([('Answers', {'sz': 40, 'color': INK}), ('    %d / 2   %s' % (page, ' · '.join('Ch%d' % c['ch'] for c in chs)), {'sz': 16, 'color': AG})])], anchor='b', name='Title')
    r = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Emu(731520), Emu(960000), Emu(731520 + 10728960), Emu(960000))
    r.line.color.rgb = RGBColor.from_string('D5D9E0'); r.line.width = Emu(6350)
    for k, c in enumerate(chs):
        x = 731520 + k * 5680000
        textbox(s.shapes, x, 1120000, 5260000, 420000, [para([('Ch%d' % c['ch'], {'sz': 20, 'b': 1, 'color': INK})])], name='Chapter')
        mc = [para([('Multiple Choice', {'sz': 14, 'i': 1, 'color': AG})], aft=3)]
        sa = []
        for n, pid, prob in c['_mc']:
            mc.append(para([(str(n), {'sz': 16, 'color': AG}), ('\t' + LET[prob['ans']], {'sz': 17, 'b': 1, 'color': INK})], aft=2.5, tabs=[(548640, 'l')]))
        nsa = sum(1 + len(c['_key'][pid]) for n, pid, prob in c['_sa'])
        lsz = 16 if nsa <= 17 else 15 if nsa <= 20 else 14
        for i, (n, pid, prob) in enumerate(c['_sa']):
            sa.append(para([('Short Answer %d' % n, {'sz': 14, 'i': 1, 'color': AG})], bef=0 if i == 0 else 12, aft=1.2))
            for line in c['_key'][pid]:
                sa.append(para(rich(line, {'sz': lsz, 'color': AT}), aft=0.8))
        textbox(s.shapes, x, 1600000, 1450000, 4750000, mc, name='MC')
        textbox(s.shapes, x + 1500000, 1600000, 3900000, 4750000, sa, name='SA')
        if k == 0 and len(chs) > 1:
            v = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Emu(6201520), Emu(1150000), Emu(6201520), Emu(6300000))
            v.line.color.rgb = RGBColor.from_string('D5D9E0'); v.line.width = Emu(6350)
    page_num(s, len(prs.slides))

def sort_key():
    short = {'NX+': 'NX↑', 'NX-': 'NX↓', 'NCO+d': 'NCO↑ D', 'NCO+p': 'NCO↑ P', 'NCO-d': 'NCO↓ D', 'NCO-p': 'NCO↓ P'}
    it = ['%s %s' % (LET[i], short[x['a']]) for i, x in enumerate(D['SORT'])]
    return ['   '.join(it[:4]), '   '.join(it[4:]), '(D = direct, P = portfolio)']

# ─────────────────────────── 만들기 ───────────────────────────
PROB = {p['id']: p for c in D['RV'] for p in c['probs']}
def slashes(v):                      # Ch31: 나누기 ÷ 는 분수 표기 / 로(인터랙티브 Ch31 과 같게)
    if isinstance(v, str): return v.replace(' ÷ ', ' / ').replace('÷', '/')
    if isinstance(v, list): return [slashes(x) for x in v]
    if isinstance(v, dict): return {k: slashes(x) for k, x in v.items()}
    return v
for k in PROB:
    if k.startswith('31-'): PROB[k] = slashes(PROB[k])
cover()
for c in CH:
    mcn = san = 0; c['_mc'], c['_sa'], c['_key'], plan = [], [], {}, []
    for pid, title, src, scn in c['probs']:
        prob = PROB[pid]
        if prob['kind'] == 'mc': mcn += 1; c['_mc'].append((mcn, pid, prob)); plan.append(('mc', mcn, pid, title, src, scn, prob))
        else:
            san += 1; c['_sa'].append((san, pid, prob)); plan.append(('sa', san, pid, title, src, scn, prob))
            c['_key'][pid] = SA_KEY.get(pid) or (sort_key() if prob['kind'] == 'sort' else [])
    cs = lambda s_: {'lecture': 'Active Learning', 'review': ''}.get(s_, s_)
    ch_cover(c, [(n, t, cs(s_)) for k, n, pid, t, s_, scn, prob in plan if k == 'mc'], [(n, t, cs(s_)) for k, n, pid, t, s_, scn, prob in plan if k == 'sa'])
    concept(c['ch'])
    for k, n, pid, t, src, scn, prob in plan:
        srcl = {'lecture': 'Active Learning', 'review': 'review'}.get(src, src)
        if k == 'mc': sl = mc_slide(c['ch'], n, pid, t, srcl, scn, prob)
        else:
            three = scn and len(SCN[scn]['panels']) == 3
            sl = sa_slide(c['ch'], n, pid, t, srcl, None if three else scn, prob, '   (1/2)' if three else '')
            if three: page_num(sl, len(prs.slides)); sl = sa_graph_slide(c['ch'], n, t, srcl, scn, prob)
        page_num(sl, len(prs.slides))
answers(1, CH[:2]); answers(2, CH[2:])

os.makedirs(DECK, exist_ok=True)
prs.save(OUT_PPTX)
print('pptx', OUT_PPTX, len(prs.slides), 'slides')

# 덱의 움직이는 그래프 데이터: 장마다 따로(같은 시나리오도 복사본)
scn_out = {}
for i, sl in enumerate(DECK_SLIDES):
    for j, (key, reg) in enumerate(sl['g']):
        scn_out['p%02d%s' % (i + 1, '' if j == 0 else chr(97 + j))] = copy.deepcopy(SCN[key])
with open(os.path.join(DECK, 'scn.js'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('/* make_ta.py 가 만든다 — 손으로 고치지 말 것. 장 번호(pNN) → 그래프(panels · states). graphs.js 가 읽는다 */\n')
    f.write('window.E3_SCN = ' + json.dumps(scn_out, ensure_ascii=False, separators=(',', ':')) + ';\n')

if '--no-pdf' in sys.argv: sys.exit(0)

# PDF: PowerPoint 로 내보내기
ps1 = os.path.join(HERE, '_export.ps1')
with open(ps1, 'w', encoding='utf-8-sig') as f:
    f.write("$app = New-Object -ComObject PowerPoint.Application\ntry {\n  $p = $app.Presentations.Open('%s', $true, $false, $false)\n  $p.SaveAs('%s', 32)\n  $p.Close()\n} finally { $app.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null }\n" % (OUT_PPTX.replace("'", "''"), OUT_PDF.replace("'", "''")))
subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1], check=True)
os.remove(ps1)
print('pdf', OUT_PDF)

# 덱 그림(1920×1080, JPG 82) — Exam 2 덱과 같은 방식
import pymupdf
for f in os.listdir(DECK):
    if re.match(r'p\d\d\.jpg$', f): os.remove(os.path.join(DECK, f))
doc = pymupdf.open(OUT_PDF)
for i, pg in enumerate(doc):
    z = 1920 / pg.rect.width
    pg.get_pixmap(matrix=pymupdf.Matrix(z, z)).save(os.path.join(DECK, 'p%02d.jpg' % (i + 1)), jpg_quality=82)
print('jpg', len(doc))

# QR
try:
    import segno
    segno.make(DECK_URL, error='m').save(os.path.join(DECK, 'qr.svg'), scale=10, border=2, dark='#1f2537', light='#fff')
except ImportError:
    print('segno 없음: qr.svg 를 만들지 못함')

# 덱 HTML
def esc(s): return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
secs = []
for i, sl in enumerate(DECK_SLIDES):
    n = i + 1; t = esc(sl['title'])
    h = '  <section class="slide pg" data-title="%s">\n    <img src="p%02d.jpg" alt="%s"%s>\n' % (t, n, t, ' fetchpriority="high"' if n == 1 else ' decoding="async"')
    steps = 0
    for j, (key, reg) in enumerate(sl['g']):
        L, T, W, H = (round(v / PXE) for v in reg)
        h += '    <div class="g" data-g="p%02d%s" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx"></div>\n' % (n, '' if j == 0 else chr(97 + j), L, T, W, H)
        steps = max(steps, len(SCN[key]['states']) - 1)
    if steps: h += '    ' + '<i class="step"></i>' * steps + '\n'
    secs.append(h + '  </section>\n')
tpl = open(os.path.join(HERE, 'deck-template.html'), encoding='utf-8').read()
html = tpl.replace('<!--SLIDES-->\n', ''.join(secs))
with open(os.path.join(DECK, 'index.html'), 'w', encoding='utf-8', newline='\n') as f: f.write(html)
print('deck', os.path.join(DECK, 'index.html'), len(DECK_SLIDES), 'slides')
