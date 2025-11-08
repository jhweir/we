import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'print-banner': 'scripts/print-banner.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  treeshake: true,
});
