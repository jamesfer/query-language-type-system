import path from 'path';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import globals from 'rollup-plugin-node-globals';

export default {
  input: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    format: 'iife',
    file: path.resolve(__dirname, 'build', 'index.js'),
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs({
      preferBuiltins: false,
      namedExports: {
        // We have to exclude react because babel types does some weird exporting and the causes
        // rollup to choke
        '@babel/types': Object.keys(require('@babel/types')).filter(name => name !== 'react'),
        codemirror: ['defineMode', 'fromTextArea'],
        lodash: Object.keys(require('lodash')),
        moo: Object.keys(require('moo')),
      },
    }),
    typescript({ target: 'es2015' }),
    babel({ extensions: ['.ts'] }),
    globals(),
  ],
  // external: id => id in dependencies
  //   || /^lodash/.test(id)
  //   || /^neo4j-driver/.test(id),
};
