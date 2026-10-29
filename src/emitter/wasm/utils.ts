export const leb128size = (n: number) => {
  let size = 0;
  do {
    n >>>= 7;
    size++;
  } while (n !== 0);
  return size;
};

export const run_length_encoding = <T>(
  xs: readonly T[],
): [count: number, value: T][] => {
  const result: [count: number, value: T][] = [];

  let value: T | undefined;
  let count = 0;

  for (const x of xs) {
    if (value === x) {
      count++;
    } else {
      if (value != null) {
        result.push([count, value]);
      }
      value = x;
      count = 1;
    }
  }

  if (value != null) {
    result.push([count, value]);
  }

  return result;
};

export const s32 = (i: bigint): bigint => {
  // 2n ** 31n;
  if (i < 2147483648n) return i;

  // 2n ** 32n;
  return i - 4294967296n;
};

export const s64 = (i: bigint): bigint => {
  // 2n ** 63n;
  if (i < 9223372036854775808n) return i;

  // 2n ** 64n;
  return i - 18446744073709551616n;
};
