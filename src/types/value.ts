export interface FreeVariable {
  kind: 'FreeVariable';
  name: string;
}

export interface DataValue {
  kind: 'DataValue';
  name: Value;
  parameters: Value[];
}

export interface DualBinding {
  kind: 'DualBinding';
  left: Value;
  right: Value;
}

export interface ApplicationValue {
  kind: 'ApplicationValue';
  callee: Value;
  parameter: Value;
}

export interface ReadRecordPropertyValue {
  kind: 'ReadRecordProperty';
  property: string;
  record: Value;
}

export interface ReadDataValueProperty {
  kind: 'ReadDataValueProperty';
  property: number;
  dataValue: Value;
}

/**
 * Literals
 */

export interface SymbolLiteral {
  kind: 'SymbolLiteral';
  name: string;
}

export interface FunctionLiteral {
  kind: 'FunctionLiteral';
  parameter: Value;
  body: Value;
}

export interface ImplicitFunctionLiteral {
  kind: 'ImplicitFunctionLiteral';
  parameter: Value;
  body: Value;
}

export interface RecordLiteral {
  kind: 'RecordLiteral';
  properties: { [k: string]: Value };
}

export interface NumberLiteral {
  kind: 'NumberLiteral';
  value: number;
}

export interface BooleanLiteral {
  kind: 'BooleanLiteral';
  value: boolean;
}

export type Value =
  | FreeVariable
  | DataValue
  | DualBinding
  | ApplicationValue
  | ReadDataValueProperty
  | ReadRecordPropertyValue
  | FunctionLiteral
  | ImplicitFunctionLiteral
  | RecordLiteral
  | SymbolLiteral
  | NumberLiteral
  | BooleanLiteral;
