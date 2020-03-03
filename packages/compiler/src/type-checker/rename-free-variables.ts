import { uniqueId } from 'lodash';
import { Expression } from './types/expression';
import { assertNever, mapValuesWithState, mapWithState } from './utils';

export type RenameScopes = { [k: string]: string }[]

function findNameInScopes(scopes: { [k: string]: string }[], name: string): string | undefined {
  if (scopes.length === 0) {
    return undefined;
  }

  const [currentScope, ...remainingScopes] = scopes;
  return currentScope[name] || findNameInScopes(remainingScopes, name);
}

function newUniqueName(name: string): string {
  return uniqueId(`${name}$rename$`);
}

function addToScope(scopes: RenameScopes, from: string, to: string): RenameScopes {
  const [currentScope, ...otherScopes] = scopes;
  return [{ ...currentScope, [from]: to }, ...otherScopes];
}

function withNewScope<T>(scopes: RenameScopes, f: (childScopes: RenameScopes) => [RenameScopes, T]): [RenameScopes, T] {
  const childScopes = [{}, ...scopes];
  const [[, ...newScopes], value] = f(childScopes);
  return [newScopes, value];
}

/**
 * Iterates over an expression and renames all the free variables to globally unique values. The
 * scopes are generally implied from function expressions.
 */
function renameFreeVariablesInScope(scopes: { [k: string]: string }[], expression: Expression): [{ [k: string]: string }[], Expression] {
  switch (expression.kind) {
    case 'SymbolExpression':
    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
    case 'NativeExpression':
      return [scopes, expression];

    case 'Identifier': {
      const newName = findNameInScopes(scopes, expression.name);
      if (newName) {
        return [scopes, {
          ...expression,
          name: newName,
        }];
      }

      const uniqueName = newUniqueName(expression.name);
      const newScopes = addToScope(scopes, expression.name, uniqueName);
      return [newScopes, { ...expression, name: uniqueName }];
    }

    case 'RecordExpression': {
      const [newScopes, properties] = mapValuesWithState(
        expression.properties,
        scopes,
        renameFreeVariablesInScope,
      );
      return [newScopes, { ...expression, properties }];
    }

    case 'Application': {
      const [newScopes, [callee, parameter]] = mapWithState(
        [expression.callee, expression.parameter],
        scopes,
        renameFreeVariablesInScope,
      );
      return [newScopes, { ...expression, callee, parameter }];
    }

    case 'FunctionExpression': {
      const [newScopes, [parameter, body]] = withNewScope(scopes, childScopes => mapWithState(
        [expression.parameter, expression.body],
        childScopes,
        renameFreeVariablesInScope,
      ));
      return [newScopes, { ...expression, body, parameter }];
    }

    case 'DataInstantiation': {
      const [afterCalleeScopes, callee] = renameFreeVariablesInScope(scopes, expression.callee);
      const [newScopes, parameters] = mapWithState(
        expression.parameters,
        afterCalleeScopes,
        renameFreeVariablesInScope,
      );
      return [newScopes, { ...expression, parameters, callee }];
    }

    case 'BindingExpression': {
      // Rename the binding expression first
      // const bindingName = newUniqueName(expression.callee);
      const [newScopes, value] = withNewScope(
        addToScope(scopes, expression.name, expression.name),
        childScopes => renameFreeVariablesInScope(childScopes, expression.value),
      );
      const [bodyScope, body] = renameFreeVariablesInScope(newScopes, expression.body);
      return [bodyScope, { ...expression, value, body }];
    }

    case 'DualExpression': {
      const [newScopes, [left, right]] = mapWithState(
        [expression.left, expression.right],
        scopes,
        renameFreeVariablesInScope,
      );
      return [newScopes, { ...expression, left, right }];
    }

    case 'ReadRecordPropertyExpression': {
      const [newScopes, record] = renameFreeVariablesInScope(scopes, expression.record);
      return [newScopes, { ...expression, record }];
    }

    case 'ReadDataPropertyExpression': {
      const [newScopes, dataValue] = renameFreeVariablesInScope(scopes, expression.dataValue);
      return [newScopes, { ...expression, dataValue }];
    }

    case 'PatternMatchExpression': {
      const [newScopes, value] = renameFreeVariablesInScope(scopes, expression.value);
      const patterns: { test: Expression, value: Expression }[] = [];
      const newScopes2 = expression.patterns.reduce(
        (newScopes, { test, value }) => {
          const [resultScopes, [newTest, newValue]] = withNewScope(newScopes, childScopes => mapWithState(
            [test, value],
            childScopes,
            renameFreeVariablesInScope,
          ));
          patterns.push({ test: newTest, value: newValue });
          return resultScopes;
        },
        newScopes,
      );
      return [newScopes2, { ...expression, value, patterns }];
    }

    default:
      return assertNever(expression);
  }
}

export function renameFreeVariables(expression: Expression): Expression {
  const [, result] = renameFreeVariablesInScope([], expression);
  return result;
}
