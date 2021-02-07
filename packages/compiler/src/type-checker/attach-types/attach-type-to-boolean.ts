import { booleanLiteral, node } from '../constructors';
import { BooleanExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToBoolean = (scope: Scope) => (expression: BooleanExpression): AttachedTypeNode => {
  return node(expression, { scope, type: booleanLiteral(expression.value) });
};
