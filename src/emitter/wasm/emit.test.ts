import { describe, expect, test } from "vitest";
import {
  type Air,
  type Id,
  InferenceContext,
  infer_type,
  ref_ty,
  type Ty,
} from "#air";
import { parse_art as art } from "#art";
import { emit_wasm } from "./emit";

const emit = (items: Air[], vars: Ty[] = []) => {
  const mod = { items };

  const ctx = new InferenceContext();
  for (const [index, ty] of vars.entries()) {
    ctx.unify(ref_ty(index as Id), ty);
  }

  infer_type(mod, ctx);
  return emit_wasm(mod);
};

describe("emit_wasm", () => {
  test("empty module", () => {
    const wasm = emit([]);
    expect(wasm).toMatchSnapshot();
  });

  test("constant func", () => {
    const wasm = emit([art("fn 0")]);
    expect(wasm).toMatchSnapshot();
  });

  test("identity func", () => {
    const wasm = emit([art("fn (%0: i32) %0")]);
    expect(wasm).toMatchSnapshot();
  });

  test("return", () => {
    const wasm = emit([art("fn return 0")]);
    expect(wasm).toMatchSnapshot();
  });

  describe("block", () => {
    test("empty block", () => {
      const wasm = emit([art("fn {}")]);
      expect(wasm).toMatchSnapshot();
    });

    test("block with last", () => {
      const wasm = emit([art("fn { 0; 0; 0 }")]);
      expect(wasm).toMatchSnapshot();
    });
  });

  describe("loop", () => {
    test("empty block", () => {
      const wasm = emit([art("fn loop {}")]);
      expect(wasm).toMatchSnapshot();
    });

    test("break", () => {
      const wasm = emit([art("fn loop break")]);
      expect(wasm).toMatchSnapshot();
    });
  });

  test("if", () => {
    const wasm = emit([art("fn if false then 0 else 0")]);
    expect(wasm).toMatchSnapshot();
  });

  test("assign to param", () => {
    const wasm = emit([art("fn (%0: i32) { %0 = 0; %0 }")]);
    expect(wasm).toMatchSnapshot();
  });

  test("define", () => {
    const wasm = emit([art("fn { let %0 = 0; %0 }")]);
    expect(wasm).toMatchSnapshot();
  });
});
