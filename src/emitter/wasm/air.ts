import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Air, AirStatement, Id } from "#air";
import { Opcode } from "./opcode";
import { empty_type, ty } from "./type";
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
      throw todo();
    }
    case "return": {
      write_air(writer, air.value, ctx);
      writer.u8(Opcode.return);
      break;
    }
    case "block": {
      write_air_statements(writer, air.body, ctx);

      if (air.last != null) {
        write_air(writer, air.last, ctx);
      }
      break;
    }
    case "loop": {
      writer.u8(Opcode.loop);
      writer.u8(ty(air.ty) ?? empty_type); // block type
      write_air(writer, air.body, ctx);
      writer.u8(Opcode.end);
      break;
    }
    case "break": {
      writer.u8(Opcode.br);
      writer.u32leb128(0);
      break;
    }
    case "if": {
      write_air(writer, air.cond, ctx);
      writer.u8(Opcode.if);
      writer.u8(ty(air.ty) ?? empty_type); // block type
      write_air(writer, air.then, ctx);
      writer.u8(Opcode.else);
      write_air(writer, air.else, ctx);
      writer.u8(Opcode.end);
      break;
    }
    case "lit.num.int": {
      writer.u8(
        // biome-ignore format: match式
        air.ty === "i32" ? Opcode.i32_const :
        air.ty === "i64" ? Opcode.i64_const :
        unreachable(),
      );
      writer.u32leb128(air.value);
      break;
    }
  }
};
