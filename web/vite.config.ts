import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The browser only talks to this origin. /api/platform and /api/ai are forwarded to the
// two backend services, so no CORS configuration is needed in development or preview.
const platformTarget = process.env.PLATFORM_API_URL ?? 'http://localhost:8000'
const aiTarget = process.env.AI_API_URL ?? 'http://localhost:8001'

const proxy = {
  '/api/platform': {
    target: platformTarget,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/platform/, ''),
  },
  '/api/ai': {
    target: aiTarget,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/ai/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
})
