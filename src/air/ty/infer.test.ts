import { describe, expect, test } from "vitest";
import { parse_art_module_item } from "#art";
import { art_infer, infer_module } from "#tests/helpers";
import { TypeMismatchError, VoidVariableError } from "./error";
import { type Ty, ty } from "./ty";

const tyof = (source: string, vars?: Ty[]) => art_infer(source, vars).ty;

const infer_module_item = (source: string, vars?: Ty[]) =>
  infer_module({ imports: [], items: [parse_art_module_item(source)] }, vars);

describe("constant", () => {
  test("bool", () => {
    expect(tyof("true")).toEqual(ty.bool);
  });

  test("int", () => {
    expect(tyof("0")).toEqual(ty.i64);
  });

  test.fails("TODO: annotated int", () => {
    expect(art_infer("%0 = 0", [ty.i32])).toHaveProperty("value.ty", ty.i32);
  });

  test("float", () => {
    expect(tyof("0.0")).toEqual(ty.f64);
  });

  test.fails("TODO: annotated float", () => {
    expect(art_infer("%0 = 0.0", [ty.f32])).toHaveProperty("value.ty", ty.f32);
  });

  test.fails("TODO: string", () => {
    expect(() => art_infer('""')).not.toThrow();
    // expect(tyof('""')).toEqual(ty.string);
  });
});

describe("block", () => {
  test("空ブロックの型はvoid", () => {
    expect(tyof("{}")).toEqual(ty.void);
  });

  test("last expressionが存在するならブロックはその型になる", () => {
    expect(tyof("{ 0 }")).toEqual(ty.i64);
  });

  test("never型の文を含むならブロック全体もnever型になる", () => {
    expect(tyof("{ %0; 0 }", [ty.never])).toEqual(ty.never);
  });
});

describe("if", () => {
  test("condition requires bool type", () => {
    expect(() => art_infer("if 0 then {} else {}")).toThrow(
      new TypeMismatchError(ty.i64, ty.bool),
    );
  });

  test("conditionがnever型ならif式もnever型になる", () => {
    expect(tyof("if %0 then {} else {}", [ty.never])).toEqual(ty.never);
  });

  test("thenとelseの型をif式の型とする", () => {
    expect(tyof("if true then 1 else 2")).toEqual(ty.i64);
  });

  test("thenとelseのどちらかがnever型なら、そうでない方の型をif式の型とする", () => {
    expect(tyof("if true then %0 else 0", [ty.never])).toEqual(ty.i64);
    expect(tyof("if true then 0 else %0", [ty.never])).toEqual(ty.i64);
  });

  test("then and else branches must have same type", () => {
    expect(() => art_infer("if true then 0 else {}")).toThrow(
      new TypeMismatchError(ty.void, ty.i64),
    );
  });
});

describe("loop", () => {
  test("break is never type", () => {
    expect(tyof("break #0")).toEqual(ty.never);
  });

  test("continue is never type", () => {
    expect(tyof("continue #0")).toEqual(ty.never);
  });

  test("loop with break", () => {
    expect(tyof("loop #0 break #0")).toEqual(ty.void);
  });

  test("loop with continue", () => {
    expect(tyof("loop #0 continue #0")).toEqual(ty.never);
  });

  test("loop without break", () => {
    expect(tyof("loop #0 {}")).toEqual(ty.never);
  });

  test("loop with unrelated break", () => {
    expect(tyof("loop #0 break #1")).toEqual(ty.never);
  });

  test("body requires void type", () => {
    expect(() => art_infer("loop #0 0")).toThrow(
      new TypeMismatchError(ty.i64, ty.void),
    );
  });
});

describe("variable", () => {
  test("ref type", () => {
    expect(tyof("%0", [ty.f32])).toEqual(ty.f32);
  });

  describe("let", () => {
    test("let is void type", () => {
      expect(tyof("let %0 = 0")).toEqual(ty.void);
    });

    test("never init", () => {
      expect(tyof("let %1: i32 = %0", [ty.never])).toEqual(ty.never);
    });

    test("let-ref", () => {
      expect(tyof("{ let %0 = 0; %0 }")).toEqual(ty.i64);
    });

    test("let requires non void type", () => {
      expect(() => art_infer("let %0 = {}")).toThrow(VoidVariableError);
    });

    test("let annotation requires non void type", () => {
      expect(() => art_infer("let %0: void = {}")).toThrow(VoidVariableError);
    });

    test("init type mismatch", () => {
      expect(() => art_infer("let %1: i32 = %0", [ty.bool])).toThrow(
        new TypeMismatchError(ty.bool, ty.i32),
      );
    });
  });

  describe("assign", () => {
    test("assign is void type", () => {
      expect(tyof("%0 = %0", [ty.i64])).toEqual(ty.void);
    });

    test("assign never type", () => {
      expect(tyof("%1 = %0", [ty.never])).toEqual(ty.never);
    });

    test("type mismatch", () => {
      expect(() => art_infer("%0 = 0", [ty.bool])).toThrow(
        new TypeMismatchError(ty.i64, ty.bool),
      );
    });
  });
});

describe("fn", () => {
  test("fn-ref", () => {
    expect(infer_module_item("fn %0 (%1: i64): void { %0; }")).toHaveProperty(
      "items.0.body.body.0.ty",
      ty.fn([ty.i64], ty.void),
    );
  });

  describe("param", () => {
    test("param-ref", () => {
      infer_module_item("fn %0 (%1: i64): i64 %1");
    });

    test("void param", () => {
      expect(() => infer_module_item("fn %0 (%1: void): void {}")).toThrow(
        VoidVariableError,
      );
    });
  });

  describe("Implicit return", () => {
    test("pass", () => {
      infer_module_item("fn %1: i64 %0", [ty.i64]);
    });

    test("pass never", () => {
      infer_module_item("fn %1: i64 %0", [ty.never]);
    });

    test("type mismatch", () => {
      expect(() => infer_module_item("fn %1: i64 %0", [ty.bool])).toThrow(
        new TypeMismatchError(ty.bool, ty.i64),
      );
    });
  });

  describe("return", () => {
    test("return is never type", () => {
      expect(tyof("return")).toEqual(ty.never);
    });

    test("pass", () => {
      infer_module_item("fn %1: i64 return %0", [ty.i64]);
    });

    test("pass never", () => {
      infer_module_item("fn %1: i64 return %0", [ty.never]);
    });

    test("type mismatch", () => {
      expect(() =>
        infer_module_item("fn %1: i64 return %0", [ty.bool]),
      ).toThrow(new TypeMismatchError(ty.bool, ty.i64));
    });

    test("pass (without value)", () => {
      infer_module_item("fn %0: void return");
    });

    test("type mismatch (without value)", () => {
      expect(() => infer_module_item("fn %0: i64 return")).toThrow(
        new TypeMismatchError(ty.void, ty.i64),
      );
    });
  });
});

describe("call", () => {
  test("call type", () => {
    expect(tyof("call %0", [ty.fn([], ty.bool)])).toEqual(ty.bool);
  });

  test("with arguments", () => {
    expect(tyof("call %0 (%1)", [ty.fn([ty.i64], ty.void), ty.i64])).toEqual(
      ty.void,
    );
  });

  test("never type callee", () => {
    expect(tyof("call %0", [ty.never])).toEqual(ty.never);
  });

  test("never type argument", () => {
    expect(tyof("call %0 (%1)", [ty.fn([ty.any], ty.void), ty.never])).toEqual(
      ty.never,
    );
  });

  test("callee requires fn type", () => {
    expect(() => art_infer("call %0", [ty.f64])).toThrow("Cannot call");
  });

  test("arity", () => {
    const fn_ty = ty.fn([ty.i32], ty.void);
    expect(() => art_infer("call %0", [fn_ty])).toThrow("arguments");
    expect(() => art_infer("call %0 (0, 1)", [fn_ty])).toThrow("arguments");
  });

  test("argument parameter type mismatch", () => {
    expect(() =>
      art_infer("call %0 (true)", [ty.fn([ty.i32], ty.void)]),
    ).toThrow(new TypeMismatchError(ty.bool, ty.i32));
  });
});
