import type { Air, Id } from "#air";
import { write_air } from "./air";
import { Opcode } from "./opcode";
import type { u8 } from "./types";
import { leb128size, run_length_encoding } from "./utils";
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

// https://www.w3.org/TR/wasm-core-2/#types⑦
export const enum NumType {
  i32 = 0x7f,
  i64 = 0x7e,
  f32 = 0x7d,
  f64 = 0x7c,
}

export const enum VecType {
  v128 = 0x7b,
}

export const enum RefType {
  func_ref = 0x70,
  extern_ref = 0x6f,
}

export type ValType = NumType | VecType | RefType;

export interface FuncType {
  kind: "func";
  params: readonly ValType[];
  return: readonly ValType[];
}

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
  local_refs: Map<Id, number>;
  locals: readonly ValType[];
  body: Air | null;
}

export interface Table {
  ref_type: RefType;
  limits: Limits;
}

export interface Global {
  type: ValType;
  mut: boolean;
  expr: Air;
}

export interface Export {
  name: string;
  desc: ImportExportDesc;
  idx: number;
}

export interface Start {
  idx: number;
}

export interface Limits {
  flags: 0x00 | 0x01;
  initial: number;
  max: number | undefined;
}

const write_limits = (writer: Writer, limits: Limits) => {
  writer.u8(limits.flags);
  writer.u32leb128(limits.initial);
  if (limits.max != null) {
    writer.u32leb128(limits.max);
  }
};

export interface Module {
  types: readonly FuncType[];
  imports: readonly Import[];
  funcs: readonly Func[];
  tables: readonly Table[];
  memories: readonly Limits[];
  globals: readonly Global[];
  exports: readonly Export[];
  start: Start | null;
}

export const write_module = (writer: Writer, module: Module) => {
  writer.u32be(0x0061736d); // magic (\0asm)
  writer.u32be(0x01000000); // version

  const { types, imports, funcs, tables, memories, globals, exports, start } =
    module;

  if (types.length > 0) {
    writer.u8(SectionId.type);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(types.length);
    for (const type of types) {
      writer.u32leb128(0x60); // func type
      writer.vec_u8(type.params);
      writer.vec_u8(type.return);
    }
    writer.fixup_size(ptr);
  }

  if (imports.length > 0) {
    writer.u8(SectionId.import);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(imports.length);
    // biome-ignore lint/style/useNamingConvention: 予約語
    for (const import_ of imports) {
      writer.str(import_.mod);
      writer.str(import_.name);
      writer.u8(import_.desc);
      writer.u32leb128(import_.type);
    }
    writer.fixup_size(ptr);
  }

  if (funcs.length > 0) {
    writer.u8(SectionId.func);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(funcs.length);
    for (const func of funcs) {
      writer.u32leb128(func.signature); // function signature index
    }
    writer.fixup_size(ptr);
  }

  if (tables.length > 0) {
    writer.u8(SectionId.table);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(tables.length);
    for (const table of tables) {
      writer.u8(table.ref_type);
      write_limits(writer, table.limits);
    }
    writer.fixup_size(ptr);
  }

  if (memories.length > 0) {
    writer.u8(SectionId.memory);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(memories.length);
    for (const memory of memories) {
      write_limits(writer, memory);
    }
    writer.fixup_size(ptr);
  }

  if (globals.length > 0) {
    writer.u8(SectionId.global);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(globals.length);
    for (const global of globals) {
      writer.u8(global.type);
      writer.u8(global.mut ? 1 : 0);
      write_air(writer, global.expr, {
        get_index() {
          throw new Error();
        },
      });
      writer.u8(Opcode.end);
    }
    writer.fixup_size(ptr);
  }

  if (exports.length > 0) {
    writer.u8(SectionId.export);
    const ptr = writer.consume(1); // section size
    writer.u32leb128(exports.length);
    // biome-ignore lint/style/useNamingConvention: 予約語
    for (const export_ of exports) {
      writer.str(export_.name);
      writer.u8(export_.desc);
      writer.u32leb128(export_.idx);
    }
    writer.fixup_size(ptr);
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
    for (const func of funcs) {
      const ptr = writer.consume(1); // body size

      const locals = run_length_encoding(func.locals);
      writer.u32leb128(locals.length);
      for (const [count, type] of locals) {
        writer.u32leb128(count);
        writer.u8(type);
      }

      if (func.body != null) {
        write_air(writer, func.body, {
          get_index(id) {
            return func.local_refs.get(id)!;
          },
        });
      }
      writer.u8(Opcode.end);
      writer.fixup_size(ptr);
    }
    writer.fixup_size(ptr);
  }
};
