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
import { TypedDecoration } from '../type-checker/type-check';
import { mapNode } from '../type-checker/visitor-utils';
import {
  DesugaredExpressionWithoutDestructuring,
  SimpleFunctionExpression,
  DesugaredNode as DestructuringDesugaredNode,
  makeDesugaredNodeIterator,
} from './desugar-destructuring';

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

export interface DesugaredNode extends NodeWithExpression<TypedDecoration, DesugaredExpressionWithoutDualExpression<DesugaredNode>> {}

interface PartiallyDesugaredNode extends NodeWithExpression<TypedDecoration, DesugaredExpressionWithoutDestructuring<DesugaredNode>> {}

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
