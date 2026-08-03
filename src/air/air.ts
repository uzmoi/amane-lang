import type { Brand } from "@uzmoi/ut/types";
import type { Ty } from "./ty";

export type Id = number & Brand<"RefId">;

export type BlockId = number & Brand<"BlockId">;

export interface AirModule {
  items: readonly Air[];
}

/**
 * Amane Intermediate Representation
 */
export type Air = { ty?: Ty } & (
  | { type: "def"; id: Id; init: Air }
  | { type: "assign"; id: Id; val: Air }
  | { type: "ref"; id: Id }
  | { type: "fn"; params: readonly { id: Id; ty: Ty }[]; body: Air }
  | { type: "return"; value: Air | null }
  | { type: "call"; callee: Air; args: readonly Air[] }
  | { type: "block"; body: readonly Air[]; last: Air | null }
  | { type: "loop"; id: BlockId; body: Air }
  | { type: "break"; id: BlockId }
  | { type: "if"; cond: Air; then: Air; else: Air }
  | { type: "const.bool"; value: boolean }
  | { type: "const.int"; value: bigint }
  | { type: "const.float"; value: number }
  | { type: "const.string"; value: string }
);
