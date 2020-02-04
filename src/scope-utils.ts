import {
  dataValue,
  eScopeBinding,
  eScopeShapeBinding,
  expandScope,
  scopeBinding,
} from './constructors';
import { evaluateExpression } from './evaluate';
import { canSatisfyShape } from './type-utils';
import { EvaluationScope } from './types/evaluation-scope';
import { Scope, ScopeBinding } from './types/scope';
import { Value } from './types/value';
import { find, flatMap } from 'lodash';
import { VariableReplacement } from './variable-utils';

export function findMatchingImplementations(scope: Scope, value: Value): ScopeBinding[] {
  console.log('Resolving implicit value', JSON.stringify(value, undefined, 2));
  const evaluateWithScope = evaluateExpression(scopeToEScope(scope));
  return scope.bindings.filter(binding => {
    const bindingValue = binding.expression ? evaluateWithScope(binding.expression) : binding.type;
    console.log('- Possible value', JSON.stringify(bindingValue, undefined, 2));
    return bindingValue && canSatisfyShape(scope, value, bindingValue);
    // return (
    //   binding.callee === callee
    //   && binding.parameters.length === parameters.length
    //   && checkedZip(binding.parameters, parameters)
    //     .everyIs(([implementationParameter, parameter]) => (
    //       typesAreEqual(implementationParameter, parameter)
    //     ))
    // );
  });
}

// export function implementationExistsInScope(scope: Scope, callee: string, parameters: Value[]): boolean {
//   return findMatchingImplementations(scope, callee, parameters).length > 0;
// }

export function scopeToEScope(scope: Scope): EvaluationScope {
  return {
    bindings: flatMap(scope.bindings, ({ name, type, expression }) => (
      expression ? eScopeBinding(name, expression) : eScopeShapeBinding(name, type)
    )),
  };
}

export function addReplacementsToScope(scope: Scope, replacements: VariableReplacement[]): Scope {
  return expandScope(scope, {
    bindings: replacements.map(({ from, to }) => scopeBinding(from, scope, to)),
  });
}

export function findBinding(scope: Scope, name: string): ScopeBinding | undefined {
  return find(scope.bindings, { name });
}
