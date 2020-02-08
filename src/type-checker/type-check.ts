import { find, flatMap, map, some, zipObject } from 'lodash';
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
import { extractImplicitParameters, stripImplicits } from './implicit-utils';
import { TypeResult, TypeWriter } from './monad-utils';
import { runTypePhaseWithoutRename } from './run-type-phase';
import { scopeToEScope } from './scope-utils';
import { stripNode } from './strip-nodes';
import { fitsShape, newFreeVariable } from './type-utils';
import {
  DataInstantiation,
  Expression,
  FunctionExpression,
  RecordExpression,
} from './types/expression';
import { Message } from './types/message';
import { Node } from './types/node';
import { Scope } from './types/scope';
import { DataValue, ExplicitValue, Value } from './types/value';
import { assertNever } from './utils';
import { applyReplacements, getBindingsFromValue } from './variable-utils';
import { visitNodes, visitValue } from './visitor-utils';

export interface TypedDecoration {
  type: ExplicitValue;
  implicitType: Value;
  scope: Scope;
}

export type TypedNode = Node<TypedDecoration>;

function result(
  expression: Expression<TypedNode>,
  scope: Scope,
  implicitType: Value,
  messages: Message[] = [],
): TypeResult<TypedNode> {
  return TypeWriter.createResult(
    [messages, scope],
    node(expression, { type: stripImplicits(implicitType), implicitType, scope }),
  );
}

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

const copyFreeVariables = visitValue({
  after(value: Value) {
    return value.kind === 'FreeVariable' ? newFreeVariable(`${value.name}$copy$`) : value;
  },
});

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
      const parameter = evaluateExpression(scopeToEScope(state.scope))(
        stripNode(node1)
      );
      if (!parameter) {
        // TODO handle undefined parameters that failed to be evaluated
        throw new Error(`Failed to evaluate expression: ${JSON.stringify(expression.parameter, undefined, 2)}\nIn scope ${JSON.stringify(scope, undefined, 2)}`);
      }

      const bindings = getBindingsFromValue(parameter)
        .map(({ from, to }) => scopeBinding(from, scope, to));
      state.updateScope(expandScope(state.scope, { bindings }));

      // TODO return inferred variables from typeExpression so that the types of parameters can be
      //      checked. I think this has been accomplished with the new scope behaviour, but need to
      //      double check.
      const body = state.run(typeExpression)(expression.body);
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
        return result(expressionNode, scope, dataValue('Any'), [`Cannot call a ${calleeType.kind}`]);
      }

      if (!state.run(fitsShape)(calleeType.parameter, parameter.decoration.type)) {
        return result(expressionNode, scope, dataValue('Any'), ['Given parameter did not match expected shape']);
      }

      // Apply replacements to all children and implicits
      return state.wrap(typeNode(expressionNode, scope, calleeType.body));
    }

    case 'BindingExpression': {
      const valueNode = state.run(typeExpression)(expression.value);

      // Extract implicit parameters from all children on the value
      const valueImplicits = extractImplicitParameters(valueNode);
      const implicitParameters = valueImplicits.map(value => dualBinding(newFreeVariable('implicitBinding$'), value));

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
      const scopeDeclaration = scopeBinding(expression.name, newValueNode.decoration.scope, newType, stripNode(newValueNode));
      state.updateScope(expandScope(scope, { bindings: [scopeDeclaration] }));
      const bodyNode = state.run(typeExpression)(expression.body);

      if (some(scope.bindings, { name: expression.name })) {
        state.log(`A variable with the name ${expression.name} already exists`)
      }

      const expressionNode = {
        ...expression,
        value: {
          ...valueNode,
          decoration: {
            ...valueNode.decoration,
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

    default:
      return assertNever(expression);
  }
};
