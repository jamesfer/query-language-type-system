import { find, flatMap, map, partition, some, zipObject } from 'lodash';
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
  symbol,
} from './constructors';
import { evaluateExpression } from './evaluate';
import {
  extractImplicitParameters,
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
import { assertNever } from './utils';
import {
  applyReplacements,
  extractFreeVariableNames,
  getBindingsFromValue,
  recursivelyApplyReplacements,
  usesVariable,
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

function getImplicitsForBinding(valueNode: TypedNode): Value[] {
  const valueList = extractImplicitParameters(valueNode);
  let variableNames = extractFreeVariableNames(valueNode.decoration.type);
  let allRelated: Value[] = [];
  let [related, unrelated] = partition(valueList, usesVariable(variableNames));
  while (related.length > 0) {
    allRelated = [...allRelated, ...related];
    variableNames = [...variableNames, ...flatMap(related, extractFreeVariableNames)];
    ([related, unrelated] = partition(unrelated, usesVariable(variableNames)));
  }
  return allRelated;
}

export const typeExpression = (scope: Scope) => (expression: Expression): TypeResult<TypedNode> => {
  const state = new TypeWriter(scope);
  switch (expression.kind) {
    case 'NumberExpression':
      return state.wrap(typeNode(expression, scope, numberLiteral(expression.value)));

    case 'BooleanExpression':
      return state.wrap(typeNode(expression, scope, booleanLiteral(expression.value)));

    case 'SymbolExpression':
      return state.wrap(typeNode(expression, scope, symbol(expression.name)));

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

      const calleeType = callee.decoration.type;
      if (calleeType.kind !== 'FunctionLiteral') {
        state.log(`Cannot call a ${calleeType.kind}`);
        return state.wrap(typeNode(expressionNode, scope, dataValue('Any')));
      }

      const replacements = converge(state.scope, calleeType.parameter, parameter.decoration.type);
      if (!replacements) {
        state.log('Given parameter did not match expected shape');
        return state.wrap(typeNode(expressionNode, scope, dataValue('Any')));
      }

      // Apply replacements to all children and implicits
      state.recordReplacements(replacements);
      return state.wrap(typeNode(
        recursivelyApplyReplacements(state.replacements)(expressionNode),
        scope,
        applyReplacements(state.replacements)(calleeType.body),
      ));
    }

    case 'BindingExpression': {
      const valueNode = state.run(typeExpression)(expression.value);

      // Extract implicit parameters from all children on the value
      const valueList = extractImplicitParameters(valueNode);
      const [valueImplicits] = partitionUnrelatedValues(valueList, valueNode.decoration.type);
      const implicitParameters = valueImplicits.map(value => (
        dualBinding(newFreeVariable('implicitBinding$'), value)
      ));

      // Add implicits to every scope so they can be discovered by the `resolveImplicitParameters`
      // function
      const implicitBindings = flatMap(implicitParameters, getBindingsFromValue)
        .map(({ from, to }) => scopeBinding(from, scope, to));
      const newValueNode = visitNodes({
        after: (node: TypedNode) => ({
          ...node,
          decoration: {
            ...node.decoration,
            scope: expandScope(node.decoration.scope, { bindings: implicitBindings }),
          },
        }),
      })(valueNode);

      // Add the binding to the scope so that it can be used in the body
      const newType = functionType(valueNode.decoration.type, implicitParameters.map(parameter => [parameter, true]));
      const bodyNode = state.withChildScope((innerState) => {
        const binding = scopeBinding(expression.name, newValueNode.decoration.scope, newType, stripNode(newValueNode));
        innerState.expandScope({ bindings: [binding] });
        return innerState.run(typeExpression)(expression.body);
      });

      if (some(scope.bindings, { name: expression.name })) {
        state.log(`A variable with the name ${expression.name} already exists`)
      }

      const expressionNode = {
        ...expression,
        value: {
          ...newValueNode,
          decoration: {
            ...newValueNode.decoration,
            implicitType: newType,
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
