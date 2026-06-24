import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli/main.ts",
  },
  platform: "neutral",
  deps: {
    neverBundle: /^node:/,
  },
  sourcemap: true,
  define: {
    "import.meta.env.DEV": "false",
  },
});
