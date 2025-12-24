import { describe, expect, test } from "vitest";
import type { u8 } from "./types";
import { Writer } from "./writer";

describe("Writer", () => {
  test("consume", () => {
    const writer = new Writer();
    expect(writer.binary.length).toBe(0);
    expect(writer.consume(4)).toBe(0);
    expect(writer.binary).toEqual(new Uint8Array(4));
  });

  test("str", () => {
    const writer = new Writer();
    writer.str("あ");
    expect(writer.binary).toEqual(new Uint8Array([3, 227, 129, 130]));
  });

  test("leb128", () => {
    const writer = new Writer();
    writer.u32leb128(12345678);
    expect(writer.binary).toEqual(new Uint8Array([0xce, 0xc2, 0xf1, 0x05]));
  });

  test("fixup without expansion", () => {
    const writer = new Writer();

    const ptr = writer.consume(1);
    writer.u8(10);
    writer.u8(11);
    writer.u8(12);
    writer.fixup_size(ptr);

    expect(writer.binary).toEqual(new Uint8Array([3, 10, 11, 12]));
  });

  test("fixup with expansion (+1)", () => {
    const writer = new Writer();
    const bytes = Uint8Array.from({ length: 128 }, (_, i) => i & 0xf);

    const ptr = writer.consume(1);
    for (const byte of bytes) {
      writer.u8(byte as u8);
    }
    writer.fixup_size(ptr);

    expect(writer.binary).toEqual(new Uint8Array([0x80, 0x01, ...bytes]));
  });

  test("fixup with expansion (+2)", () => {
    const writer = new Writer();
    const bytes = Uint8Array.from({ length: 0x3fff }, (_, i) => i & 0xf);

    const ptr = writer.consume(1);
    writer.vec_u8(bytes);
    writer.fixup_size(ptr);

    expect(writer.binary).toEqual(
      new Uint8Array([0x81, 0x80, 0x01, 0xff, 0x7f, ...bytes]),
    );
  });
});
