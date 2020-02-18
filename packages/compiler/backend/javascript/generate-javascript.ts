import generate from '@babel/generator';
import * as types from '@babel/types';
import { flatMap, initial, last, map } from 'lodash';
import { identifier } from '../../type-checker/constructors';
import { Expression, PatternMatchExpression } from '../../type-checker/types/expression';
import { assertNever } from '../../type-checker/utils';

const destructureExpression = (base: Expression) => (value: Expression): [string, Expression][] => {
  switch (value.kind) {
    case 'SymbolExpression':
    case 'NumberExpression':
    case 'BooleanExpression':
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
      return [];

    default:
      return assertNever(value);
  }
};

interface PatternConditions {
  bindings: { name: string; value: types.Expression }[];
  conditions: { left: types.Expression, right: types.Expression }[];
}

function convertPatternMatchToConditions(value: types.Expression, test: Expression): PatternConditions['conditions'] {
  switch (test.kind) {
    case 'NumberExpression':
    case 'BooleanExpression':
    case 'SymbolExpression':
      return [{
        left: value,
        right: convertExpressionToCode(test),
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
      return [];
  }
}

function convertPatternMatchToBindings(value: types.Expression, test: Expression): { name: string, value: types.Expression }[] {
  switch (test.kind) {
    case 'Identifier':
      return [{ value, name: test.name }];

    case 'NumberExpression':
    case 'BooleanExpression':
    case 'SymbolExpression':
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
      return [];
  }
}

function convertExpressionToCode(expression: Expression): types.Expression {
  switch (expression.kind) {
    case 'Identifier':
      return types.identifier(expression.name);

    case 'NumberExpression':
      return types.numericLiteral(expression.value);

    case 'BooleanExpression':
      return types.booleanLiteral(expression.value);

    case 'SymbolExpression':
      return types.stringLiteral(`$SYMBOL$${expression.name}`);

    case 'RecordExpression':
      return types.objectExpression(map(expression.properties, (property, key) => (
        types.objectProperty(key, convertExpressionToCode(property))
      )));

    case 'Application':
      return types.callExpression(convertExpressionToCode(expression.callee), [convertExpressionToCode(expression.parameter)]);

    case 'FunctionExpression': {
      if (expression.parameter.kind === 'Identifier') {
        return types.arrowFunctionExpression(
          [types.identifier(expression.parameter.name)],
          convertExpressionToCode(expression.body),
        );
      }

      const parameterName = `$PARAMETER$1`;
      const destructuredParameters = destructureExpression(identifier(parameterName))(expression.parameter);
      return types.functionExpression(null, [types.identifier(parameterName)], types.blockStatement([
        ...destructuredParameters.map(([name, expression]) => types.variableDeclaration('const', [
          types.variableDeclarator(types.identifier(name), convertExpressionToCode(expression))
        ])),
        types.returnStatement(convertExpressionToCode(expression.body)),
      ]));
    }

    case 'DataInstantiation':
      return types.objectExpression([
        types.objectProperty(`$DATA_NAME$`, convertExpressionToCode(expression.callee)),
        ...expression.parameters.map((value, index) => types.objectProperty(index, convertExpressionToCode(value))),
      ]);

    case 'BindingExpression':
      return types.sequenceExpression([
        types.assignmentExpression('=', types.identifier(expression.name), convertExpressionToCode(expression.value)),
        convertExpressionToCode(expression.body),
      ]);

    case 'DualExpression':
      return convertExpressionToCode(expression.right);

    case 'ReadRecordPropertyExpression':
      return types.memberExpression(convertExpressionToCode(expression.record), expression.property);

    case 'ReadDataPropertyExpression':
      return types.memberExpression(convertExpressionToCode(expression.dataValue), expression.property);

    case 'PatternMatchExpression': {
      const jsValue = convertExpressionToCode(expression.value);
      const patterns = expression.patterns.map(({ test, value }) => ({
        test,
        value: convertExpressionToCode(value),
      }));

      const fallback = last(patterns);
      if (!fallback) {
        throw new Error('Tried to print a pattern expression with no viable patterns');
      }

      return initial(patterns).reduceRight<types.Expression>(
        (fallback, { test, value }): types.Expression => {
          const conditions = convertPatternMatchToConditions(jsValue, test)
            .map(({ left, right }): types.Expression => types.binaryExpression('===', left, right))
            .reduce((left, right) => types.logicalExpression('&&', left, right));
          const bindings = convertPatternMatchToBindings(jsValue, test)
            .map(({ name, value }) => types.assignmentExpression('=', types.identifier(name), value));
          const valueWithBindings = types.sequenceExpression([...bindings, value]);
          return types.conditionalExpression(conditions, valueWithBindings, fallback);
        },
        fallback.value,
      );
    }


    default:
      return assertNever(expression);
  }
}

export function generateJavascript(expression: Expression): string {
  return generate(convertExpressionToCode(expression)).code;
}
