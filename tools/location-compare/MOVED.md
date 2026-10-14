# 여기살까?는 따로 옮겼습니다 (2026-10-14)

- 저장소: https://github.com/peripheral7/WhereTo — 이 PC 작업 폴더 `C:\Users\moonc\Documents\whereto`
- 사이트: https://whereto.maverickway.workers.dev (Cloudflare Workers 정적 자산, `main` 에 push 하면 자동 배포)
- 장소 검색·계산 중계 Worker `place-search` 소스도 그 저장소 `workers/place-search` 로 옮겼다(배포: 그 폴더에서 `npx wrangler deploy --config wrangler.toml`).
- 계산 서버는 `Documents\whereto` 에서 `server\start.cmd`.

이 블로그에는 옛 주소 `/WhereTo/`·`/location-compare/` 를 새 주소로 넘기는 안내 페이지만 남는다. **앱 수정은 새 저장소에서만** 한다.
이 폴더에 남아 있을 수 있는 git 제외 파일(.env.local · data/ · server/cache)은 새 폴더로 복사해 두었으니 지워도 된다.
옮긴 기록(계획·스크립트)은 git 기록의 `tools/location-compare/migration/` (커밋 4a4a829 무렵)에 있다.
