# 작업지시서 — Midterm Econometrics 에 서브노트(Ch.2–6) 행 추가

담당: site-worker (haiku)

## 목표
`/reports/midterm/` 의 Econometrics 목록 맨 아래(R 서술형 행 다음)에 영문 서브노트 PDF·PPTX 행 하나를 추가한다.
다른 과목, 합본(`All_Econometrics.pdf`), ZIP(`Midterm_All.zip`), 기존 행 문구는 바꾸지 않는다.

## 관련 파일
- `public/reports/midterm/index.html` — 과목별 목록
- `public/reports/midterm/Econometrics_Subnotes_Ch2-6.pdf` — 새 파일(15쪽)
- `public/reports/midterm/Econometrics_Subnotes_Ch2-6.pptx` — 새 파일

## 해야 할 일
1. 파일 두 개를 복사한다.
   ```
   cp /tmp/claude-0/-home-claude/3e9e38f6-0877-54f9-9480-98d85872f0d7/scratchpad/Econometrics_Subnotes_Ch2-6.pdf  public/reports/midterm/
   cp /tmp/claude-0/-home-claude/3e9e38f6-0877-54f9-9480-98d85872f0d7/scratchpad/Econometrics_Subnotes_Ch2-6.pptx public/reports/midterm/
   ```
2. `public/reports/midterm/index.html` 에서 아래 줄(R 서술형 행의 둘째 줄)을 찾는다.
   ```
       <div class="act"><a class="solve" href="quiz/Econometrics_R_Written.html">풀기</a><button type="button" data-pdf="Econometrics_R_Written_with_answers.pdf">인쇄</button><a href="Econometrics_R_Written_with_answers.pdf" download>PDF</a></div></li>
   ```
   그 줄 **바로 다음**에 아래 두 줄을 그대로 넣는다(앞 공백 2칸·4칸 유지).
   ```
     <li><div class="name"><a href="Econometrics_Subnotes_Ch2-6.pdf" target="_blank">서브노트 Ch.2–6 (영문) — 가정·편의·분산·검정·점근·함수형태</a><span>요약 정리 · 강의 슬라이드(Econometrics 1·2) 포함 · PDF 15쪽</span></div>
       <div class="act"><a class="solve" href="Econometrics_Subnotes_Ch2-6.pdf" target="_blank">보기</a><button type="button" data-pdf="Econometrics_Subnotes_Ch2-6.pdf">인쇄</button><a href="Econometrics_Subnotes_Ch2-6.pdf" download>PDF</a><a href="Econometrics_Subnotes_Ch2-6.pptx" download>PPTX</a></div></li>
   ```

## 확인 방법
- `pdfinfo public/reports/midterm/Econometrics_Subnotes_Ch2-6.pdf | grep Pages` → `15`.
- `grep -o "Econometrics_Subnotes_Ch2-6" public/reports/midterm/index.html | wc -l` → `5`.
- `pnpm build` 통과, 그리고 `ls out/reports/midterm/ | grep Subnotes` 에 pdf·pptx 둘 다 보인다.
- 빌드가 바꾼 `next-env.d.ts` 는 `git checkout -- next-env.d.ts` 로 되돌린다.

## 하지 말 것
- 커밋·푸시(메인 세션이 검토 후 한다).
- 지시서에 없는 파일 수정(합본 PDF·ZIP·다른 과목 행 포함).
