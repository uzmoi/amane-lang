import type { u8 } from "./types";
import { leb128size } from "./utils";

export class Writer {
  #buffer = new ArrayBuffer(0, { maxByteLength: 64 * 1024 }); // 64 KiB
  binary = new Uint8Array(this.#buffer);
  #ptr = 0;

  consume(n: number) {
    const ptr = this.#ptr;
    this.#ptr += n;
    if (this.#ptr > this.binary.length) {
      this.#buffer.resize(this.#ptr);
      // this.binary = new Uint8Array(this.buffer);
    }
    return ptr;
  }

  u8(value: u8) {
    this.binary[this.consume(1)] = value;
  }

  u32leb128(n: number) {
    do {
      let byte = (n & 0x7f) as u8;

      n >>>= 7;

      if (n !== 0) byte = (byte | 0x80) as u8;

      this.u8(byte);
    } while (n !== 0);
  }

  fixupSize(ptr: number, hint = 1) {
    const size = this.#ptr - ptr - hint;
    const sizeSize = leb128size(size);
    if (sizeSize === 1) {
      this.binary[ptr] = size;
    } else {
      this.binary.copyWithin(
        ptr + sizeSize,
        ptr + hint,
        this.consume(sizeSize),
      );
      this.u32leb128(size);
    }
  }

  vec_u8(u8array: Uint8Array<ArrayBuffer>) {
    this.u32leb128(u8array.length);
    this.binary.set(u8array, this.consume(u8array.length));
  }

  #encoder = new TextEncoder();
  str(utf16string: string) {
    const utf8string = this.#encoder.encode(utf16string);
    this.vec_u8(utf8string);
  }
}
