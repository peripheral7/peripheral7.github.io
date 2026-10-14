import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// 블로그의 public/WhereTo/ 로 곧바로 빌드한다 → 배포되면 https://peripheral7.github.io/WhereTo/ 로 열린다.
// (개발 중에는 npm run dev → http://localhost:5173/WhereTo/)
// 따로 떼어 옮길 때(migration/README.md): WHERETO_BASE=/ WHERETO_OUT=dist 로 빌드하면 저장소 맨 위에서 열리는 독립 사이트가 된다.
const BASE = process.env.WHERETO_BASE || '/WhereTo/'
const OUT = process.env.WHERETO_OUT ? path.resolve(process.env.WHERETO_OUT) : fileURLToPath(new URL('../../public/WhereTo', import.meta.url))
export default defineConfig({
  base: BASE,
  plugins: [react()],
  build: {
    outDir: OUT,
    emptyOutDir: true, // 빌드 결과만 담는 폴더다
  },
})
