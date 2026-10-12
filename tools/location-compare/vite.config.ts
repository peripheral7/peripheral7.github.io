import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// 블로그의 public/location-compare/ 로 곧바로 빌드한다 → 배포되면 https://peripheral7.github.io/location-compare/ 로 열린다.
// (개발 중에는 npm run dev → http://localhost:5173/location-compare/)
export default defineConfig({
  base: '/location-compare/',
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('../../public/location-compare', import.meta.url)),
    emptyOutDir: true, // public/location-compare 는 빌드 결과만 담는 폴더다
  },
})
