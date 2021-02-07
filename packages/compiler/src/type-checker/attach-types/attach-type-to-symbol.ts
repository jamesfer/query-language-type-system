import { SymbolExpression } from '../types/expression';
import { node, symbol } from '../constructors';
import { AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';

export const attachTypeToSymbol = (scope: Scope) => (expression: SymbolExpression): AttachedTypeNode => {
  return node(expression, { scope, type: symbol(expression.name) });
}
