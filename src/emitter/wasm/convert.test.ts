import { describe, expect, test } from "vitest";
import { art_infer } from "#tests/helpers";
import { convert } from "./convert";
import { type Module, NumType } from "./module";

describe("convert", () => {
  test("empty", () => {
    expect(convert({ items: [] })).toEqual({
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
    expect(convert({ items: [art_infer("let %0 = fn 0")] })).toEqual({
      types: [{ kind: "func", params: [], return: [NumType.i32] }],
      imports: [],
      funcs: [
        {
          signature: 0,
          local_refs: new Map(),
          locals: [],
          body: art_infer("0"),
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
