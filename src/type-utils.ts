import { find, flatten, map, uniqueId } from 'lodash';
import { freeVariable, scopeBinding } from './constructors';
import { TypeResult, TypeWriter } from './monad-utils';
import { Message } from './types/message';
import { Scope } from './types/scope';
import {
  BooleanLiteral,
  DataValue,
  DualBinding,
  FreeVariable,
  RecordLiteral,
  SymbolLiteral,
  Value,
} from './types/value';
import { assertNever, checkedZip, everyIs, isDefined } from './utils';
import { applyReplacements, VariableReplacement } from './variable-utils';

/**
 * Looks at two values and tries to infer as much information about the free variables as possible
 * based on any corresponding value in the value. Returns undefined if the two parameters are not
 * compatible.
 */
export function fitsShape(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined {
  if (child.kind === 'FreeVariable' && shape.kind !== 'FreeVariable' && shape.kind !== 'DualBinding') {
    return [{ from: child.name, to: shape }];
  }

  switch (shape.kind) {
    case 'NumberLiteral':
    case 'BooleanLiteral':
      return child.kind === shape.kind && child.value === shape.value ? [] : undefined;

    case 'SymbolLiteral':
      return child.kind === shape.kind && child.name === shape.name ? [] : undefined;

    case 'FreeVariable':
      return [{ from: shape.name, to: child }];

    case 'DualBinding': {
      const leftResult = fitsShape(scope, shape.left, child);
      const rightResult = fitsShape(scope, shape.right, child);
      return leftResult && rightResult ? [...leftResult, ...rightResult] : undefined;
    }

    case 'RecordLiteral': {
      if (child.kind !== 'RecordLiteral') {
        return undefined;
      }

      const replacementArrays = map(shape.properties, (value, key) => (
        key in child.properties
          ? fitsShape(scope, value, child.properties[key])
          : undefined
      ));

      return everyIs(replacementArrays, isDefined) ? flatten(replacementArrays) : undefined;
    }

    case 'DataValue': {
      // TODO if it turns out that we don't need to do much more, then the scope parameter should be
      //      removed from this function
      // if (child.kind !== 'DataValue' || child.name !== shape.name || child.parameters.length !== shape.parameters.length) {
      if (child.kind !== 'DataValue' || child.parameters.length !== shape.parameters.length) {
        return undefined;
      }

      const nameReplacements = fitsShape(scope, shape.name, child.name);
      if (!nameReplacements) {
        return undefined;
      }

      const replacements = checkedZip(shape.parameters, child.parameters)
        .map(([shapeParameter, childParameter]) => fitsShape(scope, shapeParameter, childParameter));
      return everyIs(replacements, isDefined) ? flatten([nameReplacements, ...replacements]) : undefined;
    }

    case 'ImplicitFunctionLiteral':
    case 'FunctionLiteral': {
      if (child.kind !== shape.kind) {
        return undefined;
      }

      const parameterReplacements = fitsShape(scope, shape.parameter, child.parameter);
      if (!parameterReplacements) {
        return undefined;
      }

      const bodyReplacements = fitsShape(scope, shape.body, child.body);
      if (!bodyReplacements) {
        return undefined;
      }

      return [...parameterReplacements, ...bodyReplacements];
    }

    case 'ApplicationValue': {
      if (child.kind !== shape.kind) {
        return undefined;
      }

      const calleeReplacements = fitsShape(scope, shape.callee, child.callee);
      if (!calleeReplacements) {
        return undefined;
      }

      const parameterReplacements = fitsShape(scope, shape.parameter, child.parameter);
      if (!parameterReplacements) {
        return undefined;
      }

      return [...calleeReplacements, ...parameterReplacements];
    }

    case 'ReadDataValueProperty':
    case 'ReadRecordProperty':
      return undefined;

    default:
      return assertNever(shape);
  }
}

/**
 * Looks at all the free variables in the shape and generates an expression represents each variable
 * based on value.
 */
export function destructureValue(shape: Value, value: Value): VariableReplacement[] | undefined {
  switch (shape.kind) {
    case 'SymbolLiteral':
      return value.kind === 'SymbolLiteral' && value.name === shape.kind ? [] : undefined;

    case 'NumberLiteral':
    case 'BooleanLiteral':
      return value.kind === shape.kind && value.value === shape.value ? [] : undefined;

    case 'FreeVariable':
      return [{ from: shape.name, to: value }];

    case 'DualBinding':
      const leftReplacements = destructureValue(shape.left, value);
      const rightReplacements = destructureValue(shape.right, value);
      return leftReplacements && rightReplacements
        ? [...leftReplacements, ...rightReplacements]
        : undefined;

    case 'DataValue': {
      const replacements = shape.parameters.map((shapeParameter, index) => (
        destructureValue(shapeParameter, {
          kind: 'ReadDataValueProperty',
          property: index,
          dataValue: value,
        })
      ));
      // const replacements = checkedZipWith(shape.parameters, value.parameters, destructureValue);
      return everyIs(replacements, isDefined) ? flatten(replacements) : undefined;
    }

    case 'RecordLiteral':
      const replacements = map(shape.properties, (shapeParameter, property) => (
        destructureValue(shapeParameter, {
          property,
          kind: 'ReadRecordProperty',
          record: value,
        })
      ));
      // const replacements = map(shape.properties, (property, key) => (
      //   value.properties[key] ? destructureValue(property, value.properties[key]) : undefined
      // ));
      return everyIs(replacements, isDefined) ? flatten(replacements) : undefined;

    case 'ReadRecordProperty':
    case 'ReadDataValueProperty':
    case 'FunctionLiteral':
    case 'ImplicitFunctionLiteral':
    case 'ApplicationValue':
      return [];

    default:
      return assertNever(shape);
  }
}

function removeImplicitParameters(value: Value): Value {
  return value.kind === 'ImplicitFunctionLiteral'
    ? removeImplicitParameters(value.body)
    : value;
}

export function canSatisfyShape(scope: Scope, shape: Value, child: Value): VariableReplacement[] | undefined {
  return fitsShape(scope, removeImplicitParameters(shape), removeImplicitParameters(child));
}

export function areAllPairsSubtypes(
  scope: Scope,
  pairGenerator: Iterable<[Value, Value]>,
  onFailure: (constraint: Value, parameter: Value, index: number) => Message,
): [Message[], VariableReplacement[]] {
  const allReplacements: VariableReplacement[] = [];
  const messages: Message[] = [];
  let index = 0;
  for (const [constraint, parameter] of pairGenerator) {
    // Apply previous replacements to constraint
    const replacedConstraint = applyReplacements(allReplacements)(constraint);

    // Find new replacements
    const replacements = canSatisfyShape(scope, replacedConstraint, parameter);
    if (!replacements) {
      messages.push(onFailure(constraint, parameter, index));
    } else {
      allReplacements.push(...replacements);
    }

    index += 1;

    // Replace all variables on the right-hand side of the replacements with variables that
    // don't exist in the current left-hand expression or any of its replacements
    // const takenVariables = flatten([
    //   extractFreeVariableNames(calleeType),
    //   ...allReplacements.map(({ to }) => extractFreeVariableNames(to)),
    // ]);
    // const safeReplacements = renameTakenVariables(takenVariables, replacements);
  }

  return [messages, allReplacements];
}

const applyReplacementsToScope = (scope: Scope) => (variableReplacements: VariableReplacement[]): TypeResult<undefined> => {
  const newScope: Scope = {
    bindings: [
      ...scope.bindings.map(binding => {
        const newType: Value = find(variableReplacements, { from: binding.name })?.to || binding.type;
        return {
          ...binding,
          type: applyReplacements(variableReplacements)(newType),
        };
      }),
      ...variableReplacements
        .filter(replacement => !find(scope.bindings, { name: replacement.from }))
        .map(replacement => scopeBinding(replacement.from, scope, replacement.to)),
    ],
  };

  return new TypeWriter(newScope).wrap(undefined);
};


export function newFreeVariable(prefix: string): FreeVariable {
  return freeVariable(uniqueId(prefix));
}

