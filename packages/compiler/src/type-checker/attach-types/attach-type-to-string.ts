import { node, stringLiteral } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { StringExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToString = (scope: Scope) => (expression: StringExpression): TypeResult<AttachedTypeNode> => {
  return new TypeWriter(scope).wrap(node(expression, { scope, type: stringLiteral(expression.value) }));
};
