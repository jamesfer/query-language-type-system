import { convergeValues } from '../converge-values';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { visitAndTransformValue } from '../visitor-utils';
import { Scope } from '../build-scoped-node';

function filterBindingsBy(scope: Scope, f: (value: Value, string: String) => boolean): [string, Value][] {
  const accumulator: [string, Value][] = [];

  for (const name in scope.bindings) {
    if (f(scope.bindings[name], name)) {
      accumulator.push([name, scope.bindings[name]]);
    }
  }

  return accumulator;
}

function findBinding(scope: Scope, name: string): Value | undefined {
  return scope.bindings[name];
}

/**
 * Used to determine if a value has a built in implementation such as for Integers and Strings.
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

  if (
    innerValue.kind === 'ApplicationValue'
    && innerValue.callee.kind === 'FreeVariable'
    && (
      innerValue.parameter.kind === 'StringLiteral'
      || innerValue.parameter.kind === 'NumberLiteral'
    )
  ) {
    const name = innerValue.parameter.kind === 'StringLiteral' ? 'String'
      : Number.isInteger(innerValue.parameter.value) ? 'Integer' : 'Float';
    return {
      kind: 'DataValue',
      name: { name, kind: 'SymbolLiteral' },
      parameters: [innerValue.parameter],
    };
  }

  return undefined;
}

const canSatisfyShape = (shape: Value) => (child: Value): boolean => {
  // TODO fix converge expression requirements types
  const messageState = new StateRecorder<Message>();
  convergeValues(messageState, shape, null as any, child, null as any, 'leftSpecific');
  return messageState.values.length === 0;
}

export function findMatchingImplementations(scope: Scope, value: Value): [string, Value][] {
  const builtInImplementation = hasBuiltInImplementation(scope, value);
  if (builtInImplementation) {
    return [['BUILT_IN', builtInImplementation]];
  }

  return filterBindingsBy(scope, canSatisfyShape(value));
}
