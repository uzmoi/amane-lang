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

export const zip = <A, B = A, C = [A, B]>(
  a: readonly A[],
  b: readonly B[],
  by: (a: A, b: B) => C = (a, b) => [a, b] as C,
): C[] => {
  const result: C[] = [];
  const len = Math.min(a.length, b.length);

  for (let i = 0; i < len; i++) {
    result[i] = by(a[i]!, b[i]!);
  }

  return result;
};
