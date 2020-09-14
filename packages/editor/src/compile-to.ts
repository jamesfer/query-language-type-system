import {
  compile,
  generateJavascript,
  Message,
  CoreExpression,
  CoreNode,
  generateCpp,
} from 'query-language-compiler';
import { assertNever } from './utils';

export interface CompileToOptions {
  backend: 'javascript' | 'cpp';
}

export interface CompileToResult {
  output?: string;
  messages: Message[];
}

function toBackend(expression: CoreExpression, node: CoreNode, backend: 'javascript' | 'cpp'): string | undefined {
  switch (backend) {
    case 'javascript':
      return generateJavascript(expression, { module: 'esm' });

    case 'cpp':
      return generateCpp(node);

    default:
      return assertNever(backend);
  }
}

export default function compileTo(code: string, options: CompileToOptions): CompileToResult {
  const { messages, expression, node } = compile(code);
  if (expression && node) {
    const output = toBackend(expression, node, options.backend);
    return { messages, output };
  }

  return { messages, output: undefined };
}
