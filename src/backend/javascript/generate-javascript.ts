import generate from '@babel/generator';
import * as types from '@babel/types';
import { identifier } from '../../type-checker/constructors';
import { Expression } from '../../type-checker/types/expression';
import { flatMap, map } from 'lodash';
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
      return [];

    default:
      return assertNever(value);
  }
};

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

    default:
      return assertNever(expression);
  }
}

export function generateJavascript(expression: Expression): string {
  return generate(convertExpressionToCode(expression)).code;
}
