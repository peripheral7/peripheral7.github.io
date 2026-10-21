# 작업지시서 — 대문: 사진 왼쪽에 "대본" 링크

담당: site-worker (haiku)

## 목표
대문(`/`) 사진 왼쪽에 "대본" 목록(링크 1개: AI 세션 2 대본 PDF)을 둔다.
- xl(1280px 이상): 사진 왼쪽 열, 아래쪽에 붙고 글자는 오른쪽 정렬(사진 쪽).
- md~lg: 왼쪽 열이 없으므로 오른쪽 열(기능모음 등) 아래.
- 폰: 맨 아래 가운데 정렬.
기존 사진·제목·오른쪽 열의 모양은 바꾸지 않는다.

## 관련 파일
- `lib/features.ts` — 메인 화면 글자 목록 데이터
- `components/site-hero.tsx` — 대문 격자(사진/제목/오른쪽 열)

## 해야 할 일
1. `lib/features.ts` 맨 끝에 다음을 추가한다(앞에 빈 줄 하나).
   ```ts
   // 사진 왼쪽(xl)에 보이는 "대본": 발표 대본 PDF. 좁은 화면에서는 오른쪽 열 아래(md) / 맨 아래(폰)에 쌓인다.
   export const SCRIPTS: Feature[] = [
     { label: "AI 세션 2 대본 (PDF)", href: "/reports/ai-session2-script.pdf" },
   ]
   ```
2. `components/site-hero.tsx` 에서
   `import { FEATURES, STUDY_MATERIALS } from "@/lib/features"` 를
   `import { FEATURES, SCRIPTS, STUDY_MATERIALS } from "@/lib/features"` 로 바꾼다.
3. 같은 파일에서 아래 두 줄(오른쪽 열 `aside` 의 끝과 격자 `div` 의 끝)을 찾는다.
   ```tsx
             </aside>
           </div>
   ```
   이것을 다음으로 바꾼다(`</aside>` 와 `</div>` 사이에 블록 삽입, 들여쓰기 그대로).
   ```tsx
             </aside>

             {/* 대본: xl 은 사진 왼쪽 열 아래쪽(오른쪽 정렬), md~lg 는 오른쪽 열 아래, 휴대폰은 맨 아래에 가운데 정렬로 쌓인다. */}
             <div className="mt-10 w-full max-w-xs text-center md:col-start-2 md:row-start-2 md:mt-3 md:max-w-none md:self-start md:text-left xl:col-start-1 xl:row-start-1 xl:mt-0 xl:w-60 xl:self-end xl:justify-self-end xl:text-right">
               <SiteFeatures title="대본" items={SCRIPTS} />
             </div>
           </div>
   ```

## 확인 방법
- `grep -c "SCRIPTS" components/site-hero.tsx` → `2`, `grep -c "ai-session2-script.pdf" lib/features.ts` → `1`.
- `pnpm build` 통과(로그는 스크래치패드나 화면에만, `/tmp` 에 파일 남기지 말 것). 끝나면 `git checkout -- next-env.d.ts`.
- `git diff --stat` 에 위 두 파일만.

## 하지 말 것
- 커밋·푸시.
- 지시서에 없는 파일 수정.
