import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Air, Id } from "#air";
import { Opcode } from "./opcode";
import { empty_type, ty } from "./type";
import type { Writer } from "./writer";

export interface FuncContext {
  get_index(id: Id): number;
}

export const write_air_statements = (
  writer: Writer,
  statements: readonly Air[],
  ctx: FuncContext,
) => {
  for (const statement of statements) {
    write_air(writer, statement, ctx);
    if (statement.ty?.type !== "void") {
      writer.u8(Opcode.drop);
    }
  }
};

export const write_air = (writer: Writer, air: Air, ctx: FuncContext) => {
  switch (air.type) {
    case "def": {
      write_air(writer, air.init, ctx);
      writer.u8(Opcode.local_set);
      writer.u32leb128(ctx.get_index(air.id));
      break;
    }
    case "assign": {
      write_air(writer, air.val, ctx);
      writer.u8(Opcode.local_set);
      writer.u32leb128(ctx.get_index(air.id));
      break;
    }
    case "ref": {
      writer.u8(Opcode.local_get);
      writer.u32leb128(ctx.get_index(air.id));
      break;
    }
    case "fn": {
      throw todo();
    }
    case "return": {
      if (air.value != null) {
        write_air(writer, air.value, ctx);
      }
      writer.u8(Opcode.return);
      break;
    }
    case "call": {
      throw todo();
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
      // TODO: BlockIdを使う
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
    case "const.bool": {
      writer.u8(Opcode.i32_const);
      writer.u8(air.value ? 1 : 0);
      break;
    }
    case "const.int": {
      writer.u8(
        // biome-ignore format: match式
        air.ty?.type === "i32" ? Opcode.i32_const :
        air.ty?.type === "i64" ? Opcode.i64_const :
        unreachable(),
      );
      // FIXME: 64bit対応
      writer.u32leb128(Number(air.value));
      break;
    }
    case "const.float": {
      writer.u8(
        // biome-ignore format: match式
        air.ty?.type === "f32" ? Opcode.f32_const :
        air.ty?.type === "f64" ? Opcode.f64_const :
        unreachable(),
      );
      return todo();
    }
    case "const.string": {
      return todo();
    }
    default: {
      unreachable<typeof air>();
    }
  }
};
