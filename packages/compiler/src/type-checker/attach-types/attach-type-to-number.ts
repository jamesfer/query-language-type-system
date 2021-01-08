import { node, numberLiteral } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { NumberExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToNumber = (scope: Scope) => (expression: NumberExpression): TypeResult<AttachedTypeNode> => {
  return new TypeWriter(scope).wrap(node(expression, { scope, type: numberLiteral(expression.value) }));
};
