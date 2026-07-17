import type { Air, AirModule } from "#air";
import { type W, walk_air } from "../../air/walk";
import type { Export, Func, FuncType, Import, Module, ValType } from "./module";
import { ty } from "./type";
import { zip } from "./utils";

export const convert = (air_module: AirModule): Module => {
  const imports: Import[] = [];
  const exports: Export[] = [];
  const types: FuncType[] = [];
  const funcs: Func[] = [];

  const fns: Extract<Air, { type: "fn" }>[] = [];

  const walk_toplevel_air = (air: Air, v: W<null>): void => {
    if (air.type === "fn") {
      fns.push(air);
    } else {
      walk_air(air, v);
    }
  };

  for (const item of air_module.items) {
    if (item.type === "fn") {
      fns.push(item);
    } else {
      walk_air(item, {
        air: walk_toplevel_air,
        context: null,
      });
    }
  }

  while (fns.length) {
    const fn_air = fns.shift()!;

    const param_types = fn_air.params.map((param) => {
      const type = ty(param.ty);
      if (type == null) {
        throw new Error("paramの型がvoidなのマジイミフじゃねw ウケるw");
      }
      return type;
    });

    const return_type = ty(fn_air.body.ty);

    let signature = types.findIndex(
      (type) =>
        type.params.length === fn_air.params.length &&
        zip(type.params, param_types).every(([a, b]) => a === b) &&
        (return_type == null
          ? type.return.length === 0
          : type.return.length === 1 && type.return[0] === return_type),
    );

    if (signature === -1) {
      signature = types.length;
      types.push({
        kind: "func",
        params: param_types,
        return: return_type ? [return_type] : [],
      });
    }

    const local_refs = new Map(
      fn_air.params.map((param, index) => [param.id, index]),
    );

    const locals: ValType[] = [];

    const walk_fn_air = (air: Air, w: W<null>): void => {
      walk_toplevel_air(air, w);
      if (air.type === "def") {
        local_refs.set(air.id, local_refs.size);
        const type = ty(air.init.ty);
        if (type == null) {
          throw new Error("変数の型がvoidなわけ無いじゃん。ナメてる？");
        }
        locals.push(type);
      }
    };

    walk_fn_air(fn_air, {
      air: walk_fn_air,
      context: null,
    });

    funcs.push({
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
