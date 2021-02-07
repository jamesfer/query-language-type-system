import { expandScope, freeVariable, scopeBinding } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { Expression, FunctionExpression } from '../types/expression';
import { Scope, ScopeBinding } from '../types/scope';
import { applyReplacements, extractFreeVariablesFromExpression } from '../variable-utils';
import { AttachedTypeNode } from './attached-type-node';

function createBindingsFromFreeVariables(scope: Scope, parameterExpression: Expression): ScopeBinding[] {
  const freeVariableNames = extractFreeVariablesFromExpression(parameterExpression);
  return freeVariableNames.map(name => scopeBinding(name, scope, freeVariable(name)));
}

export const attachTypeToFunctionChildren = (scope: Scope) => (expression: FunctionExpression) => (
  attachTypes: (scope: Scope) => (expression: Expression) => AttachedTypeNode,
): FunctionExpression<AttachedTypeNode> => {
  const parameter = attachTypes(scope)(expression.parameter);

  // This is required to happen after we type the parameter as we apply replacements to the bindings that were
  // discovered while typing the parameter
  const bindings = createBindingsFromFreeVariables(scope, expression.parameter);
  const innerScope = expandScope(scope, { bindings });
  const body = attachTypes(innerScope)(expression.body);

  // Apply the body replacements to the parameter before returning
  return { ...expression, body, parameter };
};
