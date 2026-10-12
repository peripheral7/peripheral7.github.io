# place-search — 장소 검색 중계 Worker

"여기살까?"(`/location-compare/`) 검색창이 부르는 네이버 **지역 검색** 중계. 네이버 Client Secret 을 브라우저·GitHub 에 두지 않으려고 이 Worker 의 시크릿에만 둔다.

- `GET /search?q=검색어` → `{ items: [{ name, address, category, lat, lng }] }` (최대 5건, 한국 좌표 밖 결과는 버림)
- 막는 장치: 하루 전체 상한(`DAILY_LIMIT`) · IP 당 상한(`IP_HOURLY`, `IP_DAILY`) · Turnstile(`TURNSTILE_SECRET` 이 있으면 필수) · 허용 출처 · 7일 캐시 · 검색어 2~40자. 자세한 이유는 `tools/location-compare/README.md` 9절.
- 카운터는 D1 `usage` 표(`schema.sql`). 지난 카운터는 요청의 약 2%에서 지운다.
- 시크릿: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `SALT`, (선택) `TURNSTILE_SECRET` — `npx wrangler secret put 이름`.
- 허용 출처를 바꾸려면 `src/index.js` 의 `ALLOWED_ORIGINS`.

## 로컬 시험
```bash
# .dev.vars (git 제외)에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET / SALT, 가짜 서버로 시험하려면 NAVER_LOCAL_URL=http://127.0.0.1:3009/local
npx wrangler d1 execute place-search --local --file=schema.sql
npx wrangler dev --local --port 8799 --var DAILY_LIMIT:3 --var IP_HOURLY:6
curl -H "Origin: https://peripheral7.github.io" "http://127.0.0.1:8799/search?q=망포"
```
Turnstile 시험용 Secret: 항상 통과 `1x0000000000000000000000000000000AA`, 항상 실패 `2x0000000000000000000000000000000AA`.

배포는 아직 하지 않았다(키 필요). 순서는 `tools/location-compare/README.md` 9절 "켜는 순서".
