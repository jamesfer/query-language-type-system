import { Expression } from './expression';

export interface FreeVariable {
  kind: 'FreeVariable';
  name: string;
}

export interface DataValue<T = Expression> {
  kind: 'DataValue';
  name: Value<T>;
  parameters: Value<T>[];
}

export interface DualBinding<T = Expression> {
  kind: 'DualBinding';
  left: Value<T>;
  right: Value<T>;
}

export interface ApplicationValue {
  kind: 'ApplicationValue';
  callee: Value;
  parameter: Value;
}

/**
 * Literals
 */

export interface SymbolLiteral {
  kind: 'SymbolLiteral';
  name: string;
}

export interface FunctionLiteralParameter {
  kind: 'FunctionLiteralParameter';
  value: Value;
}

export interface FunctionLiteral<T = Expression> {
  kind: 'FunctionLiteral';
  parameters: FunctionLiteralParameter[];
  body: T;
}

export interface RecordLiteral<T = Expression> {
  kind: 'RecordLiteral';
  properties: { [k: string]: Value<T> };
}

export interface NumberLiteral {
  kind: 'NumberLiteral';
  value: number;
}

export interface BooleanLiteral {
  kind: 'BooleanLiteral';
  value: boolean;
}

export type Value<T = Expression> =
  | FreeVariable
  | DataValue<T>
  | DualBinding<T>
  | FunctionLiteral<T>
  | RecordLiteral<T>
  | SymbolLiteral
  | NumberLiteral
  | BooleanLiteral
  | ApplicationValue;
