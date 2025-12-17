import { Opcode } from "./opcode";
import type { u8 } from "./types";
import { leb128size } from "./utils";
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

export type Type = { kind: "func"; params: []; return: [] };

export const enum ImportExportDesc {
  func = 0x00,
  table = 0x01,
  mem = 0x02,
  global = 0x03,
}

export interface Import {
  mod: string;
  name: string;
  desc: ImportExportDesc;
  type: number;
}

export interface Func {
  signature: number;
  body: null;
}

export interface Export {
  name: string;
  desc: ImportExportDesc;
  idx: number;
}

export interface Start {
  idx: number;
}

export interface Module {
  types: readonly Type[];
  imports: readonly Import[];
  funcs: readonly Func[];
  exports: readonly Export[];
  start: Start | null;
}

export const write_module = (writer: Writer, module: Module) => {
  // magic number and version
  for (const h of [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00] as const) {
    writer.u8(h);
  }

  const { types, imports, funcs, exports, start } = module;

  if (types.length > 0) {
    writer.u8(SectionId.type);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(types.length);
    for (const type of types) {
      writer.u32leb128(0x60); // func type
      writer.u32leb128(type.params.length);
      for (const _ of type.params) {
        // writer.u32leb128(NumberType.i32);
      }
      writer.u32leb128(type.return.length);
      for (const _ of type.return) {
        // writer.u32leb128(NumberType.i32);
      }
    }
    writer.fixupSize(ptr);
  }

  if (imports.length > 0) {
    writer.u8(SectionId.import);
    const ptr = writer.consume(1); // section size
    for (const import_ of imports) {
      writer.str(import_.mod);
      writer.str(import_.name);
      writer.u8(import_.desc);
      writer.u32leb128(import_.type);
    }
    writer.fixupSize(ptr);
  }

  if (funcs.length > 0) {
    writer.u8(SectionId.func);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(funcs.length);
    for (const func of funcs) {
      writer.u32leb128(func.signature); // function signature index
    }
    writer.fixupSize(ptr);
  }

  if (exports.length > 0) {
    writer.u8(SectionId.export);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(exports.length);
    for (const export_ of exports) {
      writer.str(export_.name);
      writer.u8(export_.desc);
      writer.u32leb128(export_.idx);
    }
    writer.fixupSize(ptr);
  }

  if (start != null) {
    writer.u8(SectionId.start);
    writer.u8(leb128size(start.idx) as u8); // section size
    writer.u32leb128(start.idx);
  }

  if (funcs.length > 0) {
    writer.u8(SectionId.code);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(funcs.length);
    for (const _ of funcs) {
      const ptr = writer.consume(1); // body size
      writer.u32leb128(0); // local decl count
      writer.u8(Opcode.end);
      writer.fixupSize(ptr);
    }
    writer.fixupSize(ptr);
  }
};
