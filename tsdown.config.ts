import { defineConfig } from "tsdown";
import package_json from "./package.json" with { type: "json" };

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
    "import.meta.env.VERSION": JSON.stringify(package_json.version),
  },
});
