import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:local`: 더블클릭으로 바로 열리는 HTML 파일 하나로 묶는다
export default defineConfig(({ mode }) => ({
  plugins: mode === 'file' ? [react(), viteSingleFile()] : [react()],
  base: mode === 'file' ? './' : '/',
  publicDir: mode === 'file' ? false : 'public',
  build: mode === 'file' ? { outDir: 'dist-local' } : {},
  test: { environment: 'node' },
}));
