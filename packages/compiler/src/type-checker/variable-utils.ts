import { every, find, flatMap, identity, intersection } from 'lodash';
import {
  DataValue,
  DualBinding,
  FreeVariable,
  RecordLiteral,
  SymbolLiteral,
  Value,
} from './types/value';
import {
  accumulateStates,
  accumulateStatesUsingOr,
  assertNever,
  checkedZip,
  spreadApply,
} from './utils';
import { visitValue } from './visitor-utils';

export interface VariableReplacement {
  from: string;
  to: Value;
}

export const applyReplacements = (replacements: VariableReplacement[]): (value: Value) => Value => (
  replacements.length === 0
    ? identity
    : visitValue({
      after(value: Value) {
        if (value.kind === 'FreeVariable') {
          const [replacement, ...remainingReplacements] = replacements;
          return replacement.from === value.name
            ? applyReplacements(replacements)(replacement.to)
            : applyReplacements(remainingReplacements)(value);
        }
        return value;
      },
    })
);

export function extractFreeVariableNamesFromValue(inputValue: Value): string[] {
  const [getState, after] = accumulateStates((value: Value) => (
    value.kind === 'FreeVariable' ? [value.name] : []
  ));
  visitValue({ after })(inputValue);
  return getState();
}

export function getBindingsFromPair(left: Value, right: Value): VariableReplacement[] {
  if (left.kind === 'FreeVariable') {
    return [{ from: left.name, to: right }];
  }

  if (right.kind === 'FreeVariable') {
    return [{ from: right.name, to: left }];
  }

  if (left.kind === 'DualBinding') {
    return [...getBindingsFromPair(left.left, right), ...getBindingsFromPair(left.right, right)];
  }

  if (right.kind === 'DualBinding') {
    return [...getBindingsFromPair(left, right.left), ...getBindingsFromPair(left, right.right)];
  }

  switch (left.kind) {
    case 'SymbolLiteral':
    case 'BooleanLiteral':
    case 'NumberLiteral':
    case 'StringLiteral':
      return [];

    case 'DataValue': {
      if (right.kind !== 'DataValue' || right.name !== left.name) {
        return [];
      }

      return flatMap(checkedZip(left.parameters, right.parameters), spreadApply(getBindingsFromPair));
    }

    case 'RecordLiteral': {
      if (right.kind !== 'RecordLiteral') {
        return [];
      }

      const intersectingKeys = intersection(Object.keys(left.properties), Object.keys(right.properties));
      return flatMap(intersectingKeys, key => getBindingsFromPair(left.properties[key], right.properties[key]));
    }

    case 'ApplicationValue':
    case 'FunctionLiteral':
    case 'ImplicitFunctionLiteral':
    case 'ReadDataValueProperty':
    case 'ReadRecordProperty':
    case 'PatternMatchValue':
      return [];

    default:
      return assertNever(left);
  }
}

export const usesVariable = (variables: string[]) => (incomingValue: Value): boolean => {
  const [getState, after] = accumulateStatesUsingOr((value: Value) => (
    value.kind === 'FreeVariable' ? variables.includes(value.name) : false
  ));
  visitValue({ after })(incomingValue);
  return getState();
};

export function areValuesEqual(left: Value, right: Value): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  switch (left.kind) {
    case 'BooleanLiteral':
    case 'NumberLiteral':
    case 'StringLiteral':
      return true;

    case 'SymbolLiteral':
      return (right as SymbolLiteral).name === left.name;

    case 'FreeVariable':
      return (right as FreeVariable).name === left.name;

    case 'DualBinding': {
      const rightDualBinding = right as DualBinding;
      return areValuesEqual(left.left, rightDualBinding.left) && areValuesEqual(left.right, rightDualBinding.right)
        || areValuesEqual(left.right, rightDualBinding.left) && areValuesEqual(left.left, rightDualBinding.right);
    }

    case 'DataValue': {
      const rightDataValue = right as DataValue;
      return areValuesEqual(left.name, rightDataValue.name)
        && left.parameters.length === rightDataValue.parameters.length
        && checkedZip(left.parameters, rightDataValue.parameters)
          .every(([leftParam, rightParam]) => areValuesEqual(leftParam, rightParam));
    }

    case 'RecordLiteral': {
      const rightRecord = right as RecordLiteral;
      if (Object.keys(rightRecord.properties).length !== Object.keys(left.properties).length) {
        return false;
      }

      return every(left.properties, (leftValue, key) => {
        const rightValue = rightRecord.properties[key];
        return rightValue && areValuesEqual(leftValue, rightValue);
      });
    }

    case 'ApplicationValue': {
      if (right.kind !== 'ApplicationValue') {
        return false;
      }

      return areValuesEqual(left.callee, right.callee) && areValuesEqual(left.parameter, right.parameter);
    }

    case 'ImplicitFunctionLiteral':
    case 'FunctionLiteral':
    case 'ReadDataValueProperty':
    case 'ReadRecordProperty':
    case 'PatternMatchValue':
      return false;

    default:
      return assertNever(left);
  }
}
