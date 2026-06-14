import typescript from "@rollup/plugin-typescript";
import commonjs   from "@rollup/plugin-commonjs";

const tsPlugins  = [typescript({ tsconfig: false, compilerOptions: { strict: false, ignoreDeprecations: "5.0" } })];
const cjsPlugins = [commonjs()];

export default [
  // ESM build — from TypeScript source (named + default exports)
  {
    input: "src/core.ts",
    plugins: tsPlugins,
    output: {
      file: "dist/namespace.mjs",
      format: "es",
    },
  },
  // CommonJS build — from CJS source (module.exports = namespace directly)
  {
    input: "src/core.js",
    plugins: cjsPlugins,
    output: {
      file: "dist/namespace.cjs",
      format: "cjs",
      exports: "default",
    },
  },
  // UMD build for browsers — from TypeScript source
  {
    input: "src/core.ts",
    plugins: tsPlugins,
    output: {
      file: "dist/namespace.umd.js",
      format: "umd",
      name: "namespace",
    },
  },
];
