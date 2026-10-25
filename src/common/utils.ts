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

export const equals_arrays = <T>(
  a: readonly T[],
  b: readonly T[],
  equals: (a: T, b: T) => boolean = (a, b) => a === b,
) => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!equals(a[i]!, b[i]!)) return false;
  }

  return true;
};
