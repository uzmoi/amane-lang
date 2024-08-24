import type { Intersection, NonNever } from "emnorst";

type NodeExtend<T extends string, U> = { type: T } & NonNever<
  Intersection<
    U extends { type: string } ? (T extends U["type"] ? U : never) : U
  >
>;

// #region Expression

export type BoolExpression<T = never> = NodeExtend<"Bool", T> & {
  value: boolean;
};

export type NumberExpression<T = never> = NodeExtend<"Number", T> & {
  value: string;
};

export type StringExpression<T = never> = NodeExtend<"String", T> & {
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
  then: Expression<T>;
  else: Expression<T>;
};

export type LoopExpression<T = never> = NodeExtend<"Loop", T> & {
  body: Expression<T>;
};

export type BreakExpression<T = never> = NodeExtend<"Break", T>;

export type Expression<T = never> =
  | BoolExpression<T>
  | NumberExpression<T>
  | StringExpression<T>
  | TupleExpression<T>
  | IdentExpression<T>
  | BlockExpression<T>
  | IfExpression<T>
  | LoopExpression<T>
  | BreakExpression<T>;

// #endregion

// #region Statement

export type LetStatement<T = never> = NodeExtend<"Let", T> & {
  dest: IdentExpression<T>;
  init: Expression<T>;
};

export type ExpressionStatement<T = never> = NodeExtend<"Expression", T> & {
  expr: Expression<T>;
};

export type Statement<T = never> = LetStatement<T> | ExpressionStatement<T>;

// #endregion

export type Node<T = never> = Expression<T> | Statement<T>;
