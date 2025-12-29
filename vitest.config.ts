import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    snapshotSerializers: ["tests/wat.serializer.ts"],
  },
});
