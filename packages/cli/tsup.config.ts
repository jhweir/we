import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'we-build': 'scripts/we-build.ts', 'we-banner': 'scripts/we-banner.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  treeshake: true,
});
