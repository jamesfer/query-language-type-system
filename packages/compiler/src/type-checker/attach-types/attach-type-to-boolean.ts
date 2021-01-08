import { booleanLiteral, node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { BooleanExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToBoolean = (scope: Scope) => (expression: BooleanExpression): TypeResult<AttachedTypeNode> => {
  return new TypeWriter(scope).wrap(node(expression, { scope, type: booleanLiteral(expression.value) }));
};
