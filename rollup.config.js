import run from 'rollup-plugin-run';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: './lib/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
  {
    input: './lib/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
    },
    external: ['redis'],
    plugins: [
      resolve({
        extensions: ['.js', '.ts'],
        preferBuiltins: true,
      }),
      json(),
      commonjs({
        include: 'node_modules/**',
        extensions: ['.js'],
        ignore: ['pg-native', './native'],
      }),
      babel({
        exclude: ['node_modules/**', '**/__test__/**'],
        extensions: ['.js', '.ts'],
      }),
      run({
        env: {
          ENV_FILE: '.development.env',
        },
        execArgv: ['-r', 'source-map-support/register'],
      }),
    ],
  },
];
