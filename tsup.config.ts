import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/core/index.ts", "src/react/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  external: ["react"],
});
