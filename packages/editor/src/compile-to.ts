import { compile, generateJavascript, Message, Expression } from 'query-language-compiler';

export interface CompileToOptions {
  backend: 'javascript';
}

export interface CompileToResult {
  output?: string;
  messages: Message[];
}

function toBackend(expression: Expression, backend: 'javascript'): string | undefined {
  switch (backend) {
    case 'javascript':
      return generateJavascript(expression, { module: 'esm' });
  }
}

export default function compileTo(code: string, options: CompileToOptions): CompileToResult {
  const { messages, expression } = compile(code);
  const output = expression ? toBackend(expression, options.backend) : undefined;
  return { messages, output };
}
