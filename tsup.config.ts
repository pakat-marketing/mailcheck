import { defineConfig } from "tsup";
import { readFile, writeFile } from "node:fs/promises";

const REACT_OUTPUTS = ["dist/react/index.js", "dist/react/index.cjs"];

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "react/index": "src/react/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  external: ["react"],
  // esbuild strips module-level "use client" directives while bundling.
  // Re-add the client-component boundary to the React entry afterwards so
  // Next.js App Router / RSC consumers get a proper client module.
  async onSuccess() {
    const directive = '"use client";\n';
    for (const file of REACT_OUTPUTS) {
      const contents = await readFile(file, "utf8");
      if (!contents.startsWith(directive)) {
        await writeFile(file, directive + contents);
      }
    }
  },
});
