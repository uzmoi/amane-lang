import type { AirModule } from "../../air";
import { type Func, type FuncType, type Module, NumType } from "./module";

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

    const locals = new Map(item.params.map((param, index) => [param, index]));

    funcs.push({
      signature,
      locals,
      decl_count: 0,
      body: item.body,
    });
  }

  return {
    types,
    imports: [],
    funcs,
    exports: [],
    start: null,
  };
};
