import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: {
    index: 'src/index.ts',
    design: 'src/design.ts',
  },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true,
      declaration: true,
      declarationDir: 'dist',
    }),
    resolve({
      preferBuiltins: false,
      browser: true,
      mainFields: ['module', 'main'],
    }),
    terser({ format: { comments: false } }),
  ],
};
