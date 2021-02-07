import { Expression } from './expression';

export interface Node<T> extends NodeWithChild<T, Node<T>> {}

export interface NodeWithChild<T, C> extends NodeWithExpression<T, Expression<C>> {}

export interface NodeWithExpression<D, E> {
  kind: 'Node';
  expression: E;
  decoration: D;
}
