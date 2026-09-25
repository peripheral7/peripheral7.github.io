# park-entrance-cam (공원 진출입로 촬영 앱) 배포

정적 PWA(`KICA 논문작성/field_app/dist`)를 Cloudflare Workers 정적 자산으로 올린다.
주소: https://park-entrance-cam.mooncg0916.workers.dev  (촬영 데이터는 기기 브라우저에 저장되므로
**주소(오리진)를 바꾸면 기기 안의 기록이 새 주소에서 보이지 않는다** — 함부로 바꾸지 말 것)

## 재배포

앱을 새로 빌드한 뒤(서비스 워커의 CACHE 이름 버전도 올릴 것):

    npx wrangler deploy --config workers/park-entrance-cam/wrangler.jsonc --assets "<field_app/dist 절대경로>"

- 정적 파일 요청은 무료·무제한이고, `worker.js`는 `/index.html` 요청만 처리한다.
- 요금: 없음(Workers Free). 사진·좌표는 서버로 전송되지 않는다.
