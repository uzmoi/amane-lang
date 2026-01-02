import type { Air, Id } from "../../air";
import { Opcode } from "./opcode";
import type { Writer } from "./writer";

export interface FuncContext {
  get_index(id: Id): number;
}

export const write_air = (writer: Writer, air: Air, ctx: FuncContext) => {
  switch (air.type) {
    case "ref": {
      writer.u8(Opcode.local_get);
      writer.u32leb128(ctx.get_index(air.id));
      break;
    }
    case "fn": {
      throw new Error("");
    }
    case "block": {
      for (const body of air.body) {
        write_air(writer, body, ctx);
        writer.u8(Opcode.drop);
      }

      if (air.last == null) {
        // TODO: 型を増やすときにUnit的な型にする。
        writer.u8(Opcode.i32_const);
        writer.u32leb128(0);
      } else {
        write_air(writer, air.last, ctx);
      }
      break;
    }
    case "lit.num.int": {
      writer.u8(Opcode.i32_const);
      writer.u32leb128(air.value);
      break;
    }
  }
};
