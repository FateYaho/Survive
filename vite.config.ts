import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 설정
 *
 * - 로컬 dev 서버: http://localhost:5173
 * - @ alias → src/ (import 경로 편의)
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true, // 같은 네트워크 다른 기기에서도 접근 가능
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
