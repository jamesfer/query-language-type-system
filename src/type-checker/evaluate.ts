import { find, mapValues } from 'lodash';
import {
  eScopeBinding,
  expandEvaluationScope,
  freeVariable,
} from './constructors';
import { EvaluationScope } from './types/evaluation-scope';
import { Expression } from './types/expression';
import { DataValue, Value } from './types/value';
import { assertNever, everyIs, everyValue, isDefined } from './utils';
import { destructureValue } from './type-utils';
import { applyReplacements } from './variable-utils';
import { visitValue } from './visitor-utils';

export const substituteExpressionVariables = (substitutions: { name: string, value: Expression }[]) => (expression: Expression): Expression => {
  const recurse = substituteExpressionVariables(substitutions);
  return substitutions.reduce(
    (body, { name, value }): Expression => {
      switch (body.kind) {
        case 'SymbolExpression':
        case 'NumberExpression':
        case 'BooleanExpression':
        case 'FunctionExpression':
          return body;

        case 'Identifier':
          return body.name === name ? value : body;

        case 'Application':
          return {
            ...body,
            kind: 'Application',
            parameter: recurse(body.parameter),
            callee: recurse(body.callee),
          };

        case 'DataInstantiation':
          return {
            ...body,
            kind: 'DataInstantiation',
            parameters: body.parameters.map(recurse),
          };

        case 'RecordExpression':
          return {
            ...body,
            properties: mapValues(body.properties, recurse),
          };

        case 'BindingExpression':
          return {
            ...body,
            value: recurse(body.value),
            body: recurse(body.body),
          };

        case 'DualExpression':
          return {
            ...body,
            left: recurse(body.left),
            right: recurse(body.right),
          };

        case 'ReadRecordPropertyExpression':
          return {
            ...body,
            record: recurse(body.record),
          };

        case 'ReadDataPropertyExpression':
          return {
            ...body,
            dataValue: recurse(body.dataValue),
          };

        default:
          return assertNever(body);
      }
    },
    expression,
  );
};


export const evaluateExpression = (scope: EvaluationScope) => (expression: Expression): Value | undefined => {
  switch (expression.kind) {
    case 'SymbolExpression':
      return { kind: 'SymbolLiteral', name: expression.name };

    case 'NumberExpression':
      return { kind: 'NumberLiteral', value: expression.value };

    case 'BooleanExpression':
      return { kind: 'BooleanLiteral', value: expression.value };

    case 'DualExpression': {
      const left = evaluateExpression(scope)(expression.left);
      const right = evaluateExpression(scope)(expression.right);
      if (!left || !right) {
        return undefined;
      }
      return { left, right, kind: 'DualBinding' };
    }

    case 'DataInstantiation': {
      const name = evaluateExpression(scope)(expression.callee);
      if (!name) {
        return undefined;
      }

      const parameters = expression.parameters.map(evaluateExpression(scope));
      if (everyIs(parameters, isDefined)) {
        return {
          parameters,
          kind: 'DataValue',
          name: name,
        };
      }
      return undefined;
    }

    case 'FunctionExpression': {
      const parameter = evaluateExpression(scope)(expression.parameter);
      if (!parameter) {
        return undefined;
      }

      const body = evaluateExpression(scope)(expression.body);
      if (!body) {
        return undefined;
      }

      return {
        body,
        parameter,
        kind: expression.implicit ? 'ImplicitFunctionLiteral' : 'FunctionLiteral',
      };
    }

    case 'RecordExpression': {
      const properties = mapValues(expression.properties, evaluateExpression(scope));
      if (everyValue(properties, isDefined)) {
        return { properties, kind: 'RecordLiteral' };
      }

      return undefined;
    }

    case 'Identifier': {
      const declaration = find(scope.bindings, { name: expression.name });
      if (declaration) {
        return declaration.kind === 'ScopeBinding' ? evaluateExpression(scope)(declaration.value) : declaration.type;
      }
      return freeVariable(expression.name);
    }

    case 'Application': {
      const callee = evaluateExpression(scope)(expression.callee);
      if (!callee) {
        return undefined;
      }

      const parameter = evaluateExpression(scope)(expression.parameter);
      if (!parameter) {
        return undefined;
      }

      const simplifiedCallee = simplify(callee);
      if (simplifiedCallee.kind !== 'FunctionLiteral' && simplifiedCallee.kind !== 'ImplicitFunctionLiteral') {
        return {
          parameter,
          kind: 'ApplicationValue',
          callee: simplifiedCallee,
        };
      }

      const replacements = destructureValue(simplifiedCallee.parameter, parameter);
      if (!replacements) {
        return undefined;
      }

      return simplify(applyReplacements(replacements)(simplifiedCallee.body));
    }

    case 'BindingExpression':
      return evaluateExpression(expandEvaluationScope(scope, {
        bindings: [eScopeBinding(expression.name, expression.value)]
      }))(expression.body);

    case 'ReadRecordPropertyExpression': {
      const record = evaluateExpression(scope)(expression.record);
      if (!record) {
        return undefined;
      }

      if (record.kind !== 'RecordLiteral' || !record.properties[expression.property]) {
        // Expression cannot be reduced yet
        return {
          record,
          kind: 'ReadRecordProperty',
          property: expression.property,
        };
      }

      return record.properties[expression.property];
    }

    case 'ReadDataPropertyExpression': {
      const dataValue = evaluateExpression(scope)(expression.dataValue);
      if (!dataValue) {
        return undefined;
      }

      if (dataValue.kind !== 'DataValue' || dataValue.parameters.length <= expression.property) {
        // Expression cannot be reduced yet
        return {
          dataValue,
          kind: 'ReadDataValueProperty',
          property: expression.property,
        };
      }

      return dataValue.parameters[expression.property];
    }

    default:
      return assertNever(expression);
  }
};

export const simplify = visitValue({
  after(value: Value) {
    switch (value.kind) {
      case 'ReadDataValueProperty':
        return value.dataValue.kind === 'DataValue' && value.dataValue.parameters.length > value.property
          ? value.dataValue.parameters[value.property]
          : value;

      case 'ReadRecordProperty':
        return value.record.kind === 'RecordLiteral' && value.record.properties[value.property]
          ? value.record.properties[value.property]
          : value;

      case 'ApplicationValue': {
        if (!(value.callee.kind === 'FunctionLiteral' || value.callee.kind === 'ImplicitFunctionLiteral')) {
          return value;
        }

        const replacements = destructureValue(value.callee.parameter, value.parameter);
        if (!replacements) {
          return value;
        }

        return simplify(applyReplacements(replacements)(value.callee.body));
      }

      case 'FunctionLiteral':
      case 'ImplicitFunctionLiteral':
      case 'FreeVariable':
      case 'SymbolLiteral':
      case 'NumberLiteral':
      case 'BooleanLiteral':
      case 'DataValue':
      case 'RecordLiteral':
      case 'DualBinding':
        return value;

      default:
        return assertNever(value);
    }
  },
});

