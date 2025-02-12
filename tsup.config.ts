import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli/main.ts",
  },
  format: "esm",
  sourcemap: true,
  dts: true,
  define: {
    "import.meta.env.DEV": "false",
  },
});
