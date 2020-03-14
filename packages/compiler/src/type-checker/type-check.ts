import { find, flatMap, map, some, zipObject, merge } from 'lodash';
import {
  booleanLiteral,
  dataValue,
  dualBinding,
  expandScope,
  freeVariable,
  functionType,
  node,
  numberLiteral,
  recordLiteral,
  scopeBinding,
  stringLiteral,
  symbol,
} from './constructors';
import { evaluateExpression } from './evaluate';
import {
  deepExtractImplicitParameters,
  deepExtractImplicitParametersFromExpression,
  extractImplicitsParameters,
  partitionUnrelatedValues,
  stripImplicits,
} from './implicit-utils';
import { TypeResult, TypeWriter } from './monad-utils';
import { runTypePhaseWithoutRename } from './run-type-phase';
import { scopeToEScope } from './scope-utils';
import { stripNode } from './strip-nodes';
import { converge, newFreeVariable } from './type-utils';
import {
  DataInstantiation,
  Expression,
  FunctionExpression,
  RecordExpression,
} from './types/expression';
import { Node } from './types/node';
import { Scope } from './types/scope';
import { DataValue, ExplicitValue, FreeVariable, FunctionLiteral, Value } from './types/value';
import { assertNever, withParentExpressionKind } from './utils';
import {
  applyReplacements,
  getBindingsFromValue,
  recursivelyApplyReplacements,
} from './variable-utils';
import { visitNodes, visitValueWithState } from './visitor-utils';

export interface TypedDecoration {
  type: ExplicitValue;
  implicitType: Value;
  scope: Scope;
}

export type TypedNode = Node<TypedDecoration>;

function typeNode(
  expression: Expression<TypedNode>,
  scope: Scope,
  implicitType: Value,
): TypedNode {
  return node(expression, { type: stripImplicits(implicitType), implicitType, scope });
}

function getTypeDecorations(nodes: TypedNode[]): Value[] {
  return nodes.map(node => node.decoration.type);
}

const copyFreeVariables = visitValueWithState<{ [k: string]: FreeVariable }>({}, {
  after([state, value]) {
    if (value.kind === 'FreeVariable') {
      if (!state[value.name]) {
        state[value.name] = newFreeVariable(`${value.name}$copy$`);
      }
      return [state, state[value.name]];
    }
    return [state, value];
  },
});

// function getImplicitsForBinding(valueNode: TypedNode): Value[] {
//   const valueList = deepExtractImplicitParameters(valueNode);
//   let variableNames = extractFreeVariableNames(valueNode.decoration.type);
//   let allRelated: Value[] = [];
//   let [related, unrelated] = partition(valueList, usesVariable(variableNames));
//   while (related.length > 0) {
//     allRelated = [...allRelated, ...related];
//     variableNames = [...variableNames, ...flatMap(related, extractFreeVariableNames)];
//     ([related, unrelated] = partition(unrelated, usesVariable(variableNames)));
//   }
//   return allRelated;
// }

export const typeExpression = (scope: Scope) => (expression: Expression): TypeResult<TypedNode> => {
  const state = new TypeWriter(scope);
  switch (expression.kind) {
    case 'SymbolExpression':
      return state.wrap(typeNode(expression, scope, symbol(expression.name)));

    case 'BooleanExpression':
      return state.wrap(typeNode(expression, scope, booleanLiteral(expression.value)));

    case 'NumberExpression':
      return state.wrap(typeNode(expression, scope, numberLiteral(expression.value)));

    case 'StringExpression':
      return state.wrap(typeNode(expression,scope, stringLiteral(expression.value)));

    case 'NativeExpression':
      return state.wrap(typeNode(expression, scope, newFreeVariable('native')));

    case 'DataInstantiation': {
      const callee = state.run(typeExpression)(expression.callee);
      const parameters = expression.parameters.map(state.run(typeExpression));

      const resultType = dataValue(callee.decoration.type, getTypeDecorations(parameters));
      // if (callee.decoration.type.kind !== 'SymbolLiteral') {
      //   messages.push(`Cannot use a ${callee.decoration.type.kind} value as the callee of a data value`);
      //   resultType = dataValue('void');
      // } else {
      //   resultType = dataValue(callee.decoration.type.name, stripAllImplicits(getTypeDecorations(parameters)));
      // }

      const expressionNode: Expression<TypedNode> = {
        ...expression,
        callee,
        parameters,
      };
      return state.wrap(typeNode(expressionNode, scope, resultType));
    }

    case 'RecordExpression': {
      const keys = Object.keys(expression.properties);
      const propertyNodes = map(expression.properties, state.run(typeExpression));

      const expressionNode: RecordExpression<TypedNode> = {
        ...expression,
        properties: zipObject(keys, propertyNodes),
      };
      return state.wrap(typeNode(
        expressionNode,
        scope,
        recordLiteral(zipObject(keys, getTypeDecorations(propertyNodes))),
      ));
    }

    case 'FunctionExpression': {
      // Create a free variable for each parameter
      const node1 = state.run(runTypePhaseWithoutRename)(expression.parameter);
      const parameter = evaluateExpression(
        scopeToEScope(state.scope)
      )(stripNode(node1));
      if (!parameter) {
        // TODO handle undefined parameters that failed to be evaluated
        throw new Error(`Failed to evaluate expression: ${JSON.stringify(expression.parameter, undefined, 2)}\nIn scope ${JSON.stringify(scope, undefined, 2)}`);
      }

      const body = state.withChildScope((innerState) => {
        innerState.expandScope({
          bindings: [
            ...getBindingsFromValue(parameter).map(({ from, to }) => (
              scopeBinding(from, scope, to)
            )),
            ...state.replacements.map(({ from, to }) => scopeBinding(from, scope, to))
          ],
        });

        // TODO return inferred variables from typeExpression so that the types of parameters can be
        //      checked. I think this has been accomplished with the new scope behaviour, but need to
        //      double check.
        return innerState.run(typeExpression)(expression.body);
      });

      return state.wrap(typeNode(
        { ...expression, body },
        scope,
        functionType(body.decoration.type, [[parameter, expression.implicit]]),
      ));
    }

    case 'Identifier': {
      const binding = find(scope.bindings, { name: expression.name });
      if (binding) {
        return state.wrap(typeNode(expression, scope, copyFreeVariables(binding.type)));
      }

      // return result(expression, scope, newFreeVariable(`${expression.callee}$typingFreeIdentifier$`));
      return state.wrap(typeNode(expression, scope, freeVariable(expression.name)));
    }

    case 'Application': {
      const callee = state.run(typeExpression)(expression.callee);
      const parameter = state.run(typeExpression)(expression.parameter);
      const expressionNode: Expression<TypedNode> = { ...expression, callee, parameter };

      // Converge the callee type with a function type
      const parameterTypeVariable = newFreeVariable('p');
      const bodyTypeVariable = newFreeVariable('b');
      const calleeReplacements = converge(state.scope, callee.decoration.type, {
        kind: 'FunctionLiteral',
        parameter: parameterTypeVariable,
        body: bodyTypeVariable,
      });
      if (!calleeReplacements) {
        state.log(`Cannot call a ${callee.decoration.type.kind}`);
        return state.wrap(typeNode(expressionNode, scope, dataValue('Any')));
      }

      state.recordReplacements(calleeReplacements);
      const parameterType = applyReplacements(calleeReplacements)(parameterTypeVariable);
      const bodyType = applyReplacements(calleeReplacements)(bodyTypeVariable);

      const parameterReplacements = converge(state.scope, parameterType, parameter.decoration.type);
      if (!parameterReplacements) {
        state.log('Given parameter did not match expected shape');
        return state.wrap(typeNode(expressionNode, scope, dataValue('Any')));
      }

      // Apply replacements to all children and implicits
      state.recordReplacements(parameterReplacements);
      return state.wrap(typeNode(
        recursivelyApplyReplacements(state.replacements)(expressionNode),
        scope,
        applyReplacements(state.replacements)(bodyType),
      ));
    }

    case 'BindingExpression': {
      if (some(scope.bindings, { name: expression.name })) {
        state.log(`A variable with the name ${expression.name} already exists`)
      }

      // Extract implicit parameters from all children on the value
      const valueNode = state.run(typeExpression)(expression.value);
      const [shallowImplicits] = extractImplicitsParameters(valueNode.decoration.implicitType);
      const [relatedShallowImplicits, unrelatedShallowImplicits] = partitionUnrelatedValues(shallowImplicits, valueNode.decoration.type);
      const deepImplicits = deepExtractImplicitParametersFromExpression(valueNode.expression);
      const [relatedDeepImplicits, unrelatedDeepImplicits] = partitionUnrelatedValues(deepImplicits, valueNode.decoration.type);
      const allRelatedImplicits = [...relatedShallowImplicits, ...relatedDeepImplicits];
      const allUnrelatedImplicits = [...unrelatedShallowImplicits, ...unrelatedDeepImplicits];
      const relatedImplicitParameters = allRelatedImplicits.map(value => (
        dualBinding(newFreeVariable('implicitBinding$'), value)
      ));
      const unrelatedImplicitParameters = allUnrelatedImplicits.map(value => (
        dualBinding(newFreeVariable('implicitBinding$'), value)
      ));

      // Add all implicits to every scope so they can be discovered by the resolveImplicitParameters
      // function
      const allImplicitParameters = [...relatedImplicitParameters, ...unrelatedImplicitParameters];
      const implicitBindings = flatMap(allImplicitParameters, getBindingsFromValue)
        .map(({ from, to }) => scopeBinding(from, scope, to));
      const newValueNode = visitNodes({
        after: withParentExpressionKind((parentKind: Expression['kind'] | undefined, node: TypedNode) => (
          !parentKind ? node : merge(node, {
            decoration: {
              scope: expandScope(node.decoration.scope, { bindings: implicitBindings }),
            },
          })
        )),
      })(valueNode);

      // Add the binding to the scope so that it can be used in the body
      const bodyNode = state.withChildScope((innerState) => {
        const scopeType = functionType(valueNode.decoration.type, relatedImplicitParameters.map(parameter => [parameter, true]));
        const binding = scopeBinding(expression.name, newValueNode.decoration.scope, scopeType, stripNode(newValueNode));
        innerState.expandScope({ bindings: [binding] });
        return innerState.run(typeExpression)(expression.body);
      });

      const expressionNode = {
        ...expression,
        value: {
          ...newValueNode,
          decoration: {
            ...newValueNode.decoration,
            // The node type includes all the bindings because we want the unrelated implicits to be
            // resolved
            implicitType: functionType(
              valueNode.decoration.type,
              [...shallowImplicits, ...relatedDeepImplicits].map(parameter => [parameter, true]),
            ),
          },
        },
        body: bodyNode,
      };
      return state.wrap(typeNode(expressionNode, scope, bodyNode.decoration.type));
    }

    case 'DualExpression': {
      const leftNode = state.run(typeExpression)(expression.left);
      const rightNode = state.run(typeExpression)(expression.right);

      // TODO
      // const replacements = unionType
      const expressionNode: Expression<TypedNode> = {
        ...expression,
        left: leftNode,
        right: rightNode,
      };
      return state.wrap(typeNode(
        expressionNode,
        scope,
        leftNode.decoration.type,
      ));
    }

    case 'ReadRecordPropertyExpression': {
      const recordNode = state.run(typeExpression)(expression.record);
      const expressionNode: Expression<TypedNode> = {
        ...expression,
        record: recordNode,
      };
      const type = recordNode.decoration.type;
      const resultType = type.kind === 'RecordLiteral' && type.properties[expression.property]
        || undefined;
      if (resultType === undefined) {
        state.log(`Property ${expression.property} does not exist in record`);
      }

      if (!resultType) {
        console.log('Failed to find property on record', type.kind, type.kind === 'RecordLiteral' && type.properties, expression.property);
      }
      return state.wrap(typeNode(
        expressionNode,
        scope,
        resultType ? resultType : dataValue('void'),
      ));
    }

    case 'ReadDataPropertyExpression': {
      const dataValueNode = state.run(typeExpression)(expression.dataValue);
      const expressionNode: Expression<TypedNode> = {
        ...expression,
        dataValue: dataValueNode,
      };
      const type = dataValueNode.decoration.type;
      const resultType = type.kind === 'DataValue'
        && type.parameters.length < expression.property
          ? type.parameters[expression.property]
          : undefined;
      if (resultType === undefined) {
        state.log(`Data value has less than ${expression.property} parameters`);
      }
      return state.wrap(typeNode(
        expressionNode,
        scope,
        resultType ? resultType : dataValue('void'),
      ));
    }

    case 'PatternMatchExpression': {
      const value = state.run(typeExpression)(expression.value);
      const patterns = expression.patterns.map(({ test, value }) => {
        const testNode = state.run(runTypePhaseWithoutRename)(test);
        const evaluatedTest = evaluateExpression(scopeToEScope(state.scope))(stripNode(testNode));
        if (!evaluatedTest) {
          // TODO handle undefined parameters that failed to be evaluated
          throw new Error(`Failed to evaluate expression: ${JSON.stringify(test, undefined, 2)}\nIn scope ${JSON.stringify(scope, undefined, 2)}`);
        }

        const valueNode = state.withChildScope((innerState) => {
          innerState.expandScope({
            bindings: [
              ...getBindingsFromValue(evaluatedTest).map(({ from, to }) => (
                scopeBinding(from, scope, to)
              )),
              ...state.replacements.map(({ from, to }) => scopeBinding(from, scope, to))
            ],
          });

          // TODO return inferred variables from typeExpression so that the types of parameters can be
          //      checked. I think this has been accomplished with the new scope behaviour, but need to
          //      double check.
          return innerState.run(typeExpression)(value);
        });

        return { test: testNode, value: valueNode };
      });


      // TODO Check that all the values have the same type

      // TODO check that all the tests are the same type as the input value

      // TODO check that there are no holes in the tests

      if (patterns.length === 0) {
        state.log('Require at least one pattern in match expression');
      }

      return state.wrap(typeNode(
        { ...expression, value, patterns },
        scope,
        patterns.length > 0 ? patterns[0].value.decoration.type : dataValue('void'),
      ));
    }

    default:
      return assertNever(expression);
  }
};
