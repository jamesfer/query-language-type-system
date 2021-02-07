import { BindingExpression, Expression } from '../..';
import { expandScope } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';

export const attachTypeToBindingChildren = (scope: Scope) => (expression: BindingExpression) => (
  attachTypes: (scope: Scope) => (expression: Expression) => AttachedTypeNode,
): BindingExpression<AttachedTypeNode> => {
  const value = attachTypes(scope)(expression.value);

  const childScope = expandScope(scope, {
    bindings: [{
      scope,
      kind: 'ScopeBinding',
      name: expression.name,
      type: value.expression.kind === 'FunctionExpression'
        ? value.decoration.type
        : shallowStripImplicits(value.decoration.type),
    }],
  });
  const body = attachTypes(childScope)(expression.body);

  return { ...expression, value, body };
};
