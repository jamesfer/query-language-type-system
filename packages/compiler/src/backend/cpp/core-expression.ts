import {
  Application,
  BindingExpression,
  BooleanExpression,
  DataInstantiation,
  DualExpression,
  FunctionExpression,
  Identifier, NativeExpression,
  NumberExpression,
  PatternMatchExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
  RecordExpression,
  StringExpression,
  SymbolExpression,
} from '../..';

export interface StructDeclaration {

}

export type Expression<T = void> =
  | Identifier
  | BooleanExpression
  | NumberExpression
  | StringExpression
  | SymbolExpression // -> Strings
  | Application<T extends void ? Expression : T> // -> Function call
  | FunctionExpression<T extends void ? Expression : T> // -> Lambda
  | BindingExpression<T extends void ? Expression : T> // -> Variable
  | DualExpression<T extends void ? Expression : T> // -> Just the left side
  | ReadRecordPropertyExpression<T extends void ? Expression : T> // -> dot
  | ReadDataPropertyExpression<T extends void ? Expression : T> // -> dot
  | DataInstantiation<T extends void ? Expression : T> // -> Struct creation
  | RecordExpression<T extends void ? Expression : T> // -> Struct declaration and creation
  | PatternMatchExpression<T extends void ? Expression : T> // TODO
  | NativeExpression; // TODO
