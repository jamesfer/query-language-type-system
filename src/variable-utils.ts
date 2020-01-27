import { flatMap, mapValues, intersection, find, every } from 'lodash';
import { freeVariable, functionType, node } from './constructors';
import { TypedNode } from './type-check';
import {
  unfoldExplicitParameters,
  visitValue,
} from './type-utils';
import { Expression } from './types/expression';
import { Scope } from './types/scope';
import {
  DataValue,
  DualBinding,
  FreeVariable, RecordLiteral,
  SymbolLiteral,
  Value,
} from './types/value';
import { assertNever, checkedZip, spreadApply } from './utils';

export interface VariableReplacement {
  from: string;
  to: Value;
}

export const applyReplacements = (replacements: VariableReplacement[]) => (value: Value): Value => {
  const recurse = applyReplacements(replacements);
  switch (value.kind) {
    case 'FreeVariable':
      if (replacements.length === 0) {
        return value;
      }

      const [replacement, ...remainingReplacements] = replacements;
      return applyReplacements(remainingReplacements)(
        value.name === replacement.from ? replacement.to : value,
      );

    case 'DataValue':
      return {
        ...value,
        parameters: value.parameters.map(recurse),
      };

    case 'RecordLiteral':
      return {
        ...value,
        properties: mapValues(value.properties, recurse),
      };

    case 'DualBinding':
      return {
        ...value,
        left: recurse(value.left),
        right: recurse(value.right),
      };

    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FunctionLiteral':
    case 'SymbolLiteral':
      return value;

    default:
      return assertNever(value);
  }
};

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
          parameters: expression.parameters.map(recurse),
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

export function extractFreeVariableNames(value: Value): string[] {
  switch (value.kind) {
    case 'FreeVariable':
      return [value.name];

    case 'DataValue':
      return flatMap(value.parameters, extractFreeVariableNames);

    case 'RecordLiteral':
      return flatMap(value.properties, extractFreeVariableNames);

    case 'DualBinding':
      return [...extractFreeVariableNames(value.left), ...extractFreeVariableNames(value.right)];

    case 'NumberLiteral':
    case 'BooleanLiteral':
    case 'FunctionLiteral':
    case 'SymbolLiteral':
      return [];

    default:
      return assertNever(value);
  }
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

    case 'FunctionLiteral':
      return [];
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

    case 'FunctionLiteral':
      return [];

    default:
      return assertNever(left);
  }
}

export const usesVariable = (variables: string[]) => (value: Value): boolean => {
  switch (value.kind) {
    case 'SymbolLiteral':
    case 'NumberLiteral':
    case 'BooleanLiteral':
      return false;

    case 'FreeVariable':
      return variables.includes(value.name);

    case 'DataValue':
      return value.parameters.some(usesVariable(variables));

    case 'DualBinding':
      return [value.left, value.right].some(usesVariable(variables));

    case 'FunctionLiteral':
      // TODO
      return false;

    case 'RecordLiteral':
      return Object.values(value.properties).some(usesVariable(variables));

    default:
      return assertNever(value);
  }
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

    case 'DataValue': {
      const rightDataValue = right as DataValue;
      return areValuesEqual(left.name, rightDataValue.name)
        && left.parameters.length === rightDataValue.parameters.length
        && checkedZip(left.parameters, rightDataValue.parameters)
          .every(([leftParam, rightParam]) => areValuesEqual(leftParam, rightParam));
    }

    case 'DualBinding': {
      const rightDualBinding = right as DualBinding;
      return areValuesEqual(left.left, rightDualBinding.left) && areValuesEqual(left.right, rightDualBinding.right)
        || areValuesEqual(left.right, rightDualBinding.left) && areValuesEqual(left.left, rightDualBinding.right);
    }

    case 'FunctionLiteral':
      return false;

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

    default:
      return assertNever(left);
  }
}

export const collapseValue = visitValue({
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
