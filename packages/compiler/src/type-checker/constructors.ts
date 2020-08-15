import { uniqueId } from 'lodash';
import { DesugaredExpressionWithoutPatternMatch } from '../desugar/desugar-pattern-match';
import { TypedNode } from './type-check';
import { EScopeBinding, EScopeShapeBinding, EvaluationScope } from './types/evaluation-scope';
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
  RecordExpression,
  SymbolExpression,
} from './types/expression';
import { Node } from './types/node';
import { Scope, ScopeBinding } from './types/scope';
import {
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
 * Scope stuff
 */

export function scope(scope: Partial<Scope> = {}): Scope {
  return {
    bindings: [],
    ...scope,
  };
}

export function evaluationScope(scope: Partial<EvaluationScope> = {}): EvaluationScope {
  return {
    bindings: [],
    ...scope,
  };
}

export function expandScope(parent: Scope, child: Partial<Scope> = {}): Scope {
  return {
    bindings: [...parent.bindings, ...child.bindings || []],
  };
}

export function expandEvaluationScope(parent: EvaluationScope, child: Partial<EvaluationScope> = {}): EvaluationScope {
  return {
    bindings: [...parent.bindings, ...child.bindings || []],
  };
}

// export function scopeDataDeclaration(callee: string, parameters: TypedNode[]):  {
//   return {
//     callee,
//     parameters,
//     kind: 'DataDeclaration',
//   };
// }

export function scopeBinding(name: string, scope: Scope, type: Value, node?: TypedNode): ScopeBinding {
  return {
    name,
    type,
    scope,
    node,
    // expression,
    kind: 'ScopeBinding',
  };
}

export function eScopeBinding(name: string, value: DesugaredExpressionWithoutPatternMatch): EScopeBinding {
  return {
    name,
    value,
    kind: 'ScopeBinding',
  };
}

export function eScopeShapeBinding(name: string, type: Value): EScopeShapeBinding {
  return {
    name,
    type,
    kind: 'ScopeShapeBinding',
  };
}


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

export const implement = (name: string, parameters: MaybeExpression[] = []) => (
  bind(uniqueId(`${name}Implementation`), parameters.length > 0 ? apply(identifier(name), parameters) : identifier(name))
);

function defaultExplicit<T>(parameters: (T | [T, boolean])[]): [T, boolean][] {
  return parameters.map(parameter => Array.isArray(parameter) ? parameter : [parameter, false]);
}

export function lambda<T extends object = Expression>(parameters: (MaybeExpression | [MaybeExpression, boolean])[], body: MaybeExpression<T>): Expression
export function lambda<T extends object = Expression>(parameters: (MaybeExpression | [MaybeExpression, boolean])[], body: T): T | Expression {
  return defaultExplicit(parameters).reduceRight(
    (body, [parameter, implicit]): FunctionExpression => ({
      body,
      implicit,
      kind: 'FunctionExpression',
      parameter: toExpression(parameter),
    }),
    toExpression(body) as any,
  );
}

export function identifier(name: string): Identifier {
  return {
    name,
    kind: 'Identifier',
  };
}

export function apply(callee: MaybeExpression, parameters: MaybeExpression[] = []): Expression {
  return parameters.reduce<Expression>(
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
