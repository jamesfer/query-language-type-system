import { Expression } from '../..';
import { Free, mapFree } from '../../utils/free';
import { ExpressionToken } from '../produce-expression-tokens';
import { withMessages, WithMessages } from './message-state';
import { WithTokens } from './token-state';

export enum Precedence {
  none,
  bindingEquals,
  record,
  functionArrow,
  functionArrowParam,
  implicitFunctionArrowParam,
  patternMatch,
  application,
  application2,
  dual,
  readProperty,
  parenthesis,
}

export type InterpreterFunction<T> = (
  tokens: ExpressionToken[],
  previous: Expression | undefined,
  precedence: Precedence,
) => Free<WithMessages<WithTokens<T>[]>>;

export interface Interpreter<T> {
  name: string | undefined;
  interpret: InterpreterFunction<T>;
}

export function interpreter<T>(
  name: string | undefined,
  interpret: InterpreterFunction<T>,
): Interpreter<T> {
  return { name, interpret };
}

export function runInterpreter<T>(
  interpreter: Interpreter<T>,
  tokens: ExpressionToken[],
  previous: Expression | undefined,
  precedence: Precedence,
): Free<WithMessages<WithTokens<T>[]>> {
  if (!interpreter.name) {
    return interpreter.interpret(tokens, previous, precedence);
  }

  return mapFree(interpreter.interpret(tokens, previous, precedence), ({ messages, value: results }) => {
    // const indentedMessages = messages.map(message => `  ${message}`);
    // const debugMessage = `${interpreter.name} running on: ${map(tokens, 'value').join(', ')}`;
    // const resultMessage = `${interpreter.name} ${results.length > 0 ? `succeeded (${results.length} matches, at least ${max(map(results, 'tokens.length'))} tokens)` : 'failed'}`;
    return withMessages([], results);
  });
}
