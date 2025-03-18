import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: { main: 'src/main.ts' },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js',
  },
  external: [/node_modules/, 'lit', 'jdenticon', 'tslib', '@popperjs/core'], // '@phosphor-icons/core'
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: { declaration: true, declarationDir: 'dist', outDir: 'dist', rootDir: 'src' },
      },
    }),
    resolve({
      preferBuiltins: false,
      browser: true,
      mainFields: ['module', 'browser', 'main'],
      // resolveOnly: [/^(?!@phosphor-icons\/core).*/],
    }),
    terser(),
    copy({
      targets: [
        { src: 'src/themes/*', dest: 'dist/styles/themes' },
        { src: 'src/variables.css', dest: 'dist/styles' },
      ],
    }),
  ],
};
