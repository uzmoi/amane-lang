import { todo, unreachable } from "@uzmoi/ut/ils";
import { type ast, type Loc, parse_number_literal } from "#parser";
import type { Air, AirModule, Id } from "../air";
import type { Ty } from "../ty";
import { BlockAnalyzer } from "./block";
import { Scope } from "./scope";

export const lower = (module: ast.Module<Loc>): AirModule => {
  const ctx: LowerContext = {
    scope: new Scope(),
    block: new BlockAnalyzer(),
  };

  const items = module.items.map((item) => lower_statement(item.stmt, ctx));

  return { items };
};

interface LowerContext {
  scope: Scope;
  block: BlockAnalyzer;
}

export const lower_statement = (
  stmt: ast.Statement<Loc>,
  ctx: LowerContext,
): Air => {
  switch (stmt.type) {
    case "Let": {
      const init = lower_expression(stmt.init, ctx);
      const { id } = ctx.scope.def(stmt.dest.name, stmt.dest.loc);
      // TODO: stmt.ty;
      return { type: "def", id, init };
    }
    case "Expression": {
      return lower_expression(stmt.expr, ctx);
    }
  }
};

export const lower_expression = (
  expr: ast.Expression<Loc>,
  ctx: LowerContext,
): Air => {
  switch (expr.type) {
    case "Bool": {
      return { type: "const.bool", value: expr.value };
    }
    case "Number": {
      const value = parse_number_literal(expr.value);
      return typeof value === "bigint"
        ? { type: "const.int", value }
        : { type: "const.float", value };
    }
    case "String": {
      return { type: "const.string", value: expr.value };
    }
    case "Tuple": {
      return todo();
      // const elements = expr.elements.map((element) =>
      //   lower_expression(element, ctx),
      // );
      // return { type: "tuple", elements };
    }
    case "Ident": {
      const entry = ctx.scope.ref(expr.name, expr.loc);
      if (entry == null) {
        throw new Error(`${expr.name} is undefined`);
      }
      return { type: "ref", id: entry.id };
    }
    case "Block": {
      ctx.scope.push();

      const body = expr.stmts.map((stmt) => lower_statement(stmt, ctx));
      const last = expr.last && lower_expression(expr.last, ctx);

      ctx.scope.pop();

      return { type: "block", body, last };
    }
    case "If": {
      return {
        type: "if",
        cond: lower_expression(expr.cond, ctx),
        then: lower_expression(expr.then, ctx),
        else: lower_expression(expr.else, ctx),
      };
    }
    case "Loop": {
      const id = ctx.block.push_block(expr.loc);
      const body = lower_expression(expr.body, ctx);
      ctx.block.pop();
      return { type: "loop", id, body };
    }
    case "Break": {
      const id = ctx.block.break(expr.loc);
      if (id == null) {
        throw new Error("target block for break was not found");
      }
      return { type: "break", id };
    }
    case "Fn": {
      ctx.block.push_fn();
      ctx.scope.push();

      const params: { id: Id; ty: Ty }[] = [];
      // TODO: ty
      for (const [param, _ty] of expr.params) {
        const { id } = ctx.scope.def(param.name, param.loc);
        params.push({ id, ty: { type: "any" } });
      }

      const body = lower_expression(expr.body, ctx);

      ctx.scope.pop();
      ctx.block.pop();

      return { type: "fn", params, body };
    }
    case "Return": {
      let value = null;
      if (expr.body != null) {
        value = lower_expression(expr.body, ctx);
      }
      return { type: "return", value };
    }
    default: {
      unreachable<typeof expr>();
    }
  }
};
