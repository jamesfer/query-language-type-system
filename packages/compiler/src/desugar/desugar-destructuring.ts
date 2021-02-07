import {
  Application,
  BindingExpression,
  BooleanExpression,
  DataInstantiation,
  DualExpression,
  Expression,
  FunctionExpression,
  Identifier,
  NativeExpression,
  NodeWithExpression,
  NumberExpression,
  PatternMatchExpression,
  ReadDataPropertyExpression,
  ReadRecordPropertyExpression,
  RecordExpression,
  StringExpression,
  SymbolExpression,
} from '..';
import { ResolvedNode, ResolvedNodeDecoration } from '../type-checker/resolve-implicits/index';
import { mapNode } from '../type-checker/visitor-utils';
import { performExpressionDestructuring } from './destructure-expression';
import { combineIteratorMap } from './iterators-core';
import {
  applicationMapIterator,
  bindingMapIterator,
  dataInstantiationMapIterator,
  dualMapIterator,
  emptyMapIterator, makeExpressionIterator,
  patternMatchMapIterator,
  readDataPropertyMapIterator,
  readRecordPropertyMapIterator, recordMapIterator,
} from './iterators-specific';

export interface SimpleFunctionExpression<T = Expression> {
  kind: 'SimpleFunctionExpression';
  parameter: string;
  implicit: boolean;
  body: T;
}

export type DesugaredExpressionWithoutDestructuring<T = void> =
  | Identifier
  | BooleanExpression
  | NumberExpression
  | StringExpression
  | SymbolExpression
  // This is because we want the default behaviour of an expression to contain an expression, but we
  // can't just add DesugaredExpressionWithoutDestructuring as the default to T because it is recursive.
  | RecordExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | Application<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | SimpleFunctionExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | DataInstantiation<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | BindingExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | DualExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | ReadRecordPropertyExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | ReadDataPropertyExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | PatternMatchExpression<T extends void ? DesugaredExpressionWithoutDestructuring : T>
  | NativeExpression;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly ['SimpleFunctionExpression']: SimpleFunctionExpression<A>;
    readonly ['DesugaredExpressionWithoutDestructuring']: DesugaredExpressionWithoutDestructuring<A>;
  }
}

export interface DesugaredNode extends NodeWithExpression<ResolvedNodeDecoration, DesugaredExpressionWithoutDestructuring<DesugaredNode>> {}

export interface PartiallyDesugaredNode extends NodeWithExpression<ResolvedNodeDecoration, Expression<DesugaredNode>> {}

function shallowDesugarDestructuring({ expression, decoration }: PartiallyDesugaredNode): DesugaredNode {
  switch (expression.kind) {
    case 'Identifier':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'SymbolExpression':
    case 'RecordExpression':
    case 'Application':
    case 'DataInstantiation':
    case 'BindingExpression':
    case 'DualExpression':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    case 'NativeExpression':
      return { kind: 'Node', expression, decoration };

    case 'FunctionExpression': {
      if (expression.parameter.expression.kind === 'Identifier') {
        return {
          decoration,
          kind: 'Node',
          expression: {
            kind: 'SimpleFunctionExpression',
            parameter: expression.parameter.expression.name,
            implicit: expression.implicit,
            body: expression.body,
          },
        };
      }

      const newName = 'injectedParameter$' + Math.floor(Math.random() * 1e6);
      const identifierNode: DesugaredNode = {
        kind: 'Node',
        expression: { kind: 'Identifier', name: newName },
        decoration: expression.parameter.decoration,
      };
      const bindings = performExpressionDestructuring(identifierNode, expression.parameter);
      return {
        decoration,
        kind: 'Node',
        expression: {
          kind: 'SimpleFunctionExpression',
          parameter: newName,
          implicit: expression.implicit,
          body: bindings.reduce<DesugaredNode>(
            (accum, binding) => ({
              decoration,
              kind: 'Node',
              expression: {
                kind: 'BindingExpression',
                name: binding.name,
                value: binding.node,
                body: accum,
              },
            }),
            expression.body
          ),
        },
      };
    }
  }
}

export function desugarDestructuring(node: ResolvedNode): DesugaredNode {
  const internal = (node: ResolvedNode): DesugaredNode => shallowDesugarDestructuring(mapNode(iterator, node));
  const iterator = makeExpressionIterator(internal);
  return internal(node);
}

export function simpleFunctionMapIterator<A, B>(f: (a: A) => B): (expression: SimpleFunctionExpression<A>) => SimpleFunctionExpression<B> {
  return expression => ({
    ...expression,
    body: f(expression.body),
  });
}

export function makeDesugaredNodeIterator<A, B>(f: (a: A) => B): (e: DesugaredExpressionWithoutDestructuring<A>) => DesugaredExpressionWithoutDestructuring<B> {
  return combineIteratorMap<'DesugaredExpressionWithoutDestructuring', DesugaredExpressionWithoutDestructuring, A, B>({
    Identifier: emptyMapIterator,
    BooleanExpression: emptyMapIterator,
    StringExpression: emptyMapIterator,
    NumberExpression: emptyMapIterator,
    SymbolExpression: emptyMapIterator,
    NativeExpression: emptyMapIterator,
    Application: applicationMapIterator,
    DataInstantiation: dataInstantiationMapIterator,
    ReadDataPropertyExpression: readDataPropertyMapIterator,
    ReadRecordPropertyExpression: readRecordPropertyMapIterator,
    SimpleFunctionExpression: simpleFunctionMapIterator,
    DualExpression: dualMapIterator,
    BindingExpression: bindingMapIterator,
    PatternMatchExpression: patternMatchMapIterator,
    RecordExpression: recordMapIterator,
  })(f);
}

