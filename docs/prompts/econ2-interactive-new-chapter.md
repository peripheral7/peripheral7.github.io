# 프롬프트: Econ 2 Interactive 에 새 챕터 추가하기

> 쓰는 법: 아래 `---` 사이를 통째로 복사해 새 세션(Claude Code, 이 저장소)에 붙이고, 맨 위 **입력** 칸만 채운다.
> 저장소 밖 AI 에 줄 때는 `public/econ2/graphs/en/index.html`, `public/econ2/graphs/en/app.js` 두 파일을 같이 첨부한다.
> 기준 페이지: https://peripheral7.github.io/econ2/en/ (대문) → /econ2/graphs/en/ (그래프). 2026-11-04 기준(c98efc6) 구조를 역설계한 것.

---

## 입력

- 챕터: `Ch__ <영문 챕터 제목>` (예: `Ch34 The Influence of Monetary and Fiscal Policy on AD`)
- 탭 이름: `Ch__ <짧은 이름>` (예: `Ch34 Policy & AD`)
- 다룰 개념·그래프: (예: 유동성 선호 이론 화폐시장 r–M, 승수효과·구축효과, AD 이동)
- 사건 목록 원천: (예: 교재 Problems and Applications 1·3·5, 기출 MC 4·9 — 번호를 그대로 꼬리표로 씀)
- 교재: Mankiw, *Principles of Economics* (교재의 기본 식·곡선만 쓴다)

## 할 일

`/econ2/graphs/`(한국어)와 `/econ2/graphs/en/`(영문) 페이지에 위 챕터를 **기존 네 챕터(Ch29·30·33·28)와 똑같은 문법**으로 한 구역 추가한다. 새 디자인을 만들지 말고, 아래 "역설계한 규칙"을 그대로 따른다. 판단이 필요한 곳은 기존 챕터 중 가장 비슷한 것을 본뜬다.

먼저 읽을 파일(이 순서로):
1. `public/econ2/graphs/en/index.html` — CSS 전체 · 구역 마크업 · 언어 전환 스크립트
2. `public/econ2/graphs/en/app.js` — 그래프 엔진(Plot) · 재생기(Player) · 사건→걸음 변환(beatsFor · runner) · 챕터별 함수
3. `public/econ2/graphs/index.html`, `public/econ2/graphs/app.js` — 한국어판(구조 동일, 글자만 다름)
4. `public/econ2/en/index.html`, `public/econ2/index.html` — 대문 카드

## 역설계한 규칙

### 1. 페이지 골격
- 단일 정적 HTML + `app.js` 하나. 프레임워크·외부 라이브러리 없음. 글꼴은 `/fonts/PretendardVariable.woff2`.
- 위: 고정 머리줄(`.top`) = 제목(대문 링크) · 챕터 탭(`.tabs button[data-ch="chNN"]`) · 언어 링크(EN ↔ 한국어).
- 챕터마다 `<section class="ch" id="cNN">` 하나. **구역 id 는 `cNN`, 주소 해시는 `#chNN`** (같으면 브라우저가 구역으로 스크롤해 머리줄 밑에 가린다).
- 하위 탭이 있으면 `class="ch tabbed"` + `.sub` 탭(진한 바탕 흰 글자 = 선택), 해시 `#chNN-xx`. `fromHash()` 정규식과 `show()` 에 새 챕터·하위 탭을 추가한다.
- 한 구역의 배치(데스크톱 ≥901px): grid `"side fig" / "play play"` — **왼쪽 설명·사건 목록(.side), 오른쪽 그림(.fig), 아래 전체 폭 시간선(.player)**. 휴대폰(≤900px): 그림 → 시간선 → 설명 한 줄.
- 데스크톱 그래프 높이는 화면 높이 고정(44vh, 낮은 화면 40·33vh). `.side` 는 그 높이 안에서만 스크롤, 스크롤바는 숨기고 더 있으면 아래를 흐리게(`.more`).
- 가운데 최대 폭 `--max:1240px`.

### 2. 왼쪽 `.side` 의 내용 순서
1. `<h2><small>ChNN 교재 장 제목</small>이 화면의 질문/주제</h2>`
2. `.eq` 상자: 교재 기본 식 1~2줄(`.f`, 굵게) + 가정·주의 한 문단(`small`). 예: `Y = C + I + G + NX` / "at a given price level 이면 이동, P 자체 변화는 movement along".
3. `.opts` 사건 목록(들): `<h3>무리 이름 <small>· click again to clear</small></h3><ul></ul>`. 무리가 여럿이면 `data-o` 로 나눔(Ch33 의 C·I·G·NX 처럼).

### 3. 사건 목록(.opts) 동작 — 반드시 지킬 것
- 끌기·슬라이더 **없음**. 고를 것은 글자 목록뿐.
- 줄을 누르면 **늘 처음 상태 A 에서** 그 사건이 재생된다(앞 사건의 이동은 풀림). 같은 줄을 다시 누르면 풀리고 A 로 돌아간다.
- 줄 글자: 사건 이름 + 방향 화살표(`dir: 'r'` → 빨강 →, `'l'` → 파랑 ←) + 출처 꼬리표(`q: 'SA 4'`, `'MC 7'`, 작은 회색).
- 휴대폰에서 고르면 그림이 보이게 위로 스크롤(`bringFig`).

### 4. 시간선(Player) — 모든 챕터 공용, 새로 만들지 말 것
- 사건 = 단계(stage) 1~2개. 단계마다 두 마디: **[곡선 이동] → [결론]**. 단계가 둘이면 `Stage 1 · Short run` / `Stage 2 · Long run` 줄 두 개, 하나면 단계 이름 칸 없이 전체 폭(`.solo`).
- 마디 = 점 · `[제목]`(44px 굵게) · 설명(17px). 지금 마디는 파랑, 지난 것은 검정, 남은 것은 흐림. 줄 끝 원 → 마지막 마디면 파랗게 채워지고 `End`.
- 하단 가운데 떠 있는 조작 줄: `n / N` · `‹ Prev` · `▶ Auto / ❚❚ Pause / ↻ Replay` · `Next ›` · `Speed slow/normal/fast`(기본 fast, 모든 재생기 공유). ← → 키 · 좌우 밀기.
- 마디를 누르면 그 단계 처음부터 다시 재생.
- 갈래(같은 Stage 2 를 두 길로): `from: 0` 을 준 단계는 갈래가 되고 단계 이름 아래 글자 버튼(`short: 'Wait'` · `'Policy'`)으로 고른다(Ch33 SRAS ← 사건 참고).
- 그림 아래 `.sitline`: `[Situation]` 꼬리표 + 지금 상황 한 줄(`' — '` 는 줄바꿈).

### 5. 그림 종류 셋 중 하나를 고른다
| 종류 | 쓸 때 | 본뜰 챕터 |
|---|---|---|
| **A. 곡선 그래프 `Plot`** | 수요·공급형 교점이 움직이는 개념 | Ch30(MS·MD), Ch33(AD·SRAS·LRAS), Ch28 임금 탭(S·D + 수평 W 선) |
| **B. 식 한 줄 + (필요할 때만) T계정** | 그래프 없는 계산 관계(승수, 항등식) | Ch29: `ΔReserves × multiplier = ΔMoney supply` 숫자, 아래 작은 글로 세부 |
| **C. 분수·문장 지표** | 정의 비율의 방향만 묻는 문제 | Ch28 실업률 탭: 무리 칩 → 분자·분모 강조 → 결과, 결과 문장 형광펜 |

#### A. Plot 설정 규칙
- SVG 640×520, 여백 `{l:74, r:118, t:44, b:66}`, 데이터 좌표 `dom:[x0,x1,y0,y1]` (보통 `[0,10,0,10]`, 처음 교점 (5,5)).
- 곡선 `kind`: `line`(점 (x,y)·기울기 m·반폭 span), `vert`(LRAS·MS), `horiz`(가격 하한 W 선), `hyper`(1/P = k/M). 이동은 `off[id]` 가로 이동량, `calc(off)` 로 파생 이동 가능.
- **교재의 기본 곡선만**: 직선 AD·SRAS(±0.85), 수직 LRAS·MS, 직각쌍곡선 MD. 곡선을 휘게 꾸미지 않는다.
- 라벨의 `_` 뒤는 아래 첨자(`P_1`, `AD_2`, `L_E`). 균형점 글자 A·B·C…, 지금 점은 파랑, 지난 위치 곡선은 연회색 + 번호 첨자, 옮겨진 지금 곡선은 파랑, 이동 화살표는 곡선이 멈춘 뒤.
- 결론 마디에서: 새 균형점 → 축 점선을 파랑·굵게, 바뀐 축 값은 22px + 방향 삼각형(▲ 빨강 / ▼ 파랑). `after()` 에서 `plot.seq([{axis:'x'|'y'|'xy'}])`.
- `star:true` 면 LRAS 위 x 값을 `Y*` 로 표기.

#### 사건 데이터 형식(A 형)
```js
{ t: 'Stock market crash', q: 'SA 4a', dir: 'l', stages: [
  { name: 'AD ←', step: 'Stage 1 · Short run', ch: { add: { AD: -1.4 } },
    why: 'Stocks ↓ → wealth ↓ → C ↓ → AD ←' },
  { name: 'SRAS adjusts → Y*', step: 'Stage 2 · Long run', ch: { abs: lrSRAS }, why: longRun }   // why 는 함수도 됨
]}
```
- `why` 는 `' → '` 로 이은 인과 사슬. **곡선 이름 + 화살표 조각(`AD ←`, `MS →`)이 [곡선 이동] 마디 제목**, 그 앞 조각들이 설명, 뒤 조각이 결론 설명. 엔진이 정규식 `MOVE = /(AD|SRAS|LRAS|MS|MD)…[←→]/` 로 찾으므로 **새 곡선 이름(예: `LM`, `S_LF`)을 쓰면 MOVE 에 추가**하거나 `at:` 로 조각 번호를 직접 준다. 사슬을 직접 주려면 `chain: [...]`.
- `ch`: `add`(더할 이동량), `abs`(값 또는 `(off)=>({...})`), `vis`(곡선 보이기/숨기기).
- 결론 마디 제목은 `runner` 의 `result(앞상태, 새상태)` 가 만든다: `'Y ▼ · P ▲ — Y < Y* short-run recession'` 처럼 **' — ' 앞 = 제목(변수 방향), 뒤 = 설명**. 방향 글자는 `↑`·`↓`(자동으로 ▲▼ 색), 그대로는 `unchanged`.
- 화살표 `↑ ↓` 는 자동으로 빨강 ▲ / 파랑 ▼ 로 바뀐다(한국 주식 표기). 정책 수용·장기 조정 같은 공식은 `lrSRAS`·`lrAD` 처럼 함수로 계산해 균형이 정확히 LRAS 위에 오게 한다.

### 6. 글자·색
- 색 토큰: `--ink #1f2537` · `--blue #1f6fd1`(선택·지금) · `--up #d6322b`(▲) · `--down #1f6fd1`(▼) · `--soft #5b6170` · `--line #d8dbe0` · `--tint #f3f6fb`. 흰 바탕, 장식 없음, 그림자는 떠 있는 조작 줄에만.
- 문장은 짧은 명사구 + 화살표 사슬. "등", 괄호 설명, 안내 문구("목록에서 사건을 고르면…")는 넣지 않는다.
- 맨큐 용어 그대로(wages · Pe adjust, monetary neutrality, crowding out 등). 사건 이름에 괄호 쓰지 않음.

### 7. 한·영 두 판
- 영문판(`/graphs/en/`)과 한국어판(`/graphs/`)은 **같은 구조의 두 벌**: HTML·app.js 를 나란히 고치고 글자만 번역한다. 한국어판은 `lang="ko"`, 영문은 `lang="en"`.
- 언어 기억은 `localStorage['slides.lang']`(슬라이드 덱과 공유). 언어 링크를 누를 때 지금 해시를 붙여 같은 탭으로 간다 — 새 해시도 정규식에 넣었는지 확인.
- 대문 카드 추가: `/econ2/en/index.html` 의 `.grid` 에 `<li><a href="/econ2/graphs/en/#chNN"><span class="ch">CH NN</span><span class="nm">이름</span><span class="ds">한 줄 설명</span></a></li>`, 한국어 대문(`/econ2/index.html`)도 같은 결로.

## 작업 순서
1. 입력의 개념으로 그림 종류(A/B/C)를 정하고, 사건 목록(이름 · 출처 · 방향 · 단계 · why 사슬 · 기대 결론)을 **표로 먼저** 적어 보여 준다. 경제학적으로 맞는지(이동 vs 따라 움직임, 단기/장기 결과) 스스로 점검한다.
2. 영문판 `index.html` 에 탭 버튼 · `<section class="ch" id="cNN">` 추가(기존 구역 마크업 복사).
3. 영문판 `app.js` 에 `chNN()` 함수 추가(가장 비슷한 기존 챕터 함수 복사 후 곡선·사건만 교체), 맨 아래 초기화·`plots`·`fromHash` 정규식 갱신. 공용 엔진(Plot·Player·beatsFor·runner·list)은 고치지 않는다 — 꼭 필요하면 이유를 보고하고 기존 네 챕터가 그대로인지 확인.
4. 한국어판에 같은 변경을 번역해 반영. 두 대문에 카드 추가.
5. 확인(아래).

## 확인
- `pnpm build` 통과.
- 데스크톱 1280×900 · 노트북 1280×720 · 휴대폰 390×844 스크린샷, 한·영 둘 다:
  - 가로 스크롤 없음, 라벨·축 값·탭·분수가 서로 겹치지 않음, 그래프가 부모에 잘리지 않음, 조작 줄이 글자를 가리지 않음.
  - 모든 사건을 눌러 마지막 마디까지: 결론 제목의 방향이 그래프의 새 균형점 위치와 맞는지, 다시 누르면 A 로 돌아가는지, 갈래 버튼이 있으면 두 길 모두.
  - `#chNN` 주소로 바로 열리는지, 언어 전환 후에도 같은 탭인지. 기존 네 챕터가 그대로 동작하는지.
- 콘솔 오류 0.

## 보고
바뀐 파일 목록, 사건 표(최종), 스크린샷, 기존 엔진을 건드렸다면 그 이유. 커밋 메시지는 `Econ 2 Interactive ChNN: 무엇을 왜` (한국어, Co-Authored-By 줄 없음).

---
