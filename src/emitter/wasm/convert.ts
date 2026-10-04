import type { AirModule } from "#air";
import { type W, walk_air } from "../../air/walk";
import type { Export, Func, Import, Module } from "./module";
import {
  type FuncType,
  func_type,
  get_type_index,
  ty,
  type ValType,
} from "./type";

export const convert = (air_module: AirModule): Module => {
  const imports: Import[] = [];
  const exports: Export[] = [];
  const types: FuncType[] = [];
  const funcs: Func[] = [];

  for (const fn_air of air_module.items) {
    const type = func_type(
      fn_air.params.map((param) => param.ty),
      fn_air.body.ty!,
    );
    const signature = get_type_index(types, type);

    const local_refs = new Map(
      fn_air.params.map((param, index) => [param.id, index]),
    );

    const locals: ValType[] = [];

    const collect_local_refs: W<null> = {
      air(air, w) {
        walk_air(air, w);
        if (air.type === "def") {
          local_refs.set(air.id, local_refs.size);
          const type = ty(air.init.ty);
          if (type == null) {
            throw new Error("変数の型がvoidなわけ無いじゃん。ナメてる？");
          }
          locals.push(type);
        }
      },
      context: null,
    };

    collect_local_refs.air(fn_air.body, collect_local_refs);

    funcs.push({
      id: fn_air.id,
      signature,
      local_refs,
      locals,
      body: fn_air.body,
    });
  }

  return {
    types,
    imports,
    funcs,
    tables: [],
    memories: [],
    globals: [],
    exports,
    start: null,
  };
};
