import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Ty } from "#air";
import { equals_arrays } from "#common/utils.js";

export const empty_type = 0x40;

// https://www.w3.org/TR/wasm-core-2/#types⑦
export const enum NumType {
  i32 = 0x7f,
  i64 = 0x7e,
  f32 = 0x7d,
  f64 = 0x7c,
}

export const enum VecType {
  v128 = 0x7b,
}

export const enum RefType {
  func_ref = 0x70,
  extern_ref = 0x6f,
}

export type ValType = NumType | VecType | RefType;

export const ty = (ty: Ty | undefined): NumType | null => {
  if (ty == null) {
    throw new Error("型推論して♡");
  }

  switch (ty.type) {
    case "any":
    case "never":
    case "ref":
    case "fn":
      return todo("");
    case "void":
      return null;
    case "bool":
    case "i32":
      return NumType.i32;
    case "i64":
      return NumType.i64;
    case "f32":
      return NumType.f32;
    case "f64":
      return NumType.f64;
    default:
      unreachable<typeof ty>(
        `Unknown type '${(ty as { type: string }).type}'.`,
      );
  }
};

export interface FuncType {
  kind: "func";
  params: readonly ValType[];
  return: readonly ValType[];
}

export const func_type = (params: readonly Ty[], ret_ty: Ty): FuncType => {
  const param_types = params.map((param) => {
    const type = ty(param);
    if (type == null) {
      throw new Error("Unexpected void type at param");
    }
    return type;
  });

  const return_type = ty(ret_ty);

  return {
    kind: "func",
    params: param_types,
    return: return_type ? [return_type] : [],
  };
};

export type CompositeType = FuncType;

export const get_type_index = (
  types: CompositeType[],
  type: CompositeType,
): number => {
  let index = types.findIndex(
    (t) =>
      t.kind === type.kind &&
      equals_arrays(t.params, type.params) &&
      equals_arrays(t.return, type.return),
  );

  if (index === -1) {
    index = types.length;
    types.push(type);
  }

  return index;
};
