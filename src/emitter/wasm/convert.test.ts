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
import { convert as convert_module } from "./convert";
import { type Module, NumType } from "./module";

const convert = (items: Air[], vars: Ty[] = []) => {
  const mod = { items };

  const ctx = new InferenceContext();
  for (const [index, ty] of vars.entries()) {
    ctx.unify(ref_ty(index as Id), ty);
  }

  infer_type(mod, ctx);
  return convert_module(mod);
};

describe("convert", () => {
  test("empty", () => {
    expect(convert([])).toEqual({
      types: [],
      imports: [],
      funcs: [],
      tables: [],
      memories: [],
      globals: [],
      exports: [],
      start: null,
    } satisfies Module);
  });

  test("func", () => {
    expect(convert([art("let %0 = fn 0")])).toEqual({
      types: [{ kind: "func", params: [], return: [NumType.i32] }],
      imports: [],
      funcs: [
        {
          signature: 0,
          local_refs: new Map(),
          locals: [],
          body: art("0") as Air,
        },
      ],
      tables: [],
      memories: [],
      globals: [],
      exports: [],
      start: null,
    } satisfies Module);
  });
});
