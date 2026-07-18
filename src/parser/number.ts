const is_float = (string: string) => string.includes(".");

// normalize_number 通ってくるので構文の余計な要素は考えなくて良い。
export const parse_number_literal = (string: string): number | bigint => {
  if (string === "inf") {
    return Infinity;
  }

  if (string === "nan") {
    return NaN;
  }

  if (string.startsWith("0b")) {
    return parse_bin_digits_as_u64(string.slice(2));
  }

  if (string.startsWith("0x")) {
    return parse_hex_digits_as_u64(string.slice(2));
  }

  if (is_float(string)) {
    return parseFloat(string);
  }

  return parse_decimal_integer_as_u64(string);
};

export const parse_bin_digits_as_u64 = (string: string): bigint => {
  if (string.length > 64) {
    throw new RangeError("Number is too big.");
  }

  let result = 0n;

  for (let i = 0; i < string.length; i++) {
    const char = string[i]!;

    if (char === "1") {
      result |= 1n << BigInt(string.length - 1 - i);
    }
  }

  return result;
};

export const parse_hex_digits_as_u64 = (string: string): bigint => {
  if (string.length > 16) {
    throw new RangeError("Number is too big.");
  }

  let result = 0n;

  for (let i = 0; i < string.length; i++) {
    const char = string[i]!;
    const part = parseInt(char, 16);
    result = (result << 4n) | BigInt(part);
  }

  return result;
};

const parse_decimal_digits = (string: string): bigint => {
  let result = 0n;

  for (let i = 0; i < string.length; i++) {
    const char = string[i]!;
    const part = parseInt(char, 10);
    result = result * 10n + BigInt(part);
  }

  return result;
};

const u64_max: 18446744073709551615n = 0xffffffffffffffffn;

export const parse_decimal_integer_as_u64 = (string: string): bigint => {
  let result: bigint;

  const e_index = string.indexOf("e");
  if (e_index === -1) {
    result = parse_decimal_digits(string);
  } else {
    const m = parse_decimal_digits(string.slice(0, e_index));
    const e = parse_decimal_digits(string.slice(e_index + 1));
    result = m * 10n ** BigInt(e);
  }

  if (result > u64_max) {
    throw new RangeError("Number is too big.");
  }

  return result;
};
