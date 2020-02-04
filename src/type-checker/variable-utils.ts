import { every, find, flatMap, identity, intersection, mapValues } from 'lodash';
import { freeVariable, functionType, node } from './constructors';
import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { Scope } from './types/scope';
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
import { unfoldExplicitParameters, visitValue } from './visitor-utils';

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

export const recursivelyApplyReplacementsToNode = (replacements: VariableReplacement[]) => ({ expression, decoration }: TypedNode): TypedNode => {
  return node(
    recursivelyApplyReplacements(replacements)(expression),
    {
      ...decoration,
      type: applyReplacements(replacements)(decoration.type)
    },
  );
};

export const recursivelyApplyReplacements = (replacements: VariableReplacement[]) =>
  (expression: Expression<TypedNode>): Expression<TypedNode> => {
    const recurse = recursivelyApplyReplacementsToNode(replacements);
    switch (expression.kind) {
      case 'SymbolExpression':
      case 'Identifier':
      case 'NumberExpression':
      case 'BooleanExpression':
      case 'FunctionExpression':
        return expression;

      case 'Application':
        return {
          ...expression,
          callee: recurse(expression.callee),
          parameter: recurse(expression.parameter),
        };

      case 'DataInstantiation':
        return {
          ...expression,
          parameters: expression.parameters.map(recurse),
        };

      case 'RecordExpression':
        return {
          ...expression,
          properties: mapValues(expression.properties, recurse),
        };

      case 'BindingExpression':
        return {
          ...expression,
          value: recurse(expression.value),
          body: recurse(expression.body),
        };

      case 'DualExpression':
        return {
          ...expression,
          left: recurse(expression.left),
          right: recurse(expression.right),
        };

      case 'ReadRecordPropertyExpression':
        return {
          ...expression,
          record: recurse(expression.record),
        };

      case 'ReadDataPropertyExpression':
        return {
          ...expression,
          dataValue: recurse(expression.dataValue),
        };

      // case 'ImplementExpression':
      //   return {
      //     ...expression,
      //     parameters: expression.parameters.map(recurse),
      //     body: recurse(expression.body),
      //   };

      // case 'DataDeclaration':
      //   return {
      //     ...expression,
      //     parameters: expression.parameters.map(recurse),
      //     body: recurse(expression.body),
      //   };

      default:
        return assertNever(expression);
    }
  };

export function extractFreeVariableNames(inputValue: Value) {
  const [getState, after] = accumulateStates((value: Value) => (
    value.kind === 'FreeVariable' ? [value.name] : []
  ));
  visitValue({ after })(inputValue);
  return getState();
}

export function nextFreeName(taken: string[], prefix = 'var'): string {
  const match = prefix.match(/(.*?)([0-9]*)/);
  const name = match ? match[0] : prefix;
  let number = match ? +match[1] : 0;
  let freeName;
  do {
    freeName = `${name}${number === 0 ? '' : number}`;
    number += 1;
  } while (taken.includes(freeName));
  return freeName;
}

export function renameTakenVariables(takenVariables: string[], replacements: VariableReplacement[]): VariableReplacement[] {
  const allVariables = [...takenVariables];
  return replacements.map(({ from, to }) => {
    const remainingReplacements = extractFreeVariableNames(to)
      .filter(name => allVariables.includes(name))
      .map((name) => {
        const newName = nextFreeName(allVariables, name);
        allVariables.push(newName);
        return { from: name, to: freeVariable(newName) };
      });
    return {
      from,
      to: applyReplacements(remainingReplacements)(to),
    };
  });
}

export function getBindingsFromValue(value: Value): VariableReplacement[] {
  switch (value.kind) {
    case 'SymbolLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FreeVariable':
      return [];

    case 'DualBinding':
      return getBindingsFromPair(value.left, value.right);

    case 'DataValue':
      return flatMap(value.parameters, getBindingsFromValue);

    case 'RecordLiteral':
      return flatMap(value.properties, getBindingsFromValue);

    case 'ApplicationValue':
      return [];

    case 'FunctionLiteral':
    case 'ImplicitFunctionLiteral':
      return [];

    case 'ReadDataValueProperty':
      return getBindingsFromValue(value.dataValue);

    case 'ReadRecordProperty':
      return getBindingsFromValue(value.record);

    default:
      return assertNever(value);
  }
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
    case 'NumberLiteral':
    case 'BooleanLiteral':
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

export const substituteVariables = (scope: Scope): (value: Value) => Value => visitValue({
  after(value: Value) {
    if (value.kind === 'FreeVariable') {
      const binding = find(scope.bindings, { name: value.name });
      if (binding) {
        return substituteVariables(scope)(binding.type);
      }
    }

    return value;
  },
});

export function areValuesEqual(left: Value, right: Value): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  switch (left.kind) {
    case 'NumberLiteral':
    case 'BooleanLiteral':
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
      return false;

    default:
      return assertNever(left);
  }
}

const collapseValue = visitValue({
  after(value: Value) {
    if (value.kind === 'DualBinding') {
      return areValuesEqual(value.left, value.right) ? value.left : value;
    }

    if (value.kind === 'ApplicationValue' && extractFreeVariableNames(value.parameter).length === 0) {
      return applyParameter(value.parameter, value.callee);
    }

    return value;
  },
});

export function applyParameter(parameter: Value, func: Value): Value {
  // if (!isFunctionType(func)) {
  //   throw new Error(`Tried to apply parameters to a data value that is not a function. Actual: ${JSON.stringify(func, undefined, 2)}`);
  // }

  for (const [expectedParameter, body, skippedImplicits] of unfoldExplicitParameters(func)) {
    const bindings = getBindingsFromPair(parameter, expectedParameter);
    const newBody = collapseValue(applyReplacements(bindings)(body));
    return functionType(newBody, skippedImplicits.map(implicit => [implicit, true]));
  }

  return func;
}
