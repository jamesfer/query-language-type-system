import { flatMap, flatten, mapValues, partition } from 'lodash';
import { functionType, identifier, node } from './constructors';
import {
  extractImplicitsParameters,
  partitionUnrelatedValues,
  stripImplicits,
} from './implicit-utils';
import { findMatchingImplementations } from './scope-utils';
import { TypedDecoration, TypedNode } from './type-check';
import { areAllPairsSubtypes } from './type-utils';
import { Application, Expression } from './types/expression';
import { Message } from './types/message';
import { Scope, ScopeBinding } from './types/scope';
import { DataValue, Value } from './types/value';
import { assertNever, checkedZipWith, permuteArrays, unzip, unzipObject } from './utils';
import { extractFreeVariableNames, usesVariable } from './variable-utils';

function findImplementationFor(scope: Scope, parameter: Value): string | undefined {
  const implementations = findMatchingImplementations(scope, parameter);
  return implementations.length === 1 ? implementations[0].name : undefined;
}

function iterateExpression(expression: Expression<TypedNode>, type: Value): [Message[], Expression<TypedNode>] {
  switch (expression.kind) {
    case 'SymbolExpression':
    case 'NumberExpression':
    case 'BooleanExpression':
    case 'Identifier':
      return [[], expression];

    case 'DataInstantiation': {
      const [messagesArray = [], parameters = []] = unzip(
        expression.parameters.map(strictResolveImplicitParameters),
      );
      const [calleeMessages, callee] = strictResolveImplicitParameters(expression.callee);
      return [flatten([calleeMessages, ...messagesArray]), { ...expression, parameters, callee }];
    }

    case 'DualExpression': {
      const [leftMessages, left] = strictResolveImplicitParameters(expression.left);
      const [rightMessages, right] = strictResolveImplicitParameters(expression.right);
      return [[...leftMessages, ...rightMessages], { ...expression, left, right }];
    }

    case 'Application': {
      // console.log('Resolving application', JSON.stringify(expression.callee.decoration.scope.bindings.map(({ node, callee }) => ({ callee, value: stripNode(node) })), undefined, 2));
      const [messagesArray, parameter] = strictResolveImplicitParameters(expression.parameter);
      const [calleeMessages, callee] = strictResolveImplicitParameters(expression.callee);
      return [flatten([...messagesArray, calleeMessages]), { ...expression, parameter, callee }];
    }

    case 'FunctionExpression': {
      if (type.kind !== 'FunctionLiteral') {
        throw new Error(`Not sure how to convert a function expression that does not have a function type. Actual: ${type.kind}`);
      }

      const [messages, body] = strictResolveImplicitParameters(expression.body);
      return [messages, { ...expression, body }];
    }

    case 'RecordExpression': {
      const [messages = {}, properties = {}] = unzipObject(mapValues(expression.properties, strictResolveImplicitParameters));
      return [flatMap(messages), {
        ...expression,
        properties: properties,
      }];
    }

    case 'BindingExpression': {
      // Any implicits attached to the top level of the value cannot be resolved because they have
      // still have some free variables in them. Instead we just want to resolve all the implicits
      // lower down in the chain. After adding the requested implicits to the scope.
      // TODO
      const [valueMessages, value] = resolveImplicitParameters(expression.value, true);
      const [bodyMessages, body] = strictResolveImplicitParameters(expression.body);
      return [[...valueMessages, ...bodyMessages], {
        ...expression,
        value: value,
        body: body,
      }];
    }

    case 'ReadRecordPropertyExpression': {
      const [messages, record] = strictResolveImplicitParameters(expression.record);
      return [messages, {
        ...expression,
        record,
      }];
    }

    case 'ReadDataPropertyExpression': {
      const [messages, dataValue] = strictResolveImplicitParameters(expression.dataValue);
      return [messages, {
        ...expression,
        dataValue,
      }];
    }

    default:
      return assertNever(expression);
  }
}

function strictResolveImplicitParameters(typedNode: TypedNode): [Message[], TypedNode] {
  return resolveImplicitParameters(typedNode);
}

function getImplicitImplementations(scope: Scope, value: Value): { result: Value, implementations: ScopeBinding[], skippedImplicits: Value[], messages: Message[] } {
  // Find all the implicit parts of the type
  const [implicitParameters, result] = extractImplicitsParameters(value);
  if (implicitParameters.length === 0) {
    return { result, implementations: [], skippedImplicits: [], messages: [] };
  }

  // Find all the implicit parts of the type that only mention unbound parameters not in the above list
  const [skippedImplicits, implicitsToFill] = partitionUnrelatedValues(implicitParameters, result);
  if (implicitsToFill.length === 0) {
    return { result, skippedImplicits, implementations: [], messages: [] };
  }

  // Find all possible implementations of those implicits
  const possibleImplementations = implicitsToFill.map(implicit => findMatchingImplementations(scope, implicit));

  // Perform cartesian product of all the possibilities
  const possibleCombinations = permuteArrays(possibleImplementations);

  // Remove any that have conflicting binds
  const validCombinations = possibleCombinations.filter(combination => {
    const pairs = checkedZipWith(implicitsToFill, combination, (implicit, { type }): [Value, Value] => [implicit, type]);
    const [messages, replacements] = areAllPairsSubtypes(scope, pairs, () => 'Failed');
    return messages.length === 0;
  });

  // If there is more than one possible set of replacements for a implicit parameter, that parameter is ambiguous
  if (validCombinations.length > 1) {
    return {
      result,
      skippedImplicits,
      implementations: [],
      messages: [`Implicits were ambiguous. ${validCombinations.length} possible sets of values found for ${implicitsToFill.length} implicits`],
    };
  }

  // If there are no possibilities then the implicits are unresolvable
  if (validCombinations.length === 0) {
    return {
      result,
      skippedImplicits,
      implementations: [],
      messages: ['Could not find a valid set of replacements for implicits'],
    };
  }

  return {
    result,
    skippedImplicits,
    implementations: validCombinations[0],
    messages: [],
  }
}

export function resolveImplicitParameters(typedNode: TypedNode, allowedUnresolved = false): [Message[], TypedNode] {
  // TODO use allowed unresolved

  if (typedNode.expression.kind === 'Application' && typedNode.expression.callee.expression.kind === 'Identifier' && typedNode.expression.callee.expression.name === 'go') {
    console.log(1);
  }

  const { expression, decoration: { scope, implicitType: type } } = typedNode;
  const { result, skippedImplicits, implementations, messages } = getImplicitImplementations(scope, type);

  // Recurse through the rest of the tree
  const [expressionMessages, resolvedExpression] = iterateExpression(expression, result);

  // If there is only one remaining possible set of replacements for each implicit parameter, then that is the answer
  const finalType = functionType(result, skippedImplicits.map(value => [value, true]));
  return [[...messages, ...expressionMessages], implementations.reduce<TypedNode>(
    (callee, { name, type, scope }) => node(
      {
        callee,
        kind: 'Application',
        parameter: node(identifier(name), { type: stripImplicits(type), implicitType: type, scope }),
      },
      {
        scope,
        type: stripImplicits(finalType),
        implicitType: finalType,
      },
    ),
    node(resolvedExpression, { type: stripImplicits(finalType), implicitType: finalType, scope }),
  )];

  // TODO
  // Work out any additional replacements that have been discovered through the resolution process
  // Apply those to the remaining type
}

// export function resolveImplicitParametersOld(typedNode: TypedNode, allowUnresolved = false): [Message[], TypedNode] {
//   const { expression, decoration: { scope } } = typedNode;
//   let remainingType = typedNode.decoration.type;
//   let discoveredImplementations: { name: string, type: Value }[] = [];
//   const skippedImplicits: Value[] = [];
//   const messages: Message[] = [];
//   while (remainingType.kind === 'DataValue' && remainingType.name.kind === 'SymbolLiteral' && remainingType.name.name === 'Function') {
//     const [implicit, parameter, result] = remainingType.parameters;
//
//     // Exit the loop as soon as we find a non implicit
//     if (implicit.kind !== 'BooleanLiteral' || !implicit.value) {
//       break;
//     }
//     remainingType = result;
//
//     const name = findImplementationFor(scope, parameter);
//     if (name) {
//       discoveredImplementations.push({ name, type: parameter });
//     } else if (allowUnresolved) {
//       skippedImplicits.push(parameter);
//     } else {
//       console.log('Failed to find implementation in scope', JSON.stringify(scope, undefined, 2));
//       messages.push(`Cannot find implementation for ${JSON.stringify(parameter, undefined, 2)}`);
//       // throw new Error(`Cannot find implementation for ${JSON.stringify(parameter, undefined, 2)}`);
//     }
//   }
//
//   const finalType = functionType(remainingType, skippedImplicits.map(value => [value, true]));
//   const [expressionMessages, resolvedExpression] = iterateExpression(expression, remainingType);
//   return [[...messages, ...expressionMessages], {
//     ...typedNode,
//     expression: discoveredImplementations.length === 0
//       ? resolvedExpression
//       : {
//         kind: 'Application',
//         callee: node(resolvedExpression, { type: finalType, scope }),
//         parameters: discoveredImplementations.map(({ name, type }) => (
//           node(identifier(name), { type, scope })
//         )),
//         // Remove all implicit information out of the type
//         // callee: iterateExpression(scope, expression, discoveredImplementations.reduce<Value>(
//         //   (result, { type }) => ({
//         //     kind: 'DataValue',
//         //     callee: 'Function',
//         //     parameters: [type, result],
//         //   }),
//         //   type,
//         // )),
//       },
//   }];
// }
