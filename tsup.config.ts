import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  sourcemap: true,
  dts: true,
  define: {
    "import.meta.env.DEV": "false",
  },
});
