import { castArray } from 'lodash';
import {
  Application,
  BindingExpression,
  BooleanExpression,
  DataInstantiation,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier,
  NumberExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
  RecordExpression, StringExpression,
  SymbolExpression,
} from './types/expression';
import { Node } from './types/node';
import {
  ApplicationValue,
  BooleanLiteral,
  DataValue,
  DualBinding,
  FreeVariable,
  NumberLiteral,
  RecordLiteral, StringLiteral,
  SymbolLiteral,
  Value,
} from './types/value';

/**
 * Values
 */

export function symbol(name: string): SymbolLiteral {
  return {
    name,
    kind: 'SymbolLiteral',
  };
}

export function dataValue(name: string | Value, parameters: Value[] = []): DataValue {
  return {
    parameters,
    name: typeof name === 'string' ? symbol(name) : name,
    kind: 'DataValue',
  };
}

export function functionType(returnType: Value, parameters: (Value | [Value, boolean])[]): Value {
  // TODO create a custom function type value
  return parameters.reduceRight<Value>(
    (body, parameter) => Array.isArray(parameter)
      ? {
        body,
        kind: parameter[1] ? 'ImplicitFunctionLiteral' : 'FunctionLiteral',
        parameter: parameter[0],
      }
      : {
        body,
        parameter,
        kind: 'FunctionLiteral',
      },
    returnType,
  )
}

export function recordLiteral(properties: { [k: string]: Value }): RecordLiteral {
  return {
    properties,
    kind: 'RecordLiteral',
  };
}

export function freeVariable(name: string): FreeVariable {
  return {
    name,
    kind: 'FreeVariable',
  };
}

export function booleanLiteral(value: boolean): BooleanLiteral {
  return {
    value,
    kind: 'BooleanLiteral',
  }
}

export function numberLiteral(value: number): NumberLiteral {
  return {
    value,
    kind: 'NumberLiteral',
  }
}

export function stringLiteral(value: string): StringLiteral {
  return {
    value,
    kind: 'StringLiteral',
  }
}

export function dualBinding(left: Value, right: Value): DualBinding {
  return {
    left,
    right,
    kind: 'DualBinding',
  };
}

export function application(callee: Value, parameter: Value): ApplicationValue {
  return {
    callee,
    parameter,
    kind: 'ApplicationValue',
  };
}


/**
 * Expressions
 */

type MaybeExpression<T extends object = Expression> = string | number | boolean | T;

function toExpression<T extends object = Expression>(expression: MaybeExpression<T>): T | Expression {
  if (typeof expression === 'string') {
    return identifier(expression);
  }

  if (typeof expression === 'number') {
    return numberExpression(expression);
  }

  if (typeof expression === 'boolean') {
    return booleanExpression(expression);
  }

  return expression;
}

function allToExpression<T extends object = Expression>(expressions: MaybeExpression<T>[]) {
  return expressions.map(toExpression);
}

export function symbolExpression(name: string): SymbolExpression {
  return {
    name,
    kind: 'SymbolExpression',
  };
}

export const bind = (name: string, value: MaybeExpression) => (body: Expression): BindingExpression => ({
  name,
  body,
  kind: 'BindingExpression',
  value: toExpression(value),
});

function defaultExplicit<T>(parameters: (T | [T, boolean])[]): [T, boolean][] {
  return parameters.map(parameter => Array.isArray(parameter) ? parameter : [parameter, false]);
}

export function lambda(parameters: (MaybeExpression | [MaybeExpression, boolean])[], body: MaybeExpression): FunctionExpression {
  if (parameters.length === 0) {
    throw new Error('Cannot create a function with no parameters');
  }

  const [firstParameter, ...otherParameters] = defaultExplicit(parameters);
  return otherParameters.reduceRight(
    (body, [parameter, implicit]): FunctionExpression => ({
      body,
      implicit,
      kind: 'FunctionExpression',
      parameter: toExpression(parameter),
    }),
    {
      kind: 'FunctionExpression',
      parameter: toExpression(firstParameter[0]),
      body: toExpression(body),
      implicit: firstParameter[1],
    },
  );
}

export function identifier(name: string): Identifier {
  return {
    name,
    kind: 'Identifier',
  };
}

export function apply(callee: MaybeExpression, parameters: MaybeExpression[]): Expression;
export function apply(callee: MaybeExpression, parameters: Expression): Application;
export function apply(callee: MaybeExpression, parameters: Expression | MaybeExpression[]): Expression {
  return castArray(parameters).reduce<Expression>(
    (callee, parameter): Application => ({
      kind: 'Application',
      callee: callee,
      parameter: toExpression(parameter),
    }),
    toExpression(callee),
  );
}

export function numberExpression(value: number): NumberExpression {
  return {
    value,
    kind: 'NumberExpression',
  };
}

export function booleanExpression(value: boolean): BooleanExpression {
  return {
    value,
    kind: 'BooleanExpression',
  };
}

export function stringExpression(value: string): StringExpression {
  return {
    value,
    kind: 'StringExpression',
  };
}

export function record(properties: { [k: string]: Expression }): RecordExpression {
  return {
    properties,
    kind: 'RecordExpression',
  };
}

export function dataInstantiation(name: MaybeExpression, parameters: MaybeExpression[], parameterShapes: (MaybeExpression | [MaybeExpression, boolean])[]): DataInstantiation;
export function dataInstantiation<T extends object = Expression>(name: MaybeExpression, parameters: MaybeExpression<T>[], parameterShapes: (MaybeExpression | [MaybeExpression, boolean])[]): DataInstantiation<T> {
  return {
    kind: 'DataInstantiation',
    callee: typeof name === 'string' && name[0].toUpperCase() === name[0] ? symbolExpression(name) : toExpression(name) as any,
    parameters: allToExpression(parameters) as any,
    parameterShapes: defaultExplicit(parameterShapes).map(([parameter, implicit]) => (
      [toExpression(parameter), implicit]
    )),
  };
}

export function dual(left: MaybeExpression, right: MaybeExpression): DualExpression {
  return {
    kind: 'DualExpression',
    left: toExpression(left),
    right: toExpression(right),
  };
}

export const data = (name: string, parameterNames: string[] = [], parameters: (MaybeExpression | [MaybeExpression, boolean])[] = parameterNames) => (
  // {
  //   kind: 'Data'
  // }

  bind(name, lambda(parameters, dataInstantiation(
    name,
    parameterNames.map(identifier),
    parameters,
  )))
);

export function readRecordProperty(record: MaybeExpression, property: string): ReadRecordPropertyExpression {
  return {
    property,
    kind: 'ReadRecordPropertyExpression',
    record: toExpression(record),
  };
}

export function readDataProperty(dataValue: MaybeExpression, property: number): ReadDataPropertyExpression {
  return {
    property,
    kind: 'ReadDataPropertyExpression',
    dataValue: toExpression(dataValue),
  };
}


/**
 * Other
 */

export function node<T>(expression: Expression<Node<T>>, decoration: T): Node<T> {
  return {
    expression,
    decoration,
    kind: 'Node',
  };
}
