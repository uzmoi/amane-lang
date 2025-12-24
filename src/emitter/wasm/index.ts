import { Writer } from "./writer";

export const emit_wasm = (): Uint8Array<ArrayBuffer> => {
  const writer = new Writer();

  // write_module(writer, { ... });

  return writer.binary;
};
