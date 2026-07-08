/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages는 정적 파일만 서빙하므로 정적 export 모드로 빌드합니다.
  output: "export",

  // next/image의 서버 최적화는 GitHub Pages(서버 없음)에서 동작하지 않으므로 끕니다.
  images: {
    unoptimized: true,
  },

  // 저장소가 닉네임.github.io 라서 루트(/)에 바로 배포됩니다.
  // 만약 나중에 다른 이름의 저장소(프로젝트 페이지)로 바꾸면
  // basePath: "/저장소이름", assetPrefix: "/저장소이름" 을 추가해야 합니다.

  trailingSlash: true, // GitHub Pages에서 하위 경로 라우팅이 깨지지 않도록
}

export default nextConfig
