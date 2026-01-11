import type { Brand } from "@uzmoi/ut/types";

export type Id = number & Brand<"Id">;

export interface AirModule {
  items: readonly AirStatement[];
}

export type AirStatement =
  | { type: "def"; id: Id; init: Air }
  | { type: "assign"; id: Id; val: Air }
  | Air;

/**
 * Amane Intermediate Representation
 */
export type Air =
  | { type: "ref"; id: Id }
  | { type: "fn"; params: readonly Id[]; body: Air }
  | { type: "return"; value: Air }
  | { type: "block"; body: readonly AirStatement[]; last: Air | null }
  | { type: "if"; cond: Air; then: Air; else: Air }
  | { type: "lit.num.int"; value: number };
