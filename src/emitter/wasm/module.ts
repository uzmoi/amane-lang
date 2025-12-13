import { Opcode } from "./opcode";
import type { Writer } from "./writer";

// https://www.w3.org/TR/wasm-core-2/#sections①
const enum SectionId {
  custom = 0,
  type = 1,
  import = 2,
  func = 3,
  table = 4,
  memory = 5,
  global = 6,
  export = 7,
  start = 8,
  element = 9,
  code = 10,
  data = 11,
  data_count = 12,
}

export interface Func {
  // params: Ty[];
  // return: Ty;
  body: null;
}

export interface Module {
  funcs: Func[];
}

export const write_module = (writer: Writer, module: Module) => {
  // magic number and version
  for (const h of [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00] as const) {
    writer.u8(h);
  }

  writer.u8(SectionId.type);
  writer.u32leb128(4); // section size
  writer.u32leb128(1); // types count
  writer.u32leb128(0x60); // func type
  writer.u32leb128(0); // params count
  writer.u32leb128(0); // results count

  if (module.funcs.length > 0) {
    writer.u8(SectionId.func);
    writer.u32leb128(1 + module.funcs.length); // section size
    writer.u32leb128(module.funcs.length); // functions count
    for (const _ of module.funcs) {
      writer.u32leb128(0); // function signature index
    }
  }

  if (module.funcs.length > 0) {
    writer.u8(SectionId.code);
    writer.u32leb128(1 + module.funcs.length * 3); // section size
    writer.u32leb128(module.funcs.length); // functions count
    for (const _ of module.funcs) {
      writer.u32leb128(2); // body size
      writer.u32leb128(0); // local decl count
      writer.u8(Opcode.end);
    }
  }
};
