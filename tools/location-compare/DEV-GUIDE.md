# 여기살까? — 개발 가이드라인

새 모듈(입지 요인·패널·지도 레이어·추천 카드 등)을 더할 때 따르는 지침. 계산 공식은 [README.md](README.md), 화면 결정은 [UI-UX.md](UI-UX.md), 진행 기록은 [PROGRESS.md](PROGRESS.md)에 있고, 이 문서는 **"어떻게 만들어 넣는가"**만 다룬다.

---

## 1. 지금 템플릿의 형태

### 1-1. 기술 구성
- **Vite + React 18 + TypeScript** 단일 페이지. 라우터·상태 라이브러리 없음 — 상태는 `App.tsx` 가 들고 props 로 내려준다.
- 지도: **네이버 지도 JS**(키 있으면) ↔ **Leaflet + OSM**(키 없거나 인증 실패). `components/MapView.tsx` 의 `NaverMap`·`OsmMap` 두 벌.
- 빌드 결과는 `public/WhereTo/` 에 커밋(GitHub Pages). 공개 사이트는 **유료·키 필요한 API 를 부르지 않는다** — 자료는 이 PC 의 `scripts/*.mjs` 가 미리 만들어 `src/*.json` 으로 싣고, 새 후보지는 계산 서버(`server/`, Worker 중계)가 계산한다.

### 1-2. 화면 배치(넓은 화면 3열 그리드 `.stage`)
```
┌ 머리 줄: 로고 · 사용자 탭 · 입지 지도/계산 방식 · KO|EN ┐
│ 교통평점 카드(modes-area)  │  지도(map-area)        │ 입지 요인(factors-area)   │
│ 주요 목적지(selected-area) │  + 검색창·지도 위 단추 │ 카페·식당 → 출퇴근 인사이트 │
│ 추천 매물(sideL)           │  후보지별 비교(cards)  │ (right-col 이어짐)        │
└ 바닥 줄(foot) ┘
```
- 1320px·900px·600px 미디어 쿼리에서 `grid-template-areas` 가 바뀐다. **새 영역을 넣으면 세 곳 모두 고친다.**
- 지도 높이(최소 680px)가 기준. 교통평점·오른쪽 열은 `contain: size` 로 지도 높이에 맞추고 안에서 스크롤(스크롤바 숨김).

### 1-3. 파일 구조
| 자리 | 하는 일 |
|---|---|
| `src/data.ts` | 기본 후보지·목적지·사용자(PROFILES)·라이프스타일·선호도 기본값, 금액 표기 |
| `src/store.ts` | 방문자 변경 저장(localStorage)·옛 저장값 이전(migrate) |
| `src/scoring.ts` | 이동 시간·수단 점수·종합 점수·지도 장단점 문구 |
| `src/<요인>.ts` | 입지 요인 하나 = 파일 하나(`commercial.ts`·`places.ts`·`cats.ts`·`commute.ts` …): 자료 읽기 + 점수 + 저장 키 |
| `src/live.ts` | 새 후보지 → 계산 서버 요청·결과 저장 |
| `src/i18n.ts` · `src/romanize.ts` | 화면 언어(한·영) — 3절 |
| `src/components/*.tsx` | 화면 조각. `Panels.tsx`(입지 요인), `CompareCards.tsx`(비교 카드), `GuidePanel.tsx`(계산 방식 창 — 한국어판 + `GuideEn`) |
| `scripts/*.mjs` | 이 PC 에서만 도는 자료 만들기(공공데이터·OSM·네이버) |
| `server/` | 새 후보지 계산 서버(이 PC + cloudflared 터널) |

### 1-4. 저장 키(localStorage, 모두 `locCompare.` 로 시작)
`v3`(나)·`v3.<사용자>`·`user`·`lang`·`commercial.v2`·`places.v1`·`cats.v1`·`commute.v2`·`layers.v1`·`live.v1`·`parks.v1`.
**저장 모양을 바꾸면 키 버전을 올리거나 `store.ts` 처럼 옛 값을 옮긴다.** 읽기·쓰기는 언제나 `try/catch`(사생활 보호 창에서도 화면은 동작해야 한다).

---

## 2. 개발할 때 반드시 지킬 것

1. **계산을 바꾸면 세 곳 + 영어판**: 코드(`scoring.ts`·`<요인>.ts`) → 화면 "계산 방식"(`GuidePanel.tsx` 한국어판 **과 `GuideEn`**) → README 해당 절. 화면 배치가 바뀌면 UI-UX.md 도.
2. **숫자 기준은 상수로**: 화면 글자·안내 창은 상수(`WALK_LIMIT`·`CAT_*`·`PEACE.*` …)를 가져다 쓰고 숫자를 따로 적지 않는다(한·영 두 판이 어긋나지 않게).
3. **화면 문구는 최소로**: 카드·패널에는 값과 짧은 라벨만, 규칙 설명은 계산 방식 창·README 로.
4. **지도 기능은 두 엔진 모두**: `NaverMap` 과 `OsmMap` 에 같은 동작. 마커 글자는 HTML 문자열이므로 `esc()` 로 감싼다.
5. **창(모달)**: `createPortal(…, document.body)` + `position: fixed` 화면 정가운데. 부모 좌표로 띄우지 않는다.
6. **공개 사이트에서 키·유료 API 금지**: 비밀 키는 `.env.local`(git 제외)·Worker 시크릿에만. 빌드 뒤 `public/WhereTo/assets/*.js` 에 키가 없는지 확인.
7. **자료는 미리 계산**: 새 요인의 원자료는 `scripts/` → `src/<요인>.json`. 기본 후보지는 그 파일, 검색으로 넣은 후보지는 계산 서버(`server/runner.mjs` 가 git HEAD 의 scripts 를 실행 — 규칙을 바꾸면 먼저 커밋, 시험용 사용자 자료는 `scripts/bake-profiles.mjs` 다시).
8. **입지 요인 추가 순서**: `<요인>.ts`(점수·저장) → `Panels.tsx` ⚙ 목록과 점수 줄 → 펼침 내역(필요하면 지도 덧그림 `mapOverlays.ts`) → 비교 카드 줄이면 `CompareCards` 의 `rows` 계산 → 종합 점수에 섞을지 따로 결정(지금 요인들은 안 섞음).
9. **확인**: `npm run typecheck` → 개발 서버에서 1600·1200·375px 폭, **한국어·영어 두 화면 모두** 겹침·가로 스크롤·잘림이 없는지. 콘솔의 `/fonts/` 404·미등록 포트의 네이버 401 은 정상.
10. **배포**: `npm run build` 결과(`public/WhereTo/`)까지 커밋 — 옛 `assets/index-*.js` 삭제도 함께.
11. **같은 폴더 동시 작업**: 다른 세션이 같은 파일을 고치고 있으면 별도 worktree 에서 작업하고 커밋 전 `git diff` 로 내 변경만인지 본다. 소스 파일은 CRLF — 스크립트로 바꿀 때 줄바꿈을 보존하고, 바꾼 뒤 grep 으로 확인.

---

## 3. 영어판(외국인 유학생용) — 새 글자는 반드시 두 언어로

머리 줄 **KO | EN** 단추로 바꾼다. 언어는 페이지를 열 때 한 번 정해지고(`?lang=en` → 저장값 `locCompare.lang` → 한국어), 단추를 누르면 저장 후 **다시 연다**. 그래서 모듈 상수에서도 `t()` 를 그대로 쓸 수 있다.

### 3-1. 규칙
| 무엇 | 어떻게 | 예 |
|---|---|---|
| 화면에 보이는 모든 글자(라벨·버튼·placeholder·`aria-label`·`title`·`confirm`·오류 메시지) | `t('한국어', 'English')` 로 **나란히** | `t('후보지별 비교', 'Compare candidates')` |
| 숫자가 들어간 문장 | 템플릿 문자열 두 개 | ``t(`도보 ${n}분`, `walk ${n} min`)`` |
| 분 · 순위 · 원 | `mins(n)` · `rankText(n)` · `krw(원)` | "12 min" · "#1" · "₩93,000" |
| 만원 단위 금액 | `won(v)`(영어면 `₩10M`) · `manEn(v)` · 입력 칸 단위 `MAN_UNIT` | 보증금 1000 → ₩10M, 월세 50 → ₩500K |
| **저장되는 값**(후보지·목적지·매장·공원·정류장 이름) | 저장은 한국어 그대로, 보일 때만 `pn(name)` | "망포역 신원로" → "Mangpo Station Sinwon-ro" |
| 주소 | `addr(address)` — 작은 단위부터 | "16 Sinwon-ro 136beon-gil, Yeongtong-gu, Suwon-si, Gyeonggi-do" |
| 목적지 분류(학교·본가·직장·기타 …) | 저장·비교는 한국어 값, 보일 때 `catName(c)` | "본가" → "Family home" |
| 길고 문단이 많은 안내 | 한국어판·영어판 컴포넌트를 따로 두고 `isEn ? <En/> : <Ko/>` | `GuidePanel` 의 `GuideEn` |
| 로마자로 어색한 고유명사(대학·브랜드·노선·공원 유형) | `romanize.ts` 사전(`WORD_EN`·`NAME_EN`·`STEM_EN`·`CATEGORY_EN`)에 한 줄 | `올리브영: 'Olive Young'` |
| 업종 이름(JSON 의 label) | `commercial.ts` 의 `CAT_EN` 에 id 로 | `cafe: 'Café'` |

### 3-2. 하지 말 것
- **저장값을 번역해서 저장하지 않는다** — 분류 비교(`h.category === '학교'`)·옛 이름 이전(`OLD_DEFAULT_NAMES`)·자료 연결이 깨진다. 번역은 보여 줄 때만.
- JSX 안에 한국어를 그대로 쓰지 않는다(주석은 한국어 그대로 OK). 한국어 화면 글자는 바꾸지 않는다 — 영어는 덧붙이는 것.
- 영어 문장을 한국어 어순에 맞추려 억지로 조각내지 않는다 — 문장 통째로 두 벌.
- 한국 고유 개념(보증금·월세·관리비·전월세 전환율·중개수수료)은 영어판에서 짧게 풀어 쓴다(계산 방식 창 1절 참고).

### 3-3. 새 모듈 체크리스트(영어)
1. 새 파일에 `import { t, pn, addr, catName } from './i18n'`(필요한 것만).
2. 화면 글자 전부 `t()` — 아래 검사로 빠진 곳을 찾는다(나오는 줄이 저장값·한국어 분기·주석뿐이면 통과):
   ```bash
   grep -nE "['\`\">][^'\`\"<]*[가-힣]" src/*.ts src/*.tsx src/components/*.tsx | grep -v "t(" | grep -vE ":\s*[0-9]+:\s*(//|\*)"
   ```
3. 새 이름 자료(대학·브랜드·역)가 생기면 `?lang=en` 으로 열어 보고 어색하면 `romanize.ts` 사전에 추가.
4. 계산 방식 창에 절을 더하면 `GuideEn` 에도 같은 절 번호로.
5. 영어 화면 375px 폭에서 긴 영어 라벨이 넘치지 않는지(영어는 한국어보다 대체로 1.3~1.6배 길다) — 넘치면 짧은 영어 표현을 고른다.

### 3-4. 알려진 한계
- 검색은 네이버 지역 검색이라 **한국어 검색어가 가장 잘 된다**. 결과 이름·주소는 영어 화면에서 로마자로 보이고, 원래 한글은 이름에 마우스를 올리면(title) 보인다.
- 네이버 지도 바탕 글자는 지도 JS 의 `language=en` 으로 요청한다. OSM 바탕 지도(`tiles.osm.kr`)는 한국어 지명 그대로다.
- 로마자 변환은 국어의 로마자 표기법(연음·ㄹㄹ·비음화 일부)이라 공식 영문 표기와 다를 수 있다 — 자주 보이는 이름은 사전에 넣어 맞춘다.
