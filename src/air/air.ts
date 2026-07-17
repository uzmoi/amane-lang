import type { Brand } from "@uzmoi/ut/types";
import type { Ty } from "./ty";

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
export type Air = { ty?: Ty } & (
  | { type: "ref"; id: Id }
  | { type: "fn"; params: readonly { id: Id; ty: Ty }[]; body: Air }
  | { type: "return"; value: Air }
  | { type: "call"; callee: Air; args: readonly Air[] }
  | { type: "block"; body: readonly AirStatement[]; last: Air | null }
  | { type: "loop"; body: Air }
  | { type: "break" }
  | { type: "if"; cond: Air; then: Air; else: Air }
  | { type: "const.int"; value: bigint }
);
