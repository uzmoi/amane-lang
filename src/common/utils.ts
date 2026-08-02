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
