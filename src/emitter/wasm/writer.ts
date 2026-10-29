import type { u8 } from "./types";
import { leb128size } from "./utils";

export class Writer {
  #buffer = new ArrayBuffer(1024, { maxByteLength: 64 * 1024 }); // 64 KiB
  #dv = new DataView(this.#buffer);
  #bytes = new Uint8Array(this.#buffer);
  #ptr = 0;

  emit_binary() {
    return this.#bytes.slice(0, this.#ptr);
  }

  consume(n: number) {
    const ptr = this.#ptr;
    this.#ptr += n;
    if (this.#ptr > this.#bytes.length) {
      // 0x3ff === 1024 - 1
      this.#buffer.resize((this.#ptr ^ (this.#ptr & 0x3ff)) + 1024);
    }
    return ptr;
  }

  u8(value: u8) {
    this.#bytes[this.consume(1)] = value;
  }

  u32be(value: number) {
    this.#dv.setUint32(this.consume(4), value);
  }

  u32leb128(n: number) {
    do {
      let byte = (n & 0x7f) as u8;

      n >>>= 7;

      if (n !== 0) byte = (byte | 0x80) as u8;

      this.u8(byte);
    } while (n !== 0);
  }

  sleb128(value: bigint) {
    for (;;) {
      const byte = Number(value & 0x7fn) as u8;

      value >>= 7n;

      // (0n >> 7n) == 0n
      // (-1n >> 7n) == -1n
      // 最終byte且つ0x40のbitが立っていない（負の数の場合は2の補数表現なので反転する）
      if ((value === 0n && !(byte & 0x40)) || (value === -1n && byte & 0x40)) {
        this.u8(byte);
        break;
      }

      this.u8((byte | 0x80) as u8);
    }
  }

  f32(value: number) {
    this.#dv.setFloat32(this.consume(4), value, true);
  }

  f64(value: number) {
    this.#dv.setFloat64(this.consume(8), value, true);
  }

  fixup_size(ptr: number, hint = 1) {
    const size = this.#ptr - ptr - hint;
    const size_size = leb128size(size);
    if (size_size === 1) {
      this.#bytes[ptr] = size;
    } else {
      this.#bytes.copyWithin(
        ptr + size_size,
        ptr + hint,
        this.consume(size_size - hint),
      );
      this.#ptr -= size + size_size;
      this.u32leb128(size);
      this.#ptr += size;
    }
  }

  vec_u8(u8array: Uint8Array<ArrayBuffer> | readonly u8[]) {
    this.u32leb128(u8array.length);
    this.#bytes.set(u8array, this.consume(u8array.length));
  }

  #encoder = new TextEncoder();
  str(utf16string: string) {
    const utf8string = this.#encoder.encode(utf16string);
    this.vec_u8(utf8string);
  }
}
