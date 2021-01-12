import { node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { converge } from '../type-utils';
import { DualExpression } from '../types/expression';
import { AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';
import { shallowStripImplicits } from './utils/shallow-strip-implicits';

export const attachTypeToDual = (scope: Scope) => (
  expression: DualExpression<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> => {
  const state = new TypeWriter(scope);
  const leftType = shallowStripImplicits(expression.left.decoration.type);
  const rightType = shallowStripImplicits(expression.right.decoration.type);
  const replacements = converge(scope, leftType, rightType);
  if (!replacements) {
    state.log('Left and right side of dual expression are not the same type');
  } else {
    state.recordReplacements(replacements);
  }
  return state.wrap(node(expression, { scope, type: leftType }));
}
