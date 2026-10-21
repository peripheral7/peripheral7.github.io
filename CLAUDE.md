# peripheral7.github.io — 작업 규칙

Next.js 정적 사이트(`output: "export"`). `main` 에 푸시하면 `.github/workflows/deploy.yml` 이 GitHub Pages 로 배포한다.
`public/` 아래 파일은 빌드 결과에 그대로 복사된다(정적 HTML·PDF·퀴즈는 여기).

## 모델 위임 원칙

메인 세션(상위 모델)은 **판단·설계·검토·배포**를 맡고, 범위가 분명한 쉬운 작업은 하위 모델에 맡긴다.
위임은 `Agent` 도구로 `.claude/agents/` 의 작업자를 부르고, 지시는 작업지시서(`docs/work-orders/`) 한 장으로 넘긴다.

| 등급 | 맡기는 곳 | 이런 작업 |
|---|---|---|
| 쉬움 | `site-worker` (haiku) | 파일 1~2개, 바꿀 내용이 지시서에 값까지 적힌 일: 문구·링크·목록 추가(`lib/features.ts`), midterm 페이지 행 추가·쪽수 수정, 퀴즈 HTML 복사 + `scripts/quiz-to-pdf.mjs` 로 PDF 생성, 합본(`pdfunite`)·ZIP 재생성, Tailwind 클래스 값 교체 |
| 보통 | `site-builder` (sonnet) | 여러 파일에 걸치지만 목표·완료 기준이 분명한 UI 수정: 반응형 배치 고치기, 컴포넌트 하나 새로 만들기, 스크린샷으로 확인이 필요한 일 |
| 어려움 | 메인 세션이 직접 | 요구가 모호하거나 디자인 판단이 필요한 일, 원인 모를 버그, 빌드·배포 설정(`next.config.mjs`, `.github/`), 파일 삭제·대량 변경, 사용자 원본 파일 수정 여부 판단 |

위임할 때 지킬 것:
1. **지시서 먼저.** `docs/work-orders/TEMPLATE.md` 를 복사해 목표·관련 파일·정확한 변경값·확인 방법을 적는다. 하위 모델이 추측할 여지를 남기지 않는다(“적당히”, “보기 좋게” 금지 — 숫자·클래스·문구로).
2. **하위 모델은 커밋·푸시하지 않는다.** 작업 후 바뀐 파일 목록과 확인 결과만 보고한다.
3. **메인 세션이 검토한다.** `git diff` 로 범위 밖 변경이 없는지 보고, 빌드·스크린샷을 직접 다시 확인한 뒤 커밋·푸시한다.
4. 하위 모델이 두 번 실패하거나 지시서에 없는 판단을 묻으면, 위임을 멈추고 메인 세션이 처리한다.
5. 같은 종류의 쉬운 작업이 반복되면 스크립트(`scripts/`)나 지시서 예시로 남겨 다음 위임을 더 쉽게 만든다.

## 공통 규칙

- 확인: `pnpm build` 통과가 기본. 화면이 바뀌면 모바일(390×844)·데스크톱(1280×900) 스크린샷으로 확인한다.
  - 모바일 점검 항목: 가로 스크롤 없음, iframe·이미지가 부모 `overflow-hidden` 에 잘리지 않음, 버튼이 글자를 밀어내지 않음.
- 빌드가 건드리는 `next-env.d.ts` 와 작업과 무관한 기존 변경(`.claude/launch.json`, `tsconfig.tsbuildinfo` 등)은 커밋에 넣지 않는다.
- 커밋 메시지는 한국어로 `영역: 무엇을 왜` (예: `플레이리스트: 모바일에서 플레이어가 사진 높이에 잘리지 않게`). 커밋에 `Co-Authored-By` 줄을 넣지 않는다.
- 사용자가 올린 원본 HTML(퀴즈 등)은 내용을 고치지 않는다. 꼭 필요하면(예: 저장 키 충돌) 한 줄만 고치고 커밋 메시지와 보고에 적는다.

## Midterm 자료 (`public/reports/midterm/`)

- `index.html` — 과목별 목록. 행마다 [풀기](`quiz/*.html`) · [인쇄] · [PDF], 과목 맨 위에 합본.
- 새 퀴즈 추가 순서(쉬움 → `site-worker`):
  1. 원본을 `quiz/<과목>_<종류>.html` 로 복사. 같은 템플릿·같은 `title:` 인 퀴즈가 이미 있으면 저장 키 충돌 → 메인 세션에 보고.
  2. `node scripts/quiz-to-pdf.mjs quiz/<파일>.html <이름>_with_answers.pdf` — 출력의 `n` 과 `q` 가 같아야 한다.
  3. 과목 합본: `pdfunite <그 과목 PDF들> All_<과목>.pdf`, ZIP: `zip -X Midterm_All.zip *_with_answers.pdf`.
  4. `index.html` 에 행 추가, 문항 수·쪽수(`pdfinfo`)·합본 쪽수·ZIP 크기 문구 갱신.
