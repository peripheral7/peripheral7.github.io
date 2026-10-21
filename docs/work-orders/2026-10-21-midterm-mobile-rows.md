# 작업지시서 — Midterm 페이지: 좁은 화면에서 버튼을 제목 아래 줄로

담당: site-worker (haiku)

## 목표
폭 560px 이하(폰)에서 `/reports/midterm/` 각 행의 제목이 버튼에 밀려 3~4줄로 접히는 문제를 없앤다.
폰에서는 제목·설명이 한 줄 전체를 쓰고, 버튼 묶음은 그 아래 줄 왼쪽에 놓인다. 560px 보다 넓은 화면은 지금 그대로 둔다.

## 관련 파일
- `public/reports/midterm/index.html` — 페이지 전체(스타일은 `<style>` 안). 행 구조: `<li><div class="name">…</div><div class="act">버튼들</div></li>`

## 해야 할 일
1. `public/reports/midterm/index.html` 의 `<style>` 안에서 아래 줄을 찾는다.
   ```
     #pf{ position:fixed; width:0; height:0; border:0; visibility:hidden; }
   ```
   그 줄 **바로 위**에 다음 한 줄을 넣는다(앞 공백 2칸).
   ```
     @media (max-width:560px){ li{ flex-direction:column; align-items:flex-start; gap:.5rem; } }
   ```
2. 다른 줄은 바꾸지 않는다.

## 확인 방법
- `grep -c "@media (max-width:560px)" public/reports/midterm/index.html` 결과가 `1`.
- `pnpm build` 통과(끝나면 `git checkout -- next-env.d.ts`).
- `git diff --stat` 에 `public/reports/midterm/index.html` 한 파일만 나온다.

## 하지 말 것
- 커밋·푸시.
- 지시서에 없는 파일 수정.
