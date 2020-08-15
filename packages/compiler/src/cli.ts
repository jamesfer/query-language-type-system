import chalk from 'chalk';
import { promises } from 'fs';
import { map } from 'lodash';
import { performance } from 'perf_hooks';
import { compile } from './api';
import { DesugaredExpressionWithoutPatternMatch } from './desugar/desugar-pattern-match';
import parse from './parser/parse';
import { evaluationScope } from './type-checker/constructors';
import { evaluateExpression } from './type-checker/evaluate';
import { runTypePhase } from './type-checker/run-type-phase';
import { Expression } from './type-checker/types/expression';
import { Value } from './type-checker/types/value';
import { assertNever } from './type-checker/utils';
import { visitAndTransformValue } from './type-checker/visitor-utils';

function indent(string: string, spaces = 2) {
  const indentString = Array(spaces).fill(' ').join('');
  return string.replace(/^/gm, indentString);
}

const prettyPrintValue = visitAndTransformValue<string>((value): string => {
  switch (value.kind) {
    case 'DataValue':
      return `${value.name}[${value.parameters.join(', ')}`;

    case 'RecordLiteral':
      return `{ ${map(value.properties, (property, key) => `${property}: ${key}`).join(', ')} }`;

    case 'DualBinding':
      return `${value.left}:${value.right}`;

    case 'ApplicationValue':
      return `(${value.callee} ${value.parameter})`;

    case 'ReadDataValueProperty':
      return `${value.dataValue}#${value.property}`;

    case 'ReadRecordProperty':
      return `${value.record}.${value.property}`;

    case 'FunctionLiteral':
      return `${value.parameter} -> ${value.body}`;

    case 'ImplicitFunctionLiteral':
      return `implicit ${value.parameter} -> ${value.body}`;

    case 'FreeVariable':
      return value.name;

    case 'SymbolLiteral':
      return `\`${value.name}\``;

    case 'BooleanLiteral':
      return value.value ? 'true' : 'false';

    case 'NumberLiteral':
      return value.value.toString();

    case 'StringLiteral':
      return value.value;

    case 'PatternMatchValue': {
      const patterns = value.patterns.map(({ test, value }) => `  | ${test} = ${value}`);
      return `${value.value}\n${patterns.join('')}`;
    }

    default:
      return assertNever(value);
  }
});

async function timePromise<T>(f: () => Promise<T>): Promise<[number, T]> {
  let before = performance.now();
  const result = await f();
  let after = performance.now();
  return [after - before, result];
}

function timeFunction<T>(f: () => T): [number, T] {
  let before = performance.now();
  const result = f();
  let after = performance.now();
  return [after - before, result];
}

async function readFileTimed(filename: string): Promise<[number, string]> {
  return timePromise(async () => {
    const code = await promises.readFile(filename);
    return code.toString();
  });
}

async function readFile(filename: string): Promise<string> {
  process.stdout.write('➜ Reading file...');
  try {
    const [time, code] = await readFileTimed(filename);
    process.stdout.write(chalk.grey(` ${time.toFixed(0)}ms\n`));
    return code;
  } catch (error) {
    process.stdout.write('\n');
    console.log(chalk.red('✖ Error'));
    throw error;
  }
}

function parseCode(code: string): Expression {
  process.stdout.write('➜ Parsing code...');
  const [time, { value: expression }] = timeFunction(() => parse(code.toString()));
  if (!expression) {
    process.stdout.write('\n');
    console.log(chalk.red('✖ Failed to parse code'));
    process.exit(1);
  }

  process.stdout.write(chalk.grey(` ${time.toFixed(0)}ms\n`));
  return expression;
}

function checkTypes(expression: Expression): void {
  process.stdout.write('➜ Checking types...');
  const [time, [messages]] = timeFunction(() => runTypePhase(expression));
  if (messages.length > 0) {
    process.stdout.write('\n');
    console.log(chalk.red('✖ Failed to type code'));
    messages.forEach((message) => {
      console.log(chalk.red('•', message));
    });
    process.exit(1);
  }

  process.stdout.write(chalk.grey(` ${time.toFixed(0)}ms\n`));
}

function evaluate(expression: DesugaredExpressionWithoutPatternMatch): Value {
  process.stdout.write('➜ Evaluating...');
  const [time, value] = timeFunction(() => evaluateExpression(evaluationScope())(expression));
  if (!value) {
    process.stdout.write('\n');
    console.log(chalk.red('✖ Failed to evaluate expression'));
    process.exit(1);
  }

  process.stdout.write(chalk.grey(` ${time.toFixed(0)}ms\n`));
  return value;
}

async function main() {
  const filename = process.argv[2];
  if (!filename) {
    console.log(chalk.red('✖ Need to provide a filename'));
    process.exit(1);
  }

  const code = await readFile(filename);
  const result = compile(code);
  if (result.expression) {
    const value = evaluate(result.expression);
    console.log(chalk.green('\u2713 Succeeded'));
    console.log();
    console.log(indent(prettyPrintValue(value)));
    console.log();
  } else {
    console.log(chalk.red('✖ Failed to produce an expression from compiled code.'));
    result.messages.forEach((message) => {
      console.log(chalk.red(`  - ${message}`));
    });
  }
}

main();
