import { Expression } from './expression';

export interface Node<T> {
  kind: 'Node';
  expression: Expression<Node<T>>;
  decoration: T;
}

export interface NodeWithChild<T, C> {
  kind: 'Node';
  expression: Expression<C>;
  decoration: T;
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
