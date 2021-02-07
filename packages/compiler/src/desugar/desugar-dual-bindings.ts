import {
  Application,
  BindingExpression,
  BooleanExpression,
  DataInstantiation,
  DualExpression,
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
import { ResolvedNodeDecoration } from '../type-checker/resolve-implicits';
import { mapNode } from '../type-checker/visitor-utils';
import {
  DesugaredExpressionWithoutDestructuring,
  SimpleFunctionExpression,
  DesugaredNode as DestructuringDesugaredNode,
  makeDesugaredNodeIterator, simpleFunctionMapIterator,
} from './desugar-destructuring';
import { combineIteratorMap } from './iterators-core';
import {
  applicationMapIterator,
  bindingMapIterator,
  dataInstantiationMapIterator,
  emptyMapIterator,
  patternMatchMapIterator,
  readDataPropertyMapIterator,
  readRecordPropertyMapIterator, recordMapIterator,
} from './iterators-specific';

export type DesugaredExpressionWithoutDualExpression<T = void> =
  | Identifier
  | BooleanExpression
  | NumberExpression
  | StringExpression
  | SymbolExpression
  // This is because we want the default behaviour of an expression to contain an expression, but we
  // can't just add DesugaredExpressionWithoutDualExpression as the default to T because it is recursive.
  | RecordExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | Application<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | SimpleFunctionExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | DataInstantiation<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | BindingExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | ReadRecordPropertyExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | ReadDataPropertyExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | PatternMatchExpression<T extends void ? DesugaredExpressionWithoutDualExpression : T>
  | NativeExpression;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind<A> {
    readonly ['DesugaredExpressionWithoutDualExpression']: DesugaredExpressionWithoutDualExpression<A>;
  }
}

export interface DesugaredNode extends NodeWithExpression<ResolvedNodeDecoration, DesugaredExpressionWithoutDualExpression<DesugaredNode>> {}

interface PartiallyDesugaredNode extends NodeWithExpression<ResolvedNodeDecoration, DesugaredExpressionWithoutDestructuring<DesugaredNode>> {}

function shallowDesugarDualBindings(
  { expression, decoration }: PartiallyDesugaredNode,
): DesugaredNode {
  switch (expression.kind) {
    case 'Identifier':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'SymbolExpression':
    case 'RecordExpression':
    case 'Application':
    case 'SimpleFunctionExpression':
    case 'DataInstantiation':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    case 'NativeExpression':
    case 'BindingExpression':
      return { expression, decoration, kind: 'Node' };

    case 'DualExpression':
      if (expression.left.expression.kind === 'NativeExpression'
        || expression.right.expression.kind === 'Identifier') {
        return expression.left;
      }

      if (expression.right.expression.kind === 'NativeExpression'
        || expression.left.expression.kind === 'Identifier') {
        return expression.right;
      }

      throw new Error(`Cannot simplify DualExpression: ${JSON.stringify(expression, undefined, 2)}`);
  }
}

export function desugarDualBindings(node: DestructuringDesugaredNode): DesugaredNode {
  const internal = (node: DestructuringDesugaredNode): DesugaredNode => shallowDesugarDualBindings(mapNode(iterator, node));
  const iterator = makeDesugaredNodeIterator(internal);
  return internal(node);
}

export function makeDualBindingDesugaredNodeIterator<A, B>(f: (a: A) => B): (e: DesugaredExpressionWithoutDualExpression<A>) => DesugaredExpressionWithoutDualExpression<B> {
  return combineIteratorMap<'DesugaredExpressionWithoutDualExpression', DesugaredExpressionWithoutDualExpression, A, B>({
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
    BindingExpression: bindingMapIterator,
    PatternMatchExpression: patternMatchMapIterator,
    RecordExpression: recordMapIterator,
  })(f);
}
