import { find, flatMap } from 'lodash';
import { eScopeBinding, eScopeShapeBinding, expandScope, scopeBinding } from './constructors';
import { evaluateExpression } from './evaluate';
import { canSatisfyShape } from './type-utils';
import { EvaluationScope } from './types/evaluation-scope';
import { Scope, ScopeBinding } from './types/scope';
import { Value } from './types/value';
import { VariableReplacement } from './variable-utils';
import { visitAndTransformValue } from './visitor-utils';

/**
 * Used to determine if a value has a built in implementation such as for Integers.
 */
function hasBuiltInImplementation(scope: Scope, value: Value): Value | undefined {
  // Strip meaningless wrappers from the value
  const innerValue = visitAndTransformValue<Value>((value): Value => {
    switch (value.kind) {
      case 'DualBinding':
        if (value.left.kind === 'FreeVariable' && findBinding(scope, value.left.name) === undefined) {
          return value.right;
        }

        if (value.right.kind === 'FreeVariable' && findBinding(scope, value.right.name) === undefined) {
          return value.left;
        }

        return value;

      default:
        return value;
    }
  })(value);

  if (
    innerValue.kind === 'DataValue'
    && innerValue.name.kind === 'SymbolLiteral'
    && innerValue.parameters.length === 1
    && (
      innerValue.name.name === 'Integer'
      && innerValue.parameters[0].kind === 'NumberLiteral'
      && Number.isInteger(innerValue.parameters[0].value)
      || innerValue.name.name === 'Float'
      && innerValue.parameters[0].kind === 'NumberLiteral'
      || innerValue.name.name === 'String'
      && innerValue.parameters[0].kind === 'StringLiteral'
    )
  ) {
    return innerValue;
  }

  return undefined;
}

export function findMatchingImplementations(scope: Scope, value: Value): ScopeBinding[] {
  const builtInImplementation = hasBuiltInImplementation(scope, value);
  if (builtInImplementation) {
    return [{
      scope,
      kind: 'ScopeBinding',
      type: builtInImplementation,
      name: 'BUILT_IN',
    }];
  }

  const evaluateWithScope = evaluateExpression(scopeToEScope(scope));
  return scope.bindings.filter(binding => {
    const bindingValue = binding.expression ? evaluateWithScope(binding.expression) : binding.type;
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

export function expandScopeWithReplacements(scope: EvaluationScope, replacements: VariableReplacement[]) {
  return {
    bindings: [
      ...scope.bindings,
      ...replacements.map(({ from, to }) => eScopeShapeBinding(from,  to))
    ],
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
