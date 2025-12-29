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
    // wabt.js が TypedArray の offset と length に対応していないため、新しい配列として作り直す。
    const buffer = new Uint8Array(value);
    const wasm_module = wabt.readWasm(buffer, {});

    wasm_module.validate();

    return wasm_module.toText({}).trim();
  },
} satisfies SnapshotSerializer;
