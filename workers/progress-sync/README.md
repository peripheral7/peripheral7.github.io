# progress-sync — 학습 진행사항 서버 저장

행정법 기본문제 25 페이지(`public/reports/admin-law-basic-problems-25.html`)의 진행사항(자가테스트 채점 기록,
오답 단답노트)을 여러 기기가 같이 쓰도록 Cloudflare Worker + D1에 저장하는 작은 API.
브라우저(localStorage)가 항상 원본이고 서버는 백업·기기 간 동기화용 사본이다.

- 주소: https://progress-sync.mooncg0916.workers.dev
- 저장소: D1 `progress-sync` (문서 id 아래에 rev가 오르는 스냅샷, 최근 60개 유지)
- 인증: `Authorization: Bearer <동기화 키>` — 키는 Worker 시크릿 `SYNC_TOKEN`
- 요금: Workers Free + D1 Free 한도 안(하루 요청 10만 · D1 쓰기 10만 행/일 · 5GB). 한도를 넘으면 과금이 아니라 요청이 실패한다.

## API

| 요청 | 설명 |
|---|---|
| `GET /v1/docs/:id[?since=REV]` | 최신 스냅샷 `{rev, updatedAt, device, data}` · 없으면 404 · `since`가 최신 rev와 같으면 204 |
| `PUT /v1/docs/:id` | `{baseRev, data, device?}` — 서버 최신 rev가 `baseRev`와 같을 때만 저장(200 `{rev}`). 다르면 409와 함께 최신본을 돌려준다 |
| `GET /v1/docs/:id/history` | 남아 있는 리비전 목록 |
| `GET /v1/docs/:id/rev/:n` | 특정 리비전 스냅샷 |

CORS는 `https://peripheral7.github.io`와 로컬 개발(`localhost:3000`)만 허용한다(`src/index.js`의 `ALLOWED_ORIGINS`).

## 배포·운영

    cd workers/progress-sync
    npx wrangler deploy                                   # 코드 배포
    npx wrangler d1 execute progress-sync --remote --file=schema.sql   # 스키마(최초 1회)
    echo <새 키> | npx wrangler secret put SYNC_TOKEN      # 키 교체 — 교체하면 각 기기에서 새 키를 다시 입력해야 한다

로컬 테스트: `.dev.vars`에 `SYNC_TOKEN=...`을 두고 `npx wrangler d1 execute progress-sync --local --file=schema.sql` 후
`npx wrangler dev --local --port 8787`. 페이지는 `localhost`에서만
`localStorage['admin-law-25-sync-endpoint']`(서버 주소)와 `localStorage['admin-law-25-sync-doc']`(문서 id)로 테스트용 재지정을 허용한다.

## 되돌리기(복구)

잘못 덮어써도 최근 60개 리비전이 남아 있다.

    curl -H "Authorization: Bearer <키>" https://progress-sync.mooncg0916.workers.dev/v1/docs/admin-law-25/history
    curl -H "Authorization: Bearer <키>" https://progress-sync.mooncg0916.workers.dev/v1/docs/admin-law-25/rev/<번호>

원하는 리비전의 `data`를 페이지의 "이 기기 기준으로 서버 덮어쓰기"로 되돌리거나, 그 내용을 `PUT`으로 다시 올린다.

## 병합 규칙(페이지 쪽, 요약)

- 자가테스트 채점 기록: 문항별로 기록 시각(`t`)이 더 최근인 쪽이 이긴다(같으면 더 진행된 쪽).
- 오답 단답노트(확인 목록 + 큐): 한 덩어리로 보고 마지막으로 바뀐 시각이 더 최근인 쪽이 이긴다. 이긴 쪽에 없는 카드는
  페이지가 빨강/주황 문항에서 다시 채워 주므로 어긋나도 스스로 복구된다.
