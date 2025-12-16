import { describe, expect, test } from "vitest";
import { write_module } from "./module";
import { Writer } from "./writer";

describe("write_module", () => {
  test("validate empty module", () => {
    const writer = new Writer();
    expect(writer.binary.length).toBe(0);
    write_module(writer, { types: [], funcs: [] });

    expect(WebAssembly.validate(writer.binary)).toBeTruthy();
    expect(writer.binary.length).toBe(14);
  });

  test("validate simple module", () => {
    const writer = new Writer();
    write_module(writer, {
      types: [{ kind: "func", params: [], return: [] }],
      funcs: [{ signature: 0, body: null }],
    });

    expect(WebAssembly.validate(writer.binary)).toBeTruthy();
  });

  test("validate simple module 2", () => {
    const writer = new Writer();
    write_module(writer, {
      types: [{ kind: "func", params: [], return: [] }],
      funcs: [
        { signature: 0, body: null },
        { signature: 0, body: null },
      ],
    });

    expect(WebAssembly.validate(writer.binary)).toBeTruthy();
  });
});
