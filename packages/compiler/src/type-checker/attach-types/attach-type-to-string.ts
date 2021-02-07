import { node, stringLiteral } from '../constructors';
import { StringExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToString = (scope: Scope) => (expression: StringExpression): AttachedTypeNode => {
  return node(expression, { scope, type: stringLiteral(expression.value) });
};
