import type { Air } from "../../air";
import { Opcode } from "./opcode";
import type { Writer } from "./writer";

export const write_air = (writer: Writer, air: Air) => {
  switch (air.type) {
    case "fn": {
      throw new Error("");
    }
    case "lit.num.int": {
      writer.u8(Opcode.i32_const);
      writer.u32leb128(air.value);
      break;
    }
  }
};
