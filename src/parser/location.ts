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

export const loc = (start: Loc, end: Loc): SourceLocation => ({
  start: start.loc.start,
  end: end.loc.end,
});
