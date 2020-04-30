import generate from '@babel/generator';
import * as types from '@babel/types';
import { flatMap, initial, last, map, flatten } from 'lodash';
import { identifier } from '../../type-checker/constructors';
import { Expression, PatternMatchExpression } from '../..';
import { assertNever, unzip } from '../../type-checker/utils';

const destructureExpression = (base: Expression) => (value: Expression): [string, Expression][] => {
  switch (value.kind) {
    case 'SymbolExpression':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
      return [];

    case 'Identifier':
      return [[value.name, base]];

    case 'DualExpression':
      return [
        ...destructureExpression(base)(value.left),
        ...destructureExpression(base)(value.right),
      ];

    case 'DataInstantiation':
      return flatMap(value.parameters, (parameter, index) => destructureExpression({
        kind: 'ReadDataPropertyExpression',
        dataValue: base,
        property: index,
      })(parameter));

    case 'RecordExpression':
      return flatMap(value.properties, (parameter, key) => destructureExpression({
        kind: 'ReadRecordPropertyExpression',
        record: base,
        property: key,
      })(parameter));

    case 'Application':
    case 'FunctionExpression':
    case 'ReadDataPropertyExpression':
    case 'ReadRecordPropertyExpression':
    case 'BindingExpression':
    case 'PatternMatchExpression':
    case 'NativeExpression':
      return [];

    default:
      return assertNever(value);
  }
};

interface PatternCondition {
  left: types.Expression,
  right: types.Expression
}

function convertPatternMatchToConditions(value: types.Expression, test: Expression): PatternCondition[] {
  switch (test.kind) {
    case 'SymbolExpression':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
      // We ignore statements in pattern matches because they are weird
      const [rightStatements, right] = convertExpressionToCode(test);
      return [{
        left: value,
        right: right,
      }];

    case 'RecordExpression':
      return [
        {
          left: types.unaryExpression('typeof', value),
          right: types.stringLiteral('object'),
        },
        ...flatMap(test.properties, (property, name) => (
          convertPatternMatchToConditions(types.memberExpression(value, name), property)
        )),
      ];

    case 'DualExpression':
      return [
        ...convertPatternMatchToConditions(value, test.left),
        ...convertPatternMatchToConditions(value, test.right),
      ];

    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    case 'Application':
    case 'Identifier':
    case 'FunctionExpression':
    case 'DataInstantiation':
    case 'BindingExpression':
    case 'NativeExpression':
      return [];

    default:
      return assertNever(test);
  }
}

function convertPatternMatchToBindings(value: types.Expression, test: Expression): { name: string, value: types.Expression }[] {
  switch (test.kind) {
    case 'Identifier':
      return [{ value, name: test.name }];

    case 'SymbolExpression':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
      return [];

    case 'RecordExpression':
      return flatMap(test.properties, (property, name) => (
        convertPatternMatchToBindings(types.memberExpression(value, name), property)
      ));

    case 'DualExpression':
      return [
        ...convertPatternMatchToBindings(value, test.left),
        ...convertPatternMatchToBindings(value, test.right)
      ];

    case 'FunctionExpression':
    case 'Application':
    case 'DataInstantiation':
    case 'BindingExpression':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    case 'NativeExpression':
      return [];

    default:
      return assertNever(test);
  }
}

function makePatternConsequent(valueIdentifier: types.Identifier, test: Expression, value: Expression): types.BlockStatement {
  const [valueStatements, convertedValue] = convertExpressionToCode(value);
  const variables = convertPatternMatchToBindings(valueIdentifier, test)
    .map(({ name, value }) => types.variableDeclaration('const', [
      types.variableDeclarator(types.identifier(name), value)
    ]));
  return types.blockStatement([
    ...variables,
    ...valueStatements,
    types.returnStatement(convertedValue),
  ]);
}

function makePatternIfStatement(valueIdentifier: types.Identifier, test: Expression, value: Expression, alternative: types.Statement): types.Statement {
  const consequent = makePatternConsequent(valueIdentifier, test, value);
  const condition = convertPatternMatchToConditions(valueIdentifier, test)
    .map(({ left, right }): types.Expression => types.binaryExpression('===', left, right))
    .reduce((left, right) => types.logicalExpression('&&', left, right));
  return types.ifStatement(condition, consequent, alternative);
}

function convertExpressionToCode(expression: Expression): [types.Statement[], types.Expression] {
  switch (expression.kind) {
    case 'Identifier':
      return [[], types.identifier(expression.name)];

    case 'SymbolExpression':
      return [[], types.stringLiteral(`$SYMBOL$${expression.name}`)];

    case 'BooleanExpression':
      return [[], types.booleanLiteral(expression.value)];

    case 'NumberExpression':
      return [[], types.numericLiteral(expression.value)];

    case 'StringExpression':
      return [[], types.stringLiteral(expression.value)];

    case 'RecordExpression':
      const [childStatements = [], properties = []] = unzip(map(expression.properties, (property, key) => {
        const [propertyStatements, value] = convertExpressionToCode(property);
        return [propertyStatements, types.objectProperty(types.identifier(key), value)];
      }));
      return [flatten([[], ...childStatements]), types.objectExpression(properties)];

    case 'Application': {
      const [calleeStatements, callee] = convertExpressionToCode(expression.callee);
      const [parameterStatements, parameter] = convertExpressionToCode(expression.parameter);
      return [[...calleeStatements, ...parameterStatements], types.callExpression(callee, [parameter])];
    }

    case 'FunctionExpression': {
      const [bodyStatements, body] = convertExpressionToCode(expression.body);

      if (expression.parameter.kind === 'Identifier') {
        return [[], types.arrowFunctionExpression(
          [types.identifier(expression.parameter.name)],
          bodyStatements.length === 0 ? body : types.blockStatement([
            ...bodyStatements,
            types.returnStatement(body),
          ]),
        )];
      }

      const parameterName = `$PARAMETER$1`;
      const destructuredParameters = destructureExpression(identifier(parameterName))(expression.parameter);
      const destructuringStatements = flatMap(destructuredParameters, ([name, expression]) => {
        const [parameterStatements, parameter] = convertExpressionToCode(expression);
        return [...parameterStatements, types.variableDeclaration('const', [
          types.variableDeclarator(types.identifier(name), parameter)
        ])];
      });
      return [[], types.arrowFunctionExpression(
        [types.identifier(parameterName)],
        types.blockStatement([
          ...destructuringStatements,
          types.returnStatement(body),
        ]),
      )];
    }

    case 'DataInstantiation':
      const [calleeStatements, callee] = convertExpressionToCode(expression.callee);
      const [allPropertyStatements = [], objectProperties = []] = unzip(
        expression.parameters.map((value, index) => {
          const [propertyStatements, property] = convertExpressionToCode(value);
          return [propertyStatements, types.objectProperty(types.identifier(`${index}`), property)];
        })
      );
      return [flatten([calleeStatements, ...allPropertyStatements]), types.objectExpression([
        types.objectProperty(types.identifier('$DATA_NAME$'), callee),
        ...objectProperties,
      ])];

    case 'BindingExpression':
      const [valueStatements, value] = convertExpressionToCode(expression.value);
      const [bodyStatements, body] = convertExpressionToCode(expression.body);
      const declaration = types.variableDeclaration('const', [
        types.variableDeclarator(types.identifier(expression.name), value),
      ]);
      return [[...valueStatements, declaration, ...bodyStatements], body];

    case 'DualExpression':
      return convertExpressionToCode(expression.right);

    case 'ReadRecordPropertyExpression':
      // return types.memberExpression(convertExpressionToCode(expression.record), expression.property);
      const [recordStatements, record] = convertExpressionToCode(expression.record);
      return [recordStatements, types.memberExpression(record, types.identifier(expression.property))];

    case 'ReadDataPropertyExpression':
      const [dataValueStatements, dataValue] = convertExpressionToCode(expression.dataValue);
      return [dataValueStatements, types.memberExpression(dataValue, types.identifier(`${expression.property}`))];

    case 'PatternMatchExpression': {
      const [valueStatements, jsValue] = convertExpressionToCode(expression.value);
      const valueIdentifier = types.identifier(`$patternValue`);
      const lastPattern = last(expression.patterns);
      if (!lastPattern) {
        throw new Error('Tried to print a pattern expression with no viable patterns');
      }

      const lastPatternBlock = makePatternConsequent(valueIdentifier, lastPattern.test, lastPattern.value);
      const body = initial(expression.patterns).reduceRight<types.Statement>(
        (alternative, { test, value }) => makePatternIfStatement(valueIdentifier, test, value, alternative),
        lastPatternBlock,
      );

      return [valueStatements, types.callExpression(
        types.arrowFunctionExpression(
          [valueIdentifier],
          types.isBlockStatement(body) ? body : types.blockStatement([body]),
        ),
        [jsValue],
      )];
    }

    case 'NativeExpression': {
      const { kind } = expression.data;
      switch (kind) {
        case 'member': {
          const { object, name, arity } = expression.data;
          if (typeof object !== 'string' || typeof name !== 'string' || typeof arity !== 'number') {
            throw new Error('Cannot output member native expression with incorrect data');
          }

          const callee = types.memberExpression(types.identifier(object), types.identifier(name));
          const parameterNames = Array(arity).fill(0).map((_, index) => `$nativeParameter$${index}`);
          const result = parameterNames.reduceRight<types.Expression>(
            (body, name) => types.arrowFunctionExpression([types.identifier(name)], body),
            types.callExpression(callee, parameterNames.map(parameterName => types.identifier(parameterName))),
          );
          return [[], result];
        }

        case 'memberCall': {
          const { name, arity } = expression.data;
          if (typeof name !== 'string' || typeof arity !== 'number') {
            throw new Error('Cannot output member call native expression with incorrect data');
          }

          const objectName = '$nativeObject';
          const callee = types.memberExpression(types.identifier(objectName), types.identifier(name));
          const parameterNames = Array(arity).fill(0).map((_, index) => `$nativeParameter$${index}`);
          const result = [objectName, ...parameterNames].reduceRight<types.Expression>(
            (body, name) => types.arrowFunctionExpression([types.identifier(name)], body),
            types.callExpression(callee, parameterNames.map(parameterName => types.identifier(parameterName))),
          );
          return [[], result];
        }

        case 'binaryOperation': {
          const { operator } = expression.data;
          if (typeof operator !== 'string') {
            throw new Error('Cannot output a binary operation without an operator');
          }

          const left = types.identifier(`$leftBinaryParam`);
          const right = types.identifier(`$rightBinaryParam`);
          const result = [left, right].reduceRight<types.Expression>(
            (body, identifier) => types.arrowFunctionExpression([identifier], body),
            types.binaryExpression(operator as any, left, right),
          );
          return [[], result];
        }

        default: {
          const { name } = expression.data;
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

function wrapInExport(moduleType: 'commonjs' | 'esm', statements: types.Statement[], value: types.Expression): types.Program {
  return types.program([
    ...statements,
    moduleType === 'esm'
      ? types.exportDefaultDeclaration(value as any)
      : types.expressionStatement(types.assignmentExpression(
        '=',
        types.memberExpression(types.identifier('module'), types.identifier('exports')),
        value,
      )),
  ])
}

export function generateJavascript(expression: Expression, options: JavascriptBackendOptions): string {
  const [statements, value] = convertExpressionToCode(expression);
  const program = wrapInExport(options.module, statements, value);
  return generate(program).code;
}
