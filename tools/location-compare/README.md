# 입지 비교 리포트 (블로그용 정적판)

블로그 주소: <https://peripheral7.github.io/location-compare/> — 메인 게시판의 "입지 비교 리포트" 카드(`content/posts/10-location-compare.json`)가 연결된다.

원본은 서버(FastAPI)와 DB(SQLite)가 있는 앱("입지 비교 리포트" 폴더)이다. GitHub Pages 는 정적 파일만 서빙하므로,
같은 화면·같은 계산을 **서버 없이 브라우저 안에서** 돌리도록 옮겼다.

| | 원본 앱 | 이 정적판 |
|---|---|---|
| 데이터 | 서버 DB (`data/app.db`) | 처음엔 `src/seed.json`(원본 DB 에서 뽑은 예시), 이후 입력은 방문자 브라우저의 localStorage (`locCompare.v1`) |
| 계산 | `backend/main.py` | `src/lib/scoring.ts` — 같은 공식, 파이썬의 반올림·합계 규칙까지 같게 |
| `/api/...` | FastAPI | `src/lib/api.ts` — 같은 주소·같은 응답 모양을 브라우저 안에서 처리 |
| 화면 | `src/components/*` | 그대로(아래 "원본과 달라진 점"만 고침) |

방문자가 후보·거점·선호도를 바꿔도 **그 사람의 브라우저에만** 저장된다(다른 사람·다른 기기에는 안 보인다).
화면 아래 "예시 데이터로 되돌리기"로 처음 상태로 돌릴 수 있다.

## 다시 만들기

```bash
cd tools/location-compare
npm install            # 처음 한 번 (node_modules 는 git 에 올리지 않는다)
npm run typecheck      # 타입 검사
npm run build          # → ../../public/location-compare/ 에 결과가 만들어진다(기존 내용은 지워진다)
npm run dev            # 개발용: http://localhost:5173/location-compare/
```

만들어진 `public/location-compare/` 는 **git 에 올린다**(배포 워크플로는 이 폴더를 빌드하지 않고 그대로 복사만 한다).

## 예시 데이터 바꾸기

원본 앱에서 후보·거점·선호도를 고친 뒤, 원본 폴더의 DB 에서 다시 뽑는다:

```bash
python scripts/export_seed.py "<원본 '입지 비교 리포트' 폴더 경로>"      # src/seed.json 갱신 (--dry-run 으로 미리보기)
npm run build
```

`seed.json` 의 `version` 은 내용에서 자동으로 만들어진다. 예시가 바뀌면 이미 방문한 사람의 브라우저에 저장돼 있던 옛 예시는 새 예시로 교체된다.
**공개 사이트이므로 seed.json 에 든 주소(후보 주택·학교·본가)는 누구나 볼 수 있다.** 가리고 싶으면 seed.json 의 `address`·`name` 을 고친 뒤 빌드한다
(`scripts/export_seed.py` 는 DB 값을 그대로 쓰므로, 고친 뒤에는 다시 실행하지 말 것).

## 원본과 달라진 점

계산·화면은 원본 그대로이고, 공개용으로 아래만 바꿨다.

- **서버 대신 브라우저**: `lib/api.ts`(저장·요청 처리), `lib/scoring.ts`(이동 접근성 계산), `seed.json`(예시 데이터).
  원본 백엔드의 실제 응답 5,840건(경로 요약 9만 6천여 개)과 대조해 모두 일치함을 확인했다(후보·거점·선호도를 무작위로 추가·수정·삭제하며 비교).
- **카카오 우편번호 스크립트**는 페이지를 열 때가 아니라 "주소 검색" 단추에 마우스를 올리거나 누를 때 불러온다.
- **게시판으로 돌아가기** 줄, 상단 상태 표시("이 브라우저에 저장됨"), 안내 문구, "예시 데이터로 되돌리기" 단추 추가. `noindex` 로 검색엔진 노출은 막았다.
- **원본의 오류 수정**
  - 상세 화면에서 "‹ 비교 목록"으로 돌아오면 앱 전체가 하얗게 죽던 것 — 요즘 크롬은 `window.scrollTo()` 가 Promise 를 돌려주는데 `useEffect` 가 그것을 그대로 돌려주고 있었다(`DetailView.tsx`).
  - 상세 화면 "평가 근거" 탭에 근거 문장이 비어 있던 것(`home[reason]` 으로 한 번 더 찾고 있었다).
  - 상세·후보 관리 지도의 기본 핀 그림이 깨지던 것(Vite 번들 경로; `main.tsx` 에서 그림 경로를 직접 지정).
  - 태블릿·휴대폰(1024px 이하)에서 "후보지-거점 위치 관계" 지도가 1px 높이로 사라지던 것(`app.css` 끝 규칙).
  - 비교 목록 안의 "⚙ 주요 거점 관리"를 누르면 클릭 이벤트가 탭 이름으로 넘어가 거점 종류 탭이 선택되지 않던 것(`AccessView.tsx`).
  - 상세 화면 "항목별 요약" 상자의 글자가 테두리에 붙던 것(`app.css`).
  - 타입 오류 몇 개(`npm run typecheck` 가 통과하도록).

## 주의

- 이동 시간은 외부 길찾기 없이 **좌표 거리와 평균 속도로 가상 계산**한 값이다(원본 앱의 안내 그대로). 항목별 점수(교통·상권·공원·공공)는 직접 입력하는 값이다.
- 지도 타일은 `tiles.osm.kr`(OSM 한국어 타일)을 쓴다. 그 밖의 외부 호출은 "주소 검색"을 눌렀을 때의 카카오 우편번호 서비스뿐이다.
- 폰트(Pretendard·Geist Mono)는 `src/vibe-design/fonts/` 에 들어 있다(SIL OFL, `OFL.txt`).
