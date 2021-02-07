import { node } from '../constructors';
import { convergeValues } from '../converge-values';
import { TypeResult, TypeWriter } from '../monad-utils';
import { converge } from '../type-utils';
import { DualExpression } from '../types/expression';
import { AttachTypesState } from './attach-types-state';
import { AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';

export const attachTypeToDual = (state: AttachTypesState) => (scope: Scope) => (
  expression: DualExpression<AttachedTypeNode>,
): AttachedTypeNode => {
  const leftType = shallowStripImplicits(expression.left.decoration.type);
  const rightType = shallowStripImplicits(expression.right.decoration.type);
  // TODO fix as any
  const [messages, inferredTypes] = convergeValues(scope, leftType, expression.left.expression as any, rightType, expression.right.expression as any);
  state.log(messages);
  state.recordInferredTypes(inferredTypes);
  return node(expression, { scope, type: leftType });
}
