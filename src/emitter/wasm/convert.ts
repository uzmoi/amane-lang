import type { Air, AirModule, Id } from "../../air";
import {
  type Func,
  type FuncType,
  type Module,
  NumType,
  type ValType,
} from "./module";

export const convert = (air_module: AirModule): Module => {
  const types: FuncType[] = [];
  const funcs: Func[] = [];

  for (const item of air_module.items) {
    if (item.type !== "fn") {
      throw new Error("");
    }

    let signature = types.findIndex(
      (type) => type.params.length === item.params.length,
    );

    if (signature === -1) {
      signature = types.length;
      types.push({
        kind: "func",
        params: item.params.map(() => NumType.i32),
        return: [NumType.i32],
      });
    }

    const local_refs = new Map(
      item.params.map((param, index) => [param, index]),
    );

    const locals: ValType[] = [];

    collect_locals_in_func(item.body, local_refs, locals);

    funcs.push({
      signature,
      local_refs,
      locals,
      body: item.body,
    });
  }

  return {
    types,
    imports: [],
    funcs,
    tables: [],
    memories: [],
    globals: [],
    exports: [],
    start: null,
  };
};

const collect_locals_in_func = (
  air: Air,
  local_refs: Map<Id, number>,
  locals: ValType[],
) => {
  switch (air.type) {
    case "block": {
      for (const stmt of air.body) {
        switch (stmt.type) {
          case "def": {
            collect_locals_in_func(stmt.init, local_refs, locals);
            local_refs.set(stmt.id, local_refs.size);
            locals.push(NumType.i32);
            break;
          }
          case "assign": {
            collect_locals_in_func(stmt.val, local_refs, locals);
            break;
          }
          default: {
            collect_locals_in_func(stmt, local_refs, locals);
          }
        }
      }
      if (air.last != null) {
        collect_locals_in_func(air.last, local_refs, locals);
      }
    }
  }
};
