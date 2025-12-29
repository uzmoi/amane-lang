import type { AirModule } from "../../air";
import { convert } from "./convert";
import { write_module } from "./module";
import { Writer } from "./writer";

export const emit_wasm = (module: AirModule): Uint8Array<ArrayBuffer> => {
  const writer = new Writer();

  write_module(writer, convert(module));

  return writer.emit_binary();
};
