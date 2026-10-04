import type { Brand } from "@uzmoi/ut/types";
import type { Ty } from "./ty";

export type Id = number & Brand<"RefId">;

export type BlockId = number & Brand<"BlockId">;

export interface AirModule {
  imports: AirImport[];
  items: readonly AirModuleItem[];
}

export interface AirImport {
  module: string;
  imports: { name: string; id: Id }[];
}

export type AirModuleItem = AirFn;

export interface AirFn {
  type: "fn";
  params: readonly { id: Id; ty: Ty }[];
  body: Air;
}

/**
 * Amane Intermediate Representation
 */
export type Air = { ty?: Ty | undefined } & (
  | AirDef
  | AirAssign
  | AirRef
  | AirReturn
  | AirCall
  | AirBlock
  | AirLoop
  | AirBreak
  | AirIf
  | AirConst
);

export interface AirDef {
  type: "def";
  id: Id;
  init: Air;
}

export interface AirAssign {
  type: "assign";
  id: Id;
  val: Air;
}

export interface AirRef {
  type: "ref";
  id: Id;
}

export interface AirReturn {
  type: "return";
  value: Air | null;
}

export interface AirCall {
  type: "call";
  callee: Air;
  args: readonly Air[];
}

export interface AirBlock {
  type: "block";
  body: readonly Air[];
  last: Air | null;
}

export interface AirLoop {
  type: "loop";
  id: BlockId;
  body: Air;
}

export interface AirBreak {
  type: "break";
  id: BlockId;
}

export interface AirIf {
  type: "if";
  cond: Air;
  then: Air;
  else: Air;
}

export type AirConst =
  | { type: "const.bool"; value: boolean }
  | { type: "const.int"; value: bigint }
  | { type: "const.float"; value: number }
  | { type: "const.string"; value: string };
