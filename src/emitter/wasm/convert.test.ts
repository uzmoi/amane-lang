import { describe, expect, test } from "vitest";
import type { AirModule } from "../../air";
import { convert } from "./convert";
import type { Module } from "./module";

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
});
