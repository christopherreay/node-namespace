// rollup.config.js
export default [
  // ESM build
  {
    input: 'src/core.js',
    output: {
      file: 'dist/namespace.mjs',
      format: 'es'
    }
  },
  // CommonJS build
  {
    input: 'src/core.js',
    output: {
      file: 'dist/namespace.cjs',
      format: 'cjs',
      exports: 'named'
    }
  },
  // UMD build for browsers
  {
    input: 'src/core.js',
    output: {
      file: 'dist/namespace.umd.js',
      format: 'umd',
      name: 'namespace'
    }
  }
];
