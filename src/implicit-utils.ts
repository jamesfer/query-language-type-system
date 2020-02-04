import { flatMap } from 'lodash';
import { functionType } from './constructors';
import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { ExplicitValue, Value } from './types/value';
import { assertNever } from './utils';
import { unfoldParameters, visitAndTransformValue } from './visitor-utils';

const extractImplicitParametersFromNode = (depth: number) => (node: TypedNode): Value[] => {
  const [implicits] = depth > 0 ? extractImplicitsParameters(node.decoration.implicitType) : [[]];
  const childImplicits = extractImplicitParametersFromExpression(depth)(node.expression);
  return [...implicits, ...childImplicits];
};

export const extractImplicitParameters = extractImplicitParametersFromNode(1);

const extractImplicitParametersFromExpression = (depth: number) => (expression: Expression<TypedNode>): Value[] => {
  const extractNextImplicits = extractImplicitParametersFromNode(depth);
  switch (expression.kind) {
    case 'Identifier':
    case 'NumberExpression':
    case 'BooleanExpression':
    case 'SymbolExpression':
      return [];

    case 'RecordExpression':
      return flatMap(expression.properties, extractNextImplicits);

    case 'Application':
      return [...extractNextImplicits(expression.callee), ...extractNextImplicits(expression.parameter)];

    case 'FunctionExpression':
      // We don't extract implicits from the parameters because I don't think they should be handled
      // in the same way
      return extractNextImplicits(expression.body);

    case 'DataInstantiation':
      return flatMap(expression.parameters, extractNextImplicits);

    case 'BindingExpression':
      return extractNextImplicits(expression.body);

    case 'DualExpression':
      return [...extractNextImplicits(expression.left), ...extractNextImplicits(expression.right)];

    case 'ReadRecordPropertyExpression':
      return extractNextImplicits(expression.record);

    case 'ReadDataPropertyExpression':
      return extractNextImplicits(expression.dataValue);

    default:
      return assertNever(expression);
  }
};

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
