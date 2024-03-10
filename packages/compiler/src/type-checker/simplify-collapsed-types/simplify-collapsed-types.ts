import { CollapsedInferredTypeMap } from '../types/inferred-type';
import { mapValues } from 'lodash';
import { visitAndTransformValue } from '../utils/visitor-utils';
import { Value } from '../types/value';
import { CountMap } from '../../utils/count-map';
import { pipe } from '../utils/utils';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';

function cacheValues(f: (value: Value) => Value): (value: Value) => Value {
  const cache: { [k: string]: Value } = {};

  return (value: Value): Value => {
    if (value.kind === 'FreeVariable' && value.name in cache) {
      return cache[value.name];
    }

    const result = f(value);

    if (value.kind === 'FreeVariable') {
      cache[value.name] = result;
    }

    return result;
  };
}

function protectAgainstRecursiveTypes(f: (value: Value) => Value): (value: Value) => Value {
  const visitedVariables = new CountMap<string>();

  return (value: Value): Value => {
    if (value.kind !== 'FreeVariable') {
      return f(value);
    }

    if (visitedVariables.has(value.name)) {
      return value;
    }

    visitedVariables.increment(value.name);
    const result = f(value);
    visitedVariables.decrement(value.name);

    return result;
  };
}

function simplifyValue(
  collapsedTypes: CollapsedInferredTypeMap,
  recursivelySimplifyValue: (value: Value) => Value,
  // visitedVariables: CountMap<string>,
): (value: Value) => Value {
  return visitAndTransformValue((value: Value) => {
    if (value.kind !== 'FreeVariable' || !(value.name in collapsedTypes)) {
      return value;
    }

    // If the type is recursive, skip it
    // if (visitedVariables.has(value.name)) {
    //   return value;
    // }

    // visitedVariables.increment(value.name);
    const result = recursivelySimplifyValue(collapsedTypes[value.name].to);
    // visitedVariables.decrement(value.name);

    return result;
  });
}

export interface SimplifiedInferredType {
  from: string;
  to: Value;
}

export type SimplifiedInferredTypeMap = { [k: string]: SimplifiedInferredType };

export function simplifyCollapsedTypes(
  collapsedTypes: CollapsedInferredTypeMap,
): SimplifiedInferredTypeMap {
  return mapValues(collapsedTypes, (collapsedType) => {
    // This pipe utility is in the reverse order
    const simplifyValueRecursively: (value: Value) => Value = pipe(
      cacheValues,
      protectAgainstRecursiveTypes,
      simplifyValue(collapsedTypes, value => simplifyValueRecursively(value)),
    );

    const simplifiedValue = simplifyValueRecursively(collapsedType.to);
    const strippedValue = collapsedType.operator === 'EvaluatedFrom'
      ? shallowStripImplicits(simplifiedValue)
      : simplifiedValue;

    return {
      from: collapsedType.from,
      to: strippedValue,
    };
  });
}
