import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/server/app.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    'commander',
    'inquirer',
    'chalk',
    'ora',
    'fast-glob',
    'fs-extra',
    'ejs',
    'cosmiconfig',
    'ignore',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@vue/compiler-sfc',
    'axios',
    'qs',
    'xlsx',
    'better-sqlite3',
    'express',
    'ws',
    'cors',
    'crypto',
    'md5',
  ],
})


