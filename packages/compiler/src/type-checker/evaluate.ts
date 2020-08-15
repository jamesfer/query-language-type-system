import { find, mapValues } from 'lodash';
import { DesugaredExpressionWithoutPatternMatch } from '../desugar/desugar-pattern-match';
import {
  eScopeBinding,
  expandEvaluationScope,
  freeVariable, scope,
} from './constructors';
import { EvaluationScope } from './types/evaluation-scope';
import { DataValue, Value } from './types/value';
import { assertNever, everyIs, everyValue, findWithResult, isDefined } from './utils';
import { converge, destructureValue } from './type-utils';
import { applyReplacements, extractFreeVariableNamesFromValue } from './variable-utils';
import { visitValue } from './visitor-utils';

export const evaluateExpression = (scope: EvaluationScope) => (expression: DesugaredExpressionWithoutPatternMatch): Value | undefined => {
  switch (expression.kind) {
    case 'SymbolExpression':
      return { kind: 'SymbolLiteral', name: expression.name };

    case 'BooleanExpression':
      return { kind: 'BooleanLiteral', value: expression.value };

    case 'NumberExpression':
      return { kind: 'NumberLiteral', value: expression.value };

    case 'StringExpression':
      return { kind: 'StringLiteral', value: expression.value };

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

    case 'SimpleFunctionExpression': {
      const body = evaluateExpression(scope)(expression.body);
      if (!body) {
        return undefined;
      }

      return {
        body,
        parameter: {
          kind: 'FreeVariable',
          name: expression.parameter,
        },
        kind: 'FunctionLiteral',
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

    case 'NativeExpression':
      return undefined;

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
        if (value.callee.kind !== 'FunctionLiteral' && value.callee.kind !== 'ImplicitFunctionLiteral') {
          return value;
        }

        const replacements = destructureValue(value.callee.parameter, value.parameter);
        if (!replacements) {
          return value;
        }

        return simplify(applyReplacements(replacements)(value.callee.body));
      }

      case 'PatternMatchValue': {
        if (extractFreeVariableNamesFromValue(value.value).length !== 0) {
          return value;
        }

        const found = findWithResult(value.patterns, ({ test }) => converge(scope(), test, value.value));
        if (!found) {
          return value;
        }

        const [{ value: matched }, replacements] = found;
        return simplify(applyReplacements(replacements)(matched));
      }

      case 'FunctionLiteral':
      case 'ImplicitFunctionLiteral':
      case 'FreeVariable':
      case 'SymbolLiteral':
      case 'NumberLiteral':
      case 'StringLiteral':
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

