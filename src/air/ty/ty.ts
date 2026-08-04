import { equals_arrays } from "#common/utils.js";
import type { Id } from "../air";

// any is top type
// never is bottom type

export type Ty =
  | { type: "any" }
  | { type: "never" }
  | { type: "void" }
  | { type: "bool" | "i32" | "i64" | "f32" | "f64" }
  | { type: "fn"; params: readonly Ty[]; ret: Ty }
  | { type: "ref"; id: Id };

export const ty = {
  any: { type: "any" } as Ty,
  never: { type: "never" } as Ty,
  void: { type: "void" } as Ty,
  bool: { type: "bool" } as Ty,
  i32: { type: "i32" } as Ty,
  i64: { type: "i64" } as Ty,
  f32: { type: "f32" } as Ty,
  f64: { type: "f64" } as Ty,
  fn: (params: readonly Ty[], ret: Ty): Ty => ({
    type: "fn",
    params,
    ret,
  }),
  ref: (id: Id): Ty => ({ type: "ref", id }),
} satisfies Record<Ty["type"], Ty | ((...args: never) => Ty)>;

export const equals_ty = (a: Ty, b: Ty): boolean => {
  if (a.type === "fn" && b.type === "fn") {
    return (
      equals_arrays(a.params, b.params, equals_ty) && equals_ty(a.ret, b.ret)
    );
  }

  if (a.type === "ref" && b.type === "ref") {
    return a.id === b.id;
  }

  return a.type === b.type;
};
