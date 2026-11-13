import { todo } from "@uzmoi/ut/ils";
import type { ast, Loc } from "#parser";
import type { Ty } from "../ty";
import type { LowerContext } from "./context";

const builtin_tys = [
  "bool",
  "i32",
  "i64",
  "f32",
  "f64",
  "never",
  "void",
] as const satisfies Ty["type"][];

type BuiltinTyName = (typeof builtin_tys)[number];

export const ty_from = (t: ast.Ty<Loc>, _ctx: LowerContext): Ty => {
  if (builtin_tys.includes(t.name as BuiltinTyName)) {
    return { type: t.name as BuiltinTyName };
  }

  todo();
};
