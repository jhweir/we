import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import { cssGenerator } from './dist/plugins/css-generator.js';

export default defineConfig({
  input: 'src/index.ts',
  output: { dir: 'dist', format: 'es', preserveModules: true, preserveModulesRoot: 'src', sourcemap: true },
  plugins: [
    typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist' }),
    nodeResolve(),
    cssGenerator({ outputDir: 'dist/css' }),
  ],
  external: (id) => id.startsWith('node:'),
});
