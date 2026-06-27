import { describe, expect, test } from "vitest";
import { normalize_number, skip_shebang } from "./utils";

describe("normalize_number", () => {
  test.each([
    ["0"],
    ["00", "0"],
    ["001", "1"],
    ["100"],
    ["0.0"],
    ["00.00", "0.0"],
    ["0.100", "0.1"],

    ["0b0"],
    ["0b00", "0b0"],
    ["0b001", "0b1"],
    ["0b100"],
    ["0xf"],
    ["0x00", "0x0"],
    ["0x001", "0x1"],
    ["0x00f", "0xf"],
    ["0x100"],
    ["0XF", "0xf"],

    ["nan"],
    ["inf"],
  ])("Normalize '%s'", (input, output = input) => {
    expect(normalize_number(input)).toEqual(output);
  });
});

describe("skip_shebang", () => {
  test("No shebang", () => {
    expect(skip_shebang("hoge\n#!fuga")).toBe(0);
  });

  test("Skip until LF", () => {
    expect(skip_shebang("#!hoge\nfuga")).toBe(6);
  });

  test("Skip until CR", () => {
    expect(skip_shebang("#!hoge\rfuga")).toBe(6);
  });

  test("Skip until CRLF", () => {
    expect(skip_shebang("#!hoge\r\nfuga")).toBe(6);
  });

  test("Skip until EOF", () => {
    expect(skip_shebang("#!hoge")).toBe(6);
  });
});
