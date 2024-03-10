import generator from '@babel/generator';
import * as types from '@babel/types';
import { flatten, map, range } from 'lodash';
import { CoreExpression } from '../..';
import { assertNever, unzip } from '../../type-checker/utils/utils';

// const destructureExpression = (base: Expression) =>
//   (value: Expression): [string, Expression][] => {
//   switch (value.kind) {
//     case 'SymbolExpression':
//     case 'BooleanExpression':
//     case 'NumberExpression':
//     case 'StringExpression':
//       return [];
//
//     case 'Identifier':
//       return [[value.name, base]];
//
//     case 'DualExpression':
//       return [
//         ...destructureExpression(base)(value.left),
//         ...destructureExpression(base)(value.right),
//       ];
//
//     case 'DataInstantiation':
//       return flatMap(value.parameters, (parameter, index) => destructureExpression({
//         kind: 'ReadDataPropertyExpression',
//         dataValue: base,
//         property: index,
//       })(parameter));
//
//     case 'RecordExpression':
//       return flatMap(value.properties, (parameter, key) => destructureExpression({
//         kind: 'ReadRecordPropertyExpression',
//         record: base,
//         property: key,
//       })(parameter));
//
//     case 'Application':
//     case 'FunctionExpression':
//     case 'ReadDataPropertyExpression':
//     case 'ReadRecordPropertyExpression':
//     case 'BindingExpression':
//     case 'PatternMatchExpression':
//     case 'NativeExpression':
//       return [];
//
//     default:
//       return assertNever(value);
//   }
// };

const reservedKeywords = new Set([
  'if',
  'return',
  'for',
  'const',
  'let',
]);

function makeIdentifierSafe(name: string): string {
  // strip all the trailing underscores from the name
  const strippedName = name.replace(/_*$/, '');
  if (reservedKeywords.has(strippedName)) {
    return `${name}_`;
  }

  return name;
}

function convertExpressionToCode(
  expression: CoreExpression,
): [types.Statement[], types.Expression] {
  switch (expression.kind) {
    case 'Identifier': {
      return [[], types.identifier(makeIdentifierSafe(expression.name))];
    }

    case 'SymbolExpression':
      return [[], types.stringLiteral(`$SYMBOL$${expression.name}`)];

    case 'BooleanExpression':
      return [[], types.booleanLiteral(expression.value)];

    case 'NumberExpression':
      return [[], types.numericLiteral(expression.value)];

    case 'StringExpression':
      return [[], types.stringLiteral(expression.value)];

    case 'RecordExpression': {
      const [childStatements = [], properties = []] = unzip(
        map(expression.properties, (property, key) => {
          const [propertyStatements, value] = convertExpressionToCode(property);
          return [propertyStatements, types.objectProperty(types.identifier(key), value)];
        }),
      );
      return [flatten([[], ...childStatements]), types.objectExpression(properties)];
    }

    case 'Application': {
      const [calleeStatements, callee] = convertExpressionToCode(expression.callee);
      const [parameterStatements, parameter] = convertExpressionToCode(expression.parameter);
      const callExpression = types.callExpression(callee, [parameter]);
      return [[...calleeStatements, ...parameterStatements], callExpression];
    }

    case 'SimpleFunctionExpression': {
      const [bodyStatements, body] = convertExpressionToCode(expression.body);

      return [[], types.arrowFunctionExpression(
        [types.identifier(expression.parameter)],
        bodyStatements.length === 0 ? body : types.blockStatement([
          ...bodyStatements,
          types.returnStatement(body),
        ]),
      )];

      // const parameterName = `$PARAMETER$1`;
      // const destructuredParameters =
      //   destructureExpression(identifier(parameterName))(expression.parameter);
      // const destructuringStatements = flatMap(destructuredParameters, ([name, expression]) => {
      //   const [parameterStatements, parameter] = convertExpressionToCode(expression);
      //   return [...parameterStatements, types.variableDeclaration('const', [
      //     types.variableDeclarator(types.identifier(name), parameter)
      //   ])];
      // });
      // return [[], types.arrowFunctionExpression(
      //   [types.identifier(parameterName)],
      //   types.blockStatement([
      //     ...destructuringStatements,
      //     types.returnStatement(body),
      //   ]),
      // )];
    }

    case 'DataInstantiation': {
      const [calleeStatements, callee] = convertExpressionToCode(expression.callee);
      const [allPropertyStatements = [], objectProperties = []] = unzip(
        expression.parameters.map((value, index) => {
          const [propertyStatements, property] = convertExpressionToCode(value);
          return [propertyStatements, types.objectProperty(types.identifier(`${index}`), property)];
        }),
      );
      return [flatten([calleeStatements, ...allPropertyStatements]), types.objectExpression([
        types.objectProperty(types.identifier('$DATA_NAME$'), callee),
        ...objectProperties,
      ])];
    }

    case 'BindingExpression': {
      const [valueStatements, value] = convertExpressionToCode(expression.value);
      const [bodyStatements, body] = convertExpressionToCode(expression.body);
      const declaration = types.variableDeclaration('const', [
        types.variableDeclarator(types.identifier(makeIdentifierSafe(expression.name)), value),
      ]);
      return [[...valueStatements, declaration, ...bodyStatements], body];
    }

    case 'ReadRecordPropertyExpression': {
      // return types.memberExpression(
      //   convertExpressionToCode(expression.record),
      //   expression.property);
      const [recordStatements, record] = convertExpressionToCode(expression.record);
      const identifier = types.identifier(expression.property);
      const memberExpression = types.memberExpression(record, identifier);
      return [recordStatements, memberExpression];
    }

    case 'ReadDataPropertyExpression':
      const [dataValueStatements, dataValue] = convertExpressionToCode(expression.dataValue);
      return [dataValueStatements, types.memberExpression(dataValue, types.identifier(`${expression.property}`), true)];

    case 'NativeExpression': {
      const nativeData = expression.data.javascript;
      if (!nativeData) {
        throw new Error(`Cannot output a native expression without a javascript spec:${JSON.stringify(expression.data, undefined, 2)}`);
      }

      const { kind } = nativeData;
      switch (kind) {
        case 'member': {
          const { object, name, arity } = nativeData;
          if (typeof object !== 'string' || typeof name !== 'string' || typeof arity !== 'number') {
            throw new Error('Cannot output member native expression with incorrect data');
          }

          const callee = types.memberExpression(types.identifier(object), types.identifier(name));
          const parameterNames = range(arity).map(index => `$nativeParameter$${index}`);
          const parameters = parameterNames.map(parameterName => types.identifier(parameterName));
          const result = parameterNames.reduceRight<types.Expression>(
            (body, name) => types.arrowFunctionExpression([types.identifier(name)], body),
            types.callExpression(callee, parameters),
          );
          return [[], result];
        }

        case 'memberCall': {
          const { name, arity } = nativeData;
          if (typeof name !== 'string' || typeof arity !== 'number') {
            throw new Error('Cannot output member call native expression with incorrect data');
          }

          const objectName = '$nativeObject';
          const callee = types.memberExpression(
            types.identifier(objectName),
            types.identifier(name),
          );
          const parameterNames = range(arity).map(index => `$nativeParameter$${index}`);
          const parameters = parameterNames.map(parameterName => types.identifier(parameterName));
          const result = [objectName, ...parameterNames].reduceRight<types.Expression>(
            (body, name) => types.arrowFunctionExpression([types.identifier(name)], body),
            types.callExpression(callee, parameters),
          );
          return [[], result];
        }

        case 'binaryOperation': {
          const { operator } = nativeData;
          if (typeof operator !== 'string') {
            throw new Error('Cannot output a binary operation without an operator');
          }

          const left = types.identifier('$leftBinaryParam');
          const right = types.identifier('$rightBinaryParam');
          const result = [left, right].reduceRight<types.Expression>(
            (body, identifier) => types.arrowFunctionExpression([identifier], body),
            types.binaryExpression(operator as any, left, right),
          );
          return [[], result];
        }

        case 'ternaryOperator': {
          const condition = types.identifier('$conditionParam');
          const consequent = types.identifier('$consequentParam');
          const alternative = types.identifier('$alternativeParam');
          const result = [condition, consequent, alternative].reduceRight<types.Expression>(
            (body, identifier) => types.arrowFunctionExpression([identifier], body),
            types.conditionalExpression(condition, consequent, alternative),
          );
          return [[], result];
        }

        default: {
          const { name } = nativeData;
          if (typeof name !== 'string') {
            throw new Error('Native expression is missing a name');
          }

          return [[], types.identifier(name)];
        }
      }
    }

    default:
      return assertNever(expression);
  }
}

export interface JavascriptBackendOptions {
  module: 'commonjs' | 'esm';
}

function wrapInExport(
  moduleType: 'commonjs' | 'esm',
  statements: types.Statement[],
  value: types.Expression,
): types.Program {
  return types.program([
    ...statements,
    moduleType === 'esm'
      ? types.exportDefaultDeclaration(value as any)
      : types.expressionStatement(types.assignmentExpression(
        '=',
        types.memberExpression(types.identifier('module'), types.identifier('exports')),
        value,
      )),
  ]);
}

export function generateJavascript(
  expression: CoreExpression,
  options: JavascriptBackendOptions,
): string {
  const [statements, value] = convertExpressionToCode(expression);
  const program = wrapInExport(options.module, statements, value);
  return generator(program).code;
}
