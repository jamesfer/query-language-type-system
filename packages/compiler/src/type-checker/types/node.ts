import { Expression } from './expression';

export interface Node<T> extends NodeWithChild<T, Node<T>> {}

export interface NodeWithChild<T, C> extends NodeWithExpression<T, Expression<C>> {}

export interface NodeWithExpression<D, E> {
  kind: 'Node';
  expression: E;
  decoration: D;
}

export function getDecoration<T>(node: Node<T>): T {
  return node.decoration;
}

export function getDecorations<T>(nodes: Node<T>[]): T[] {
  return nodes.map(getDecoration);
}

export function getOptionalDecorations<T>(nodes: (Node<T | undefined> | undefined)[]): (T | undefined)[] {
  return nodes.map(node => node ? getDecoration(node) : undefined);
}
