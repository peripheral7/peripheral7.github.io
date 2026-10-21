# 작업지시서 — Golden Smoking Hour: 태블릿(768px 이상)에서 사진 3장 모두 표시

담당: site-worker (haiku)

## 목표
`/board/golden-smoking-hour/` 는 지금 1400px 이상에서만 사진 3장을 나란히 보여 주고, 그보다 좁으면 한 장씩 넘긴다.
이 기준을 **768px(Tailwind `md`)** 로 내려, 태블릿에서도 3장이 한 화면에 나란히 보이게 한다. 폰(768px 미만)은 지금처럼 한 장씩 넘기기.

## 관련 파일
- `components/golden-stage.tsx` — 사진 무대(이 파일만 바꾼다)

## 해야 할 일 (모두 `components/golden-stage.tsx`)
1. 클래스의 `min-[1400px]:` 를 **전부** `md:` 로 바꾼다(파일 안 모든 곳).
2. 클래스의 `max-[1399px]:` 를 **전부** `max-md:` 로 바꾼다(파일 안 모든 곳).
3. `sizes="(max-width: 1400px) 100vw, 40vh"` 를 `sizes="(max-width: 767px) 100vw, 34vw"` 로 바꾼다.
4. 주석 `// 좁은 화면(1400px 미만): 한 장씩 보이고` 의 `1400px` 를 `768px` 로 바꾼다.
5. 그 밖의 줄은 바꾸지 않는다.

## 확인 방법
- `grep -c "1400\|1399" components/golden-stage.tsx` → `0`.
- `grep -c "md:" components/golden-stage.tsx` 가 1 이상.
- `pnpm build` 통과(로그는 화면에만, `/tmp` 등에 파일 남기지 말 것). 끝나면 `git checkout -- next-env.d.ts`.
- `git diff --stat` 에 `components/golden-stage.tsx` 한 파일만(작업지시서 파일은 untracked 로 보여도 됨).

## 하지 말 것
- 커밋·푸시.
- 지시서에 없는 파일 수정.
