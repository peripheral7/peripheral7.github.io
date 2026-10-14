# 여기살까? 단독 이전 계획 — 새 GitHub 저장소 + 소규모 무료 서버

블로그(peripheral7.github.io)에 함께 들어 있는 **여기살까?(/WhereTo/) 앱만** 새 GitHub 저장소와 새 서버로 옮긴다.
블로그의 다른 페이지는 그대로 두고, 옛 주소 `/WhereTo/` 는 새 주소로 넘겨 주는 안내 페이지만 남긴다.
이 폴더의 스크립트는 **사용자가 값을 넣고 실행할 때만** 외부(GitHub·Cloudflare·서버)에 무언가를 만든다. 미리 실행된 것은 없다.

---

## 1. 지금 구성 → 옮긴 뒤 구성

| 부분 | 지금 | 옮긴 뒤(추천) | 비용 |
|---|---|---|---|
| 화면(정적 사이트, Vite 빌드) | 블로그 저장소 `tools/location-compare` → `public/WhereTo/` → GitHub Pages | **새 GitHub 저장소** → **Cloudflare Pages**(무료: 대역폭 무제한, 빌드 월 500회, `*.pages.dev` 주소 + 원하면 내 도메인) | 0원 |
| 장소 검색·계산 중계 Worker + D1 | `workers/place-search`(Cloudflare, 이미 무료 요금제) | 소스만 새 저장소로 옮기고 **같은 Worker 그대로**(허용 출처에 새 주소 추가) | 0원 |
| 새 후보지 계산 서버(상권·입지·길) | 이 PC + cloudflared 빠른 터널(PC 끄면 꺼짐) | **Oracle Cloud Always Free VM**(서울·춘천 리전, Ampere A1 ARM 최대 4코어·24GB·200GB 디스크) + 같은 빠른 터널 방식(설정 없음) | 0원(가입 때 카드 인증만) |
| 큰 자료(상가 DB 490MB·공원 경계 34MB·고도 49MB·도서관 csv) | 이 PC `data/`, 저장소 맨 위 | 서버 `~/whereto/data`, `~/whereto/raw` 로 한 번 올림(git 에는 안 올림) | — |
| 키(.env.local) | 이 PC | 서버에 같은 파일 복사(권한 600). GitHub 에는 공개 키(VITE_*)만 저장소 비밀값으로 | — |
| 자동 실측(08·18시 / 10·13시) | 계산 서버 안 타이머 | 같은 서버가 24시간 켜져 있으니 **빠짐없이** 잰다 | — |

### 왜 이 조합인가(무료 서버 비교)

| 후보 | 장점 | 단점 | 판단 |
|---|---|---|---|
| **Oracle Cloud Always Free** (A1 ARM) | 한국 리전(서울·춘천) — 네이버·공공데이터 API 가 가까움, 메모리 넉넉(상가 DB·OpenTripPlanner 도 가능), 기간 제한 없음 | 가입이 까다롭고(카드 인증), 인기 리전은 A1 자리가 없을 때가 있음 → 춘천 시도, 안 되면 AMD E2.1.Micro(1GB) | **1순위** |
| Google Cloud e2-micro(무료 등급) | 가입 쉬움 | 미국 리전만 무료, 메모리 1GB(분석 30초 동안 빠듯), 한국 API 지연 | 2순위 |
| Render·Railway·Fly.io 무료 | 배포 쉬움 | 잠듦·디스크 없음/유료 전환 — 490MB 상가 DB 를 둘 곳이 없음 | 부적합 |
| Cloudflare Workers 로 계산 이식 | 서버 없음 | 상가 DB(SQLite 490MB)·Shapefile·GeoTIFF 처리 불가(Worker 메모리 128MB) | 부적합 |

화면은 **Cloudflare Pages**(이미 Worker·D1 을 쓰는 같은 계정) — GitHub Pages 도 되지만 저장소 이름이 주소 경로(`/저장소이름/`)로 붙고, 비공개 저장소는 유료다. Cloudflare Pages 는 비공개 저장소도 무료.

---

## 2. 사용자가 정해서 알려 줄 값(이것만 입력하면 진행)

| 값 | 예 | 어디에 쓰나 |
|---|---|---|
| ① 새 GitHub 저장소 주소 | `https://github.com/새아이디/whereto.git` (빈 저장소로 만들어 두기 — README 도 만들지 말 것) | `1-export-repo.ps1 -RepoUrl` |
| ② 저장소 공개 여부 | 비공개 추천 | GitHub 에서 만들 때 |
| ③ 사이트 이름(Cloudflare Pages 프로젝트) | `whereto` → `https://whereto.pages.dev` | `2-pages-setup.md` |
| ④ (선택) 내 도메인 | `whereto.example.com` | Pages 사용자 도메인 · 네이버 콘솔 URL 등록 |
| ⑤ 서버 접속 정보 | `ubuntu@123.45.67.89` + SSH 키 파일 경로 | `3-upload-data.ps1`, `server-setup.sh` |
| ⑥ Cloudflare 계정 | 지금 Worker 를 둔 계정(mooncg0916) 그대로 쓸지 | Pages·Worker |

사용자가 **직접** 해야 하는 일(로그인·결제 정보·약관 동의라 대신 못 함):
- GitHub 에서 빈 저장소 만들기, Cloudflare 대시보드에서 Pages 프로젝트 연결(또는 API 토큰 발급),
- Oracle Cloud 가입·VM 만들기(Ubuntu 24.04, ARM A1.Flex 1~2 OCPU · 6~12GB, 공개 IP, SSH 키),
- 네이버 클라우드 콘솔 → Maps Application → **Web 서비스 URL 에 새 주소 추가**(안 하면 새 사이트에서 지도 인증 실패 → OSM 지도로 자동 전환),
- 브이월드 키는 요청 `domain` 값만 맞으면 되므로(서버에서 부름) 그대로 두어도 된다.

---

## 3. 진행 순서(입력 후 내가 실행하는 것)

```
1-export-repo.ps1 -RepoUrl <①>            # 기록(커밋 이력)을 살려 tools/location-compare 만 새 저장소 모양으로 떼어 냄
                                           #   + workers/place-search · 글꼴 · 독립 빌드 설정 · Pages 배포 워크플로 추가
                                           #   -Push 를 붙여야 실제로 GitHub 에 올린다(처음엔 붙이지 않고 결과 폴더를 확인)
2-pages-setup.md                           # Cloudflare Pages 연결(대시보드 클릭 순서 / 또는 wrangler pages deploy)
server-setup.sh  (서버에서)                 # Node 24 · git · cloudflared 설치, 저장소 받기, npm ci, systemd 등록
3-upload-data.ps1 -Server <⑤> -Key <키>     # 큰 자료 + .env.local 을 서버로(scp), 권한 600
4-switch.ps1 -NewUrl <사이트 주소>           # Worker 허용 출처에 새 주소 추가·배포, 블로그 /WhereTo/ 를 새 주소로 넘기는 안내 페이지로,
                                           #   게시판 카드 링크 변경, 이 PC 계산 서버 끄기(새 서버가 Worker 에 등록되면)
```

각 단계 뒤 확인:
1. 새 저장소: `npm ci && npm run build:site` 가 되고 `dist/index.html` 이 `/assets/…` 를 부르는지.
2. Pages: `https://<③>.pages.dev` 가 열리고 지도(네이버 또는 OSM)·기본 후보지 점수가 나오는지.
3. 서버: `systemctl status whereto` 가 active, 로그에 "Worker 에 등록 완료".
4. 새 사이트에서 지도 우클릭 → 후보지 추가 → 약 30초 뒤 상권·평화로움 값이 채워지는지, 대중교통 "경로 찾는 중"이 사라지는지.
5. 옛 주소 `peripheral7.github.io/WhereTo/` → 새 주소로 넘어가는지.

**되돌리기**: 블로그 쪽은 4단계 전까지 아무것도 바뀌지 않는다. 4단계 뒤라도 `git revert` 한 번으로 `/WhereTo/` 가 다시 열리고, Worker 허용 출처는 옛 주소를 지우지 않으므로 둘 다 동작한다. 이 PC 계산 서버는 `server/start.cmd` 로 언제든 다시 켤 수 있다(나중에 등록한 쪽이 Worker 에 남는다 — 두 서버를 같이 켜 두지 말 것).

---

## 4. 옮기면서 달라지는 점 · 미리 고쳐 둔 것

- `vite.config.ts`: `WHERETO_BASE=/`·`WHERETO_OUT=dist` 로 빌드하면 맨 위 주소(`/`)에서 열리는 독립 사이트(기본값은 지금처럼 블로그 `/WhereTo/`). 새 저장소의 `npm run build:site` 가 이 값을 쓴다.
- 글꼴: 블로그 공용 `/fonts/PretendardVariable.woff2`(2MB) → 새 저장소 `public/fonts/` 로 복사.
- 계산 서버 `server/runner.mjs`: 저장소 안 경로를 `git rev-parse --show-prefix` 로 알아내 블로그(`tools/location-compare/`)·새 저장소(맨 위) 어디서나 동작. 큰 원본 자료는 `raw/` 폴더(없으면 예전처럼 저장소 맨 위) — `scripts/places.mjs` 도 같은 규칙, `WHERETO_RAW_DIR` 로 바꿀 수 있음.
- 도서관 xls → csv 는 Windows Excel 로 바꾸므로 서버에는 **csv 만** 올린다(xls 가 없으면 csv 를 그대로 씀).
- `scripts/scheduled-routes.ps1`(Windows 작업 스케줄러용)은 서버에서는 필요 없다 — 계산 서버가 기준 시각에 스스로 잰다. 기본 후보지 값을 저장소(`src/routes.json`)에 고정하고 싶으면 서버에서 `node scripts/fetch-routes.mjs --slot rush` 를 cron 으로(선택, `server-setup.sh` 끝에 예시).
- Node 버전: 스크립트가 `.ts` 파일을 바로 읽고(`import … from '../src/data.ts'`) `node:sqlite` 를 쓰므로 **Node 24 이상**.
- 블로그 저장소에서 앱 소스는 이전이 끝나고 안정되면 지운다(별도 커밋, 사용자 확인 후).
