import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Ty } from "#air";
import { NumType } from "./module";

export const empty_type = 0x40;

export const ty = (ty: Ty | undefined): NumType | null => {
  if (ty == null) {
    throw new Error("型推論して♡");
  }

  switch (ty) {
    case "any":
    case "never":
      return todo("");
    case "void":
      return null;
    case "i32":
      return NumType.i32;
    case "i64":
      return NumType.i64;
    case "f32":
      return NumType.f32;
    case "f64":
      return NumType.f64;
    default:
      unreachable<typeof ty>(`Unknown type '${ty}'.`);
  }
};
