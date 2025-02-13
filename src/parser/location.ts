// export interface SourcePosition {
//   index: number;
//   line: number;
//   column: number;
// }

export interface SourceLocation {
  start: number;
  end: number;
}

export interface Loc {
  loc: SourceLocation;
}

export const loc = (
  start: SourceLocation,
  end: SourceLocation,
): SourceLocation => ({
  start: start.start,
  end: end.end,
});
