import { unreachable } from "@uzmoi/ut/ils";
import type { Air } from "../air";
import type { Ty } from "../ty";

export const print_ty = (ty: Ty): string => {
  switch (ty.type) {
    case "any":
    case "never":
    case "void":
    case "i32":
    case "i64":
    case "f32":
    case "f64":
      return ty.type;
    case "fn":
      return ty.params.length > 0
        ? `fn (${ty.params.map(print_ty).join(", ")}): ${print_ty(ty.ret)}`
        : `fn: ${print_ty(ty.ret)}`;
    case "ref":
      return `%${ty.id}`;
  }
};

export const print_air = (air: Air): string => {
  switch (air.type) {
    case "def": {
      return `let %${air.id} = ${print_air(air.init)}`;
    }
    case "assign": {
      return `%${air.id} = ${print_air(air.val)}`;
    }
    case "fn": {
      return air.params.length > 0
        ? `fn (${air.params.map((param) => `%${param.id}: ${print_ty(param.ty)}`).join(", ")}) ${print_air(air.body)}`
        : `fn ${print_air(air.body)}`;
    }
    case "return": {
      return `return ${print_air(air.value)}`;
    }
    case "ref": {
      return `%${air.id}`;
    }
    case "call": {
      return air.args.length > 0
        ? `call ${print_air(air.callee)}(${air.args.map(print_air).join(", ")})`
        : `call ${print_air(air.callee)}`;
    }
    case "block": {
      const stmts = air.body.map(print_air).map((t) => `${t};`);
      if (air.last != null) stmts.push(print_air(air.last));
      return stmts.length === 0 ? "{}" : `{ ${stmts.join(" ")} }`;
    }
    case "loop": {
      return `loop ${print_air(air.body)}`;
    }
    case "break": {
      return "break";
    }
    case "if": {
      return `if ${print_air(air.cond)} then ${print_air(air.then)} else ${print_air(air.else)}`;
    }
    case "const.bool":
    case "const.int":
    case "const.float": {
      return air.value.toString();
    }
    case "const.string": {
      return `"${air.value}"`;
    }
    default: {
      unreachable<typeof air>();
    }
  }
};
