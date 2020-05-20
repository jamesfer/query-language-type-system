export interface CppIdentifier {
  kind: 'Identifier';
  name: string;
}

export interface CppBoolean {
  kind: 'Boolean';
  value: boolean;
}

export interface CppNumber {
  kind: 'Number';
  value: number;
}

export interface CppString {
  kind: 'String';
  value: string;
}

export interface CppApplication {
  kind: 'Application';
  callee: CppExpression;
  parameters: CppExpression[];
}

export interface CppStructConstruction {
  kind: 'StructConstruction';
  structName: string;
  parameters: CppExpression[];
}

export interface CppParameter {
  kind: 'Parameter';
  identifier: CppIdentifier;
  type: CppType;
}

export interface CppLambda {
  kind: 'Lambda';
  parameters: CppParameter[];
  body: CppBlock;
}

export type CppExpression =
  | CppIdentifier
  | CppBoolean
  | CppNumber
  | CppString
  | CppApplication
  | CppStructConstruction
  | CppLambda;

export interface CppBlock {
  kind: 'Block';
  statements: CppStatement[];
}

export interface CppExpressionStatement {
  kind: 'ExpressionStatement';
  expression: CppExpression;
}

export interface CppBinding {
  kind: 'Binding';
  name: string;
  type: CppType;
  value: CppExpression;
}

export interface CppReturn {
  kind: 'Return';
  value: CppExpression;
}

export interface CppStruct {
  kind: 'Struct';
  name: string;
  properties: CppParameter[];
}

export type CppStatement =
  | CppExpressionStatement
  | CppBinding
  | CppReturn
  | CppStruct;

export interface CppType {
  kind: 'Type';
  value: string;
}
