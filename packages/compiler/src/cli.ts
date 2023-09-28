import chalk from 'chalk';
import { promises } from 'fs';
import { map } from 'lodash';
import { performance } from 'perf_hooks';
import { compile, CompileResult } from './api';
import parse from './parser/parse';
import { checkTypes } from './type-checker';
import { Expression } from './type-checker/types/expression';
import { assertNever } from './type-checker/utils';
import { visitAndTransformValue } from './type-checker/visitor-utils';
import { uniqueIdStream } from './utils/unique-id-generator';
import { assert } from './utils/assert';
import { DesugaredExpressionWithoutPatternMatch } from './desugar/desugar-pattern-match';
import { generateJavascript } from './backend/javascript/generate-javascript';
import requireFromString from 'require-from-string';

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
  const before = performance.now();
  const result = await f();
  const after = performance.now();
  return [after - before, result];
}

function timeFunction<T>(f: () => T): [number, T] {
  const before = performance.now();
  const result = f();
  const after = performance.now();
  return [after - before, result];
}

function timeAndPrintSection<T>(name: string, f: () => T): T {
  try {
    process.stdout.write(name);
    const [time, value] = timeFunction(f);
    process.stdout.write(chalk.grey(` ${time.toFixed(0)}ms\n`));
    return value;
  } catch (e) {
    process.stdout.write('\n');
    throw e;
  }
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

function runCheckTypes(expression: Expression): void {
  process.stdout.write('➜ Checking types...');
  const [time, [messages]] = timeFunction(() => checkTypes(uniqueIdStream(), expression));
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

function compileCode(code: string): CompileResult | undefined {
  try {
    return timeAndPrintSection('➜ Compiling...', () => {
      return compile(code);
    });
  } catch (e) {
    console.error(chalk.red('✖ Compilation threw an error: ') + e);
  }
}

function evaluateExpression(expression: DesugaredExpressionWithoutPatternMatch): any {
  const javascriptCode = generateJavascript(expression, { module: 'commonjs' });
  try {
    return requireFromString(javascriptCode);
  } catch (error) {
    throw new Error(`Encountered an error while requiring generated code\n${error}\n\nCode: ${javascriptCode}`);
  }
}

function evaluate(expression: DesugaredExpressionWithoutPatternMatch): any {
  try {
    return timeAndPrintSection('➜ Evaluating...', () => {
      return evaluateExpression(expression);
    });
  } catch (e) {
    console.log(chalk.red('✖ Failed to evaluate expression: ') + e);
  }
}

function handleCode(code: string) {
  const result = compileCode(code);
  if (result == null) {
    return;
  }

  if (result.expression == null) {
    console.error(chalk.red('✖ Failed to produce an expression from compiled code.'));
    result.messages.forEach((message) => {
      console.error(chalk.red(`  - ${message}`));
    });
    return;
  }

  const value = evaluate(result.expression);
  console.log(chalk.green('\u2713 Succeeded'));
  console.log();
  console.log(value);

  // console.log(indent(prettyPrintValue(value)));
  // console.log();
}

async function main() {
  if (process.argv[2] === '-e') {
    const code = process.argv[3];
    assert(code != null, 'Missing code argument after -e');

    handleCode(code);
  } else {
    const filename = process.argv[2];
    if (!filename) {
      console.log(chalk.red('✖ Need to provide a filename'));
      process.exit(1);
    }

    const code = await readFile(filename);
    handleCode(code);
  }
}

main();
