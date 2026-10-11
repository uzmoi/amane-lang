import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    "import.meta.env.VERSION": '"0.0.0-test"',
  },
  test: {
    snapshotSerializers: ["tests/fixtures/wat.serializer.ts"],
  },
});
