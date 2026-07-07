import { describe, expect, test } from "vitest";
import { parse_art as art } from "./parser";
import { print_air } from "./print";

test("ref", () => {
  expect(print_air(art("%0"))).toEqual("%0");
});

describe("fn", () => {
  test.each([
    "fn 0",
    "fn (%0: i32, %1: i32) %2",
    "fn return 0",
    "call %0",
    "call %0(0, 1, 2)",
  ])("%o", (art_code) => {
    expect(print_air(art(art_code))).toBe(art_code);
  });
});

describe("block", () => {
  test.each([
    "{}",
    "{ 0; }",
    "{ 0 }",
    "{ 0; 1; 2 }",
    "loop {}",
    "break",
    "if %0 then %1 else %2",
    "let %0 = 0",
    "%0 = 0",
  ])("%o", (art_code) => {
    expect(print_air(art(art_code))).toBe(art_code);
  });
});
