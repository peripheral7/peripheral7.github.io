// 정적 파일은 Worker를 거치지 않고 바로 서빙된다. 이 Worker는 /index.html 요청에만 끼어들어,
// Cloudflare 기본 동작(/index.html → / 로 307 리다이렉트) 대신 index.html을 200으로 바로 준다.
//
// 이유: 앱의 서비스 워커가 './index.html'을 미리 캐시(cache.addAll)하는데, 리다이렉트된 응답이
// 캐시에 들어가면 iOS Safari 등에서 "설치 직후 오프라인 첫 실행"이 실패할 수 있다.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.pathname = '/';
    return env.ASSETS.fetch(new Request(url, request));
  },
};
