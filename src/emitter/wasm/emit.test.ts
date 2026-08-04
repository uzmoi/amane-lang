import { describe, expect, test } from "vitest";
import type { Air } from "#air";
import { art_infer } from "#tests/helpers";
import { emit_wasm } from "./emit";

const emit = (items: Air[]) => {
  return emit_wasm({ items });
};

describe("emit_wasm", () => {
  test("empty module", () => {
    const wasm = emit([]);
    expect(wasm).toMatchSnapshot();
  });

  test("constant func", () => {
    const wasm = emit([art_infer("fn 0")]);
    expect(wasm).toMatchSnapshot();
  });

  test("identity func", () => {
    const wasm = emit([art_infer("fn (%0: i32) %0")]);
    expect(wasm).toMatchSnapshot();
  });

  test("return", () => {
    const wasm = emit([art_infer("fn return 0")]);
    expect(wasm).toMatchSnapshot();
  });

  describe("block", () => {
    test("empty block", () => {
      const wasm = emit([art_infer("fn {}")]);
      expect(wasm).toMatchSnapshot();
    });

    test("block with last", () => {
      const wasm = emit([art_infer("fn { 0; 0; 0 }")]);
      expect(wasm).toMatchSnapshot();
    });
  });

  describe("loop", () => {
    test("empty block", () => {
      const wasm = emit([art_infer("fn loop #0 {}")]);
      expect(wasm).toMatchSnapshot();
    });

    test("break", () => {
      const wasm = emit([art_infer("fn loop #0 break #0")]);
      expect(wasm).toMatchSnapshot();
    });
  });

  test("if", () => {
    const wasm = emit([art_infer("fn if false then 0 else 0")]);
    expect(wasm).toMatchSnapshot();
  });

  test("assign to param", () => {
    const wasm = emit([art_infer("fn (%0: i32) { %0 = 0; %0 }")]);
    expect(wasm).toMatchSnapshot();
  });

  test("define", () => {
    const wasm = emit([art_infer("fn { let %0 = 0; %0 }")]);
    expect(wasm).toMatchSnapshot();
  });
});
