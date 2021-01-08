import { SymbolExpression } from '../types/expression';
import { node, symbol } from '../constructors';
import { AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';
import { TypeResult, TypeWriter } from '../monad-utils';

export const attachTypeToSymbol = (scope: Scope) => (expression: SymbolExpression): TypeResult<AttachedTypeNode> => {
  return new TypeWriter(scope).wrap(node(expression, { scope, type: symbol(expression.name) }));
}
