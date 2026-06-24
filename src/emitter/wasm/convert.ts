import type { Air, AirModule, AirStatement } from "#air";
import { type W, walk_air, walk_air_statement } from "../../air/walk";
import {
  type Export,
  type Func,
  type FuncType,
  type Import,
  type Module,
  NumType,
  type ValType,
} from "./module";

export const convert = (air_module: AirModule): Module => {
  const imports: Import[] = [];
  const exports: Export[] = [];
  const types: FuncType[] = [];
  const funcs: Func[] = [];

  const fns: Extract<Air, { type: "fn" }>[] = [];

  const walk_toplevel_air = (air: Air, v: W): void => {
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
      walk_air_statement(item, {
        air: walk_toplevel_air,
        air_statement: walk_air_statement,
      });
    }
  }

  while (fns.length) {
    const fn_air = fns.shift()!;

    let signature = types.findIndex(
      (type) => type.params.length === fn_air.params.length,
    );

    if (signature === -1) {
      signature = types.length;
      types.push({
        kind: "func",
        params: fn_air.params.map(() => NumType.i32),
        return: [NumType.i32],
      });
    }

    const local_refs = new Map(
      fn_air.params.map((param, index) => [param, index]),
    );

    const locals: ValType[] = [];

    const walk_fn_air_statement = (air: AirStatement, w: W): void => {
      walk_air_statement(air, w);
      if (air.type === "def") {
        local_refs.set(air.id, local_refs.size);
        locals.push(NumType.i32);
      }
    };

    walk_fn_air_statement(fn_air, {
      air: walk_toplevel_air,
      air_statement: walk_fn_air_statement,
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
