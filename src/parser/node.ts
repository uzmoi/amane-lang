import type { Intersection, NonNever } from "emnorst";

type NodeExtend<T extends string, U> = { type: T } & NonNever<
  Intersection<
    U extends { type: string } ? (T extends U["type"] ? U : never) : U
  >
>;

// #region Expression

export type BoolLiteral<T = never> = NodeExtend<"Bool", T> & {
  value: boolean;
};

export type NumberLiteral<T = never> = NodeExtend<"Number", T> & {
  value: string;
};

export type StringLiteral<T = never> = NodeExtend<"String", T> & {
  value: string;
};

export type TupleExpression<T = never> = NodeExtend<"Tuple", T> & {
  elements: Expression<T>[];
};

export type IdentExpression<T = never> = NodeExtend<"Ident", T> & {
  name: string;
};

export type BlockExpression<T = never> = NodeExtend<"Block", T> & {
  stmts: Statement<T>[];
  last: Expression<T> | null;
};

export type IfExpression<T = never> = NodeExtend<"If", T> & {
  cond: Expression<T>;
  then_body: Expression<T>;
  else_body: Expression<T>;
};

export type LoopExpression<T = never> = NodeExtend<"Loop", T> & {
  body: Expression<T>;
};

export type BreakExpression<T = never> = NodeExtend<"Break", T>;

export type ReturnExpression<T = never> = NodeExtend<"Return", T> & {
  body: Expression<T> | null;
};

export type CallExpression<T = never> = NodeExtend<"Call", T> & {
  callee: Expression<T>;
  args: Expression<T>[];
};

export type Expression<T = never> =
  | BoolLiteral<T>
  | NumberLiteral<T>
  | StringLiteral<T>
  | TupleExpression<T>
  | IdentExpression<T>
  | BlockExpression<T>
  | IfExpression<T>
  | LoopExpression<T>
  | BreakExpression<T>
  | ReturnExpression<T>
  | CallExpression<T>;

// #endregion

type Ty<T = never> = IdentExpression<T>;

// #region Statement

export type LetStatement<T = never> = NodeExtend<"Let", T> & {
  dest: IdentExpression<T>;
  ty: Ty<T> | null;
  init: Expression<T>;
};

export type ExpressionStatement<T = never> = NodeExtend<"Expression", T> & {
  expr: Expression<T>;
};

export type Statement<T = never> = LetStatement<T> | ExpressionStatement<T>;

// #endregion

// #region Module

export type FnModuleItem<T = never> = NodeExtend<"Fn", T> & {
  name: IdentExpression<T>;
  params: [IdentExpression<T>, Ty<T>][];
  ret_ty: Ty<T>;
  body: Expression<T>;
};

export type StatementModuleItem<T = never> = NodeExtend<"Statement", T> & {
  stmt: Statement<T>;
};

export type ModuleItem<T = never> = FnModuleItem<T> | StatementModuleItem<T>;

export type Module<T = never> = NodeExtend<"Module", T> & {
  items: ModuleItem<T>[];
};

// #endregion

export type Node<T = never> =
  | Expression<T>
  | Statement<T>
  | Module<T>
  | ModuleItem<T>;
