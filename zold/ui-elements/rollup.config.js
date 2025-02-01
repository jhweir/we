// import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { globSync } from 'glob';
import path from 'path';
import postcss from 'rollup-plugin-postcss';
import typescript from 'rollup-plugin-typescript2';
// import copy from 'rollup-plugin-copy';

// Build the input object dynamically
// const input = {
//   index: 'src/index.ts',
//   main: 'src/main.ts',
// };

// const components = globSync('src/components/**/*.ts');
// // Add each component to the input
// components.forEach((filePath) => {
//   const componentName = path.basename(filePath, '.ts');
//   input[`components/${componentName}`] = filePath;
// });

// const components = globSync('src/components/**/*.ts');
// components.forEach((filePath) => {
//   const componentName = path.relative('src', filePath).replace('.ts', '');
//   input[componentName] = filePath;
// });

export default {
  input: {
    main: 'src/main.ts',
    // 'individual-components': 'src/individual-components.js',
    ...Object.fromEntries(
      globSync('src/components/*.ts').map((file) => [
        // This remove `src/` as well as the file extension from each
        // file, so e.g. src/nested/foo.js becomes nested/foo
        path.relative('src', file.slice(0, file.length - path.extname(file).length)),
        // This expands the relative paths to absolute paths, so e.g.
        // src/nested/foo becomes /project/src/nested/foo.js
        // fileURLToPath(new URL(file, import.meta.url))
        path.resolve(file),
      ]),
    ),
  },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    // preserveModules: false,
    // preserveModulesRoot: 'src',
    // entryFileNames: '[name].js', // Uses the keys from the input object
    // chunkFileNames: 'chunks/[name]-[hash].js',
    // // assetFileNames: '[name].[ext]',
    // preserveModules: true,
    // preserveModulesRoot: 'src',
  },
  external: ['lit', 'jdenticon', 'tslib'],
  plugins: [
    // todo: create map?
    postcss({
      extract: 'variables.css',
      minimize: true,
    }),
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true,
      // tsconfigOverride: {
      //   compilerOptions: {
      //     // Ensure declarations go to the correct directory
      //     declaration: true,
      //     declarationDir: 'dist',
      //     outDir: 'dist',
      //     rootDir: 'src',
      //   },
      // },
    }),
    resolve({ preferBuiltins: false, browser: true }), // moduleDirectories: ['src']
    // commonjs(),
    terser(),
    // copy({
    //   targets: [
    //     { src: 'src/styles/themes/*', dest: 'dist/themes' }, // Copy themes folder
    //   ],
    // })
  ],
};

//     postcss({ inject: false, extract: true, minimize: true }),
