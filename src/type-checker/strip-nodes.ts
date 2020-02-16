import { Expression } from './types/expression';
import { Node } from './types/node';
import { visitAndTransformExpressionBefore } from './visitor-utils';

export function stripNode<T>(node: Node<T>): Expression {
  return visitAndTransformExpressionBefore<Node<T>>(node => node.expression)(node);
}
