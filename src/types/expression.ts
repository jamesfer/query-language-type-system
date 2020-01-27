export interface Identifier {
  kind: 'Identifier';
  name: string;
}

export interface NumberExpression {
  kind: 'NumberExpression';
  value: number;
}

export interface BooleanExpression {
  kind: 'BooleanExpression';
  value: boolean;
}

export interface SymbolExpression {
  kind: 'SymbolExpression';
  name: string;
}

export interface RecordExpression<T = Expression> {
  kind: 'RecordExpression';
  properties: { [k: string]: T };
}

export interface Application<T = Expression> {
  kind: 'Application';
  callee: T;
  parameters: T[];
}

export interface FunctionExpressionParameter {
  kind: 'FunctionExpressionParameter';
  value: Expression;
  implicit: boolean;
}

export interface FunctionExpression<T = Expression> {
  kind: 'FunctionExpression';
  parameters: FunctionExpressionParameter[];
  body: T;
}

export interface DataInstantiation<T = Expression> {
  kind: 'DataInstantiation';
  callee: T;
  parameters: T[];
}

export interface BindingExpression<T = Expression> {
  kind: 'BindingExpression';
  name: string;
  value: T;
  body: T;
}

export interface DualExpression<T = Expression> {
  kind: 'DualExpression';
  left: T;
  right: T;
}

export interface ReadRecordPropertyExpression<T = Expression> {
  kind: 'ReadRecordPropertyExpression';
  record: T;
  property: string;
}

export interface ReadDataPropertyExpression<T = Expression> {
  kind: 'ReadDataPropertyExpression';
  dataValue: T;
  property: number;
}

// export interface ImplementExpression<T = Expression> {
//   kind: 'ImplementExpression';
//   callee: string;
//   identifier: string;
//   parameters: T[];
//   body: T;
// }

// export interface DataDeclaration<T = Expression> {
//   kind: 'DataDeclaration';
//   callee: string;
//   // TODO this shouldn't be a T as they are constraints. Probably rename to constraints too
//   parameters: T[];
//   body: T;
// }

export type Expression<T = void> =
  | Identifier
  | NumberExpression
  | BooleanExpression
  | SymbolExpression
  // This is because we want the default behaviour of an expression to contain an expression, but we
  // can't just add Expression as the default to T because it is recursive.
  | RecordExpression<T extends void ? Expression : T>
  | Application<T extends void ? Expression : T>
  | FunctionExpression<T extends void ? Expression : T>
  | DataInstantiation<T extends void ? Expression : T>
  | BindingExpression<T extends void ? Expression : T>
  | DualExpression<T extends void ? Expression : T>
  | ReadRecordPropertyExpression<T extends void ? Expression : T>
  | ReadDataPropertyExpression<T extends void ? Expression : T>
  // | ImplementExpression<T extends void ? Expression : T>
  // | DataDeclaration<T extends void ? Expression : T>;
