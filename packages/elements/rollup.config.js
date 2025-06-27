import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { glob } from 'glob';
import copy from 'rollup-plugin-copy';
import typescript from 'rollup-plugin-typescript2';

const componentEntries = glob.sync('src/components/**/*.ts').reduce((acc, file) => {
  const name = file.replace('src/', '').replace('.ts', '');
  acc[name] = file;
  return acc;
}, {});

export default {
  input: { index: 'src/index.ts', helpers: 'src/helpers.ts', ...componentEntries },
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
        compilerOptions: { outDir: 'dist', rootDir: 'src', skipLibCheck: true },
        include: ['src/**/*.ts'],
      },
    }),
    resolve({
      preferBuiltins: false,
      browser: true,
      mainFields: ['module', 'browser', 'main'],
      // resolveOnly: [/^(?!@phosphor-icons\/core).*/],
    }),
    terser({ format: { comments: false } }), // Remove comments
    copy({
      targets: [
        { src: 'src/styles/themes/*', dest: 'dist/styles/themes' },
        { src: 'src/styles/variables.css', dest: 'dist/styles' },
        { src: 'src/types.ts', dest: 'dist' },
      ],
    }),
  ],
};
