import { solidPlugin } from 'esbuild-plugin-solid';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  treeshake: true,
  external: ['solid-js', '@we/elements'],
  esbuildPlugins: [solidPlugin()],
  esbuildOptions(o) {
    o.jsx = 'automatic';
    o.jsxImportSource = 'solid-js';
  },
});
