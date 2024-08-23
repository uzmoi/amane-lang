import type { IfUnion } from "emnorst";
import { expectTypeOf, test } from "vitest";
import type { Node } from "./node";

test("has type property", () => {
  const type = expectTypeOf<Node>().toHaveProperty("type");
  type.toBeString();
  type.not.toEqualTypeOf<string>();
});

test("type is not duplicated", () => {
  type DuplicatedTypeOf<T, Original = T> = T extends { type: infer Type }
    ? IfUnion<Extract<Original, { type: Type }>, Type, never>
    : never;
  expectTypeOf<DuplicatedTypeOf<Node>>().toBeNever();
});

test("extend", () => {
  expectTypeOf<Node<{ hoge: number }>>().toHaveProperty("hoge").toBeNumber();
});

test("extend with type", () => {
  type Ext = { type: "Ident" | "Bool"; hoge: number };

  expectTypeOf<Node<Ext>>()
    .extract<{ type: "Ident" | "Bool" }>()
    .toHaveProperty("hoge")
    .toBeNumber();

  expectTypeOf<Node<Ext>>().not.toHaveProperty("hoge");
});
