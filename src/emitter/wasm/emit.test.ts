import { describe, expect, test } from "vitest";
import { parse_art as art } from "#art";
import { emit_wasm } from "./emit";

describe("emit_wasm", () => {
  test("empty module", () => {
    const wasm = emit_wasm({ items: [] });
    expect(wasm).toMatchSnapshot();
  });

  test("constant func", () => {
    const wasm = emit_wasm({
      items: [art("fn 0")],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("identity func", () => {
    const wasm = emit_wasm({
      items: [art("fn (%0: i32) %0")],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("return", () => {
    const wasm = emit_wasm({
      items: [art("fn return 0")],
    });
    expect(wasm).toMatchSnapshot();
  });

  describe("block", () => {
    test("empty block", () => {
      const wasm = emit_wasm({
        items: [art("fn {}")],
      });
      expect(wasm).toMatchSnapshot();
    });

    test("block with last", () => {
      const wasm = emit_wasm({
        items: [art("fn { 0; 0; 0 }")],
      });
      expect(wasm).toMatchSnapshot();
    });
  });

  describe("loop", () => {
    test("empty block", () => {
      const wasm = emit_wasm({
        items: [art("fn loop {}")],
      });
      expect(wasm).toMatchSnapshot();
    });

    test("break", () => {
      const wasm = emit_wasm({
        items: [art("fn loop break")],
      });
      expect(wasm).toMatchSnapshot();
    });
  });

  test("if", () => {
    const wasm = emit_wasm({
      items: [art("fn if 0 then 0 else 0")],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("assign to param", () => {
    const wasm = emit_wasm({
      items: [art("fn (%0: i32) { %0 = 0; %0 }")],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("define", () => {
    const wasm = emit_wasm({
      items: [art("fn { let %0 = 0; %0 }")],
    });
    expect(wasm).toMatchSnapshot();
  });
});
