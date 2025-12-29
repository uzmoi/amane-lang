import { describe, expect, test } from "vitest";
import { ImportExportDesc, type Module, write_module } from "./module";
import { Writer } from "./writer";

describe("write_module", () => {
  test.each(
    Object.entries<string, Module>({
      empty: { types: [], imports: [], funcs: [], exports: [], start: null },
      export_func: {
        types: [{ kind: "func", params: [], return: [] }],
        imports: [],
        funcs: [{ signature: 0, decl_count: 0, body: null }],
        exports: [{ name: "noop", desc: ImportExportDesc.func, idx: 0 }],
        start: null,
      },
      start: {
        types: [{ kind: "func", params: [], return: [] }],
        imports: [],
        funcs: [{ signature: 0, decl_count: 0, body: null }],
        exports: [],
        start: { idx: 0 },
      },
    }),
  )("%s module snapshot", (_, module) => {
    const writer = new Writer();
    write_module(writer, module);

    expect(writer.emit_binary()).toMatchSnapshot();
  });

  test("exports", async () => {
    const writer = new Writer();
    write_module(writer, {
      types: [{ kind: "func", params: [], return: [] }],
      imports: [],
      funcs: [{ signature: 0, decl_count: 0, body: null }],
      exports: [{ name: "hoge", desc: ImportExportDesc.func, idx: 0 }],
      start: null,
    });

    const { instance } = await WebAssembly.instantiate(writer.emit_binary());
    expect(instance.exports).toEqual({ hoge: expect.any(Function) });
  });
});
