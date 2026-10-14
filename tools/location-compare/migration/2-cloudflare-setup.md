# 2. Cloudflare 에 화면 올리기 — Workers 정적 자산(지금 방식)

Cloudflare 대시보드는 Pages 를 옛 방식으로 돌리고 **"Create application"** 하나로 합쳤다. 화면(정적 사이트)은 이제
**Worker + 정적 자산(Static Assets)** 으로 올린다. 저장소 맨 위 `wrangler.jsonc` 가 "코드 없이 `dist/` 파일만"이라고 정해 둔다.
GitHub 저장소를 연결하면 Cloudflare 가 push 할 때마다 직접 빌드·배포한다 → **API 토큰·GitHub 비밀값이 필요 없다.**

## 사용자가 할 일(로그인이 필요해 대신 못 함)
1. Cloudflare 대시보드(Worker 를 둔 계정) → **Workers & Pages → Create application → Import a repository**
   - 처음이면 GitHub 연결 → `peripheral7/WhereTo` 저장소 허용.
2. 설정 화면
   - Project name: `whereto` → 주소가 `https://whereto.<계정 하위도메인>.workers.dev`
   - Build command: `npm run build:site`
   - Deploy command: `npx wrangler deploy` (기본값 그대로)
   - Root directory: 비워 둠(저장소 맨 위)
   - **Build variables**(Advanced settings → Variables) — 공개되는 값만:
     - `VITE_NAVER_MAP_KEY_ID` = `.env.local` 의 같은 이름 값(지도 Client ID, 원래 공개 값)
     - `VITE_PLACE_SEARCH_URL` = `https://place-search.mooncg0916.workers.dev`
3. **Deploy** → 1~2분 뒤 주소가 나온다. 이후 `main` 에 push 하면 자동 배포.
4. **네이버 클라우드 콘솔** → Maps Application → Web 서비스 URL 에 새 주소 추가(빠지면 OSM 지도로 자동 전환, 기능은 동작).
5. (선택) 그 Worker → Settings → Domains & Routes → 내 도메인.

## 그다음(내가)
- 새 주소가 열리는지·지도·점수 확인.
- `4-switch.ps1 -NewUrl <새 주소> -Deploy` 전에 장소 검색 Worker 허용 출처에 새 주소를 넣어야 새 사이트에서 검색·계산이 된다(그 전에는 검색창이 "검색 준비 중", 새 후보지 계산이 안 됨 — 기본 후보지 화면은 동작).
