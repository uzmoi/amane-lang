import type { Air, AirStatement, Id } from "../../air";
import { Opcode } from "./opcode";
import type { Writer } from "./writer";

export interface FuncContext {
  get_index(id: Id): number;
}

export const write_air_statements = (
  writer: Writer,
  statements: readonly AirStatement[],
  ctx: FuncContext,
) => {
  for (const statement of statements) {
    switch (statement.type) {
      case "def": {
        write_air(writer, statement.init, ctx);
        writer.u8(Opcode.local_set);
        writer.u32leb128(ctx.get_index(statement.id));
        break;
      }
      case "assign": {
        write_air(writer, statement.val, ctx);
        writer.u8(Opcode.local_set);
        writer.u32leb128(ctx.get_index(statement.id));
        break;
      }
      default: {
        write_air(writer, statement, ctx);
        writer.u8(Opcode.drop);
        break;
      }
    }
  }
};

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
      write_air_statements(writer, air.body, ctx);

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
