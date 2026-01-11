import { describe, expect, test } from "vitest";
import type { Air, Id } from "../../air";
import { emit_wasm } from "./emit";

describe("emit_wasm", () => {
  test("empty module", () => {
    const wasm = emit_wasm({ items: [] });
    expect(wasm).toMatchSnapshot();
  });

  test("constant func", () => {
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

  test("identity func", () => {
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

  test("return", () => {
    const wasm = emit_wasm({
      items: [
        {
          type: "fn",
          params: [],
          body: { type: "return", value: { type: "lit.num.int", value: 0 } },
        },
      ],
    });
    expect(wasm).toMatchSnapshot();
  });

  describe("block", () => {
    test("empty block", () => {
      const wasm = emit_wasm({
        items: [
          {
            type: "fn",
            params: [],
            body: { type: "block", body: [], last: null },
          },
        ],
      });
      expect(wasm).toMatchSnapshot();
    });

    test("block with last", () => {
      const air: Air = { type: "lit.num.int", value: 0 };
      const wasm = emit_wasm({
        items: [
          {
            type: "fn",
            params: [],
            body: { type: "block", body: [air, air], last: air },
          },
        ],
      });
      expect(wasm).toMatchSnapshot();
    });
  });

  test("if", () => {
    const air: Air = { type: "lit.num.int", value: 0 };
    const wasm = emit_wasm({
      items: [
        {
          type: "fn",
          params: [],
          body: { type: "if", cond: air, then: air, else: air },
        },
      ],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("assign to param", () => {
    const id0 = 0 as Id;
    const wasm = emit_wasm({
      items: [
        {
          type: "fn",
          params: [id0],
          body: {
            type: "block",
            body: [
              {
                type: "assign",
                id: id0,
                val: { type: "lit.num.int", value: 0 },
              },
            ],
            last: { type: "ref", id: id0 },
          },
        },
      ],
    });
    expect(wasm).toMatchSnapshot();
  });

  test("define", () => {
    const id0 = 0 as Id;
    const wasm = emit_wasm({
      items: [
        {
          type: "fn",
          params: [],
          body: {
            type: "block",
            body: [
              {
                type: "def",
                id: id0,
                init: { type: "lit.num.int", value: 0 },
              },
            ],
            last: { type: "ref", id: id0 },
          },
        },
      ],
    });
    expect(wasm).toMatchSnapshot();
  });
});
