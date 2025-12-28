import { describe, expect, test } from "vitest";
import type { Air, AirModule } from "../../air";
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
      exports: [],
      start: null,
    } satisfies Module);
  });

  test("func", () => {
    const func_body: Air = { type: "lit.num.int", value: 0 };
    const air_module: AirModule = {
      items: [{ type: "fn", body: func_body }],
    };

    expect(convert(air_module)).toEqual({
      types: [{ kind: "func", params: [], return: [NumType.i32] }],
      imports: [],
      funcs: [
        {
          signature: 0,
          decl_count: 0,
          body: func_body,
        },
      ],
      exports: [],
      start: null,
    } satisfies Module);
  });
});
