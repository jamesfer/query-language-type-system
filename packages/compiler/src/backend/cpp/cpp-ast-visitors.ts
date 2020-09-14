import { assertNever } from '../../type-checker/utils';
import {
  CppExpression,
  CppExpressionWithChild,
  CppStatement,
  CppStatementWithChild,
} from './cpp-ast';

export function visitAndTransformCppExpression<T>(
  expressionVisitor: (expression: CppExpressionWithChild<T>) => T,
  statementVisitor: (statement: CppStatementWithChild<T>) => T,
): (expression: CppExpression) => T {
  return (expression) => {
    const recurse = visitAndTransformCppExpression(expressionVisitor, statementVisitor);
    switch (expression.kind) {
      case 'Identifier':
      case 'Boolean':
      case 'Number':
      case 'String':
        return expressionVisitor(expression);

      case 'Application':
        return expressionVisitor({
          kind: 'Application',
          parameters: expression.parameters.map(recurse),
          callee: recurse(expression.callee),
        });

      case 'StructConstruction':
        return expressionVisitor({
          kind: 'StructConstruction',
          structName: expression.structName,
          parameters: expression.parameters.map(recurse),
        });

      case 'Lambda':
        return expressionVisitor({
          kind: 'Lambda',
          parameters: expression.parameters,
          body: {
            kind: 'Block',
            statements: expression.body.statements.map(visitAndTransformCppStatement(statementVisitor, expressionVisitor)),
          },
        });

      case 'ReadProperty':
        return expressionVisitor({
          kind: 'ReadProperty',
          property: expression.property,
          object: recurse(expression.object),
        });

      default:
        return assertNever(expression);
    }
  };
}

export function visitAndTransformCppStatement<T>(
  statementVisitor: (statement: CppStatementWithChild<T>) => T,
  expressionVisitor: (expression: CppExpressionWithChild<T>) => T,
): (statement: CppStatement) => T {
  return (statement) => {
    switch (statement.kind) {
      case 'Struct':
        return statementVisitor(statement);

      case 'ExpressionStatement':
        return statementVisitor({
          kind: 'ExpressionStatement',
          expression: visitAndTransformCppExpression(expressionVisitor, statementVisitor)(statement.expression),
        });

      case 'Binding':
        return statementVisitor({
          kind: 'Binding',
          name: statement.name,
          type: statement.type,
          value: visitAndTransformCppExpression(expressionVisitor, statementVisitor)(statement.value),
        });

      case 'Return':
        return statementVisitor({
          kind: 'Return',
          value: visitAndTransformCppExpression(expressionVisitor, statementVisitor)(statement.value),
        });

      case 'Function':
        return statementVisitor({
          kind: 'Function',
          name: statement.name,
          parameters: statement.parameters,
          returnType: statement.returnType,
          body: {
            kind: 'Block',
            statements: statement.body.statements.map(visitAndTransformCppStatement(statementVisitor, expressionVisitor)),
          },
        });

      default:
        return assertNever(statement);
    }
  }
}
