import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 빌드 시 Electron 내에서 상대 경로로 에셋을 로드할 수 있게 설정
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
