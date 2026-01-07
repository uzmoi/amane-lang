import { describe, expect, test } from "vitest";
import {
  ImportExportDesc,
  type Module,
  NumType,
  RefType,
  write_module,
} from "./module";
import { Writer } from "./writer";

describe("write_module", () => {
  test.each(
    Object.entries<string, Partial<Module>>({
      empty: {},
      import: {
        types: [{ kind: "func", params: [], return: [] }],
        imports: [
          { mod: "hoge", name: "fuga", desc: ImportExportDesc.func, type: 0 },
        ],
      },
      export_func: {
        types: [{ kind: "func", params: [], return: [] }],
        funcs: [
          { signature: 0, local_refs: new Map(), locals: [], body: null },
        ],
        exports: [{ name: "noop", desc: ImportExportDesc.func, idx: 0 }],
      },
      table: {
        tables: [
          {
            ref_type: RefType.func_ref,
            limits: { flags: 0x00, initial: 1, max: undefined },
          },
        ],
      },
      memory32: {
        memories: [{ flags: 0x00, initial: 1, max: undefined }],
      },
      memory32_with_max: {
        memories: [{ flags: 0x01, initial: 1, max: 1 }],
      },
      global: {
        globals: [
          {
            type: NumType.i32,
            mut: false,
            expr: { type: "lit.num.int", value: 0 },
          },
          {
            type: NumType.i32,
            mut: true,
            expr: { type: "lit.num.int", value: 0 },
          },
        ],
      },
      start: {
        types: [{ kind: "func", params: [], return: [] }],
        funcs: [
          { signature: 0, local_refs: new Map(), locals: [], body: null },
        ],
        start: { idx: 0 },
      },
    }),
  )("%s module snapshot", (_, module) => {
    const writer = new Writer();
    write_module(writer, {
      types: [],
      imports: [],
      funcs: [],
      tables: [],
      memories: [],
      globals: [],
      exports: [],
      start: null,
      ...module,
    });

    expect(writer.emit_binary()).toMatchSnapshot();
  });

  test("exports", async ({ expect }) => {
    const writer = new Writer();
    write_module(writer, {
      types: [{ kind: "func", params: [], return: [] }],
      imports: [],
      funcs: [{ signature: 0, local_refs: new Map(), locals: [], body: null }],
      tables: [],
      memories: [],
      globals: [],
      exports: [{ name: "hoge", desc: ImportExportDesc.func, idx: 0 }],
      start: null,
    });

    const { instance } = await WebAssembly.instantiate(writer.emit_binary());
    expect(instance.exports).toEqual({ hoge: expect.any(Function) });
  });
});
