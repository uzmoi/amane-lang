import type { AirModule } from "../../air";
import type { Module } from "./module";

export const convert = (_air_module: AirModule): Module => {
  return {
    types: [],
    imports: [],
    funcs: [],
    exports: [],
    start: null,
  };
};
