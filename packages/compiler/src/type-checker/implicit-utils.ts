import { flatMap, partition } from 'lodash';
import { functionType } from './constructors';
import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { ExplicitValue, Value } from './types/value';
import { assertNever } from './utils';
import { extractFreeVariableNamesFromValue, usesVariable } from './variable-utils';
import { unfoldParameters, visitAndTransformValue } from './visitor-utils';

export function deepExtractImplicitParameters(node: TypedNode): Value[] {
  const [implicits] = extractImplicitsParameters(node.decoration.implicitType);
  const childImplicits = deepExtractImplicitParametersFromExpression(node.expression);
  return [...implicits, ...childImplicits];
}

export function deepExtractImplicitParametersFromExpression(expression: Expression<TypedNode>): Value[] {
  const extractNextImplicits = deepExtractImplicitParameters;
  switch (expression.kind) {
    case 'Identifier':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'SymbolExpression':
    case 'NativeExpression':
      return [];

    case 'RecordExpression':
      return [];
      // return flatMap(expression.properties, extractNextImplicits);

    case 'Application':
      return [];
      // return [...extractNextImplicits(expression.callee), ...extractNextImplicits(expression.parameter)];

    case 'FunctionExpression':
      // We don't extract implicits from the parameters because I don't think they should be handled
      // in the same way
      return extractNextImplicits(expression.body);

    case 'DataInstantiation':
      return [];
      // return flatMap(expression.parameters, extractNextImplicits);

    case 'BindingExpression':
      return [];
      // return extractNextImplicits(expression.body);

    case 'DualExpression':
      return [...extractNextImplicits(expression.left), ...extractNextImplicits(expression.right)];

    case 'ReadRecordPropertyExpression':
      return [];
      // return extractNextImplicits(expression.record);

    case 'ReadDataPropertyExpression':
      return [];
      // return extractNextImplicits(expression.dataValue);

    case 'PatternMatchExpression':
      return [];
      // return [...extractNextImplicits(expression.value), ...flatMap(expression.patterns, ({ test, value }) => (
      //   [...extractNextImplicits(test), ...extractNextImplicits(value)]
      // ))];

    default:
      return assertNever(expression);
  }
}

export function extractImplicitsParameters(type: Value): [Value[], Value] {
  // Strips any implicit values from the result type and stores them in a separate array.
  const implicits: Value[] = [];
  const parameters: Value[] = [];
  let currentType: Value = type;
  for (const [isImplicit, parameter, result] of unfoldParameters(type)) {
    currentType = result;
    // Skip implicit arguments
    if (isImplicit) {
      implicits.push(parameter);
    } else {
      parameters.push(parameter);
    }
  }

  return [implicits, functionType(currentType, parameters)];
}

// export function stripImplicits(type: Value): ExplicitValue {
//   if (type.kind === 'ImplicitFunctionLiteral') {
//     return stripImplicits(type.body);
//   }
//   return type;
// }

function shallowStripImplicits(value: Value<ExplicitValue>): ExplicitValue {
  return value.kind === 'ImplicitFunctionLiteral' ? shallowStripImplicits(value.body) : value;
}

export const stripImplicits = visitAndTransformValue<ExplicitValue>(shallowStripImplicits);

export function stripAllImplicits(types: Value[]): ExplicitValue[] {
  return types.map(stripImplicits);
}

/**
 * Splits a list of values into two lists. The first contains all the values that use at least one
 * free variable in common with relating value. The second shares no free variables.
 */
export function partitionUnrelatedValues(valueList: Value[], relatingValue: Value): [Value[], Value[]] {
  let variableNames = extractFreeVariableNamesFromValue(relatingValue);
  let allRelated: Value[] = [];
  let [related, unrelated] = partition(valueList, usesVariable(variableNames));
  while (related.length > 0) {
    allRelated = [...allRelated, ...related];
    variableNames = [...variableNames, ...flatMap(related, extractFreeVariableNamesFromValue)];
    ([related, unrelated] = partition(unrelated, usesVariable(variableNames)));
  }
  return [allRelated, unrelated];

  // const freeVariables = extractFreeVariableNames(relatingValue);
  // return partition(valueList, usesVariable(freeVariables));
}
