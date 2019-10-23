import run from 'rollup-plugin-run';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
  input: './example/exampleServer.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [
    resolve({
      extensions: ['.js', '.ts'],
      preferBuiltins: true
    }),
    json(),
    commonjs({
      include: 'node_modules/**',
      extensions: ['.js'],
      ignore: ['pg-native' , './native']
    }),
    babel({
      exclude: ['node_modules/**', '**/__test__/**'],
      extensions: ['.js', '.ts'],
    }),
    run(),
  ],
};
