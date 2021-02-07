import { node, numberLiteral } from '../constructors';
import { NumberExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToNumber = (scope: Scope) => (expression: NumberExpression): AttachedTypeNode => {
  return node(expression, { scope, type: numberLiteral(expression.value) });
};
