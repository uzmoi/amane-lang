import { todo, unreachable } from "@uzmoi/ut/ils";
import type { Air, AirModule, AirStatement } from "../air";
import { type W, walk_air, walk_air_statement } from "../walk";
import { InferenceContext } from "./infer_context";
import { ref_ty } from "./ty";

export const infer_air_statements_type = (
  air: AirStatement,
  ctx: InferenceContext,
) => {
  switch (air.type) {
    case "def": {
      ctx.unify(ref_ty(air.id), air.init.ty!);
      break;
    }
    case "assign": {
      ctx.unify(ref_ty(air.id), air.val.ty!);
      break;
    }
    default: {
      infer_air_type(air, ctx);
    }
  }
};

// TODO: neverを含む式/文をneverにする。
export const infer_air_type = (air: Air, ctx: InferenceContext) => {
  switch (air.type) {
    case "ref": {
      air.ty = ref_ty(air.id);
      break;
    }
    case "fn": {
      const params = air.params.map((param) => {
        ctx.unify(ref_ty(param.id), param.ty);
        return param.ty;
      });
      air.ty = { type: "fn", params, ret: air.body.ty! };
      break;
    }
    case "return": {
      // const fn_ty = ctx.get_fn_ty(air.id);
      // ctx.unify(fn_ty.ret, air.value.ty);
      air.ty = { type: "never" };
      throw todo();
      // break;
    }
    case "call": {
      const ret_ty = ref_ty(ctx.new_ty_id());
      air.ty = ret_ty;
      ctx.unify(air.callee.ty!, {
        type: "fn",
        params: air.args.map((arg) => arg.ty!),
        ret: ret_ty,
      });
      break;
    }
    case "block": {
      air.ty = air.last?.ty ?? { type: "void" };
      break;
    }
    case "loop": {
      air.ty = air.body.ty;
      break;
    }
    case "break": {
      air.ty = { type: "never" /* , id: air.id */ };
      break;
    }
    case "if": {
      ctx.unify(air.cond.ty!, { type: "i32" });
      ctx.unify(air.then.ty!, air.else.ty!);
      air.ty = air.then.ty;
      // air.ty = union(air.then.ty!, air.else.ty!);
      // ctx.unify(air.ty!, air.else.ty!);
      break;
    }
    case "const.bool": {
      // TODO: bool型追加
      air.ty = { type: "i32" };
      break;
    }
    case "const.int": {
      // FIXME: i64...
      air.ty = { type: "i32" };
      break;
    }
    case "const.float": {
      // FIXME: f64...
      air.ty = { type: "f32" };
      break;
    }
    case "const.string": {
      // air.ty = { type: "string" };
      return todo();
    }
    default: {
      unreachable<typeof air>();
    }
  }
};

export const infer_type = (
  module: AirModule,
  ctx = new InferenceContext(),
): AirModule => {
  const infer: W<InferenceContext> = {
    air_statement(air, w) {
      walk_air_statement(air, w);
      infer_air_statements_type(air, w.context);
    },
    air(air, w) {
      walk_air(air, w);
      infer_air_type(air, w.context);
    },
    context: ctx,
  };

  for (const item of module.items) {
    infer.air_statement(item, infer);
  }

  const ap: W<InferenceContext> = {
    air_statement(air, w) {
      walk_air_statement(air, w);
      if ("ty" in air) {
        air.ty = w.context.ap(air.ty!);
      }
    },
    air(air, w) {
      walk_air(air, w);
      air.ty = w.context.ap(air.ty!);
    },
    context: ctx,
  };

  for (const item of module.items) {
    ap.air_statement(item, ap);
  }

  return module;
};
