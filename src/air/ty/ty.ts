// any is top type
// never is bottom type

export type Ty =
  | { type: "any" }
  | { type: "never" }
  | { type: "void" }
  | { type: "i32" | "i64" | "f32" | "f64" };
