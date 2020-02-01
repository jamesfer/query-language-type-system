import { find, flatMap, flatten, map, some, zipObject } from 'lodash';
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
import { TypeResult, TypeWriter } from './monad-utils';
import { runTypePhaseWithoutRename } from './run-type-phase';
import { scopeToEScope } from './scope-utils';
import { stripNode } from './strip-nodes';
import {
  fitsShape,
  newFreeVariable,



} from './type-utils';
import {
  DataInstantiation,
  Expression,
  FunctionExpression,
  RecordExpression,
} from './types/expression';
import { Message } from './types/message';
import { Node } from './types/node';
import { Scope } from './types/scope';
import { DataValue, Value } from './types/value';
import { assertNever, unzip } from './utils';
import { applyReplacements, getBindingsFromValue } from './variable-utils';
import { unfoldParameters, visitNodes, visitValue } from './visitor-utils';

export interface TypedDecoration {
  type: Value;
  typeWithImplicits: Value;
  scope: Scope;
}

export type TypedNode = Node<TypedDecoration>;

const extractImplicitParametersFromNode = (depth: number) => (node: TypedNode): Value[] => {
  const [implicits] = depth > 0 ? extractImplicits(node.decoration.type) : [[]];
  const childImplicits = extractImplicitParametersFromExpression(depth)(node.expression);
  return [...implicits, ...childImplicits];
};

const extractImplicitParameters = extractImplicitParametersFromNode(0);

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

export function extractImplicits(type: Value): [Value[], Value] {
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
      parameters.push(parameter)
    }
  }

  return [implicits, functionType(currentType, parameters)];
}

function extractAllImplicits(types: Value[]): [Value[], Value[]] {
  const [implicits = [], values = []] = unzip(types.map(extractImplicits));
  return [flatten(implicits), values];
}

function stripImplicits(type: Value): Value {
  const [, value] = extractImplicits(type);
  return value;
}

function stripAllImplicits(types: Value[]): Value[] {
  return types.map(stripImplicits);
}

function result(
  expression: Expression<TypedNode>,
  scope: Scope,
  type: Value,
  messages: Message[] = [],
): TypeResult<TypedNode> {
  return TypeWriter.createResult(
    [messages, scope],
    node(expression, { type, scope }),
  );
}

function typeNode(
  expression: Expression<TypedNode>,
  scope: Scope,
  type: Value,
): TypedNode {
  return node(expression, { type, scope });
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

      const resultType = dataValue(callee.decoration.type, stripAllImplicits(getTypeDecorations(parameters)));
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
        recordLiteral(zipObject(keys, stripAllImplicits(getTypeDecorations(propertyNodes)))),
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
        functionType(stripImplicits(body.decoration.type), [[stripImplicits(parameter), expression.implicit]]),
      ));
    }

    case 'Identifier': {
      const binding = find(scope.bindings, { name: expression.name });
      if (binding) {
        console.log('found binding for', expression.name);
        return state.wrap(typeNode(expression, scope, copyFreeVariables(binding.type)));
      }

      console.log('creating new identifier for', expression.name);
      // return result(expression, scope, newFreeVariable(`${expression.callee}$typingFreeIdentifier$`));
      return state.wrap(typeNode(expression, scope, freeVariable(expression.name)));
    }

    case 'Application': {
      const callee = state.run(typeExpression)(expression.callee);
      const parameter = state.run(typeExpression)(expression.parameter);
      const expressionNode: Expression<TypedNode> = { ...expression, callee, parameter };

      const calleeType = stripImplicits(callee.decoration.type);
      if (calleeType.kind !== 'FunctionLiteral') {
        return result(expressionNode, scope, dataValue('Any'), [`Cannot call a ${calleeType.kind}`]);
      }

      const replacements = fitsShape(scope, calleeType.parameter, parameter.decoration.type);
      if (!replacements) {
        return result(expressionNode, scope, dataValue('Any'), ['Given parameter did not match expected shape']);
      }

      // Apply replacements to all children and implicits
      return state.wrap(typeNode(
        expressionNode,
        scope,
        stripImplicits(applyReplacements(replacements)(calleeType.body)),
      ));
    }

    case 'BindingExpression': {
      const valueNode = state.run(typeExpression)(expression.value);
      const valueImplicits = extractImplicitParameters(valueNode);
      const implicitParameters = valueImplicits.map(value => dualBinding(newFreeVariable('implicitBinding$'), value));
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

      const newType = functionType(valueNode.decoration.type, implicitParameters.map(parameter => [parameter, true]));
      const scopeDeclaration = scopeBinding(expression.name, newValueNode.decoration.scope, newType, stripNode(newValueNode));
      state.updateScope(expandScope(scope, { bindings: [scopeDeclaration] }));
      const bodyNode = state.run(typeExpression)(expression.body);

      if (some(scope.bindings, { name: expression.name })) {
        state.log(`A variable with the name ${expression.name} already exists`)
      }

      const expressionNode = {
        ...expression,
        value: valueNode,
        body: bodyNode,
      };
      return state.wrap(typeNode(expressionNode, scope, stripImplicits(bodyNode.decoration.type)));
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
        stripImplicits(leftNode.decoration.type),
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
        resultType ? stripImplicits(resultType) : dataValue('void'),
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
        resultType ? stripImplicits(resultType) : dataValue('void'),
      ));
    }

    // case 'ImplementExpression': {
    //   // Type each of the parameters
    //   const [parameterMessages = [], parameterNodes = []] = (
    //     unzip(expression.parameters.map(typeExpression(scope)))
    //   );
    //   const parameterTypes = getTypeDecorations(parameterNodes);
    //   const checkParameterMessages = checkImplementationParameters(scope, expression, parameterTypes);
    //
    //   // Create a new scope
    //   const newScope = expandScope(scope, {
    //     implementations: [{
    //       kind: 'ImplementDeclaration',
    //       callee: expression.callee,
    //       identifier: expression.identifier,
    //       parameters: parameterTypes,
    //     }],
    //   });
    //
    //   const [bodyMessages, bodyNode] = typeExpression(newScope)(expression.body);
    //   const expressionNode: Expression<TypedNode> = {
    //     ...expression,
    //     parameters: parameterNodes,
    //     body: bodyNode,
    //   };
    //
    //   const messages = flatten([...parameterMessages, checkParameterMessages, bodyMessages]);
    //   return result(expressionNode, scope, bodyNode.decoration.type, messages);
    // }

    // case 'DataDeclaration': {
    //   const existingDeclarationMessages = find(scope.bindings, { callee: expression.callee })
    //     ? [`A variable named ${expression.callee} already exists`]
    //     : [];
    //
    //   // Type each of the parameters
    //   const [parameterMessages = [], parameterNodes = []] = (
    //     unzip(expression.parameters.map(typeExpression(scope)))
    //   );
    //
    //   // Create a new scope
    //   const parameterNames = parameterNodes.map((_, index) => `f${index}`);
    //   const parameterDecorations = getDecorations(parameterNodes);
    //   const parameterTypes = getTypeDecorations(parameterNodes);
    //   const funcParams = checkedZip(parameterNames, parameterNodes)
    //     .map(([callee, { expression }]) => funcExpParam(callee, stripExpression(expression)));
    //   const funcResult = dataInstantiation<TypedNode>(
    //     expression.callee,
    //     checkedZip(parameterNames, parameterDecorations)
    //       .map(([callee, decoration]) => node(identifier(callee), decoration)),
    //   );
    //   const dataValueType = dataValue(expression.callee, parameterTypes);
    //   const funcExp = lambda<TypedNode>(
    //     funcParams,
    //     node(funcResult, { scope, type: dataValueType }),
    //   );
    //   const funcNode = node(funcExp, { scope, type: functionType(dataValueType, parameterTypes) });
    //   const newScope = expandScope(scope, {
    //     // Add a declaration so that it can be inherited
    //     // declarations: [scopeDataDeclaration(expression.callee, parameterNodes)],
    //     // Add a binding so that the data declaration can be used as a constraint and value
    //     bindings: [scopeBinding(expression.callee, funcNode)],
    //   });
    //
    //   const [bodyMessages, bodyNode] = typeExpression(newScope)(expression.body);
    //   const expressionNode: Expression<TypedNode> = {
    //     ...expression,
    //     parameters: parameterNodes,
    //     body: bodyNode,
    //   };
    //
    //   return result(expressionNode, scope, bodyNode.decoration.type, flatten([
    //     existingDeclarationMessages,
    //     ...parameterMessages,
    //     bodyMessages,
    //   ]));
    // }

    default:
      return assertNever(expression);
  }
};

// export function checkDeclaration(scope: Scope, declaration: Declaration): [Message[], Scope] | [Message[], Scope, TypedNode] {
//   switch (declaration.kind) {
//     case 'DataDeclaration': {
//       if (scope.declarations.some(({ callee }) => callee === declaration.callee)) {
//         return [[`A declaration with the callee ${declaration.callee} already exists`], scope];
//       }
//
//       if (declaration.parameters.length === 0) {
//         return [['Data declarations must have at least one parameter'], scope];
//       }
//
//       const [parameterMessages, constraintNodes] = unzip(declaration.parameters.map(({ constraint }) => (
//         constraint ? typeExpression(scope, constraint) : [[], undefined]
//       )));
//       const constraints = getOptionalDecorations(constraintNodes);
//
//       const parameters = checkedZip(constraints, declaration.parameters)
//         .map(([constraint, parameter]): ScopeDataParameter => ({
//           ...parameter,
//           constraint: constraint || newFreeVariable(parameter.callee),
//         }));
//       const scopeDeclaration: ScopeDataDeclaration = { ...declaration, parameters};
//       const messages = flatten(parameterMessages);
//       return messages.length > 0
//         ? [messages, scope]
//         : [[], expandScope(scope, { declarations: [scopeDeclaration] })];
//     }
//
//     case 'ImplementDeclaration': {
//     }
//
//     case 'FunctionDeclaration': {
//     }
//
//     case 'ExpressionDeclaration': {
//       const [messages, node] = typeExpression(scope, declaration.value);
//       return [messages, scope, node];
//     }
//
//     default:
//       return assertNever(declaration);
//   }
// }
//
// export function check(scope: Scope, declarations: Declaration[]): [Message[], Scope, TypedNode | undefined] {
//   return declarations.reduce<[Message[], Scope, TypedNode | undefined]>(
//     ([messages, scope], declaration) => {
//       const [newMessages, newScope, checkedNode] = checkDeclaration(scope, declaration);
//       return [[...messages, ...newMessages], newScope, checkedNode];
//     },
//     [[], scope, undefined],
//   );
// }
