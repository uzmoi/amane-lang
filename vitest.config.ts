import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    snapshotSerializers: ["tests/fixtures/wat.serializer.ts"],
  },
});
