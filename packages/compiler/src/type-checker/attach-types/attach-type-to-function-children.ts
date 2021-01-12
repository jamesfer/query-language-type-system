import { freeVariable, scopeBinding } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { Expression, FunctionExpression } from '../types/expression';
import { Scope, ScopeBinding } from '../types/scope';
import { applyReplacements, extractFreeVariablesFromExpression } from '../variable-utils';
import { AttachedTypeNode } from './attached-type-node';

function createBindingsFromFreeVariables(state: TypeWriter, parameterExpression: Expression): ScopeBinding[] {
  const freeVariableNames = extractFreeVariablesFromExpression(parameterExpression);
  return freeVariableNames.map(name => (
    scopeBinding(name, state.scope, applyReplacements(state.replacements)(freeVariable(name)))
  ));
}

export const attachTypeToFunctionChildren = (scope: Scope) => (expression: FunctionExpression) => (
  attachTypes: (scope: Scope) => (expression: Expression) => TypeResult<AttachedTypeNode>,
): TypeResult<FunctionExpression<AttachedTypeNode>> => {
  const state = new TypeWriter(scope);
  const parameter = state.run(attachTypes)(expression.parameter);

  // This is required to happen after we type the parameter as we apply replacements to the bindings that were
  // discovered while typing the parameter
  const bindings = createBindingsFromFreeVariables(state, expression.parameter);
  const body = state.withChildScope((innerState) => {
    innerState.expandScope({ bindings })
    return innerState.run(attachTypes)(expression.body);
  });

  // Apply the body replacements to the parameter before returning
  // TODO this should no longer be needed as all replacements will be lifted to the top level, compressed once, and
  //      the applied to the entire tree as a whole
  return state.wrap({
    ...expression,
    body,
    parameter: {
      ...parameter,
      decoration: {
        ...parameter.decoration,
        type: applyReplacements(state.replacements)(parameter.decoration.type),
      },
    },
  });
};
