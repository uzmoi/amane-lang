import { describe, expect, test } from "vitest";
import type { Id } from "../../air";
import { emit_wasm } from "./emit";

describe("emit_wasm", () => {
  test("empty module", async () => {
    const wasm = emit_wasm({ items: [] });
    expect(wasm).toMatchSnapshot();
  });

  test("constant func", async () => {
    const wasm = emit_wasm({
      items: [
        {
          type: "fn",
          params: [],
          body: { type: "lit.num.int", value: 0 },
        },
      ],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("identity func", async () => {
    const id0 = 0 as Id;
    const wasm = emit_wasm({
      items: [
        {
          type: "fn",
          params: [id0],
          body: { type: "ref", id: id0 },
        },
      ],
    });
    expect(wasm).toMatchSnapshot();
  });
});
