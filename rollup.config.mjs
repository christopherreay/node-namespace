import commonjs from "@rollup/plugin-commonjs";

const plugins = [commonjs()];

export default [
  // ESM build
  {
    input: "src/core.js",
    plugins,
    output: {
      file: "dist/namespace.mjs",
      format: "es",
    },
  },
  // CommonJS build
  {
    input: "src/core.js",
    plugins,
    output: {
      file: "dist/namespace.cjs",
      format: "cjs",
      exports: "default",
    },
  },
  // UMD build for browsers
  {
    input: "src/core.js",
    plugins,
    output: {
      file: "dist/namespace.umd.js",
      format: "umd",
      name: "namespace",
    },
  },
];
