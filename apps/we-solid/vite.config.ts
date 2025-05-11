import { resolve } from 'path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()], // { tsDecorators: true }
  server: { port: 3000 },
  build: { target: 'esnext' },
  resolve: { alias: [{ find: '@', replacement: resolve(__dirname, 'src') }] },
});
