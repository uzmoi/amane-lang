import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Air, BlockId, Id } from "#air";
import { Opcode } from "./opcode";
import { empty_type, ty } from "./type";
import { s32, s64 } from "./utils";
import type { Writer } from "./writer";

export interface FuncContext {
  push_block(id: BlockId): void;
  pop_block(): void;
  get_label_for(id: BlockId): number;
  get_variable_entry(id: Id): { type: "global" | "local"; index: number };
  get_func_index(id: Id): number;
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
      const entry = ctx.get_variable_entry(air.id);
      if (entry.type === "global") {
        unreachable("Cannot define a global variable within a function.");
      }

      write_air(writer, air.init, ctx);
      writer.u8(Opcode.local_set);
      writer.u32leb128(entry.index);
      break;
    }
    case "assign": {
      write_air(writer, air.value, ctx);

      const entry = ctx.get_variable_entry(air.id);
      writer.u8(entry.type === "local" ? Opcode.local_set : Opcode.global_set);
      writer.u32leb128(entry.index);
      break;
    }
    case "ref": {
      const entry = ctx.get_variable_entry(air.id);
      writer.u8(entry.type === "local" ? Opcode.local_get : Opcode.global_get);
      writer.u32leb128(entry.index);
      break;
    }
    case "return": {
      if (air.value != null) {
        write_air(writer, air.value, ctx);
      }
      writer.u8(Opcode.return);
      break;
    }
    case "call": {
      if (air.callee.type === "ref") {
        const index = ctx.get_func_index(air.callee.id);
        if (index != null) {
          for (const arg of air.args) {
            write_air(writer, arg, ctx);
          }

          writer.u8(Opcode.call);
          writer.u32leb128(index);
          break;
        }
      }

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
      const block_type = ty(air.ty) ?? empty_type;

      writer.u8(Opcode.block);
      writer.u8(block_type);
      writer.u8(Opcode.loop);
      writer.u8(block_type);

      ctx.push_block(air.id);
      write_air(writer, air.body, ctx);
      ctx.pop_block();

      writer.u8(Opcode.end);
      writer.u8(Opcode.end);
      break;
    }
    case "continue": {
      writer.u8(Opcode.br);
      const label = ctx.get_label_for(air.id);
      writer.u32leb128(label);
      break;
    }
    case "break": {
      writer.u8(Opcode.br);
      const label = ctx.get_label_for(air.id);
      writer.u32leb128(label + 1);
      break;
    }
    case "if": {
      write_air(writer, air.cond, ctx);
      writer.u8(Opcode.if);
      writer.u8(ty(air.ty) ?? empty_type); // block type
      write_air(writer, air.then_body, ctx);
      writer.u8(Opcode.else);
      write_air(writer, air.else_body, ctx);
      writer.u8(Opcode.end);
      break;
    }
    case "const.bool": {
      writer.u8(Opcode.i32_const);
      writer.u8(air.value ? 1 : 0);
      break;
    }
    case "const.int": {
      switch (air.ty.type) {
        case "i32": {
          writer.u8(Opcode.i32_const);
          writer.sleb128(s32(air.value));
          break;
        }
        case "i64": {
          writer.u8(Opcode.i64_const);
          writer.sleb128(s64(air.value));
          break;
        }
        default: {
          unreachable(
            `const.int must be typed as i32 or i64, but it was typed as ${air.ty.type}`,
          );
        }
      }
      break;
    }
    case "const.float": {
      switch (air.ty.type) {
        case "f32": {
          writer.u8(Opcode.f32_const);
          writer.f32(air.value);
          break;
        }
        case "f64": {
          writer.u8(Opcode.f64_const);
          writer.f64(air.value);
          break;
        }
        default: {
          unreachable(
            `const.float must be typed as f32 or f64, but it was typed as ${air.ty.type}`,
          );
        }
      }
      break;
    }
    case "const.string": {
      return todo();
    }
    default: {
      unreachable<typeof air>();
    }
  }
};
