import { Opcode } from "./opcode";
import type { u8 } from "./types";

export class Writer {
  u8(_value: u8) {
    // TODO: impl
  }

  u32leb128(n: number) {
    do {
      let byte = (n & 0x7f) as u8;

      n >>>= 7;

      if (n !== 0) byte = (byte | 0x80) as u8;

      this.u8(byte);
    } while (n !== 0);
  }
}
