# 2. Cloudflare Pages 연결 (사용자가 대시보드에서 — 로그인·토큰 발급은 대신 못 함)

두 방법 중 하나. **A 를 추천**(배포가 저장소의 GitHub Actions 에 남아 기록이 보인다).

## A. GitHub Actions 로 배포(deploy-pages.yml — 1단계에서 저장소에 이미 들어감)
1. Cloudflare 대시보드 → Workers & Pages → **Create → Pages → Direct Upload** → 프로젝트 이름 ③(예: `whereto`) → 빈 프로젝트로 만들기(파일은 안 올려도 됨).
2. 내 프로필 → API Tokens → **Create Token** → 템플릿 "Edit Cloudflare Workers" 또는 사용자 지정: `Account · Cloudflare Pages · Edit` → 토큰 복사.
3. 계정 ID: 대시보드 오른쪽 아래 "Account ID".
4. 새 GitHub 저장소 → Settings → Secrets and variables → Actions
   - Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - Variables: `PAGES_PROJECT` = ③, `VITE_NAVER_MAP_KEY_ID` = 지금 `.env.local` 의 같은 이름 값(공개 값), `VITE_PLACE_SEARCH_URL` = `https://place-search.mooncg0916.workers.dev`
5. Actions 탭 → deploy-pages → Run workflow. 끝나면 `https://③.pages.dev`.

## B. Cloudflare 가 GitHub 저장소를 직접 빌드
Workers & Pages → Create → Pages → **Connect to Git** → 새 저장소 선택 → Build command `npm run build:site`, Output `dist`, 환경 변수 `NODE_VERSION=24`, `VITE_NAVER_MAP_KEY_ID`, `VITE_PLACE_SEARCH_URL`.
(이 경우 저장소의 `.github/workflows/deploy-pages.yml` 은 지운다 — 두 번 배포되지 않게.)

## 공통 — 배포 뒤
- **네이버 클라우드 콘솔** → AI·NAVER API → Application → (지도 앱) 수정 → Web 서비스 URL 에 `https://③.pages.dev` (와 ④ 도메인) 추가. 빠지면 지도 401 → OSM 지도로 자동 전환(기능은 동작).
- (선택) Pages → Custom domains → ④.
- `4-switch.ps1 -NewUrl https://③.pages.dev` 가 Worker 허용 출처에 이 주소를 더하고 배포한다.
