import { describe, expect, test } from "vitest";
import type { Air, AirModule } from "#air";
import { parse_art as art } from "#art";
import { convert } from "./convert";
import { type Module, NumType } from "./module";

describe("convert", () => {
  test("empty", () => {
    const air_module: AirModule = {
      items: [],
    };

    expect(convert(air_module)).toEqual({
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
    const air_module: AirModule = {
      items: [art("let %0 = fn 0")],
    };

    expect(convert(air_module)).toEqual({
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
