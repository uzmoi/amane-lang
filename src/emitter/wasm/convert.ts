import { unreachable } from "@uzmoi/ut/ils";
import type { AirModule } from "#air";
import { type W, walk_air } from "../../air/walk";
import type { Export, Func, Global, Import, Module } from "./module";
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
  const globals: Global[] = [];

  for (const item of air_module.items) {
    switch (item.type) {
      case "def": {
        globals.push({
          id: item.id,
          type: ty(item.init.ty)!,
          mut: true,
          expr: item.init,
        });
        break;
      }
      case "fn": {
        const type = func_type(
          item.params.map((param) => param.ty),
          item.ret_ty,
        );
        const signature = get_type_index(types, type);

        const local_refs = new Map(
          item.params.map((param, index) => [param.id, index]),
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

        collect_local_refs.air(item.body, collect_local_refs);

        funcs.push({
          id: item.id,
          signature,
          local_refs,
          locals,
          body: item.body,
        });
        break;
      }
      default: {
        unreachable<typeof item>();
      }
    }
  }

  return {
    types,
    imports,
    funcs,
    tables: [],
    memories: [],
    globals,
    exports,
    start: null,
  };
};
