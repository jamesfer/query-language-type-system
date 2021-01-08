import { functionType, node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { FunctionExpression } from '../types/expression';
import { AttachedTypeDecoration, AttachedTypeNode } from './attached-type-node';
import { Scope } from '../types/scope';
import { shallowStripImplicits } from './utils/shallow-strip-implicits';

export const attachTypeToFunction = (scope: Scope) => (
  expression: FunctionExpression<AttachedTypeNode>,
): TypeResult<AttachedTypeNode> => {
  const state = new TypeWriter(scope);
  return state.wrap(node<AttachedTypeDecoration>(
    expression,
    {
      scope,
      type: functionType(
        expression.body.expression.kind === 'FunctionExpression'
          ? expression.body.decoration.type
          : shallowStripImplicits(expression.body.decoration.type),
        [[shallowStripImplicits(expression.parameter.decoration.type), expression.implicit]],
      ),
    },
  ));
}
