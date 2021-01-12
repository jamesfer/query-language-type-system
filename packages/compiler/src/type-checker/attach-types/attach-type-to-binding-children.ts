import { BindingExpression, Expression } from '../..';
import { TypeResult, TypeWriter } from '../monad-utils';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from './utils/shallow-strip-implicits';

export const attachTypeToBindingChildren = (scope: Scope) => (expression: BindingExpression) => (
  attachTypes: (scope: Scope) => (expression: Expression) => TypeResult<AttachedTypeNode>,
): TypeResult<BindingExpression<AttachedTypeNode>> => {
  const state = new TypeWriter(scope);
  const value = state.run(attachTypes)(expression.value);

  const body = state.withChildScope((innerState) => {
    innerState.expandScope({
      bindings: [{
        scope,
        kind: 'ScopeBinding',
        name: expression.name,
        type: value.expression.kind === 'FunctionExpression'
          ? value.decoration.type
          : shallowStripImplicits(value.decoration.type),
      }],
    });

    return innerState.run(attachTypes)(expression.body);
  });

  return state.wrap({ ...expression, value, body });
};
