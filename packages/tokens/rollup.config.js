import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import sassModules from 'rollup-plugin-sass-modules';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: { 'styles/index': 'src/styles/index.ts' },
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
    sassModules({
      outputDir: 'dist/styles/css',
      outputStyle: 'compressed',
      sourceMap: true,
      autoModules: false,
      filenameFn: (filename) => filename.replace(/\.scss$/, '.css'),
    }),
  ],
};
