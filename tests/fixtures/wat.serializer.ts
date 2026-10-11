import type { SnapshotSerializer } from "vitest";
import init_wabt from "wabt";

const wabt = await init_wabt();

export default {
  test(value: unknown) {
    return (
      value instanceof Uint8Array &&
      String.fromCharCode(...value.slice(0, 4)) === "\0asm"
    );
  },
  serialize(value: Uint8Array) {
    const wasm_module = wabt.readWasm(value, {});

    wasm_module.validate();

    return wasm_module.toText({}).trim();
  },
} satisfies SnapshotSerializer;
