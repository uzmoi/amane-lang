import type { Id } from "../air";
import { zip } from "./utils";

// any is top type
// never is bottom type

export type Ty =
  | { type: "any" }
  | { type: "never" }
  | { type: "void" }
  | { type: "bool" | "i32" | "i64" | "f32" | "f64" }
  | { type: "fn"; params: readonly Ty[]; ret: Ty }
  | { type: "ref"; id: Id };

export const equals_ty = (a: Ty, b: Ty): boolean => {
  if (a.type === "fn" && b.type === "fn") {
    return (
      a.params.length === b.params.length &&
      zip(a.params, b.params).every(([a, b]) => equals_ty(a, b)) &&
      equals_ty(a.ret, b.ret)
    );
  }

  if (a.type === "ref" && b.type === "ref") {
    return a.id === b.id;
  }

  return a.type === b.type;
};

export const ref_ty = (id: Id): Ty => ({ type: "ref", id });
