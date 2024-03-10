import { assertNever } from '../../type-checker/utils/utils';
import {
  CppExpressionWithChild,
  CppParameter,
  CppStatement,
  CppStatementWithChild,
} from './cpp-ast';
import { visitAndTransformCppStatement } from './cpp-ast-visitors';

function indentLines(lines: string[]): string[] {
  return lines.join('\n').split('\n').map(line => `    ${line}`);
}

function printCppExpression(expression: CppExpressionWithChild<string>): string {
  switch (expression.kind) {
    case 'Identifier':
      return expression.name;

    case 'Boolean':
      return expression.value.toString();

    case 'Number':
      return expression.value.toString();

    case 'String':
      return `"${expression.value}"`;

    case 'Application':
      return `${expression.callee}(${expression.parameters.join(', ')})`;

    case 'StructConstruction':
      return `${expression.structName}{${expression.parameters.join(', ')}`;

    case 'Lambda':
      return [
        `[](${expression.parameters.map(printParameter).join(', ')}) -> {`,
        ...indentLines(expression.body.statements),
        '}',
      ].join('\n');

    case 'ReadProperty':
      return `${expression.object}.${expression.property}`;
  }
}

function printParameter({ identifier, type }: CppParameter): string {
  return `${type.value} ${identifier.name}`;
}

function printCppStatement(statement: CppStatementWithChild<string>): string {
  switch (statement.kind) {
    case 'ExpressionStatement':
      return `${statement.expression};`;

    case 'Return':
      return `return ${statement.value};`;

    case 'Binding':
      return `${statement.type.value} ${statement.name} = ${statement.value};`;

    case 'Struct': {
      const properties = statement.properties.map(printParameter).map(line => `${line};`);
      return [
        `struct ${statement.name} {`,
        ...indentLines(properties),
        '};',
      ].join('\n');
    }

    case 'Function': {
      const parameters = statement.parameters.map(printParameter).map(line => `${line};`);
      return [
        `${statement.returnType.value} ${statement.name}(${parameters.join(', ')}) {`,
        ...indentLines(statement.body.statements),
        '}',
      ].join('\n');
    }

    default:
      return assertNever(statement);
  }
}

export function printCppAst(statements: CppStatement[]): string {
  const transformer = visitAndTransformCppStatement(
    printCppStatement,
    printCppExpression,
  );
  return statements.map(transformer).join('\n\n');
}
