# 작업지시서 — BF·IA 예습·복습 슬라이드 덱 영어 번역

담당: site-builder (sonnet)

## 목표
`public/study/*/preview/index.html`, `public/study/*/review/index.html` 덱(7개)의 **영어판**을 만든다.
영어판은 원본과 **구조가 똑같은** 별도 HTML 파일이다. 메인 세션이 나중에 스크립트로 원본(한국어)과 영어판을 한 파일에 합쳐
영어 기본 + 한국어 전환 덱으로 만든다. 그래서 **글자만 바꾸고 태그·속성·순서는 한 글자도 바꾸지 않는 것**이 핵심이다.

## 관련 파일
- 읽기만: 맡은 원본 덱 `public/study/<장>/<preview|review>/index.html` (절대 고치지 않는다)
- 쓰기: `C:/Users/moonc/AppData/Local/Temp/claude/e663bcf993dea1fa/e36296ee-e9f0-4671-ac60-8c5ab651ac91/scratchpad/en/<장>-<preview|review>.html`
  (예: `bf11-review.html`). 저장소 안에는 아무 파일도 만들거나 고치지 않는다.

## 해야 할 일
1. 원본 파일 전체를 읽고, 그대로 복사한 뒤 **한국어 글자만** 영어로 바꿔 위 경로에 쓴다.
2. 바꾸는 것:
   - 모든 보이는 글(제목, 문단, 목록, 표 칸, SVG `<text>`, 풀이)
   - `data-title="…"`, `title="…"`, `alt="…"`, `aria-label="…"` 속성값
   - `<title>`: `… — 복습 문제` → `… — Review`, `… — 예습` → `… — Preview`
   - `<html lang="ko">` → `<html lang="en">`
   - HTML 주석(`<!-- … -->`)도 영어로(앞으로 영어가 기본이므로)
   - 표지의 키 안내 문구(class="hint")는 이렇게 통일: `→ next / reveal step &nbsp;·&nbsp; O overview &nbsp;·&nbsp; D black/white &nbsp;·&nbsp; F full screen &nbsp;·&nbsp; L 한국어`
     (원본 hint 에 교재·교수 이름 같은 정보가 있으면 그 부분은 영어로 옮겨 class="sub" 쪽 끝에 ` · ` 로 붙인다)
3. 바꾸지 않는 것:
   - 태그, 클래스, id, 인라인 `style`, `<style>` 블록, `<script>`, SVG 도형·좌표, `class="step"` 위치
   - `<section>` 개수와 순서(원본과 반드시 같아야 한다), 각 section 안의 요소 개수·중첩도 가능하면 그대로
   - 숫자, 수식, 기호(σ, β, E(R), ×, −, →), 표의 숫자 값. 계산 결과를 고치지 않는다
   - 이미 영어인 낱말(Recession, Stock A, BA II Plus 키 이름 등)
4. 번역 문체:
   - 영어로 진행되는 대학 재무 수업(교재 RWJ *Essentials of Corporate Finance*, BKM *Essentials of Investments*)의 슬라이드 영어. 교재의 표준 용어를 쓴다(expected return, systematic risk, payback period, limits to arbitrage …).
   - 짧고 단정하게. 슬라이드는 문장보다 구(phrase)가 낫다. 한국어 원문보다 길어지지 않게(글자 수 기준 원문의 1.6배를 넘기지 말 것 — 슬라이드 밖으로 넘친다).
   - 원문의 `한국어 (English)` 병기는 영어 하나로: `기대수익률 (expected return)` → `Expected return`.
   - 한국어 특유의 설명(“~이다”, “~한다”)은 영어 슬라이드 관례대로 명사구·명령형·짧은 문장으로.
   - 문제(Q)의 수치·조건은 하나도 빠뜨리지 않는다. 풀이 단계 수도 그대로.
5. 다 쓰면 원본과 번역본에서 다음을 세어 같은지 확인한다(Bash 로 `grep -o` 등):
   `<section` 수, `class="step` 수, `<table` 수, `<tr` 수, `<svg` 수, `<li` 수.
   그리고 번역본에 한글(가-힣)이 남았는지 `grep -nP '[가-힣]'` 로 확인한다 — hint 의 `한국어` 한 낱말 외에는 0이어야 한다.

## 확인 방법
- 위 5번의 개수가 원본과 모두 같다.
- 한글 잔존: hint 의 `L 한국어` 외 0.
- 빌드·스크린샷은 필요 없다(메인 세션이 합친 뒤 확인).

## 하지 말 것
- 커밋·푸시.
- 저장소 안 파일 수정(원본 덱 포함). 쓰는 곳은 scratchpad/en/ 하나뿐.
- 구조·스타일 "개선". 이상해 보이는 곳이 있으면 보고에 적기만 한다.

## 보고
```
쓴 파일: <경로>
개수 비교: section a=a, step b=b, table c=c, tr d=d, svg e=e, li f=f
한글 잔존: <0 또는 줄 목록>
애매했던 번역: <용어 선택 등, 없으면 "없음">
```
