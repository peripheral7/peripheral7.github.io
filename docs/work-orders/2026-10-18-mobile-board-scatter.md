# 작업지시서 — 모바일 메인 보드: 카드 절반 크기 + 불규칙 세로 배치

## 목표
모바일(폭 < 640px, Tailwind `sm` 미만)에서 메인 화면(`/`) "The board / Reports" 카드가
- 지금(한 줄에 1장, 화면 폭 거의 전체)의 **약 절반 크기**가 되고,
- 2열로 놓이되 카드마다 위아래 위치가 **불규칙하게 어긋나** 스크랩북에 붙인 것처럼 세로로 흩어져 보이게 한다.

태블릿·데스크톱(`sm` 이상)은 **지금 모습 그대로** 둔다.

## 관련 파일
- `components/scrapbook-board.tsx` — 카드 그리드 (`grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`)
- `components/board-item.tsx` — 카드 본체(테이프, 사진 `aspect-[4/5]`, 제목, 태그·날짜, `--r` 회전)
- `app/globals.css` — `.tape`, `.scrap`, `.shadow-scrap` 등
- `lib/posts.ts` — 글 목록(순서 = content/posts 파일명 정렬, 바꾸지 말 것)

## 해야 할 일
1. **2열 + 작은 카드 (모바일만)**
   - 그리드를 `grid-cols-2`(모바일) → 기존 `sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4` 유지.
   - 모바일 간격은 `gap-x-3 gap-y-5` 정도로 줄인다(`sm:gap-6` 으로 원복).
   - 읽는 순서(DOM 순서 = 왼→오, 위→아래)는 유지한다. CSS `columns` 다단은 쓰지 말 것(주석에 적힌 대로 순서가 뒤섞이고 배경 밖으로 밀리는 문제가 있었다).
2. **불규칙한 세로 어긋남 (모바일만)**
   - 카드마다 결정적인(새로고침해도 같은) 세로 오프셋을 준다. 예: `post.id` 문자열 해시 → 0~48px 사이 값, 오른쪽 열(홀수 index)은 기본으로 +24~40px 더 내려 엇갈리게.
   - `Math.random()` 금지(SSR/정적 빌드와 하이드레이션 불일치). 해시 함수는 순수 함수로.
   - 적용은 CSS 변수(`--dy`)로 넘기고 `max-sm:` 에서만 `margin-top`/`translate-y` 가 먹게 한다(`sm` 이상에서는 0). `translate` 를 쓰면 마지막 줄이 아래 "Add to the file" 상자와 겹치지 않는지 확인하고, 겹치면 `margin-top` 방식 또는 그리드 하단 padding 으로 해결.
   - 기존 카드 회전(`--r`, `.scrap`)은 그대로 살리되, 모바일에서 너무 기울어 보이면 회전각을 약간 줄여도 된다.
3. **카드 안 요소 축소 (모바일만)**
   - 테이프: `h-7 w-28` → 모바일 `h-5 w-16` 정도, `-top-4` → `-top-3`.
   - 카드 패딩 `p-3 pb-4` → 모바일 `p-2 pb-3`.
   - 제목 `text-base` → 모바일 `text-[0.8rem]`, 카테고리 배지·태그·날짜 글자도 한 단계 작게. 태그가 넘치면 날짜 밑으로 줄바꿈되거나 1개만 보여도 괜찮다(깨지지만 않게).
   - 글만 있는 카드(이미지 없음)는 `line-clamp-6` → 모바일 `line-clamp-4`, `text-sm` → `text-xs`.
   - `next/image` `sizes` 를 `(max-width: 640px) 48vw, ...` 로 고친다.
4. 호버 효과·테이프가 카드 일부라는 구조(주석 참고)는 건드리지 않는다.

## 확인 방법
- `.claude/launch.json` 의 개발 서버를 `preview_start` 로 띄우고, `resize_window` mobile(375×812)에서 `/` 를 연다. 브라우저 창이 숨겨져 있으면 메모리 `reference_verification_gotchas` 대로 헤드리스 Chrome CDP 로 스크린샷.
- 확인 항목: 2열·카드 폭 ≈ 화면 절반, 카드끼리 세로로 불규칙하게 어긋남, 겹침·가로 스크롤 없음, 마지막 카드가 아래 상자와 안 겹침, 필터 버튼(Research 등) 눌러도 정상, 새로고침해도 배치 동일, 콘솔에 hydration 경고 없음.
- `tablet`(768) / `desktop` 에서 기존과 똑같은지 비교.
- `npm run build`(또는 프로젝트의 빌드 명령)가 통과하는지.

## 마무리
- 사용자 규칙: 변경 후 바로 commit + push (묻지 않음). 커밋에 `Co-Authored-By` 줄 넣지 않음.
- 커밋 메시지 예: `메인: 모바일에서 보드 카드 절반 크기·2열·불규칙 세로 배치`
- 작업과 무관한 기존 변경(`.claude/launch.json`, `next-env.d.ts`, `tsconfig.tsbuildinfo`, `입지 비교 리포트/`)은 커밋에 넣지 말 것.
