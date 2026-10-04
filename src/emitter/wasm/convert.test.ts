import { todo } from "@uzmoi/ut/ils";
import { describe, expect, test } from "vitest";
import type { Id } from "#air";
import { art_infer } from "#tests/helpers";
import { convert } from "./convert";
import type { Module } from "./module";
import { NumType } from "./type";

describe("convert", () => {
  test("empty", () => {
    expect(convert({ imports: [], items: [] })).toEqual({
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

  test.todo("func", () => {
    expect(
      todo(),
      // convert({ imports: [], items: [art_infer("let %0 = fn 0")] }),
    ).toEqual({
      types: [{ kind: "func", params: [], return: [NumType.i32] }],
      imports: [],
      funcs: [
        {
          id: 0 as Id,
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
