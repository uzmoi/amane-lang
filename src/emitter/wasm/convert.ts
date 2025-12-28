import type { AirModule } from "../../air";
import { type Func, type FuncType, type Module, NumType } from "./module";

export const convert = (air_module: AirModule): Module => {
  const types: FuncType[] = [];
  const funcs: Func[] = [];

  if (air_module.items.length > 0) {
    const signature = types.length;
    types.push({ kind: "func", params: [], return: [NumType.i32] });

    for (const item of air_module.items) {
      if (item.type !== "fn") {
        throw new Error("");
      }

      funcs.push({
        signature,
        decl_count: 0,
        body: item.body,
      });
    }
  }

  return {
    types,
    imports: [],
    funcs,
    exports: [],
    start: null,
  };
};
