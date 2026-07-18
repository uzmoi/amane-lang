import { describe, expect, test } from "vitest";
import {
  parse_bin_digits_as_u64,
  parse_decimal_integer_as_u64,
  parse_hex_digits_as_u64,
  parse_number_literal,
} from "./number";

describe("binary", () => {
  test("zero", () => {
    expect(parse_bin_digits_as_u64("0")).toBe(0n);
  });

  test("random", () => {
    const n = BigInt(Math.floor(Math.random() * 1000000));
    expect(parse_bin_digits_as_u64(n.toString(2))).toBe(n);
  });

  test("max", () => {
    const n = 2n ** 64n - 1n;
    expect(parse_bin_digits_as_u64(n.toString(2))).toBe(n);
  });

  test("too big", () => {
    const n = 2n ** 64n;
    expect(() => parse_bin_digits_as_u64(n.toString(2))).toThrow(RangeError);
  });
});

describe("hexadecimal", () => {
  test("zero", () => {
    expect(parse_hex_digits_as_u64("0")).toBe(0n);
  });

  test("random", () => {
    const n = BigInt(Math.floor(Math.random() * 1000000));
    expect(parse_hex_digits_as_u64(n.toString(16))).toBe(n);
  });

  test("max", () => {
    const n = 2n ** 64n - 1n;
    expect(parse_hex_digits_as_u64(n.toString(16))).toBe(n);
  });

  test("too big", () => {
    const n = 2n ** 64n;
    expect(() => parse_hex_digits_as_u64(n.toString(16))).toThrow(RangeError);
  });
});

describe("decimal", () => {
  test("0", () => {
    expect(parse_decimal_integer_as_u64("0")).toBe(0n);
  });

  test("1", () => {
    expect(parse_decimal_integer_as_u64("1")).toBe(1n);
  });

  test("100", () => {
    expect(parse_decimal_integer_as_u64("100")).toBe(100n);
  });

  test("1e0", () => {
    expect(parse_decimal_integer_as_u64("1e0")).toBe(1n);
  });

  test("1e1", () => {
    expect(parse_decimal_integer_as_u64("1e1")).toBe(10n);
  });

  test("1e10", () => {
    expect(parse_decimal_integer_as_u64("1e10")).toBe(BigInt(1e10));
  });

  test("random", () => {
    const n = BigInt(Math.floor(Math.random() * 1000000));
    expect(parse_decimal_integer_as_u64(n.toString())).toBe(n);
  });

  test("max", () => {
    const n = 2n ** 64n - 1n;
    expect(parse_decimal_integer_as_u64(n.toString())).toBe(n);
  });

  test("too big", () => {
    const n = 2n ** 64n;
    expect(() => parse_decimal_integer_as_u64(n.toString())).toThrow(
      RangeError,
    );
  });

  test("too big (E-notation)", () => {
    // 2 ** 64 ≒ 1.84e19 < 2e19
    expect(() => parse_decimal_integer_as_u64("2e19")).toThrow(RangeError);
  });
});

describe("parse_number_literal", () => {
  test("inf", () => {
    expect(parse_number_literal("inf")).toBe(Infinity);
  });

  test("nan", () => {
    expect(parse_number_literal("nan")).toBe(NaN);
  });

  test("binary", () => {
    expect(parse_number_literal("0b0")).toBe(0n);
  });

  test("hex", () => {
    expect(parse_number_literal("0x0")).toBe(0n);
  });

  test("decimal", () => {
    expect(parse_number_literal("0e0")).toBe(0n);
  });

  test("0.0", () => {
    expect(parse_number_literal("0.0")).toBe(0);
  });
});
