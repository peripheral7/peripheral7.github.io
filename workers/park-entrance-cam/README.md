# park-entrance-cam (공원 진출입로 촬영 앱) 배포

정적 PWA(`KICA 논문작성/field_app/dist`)를 Cloudflare Workers 정적 자산으로 올린다.
주소: https://park-entrance-cam.mooncg0916.workers.dev  (촬영 데이터는 기기 브라우저에 저장되므로
**주소(오리진)를 바꾸면 기기 안의 기록이 새 주소에서 보이지 않는다** — 함부로 바꾸지 말 것)

## 블로그 소개 페이지

블로그에는 앱을 소개하고 여는 페이지 `/field-cam`(`app/field-cam/page.tsx`)과 보드 카드
(`content/posts/09-park-entrance-cam.json`, 미리보기 `public/images/reports/park-entrance-cam/preview.png`)가 있다.
앱은 위 주소에서 따로 실행되고 블로그는 링크만 건다(iframe으로 넣지 않는다 — 다른 주소의 iframe은 브라우저 저장소가 분리되어
앱을 직접 열었을 때의 기록과 따로 쌓인다). 앱 주소를 바꾸면 `app/field-cam/page.tsx`의 `APP_URL`도 고칠 것.

## 재배포

앱을 새로 빌드한 뒤(서비스 워커의 CACHE 이름 버전도 올릴 것):

    npx wrangler deploy --config workers/park-entrance-cam/wrangler.jsonc --assets "<field_app/dist 절대경로>"

- 정적 파일 요청은 무료·무제한이고, `worker.js`는 `/index.html` 요청만 처리한다.
- 요금: 없음(Workers Free). 사진·좌표는 서버로 전송되지 않는다.
